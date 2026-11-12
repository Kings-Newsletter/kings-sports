import { cache } from "react";
import { promises as fs } from "node:fs";
import path from "node:path";

import { catalog, toCompetition } from "@/lib/catalog";
import { localDayBounds, toLocalYmd } from "@/lib/dates";
import {
  type ArticleDoc,
  articleFromDoc,
  collections,
  fixtureFromDoc,
  standingsFromDoc,
} from "@/lib/db/collections";
import { getDb, isDbConfigured } from "@/lib/db/mongo";
import { normalizeTeam, sameTeam } from "@/lib/normalize";
import type {
  Article,
  BroadcastEntry,
  Competition,
  DailyBrief,
  Fixture,
  FixtureStatus,
  HistoricalMatch,
  Standings,
  StatBoard,
  Transfer,
} from "@/lib/types";

/**
 * Camada de dados.
 *
 * Contrato: os componentes chamam as funções abaixo e recebem tipos de lib/types.
 *
 * Duas origens:
 *  - Dados esportivos (partidas, tabelas, histórico): MongoDB, alimentado pela
 *    coleta agendada (lib/ingest). Sem MONGODB_URI, usa /content/*.json quando disponível.
 *  - Notícias: MongoDB. Sem MONGODB_URI, não há notícias publicadas.
 *  - Demais conteúdos editoriais: /content/*.json, versionado no repositório.
 *
 * Regra editorial: NADA é gerado, estimado ou preenchido por padrão.
 * Sem dado, a interface mostra estado vazio explícito.
 */

const CONTENT_DIR = path.join(process.cwd(), "content");

async function readCollection<T>(file: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(path.join(CONTENT_DIR, file), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn(`[data] ${file} deveria conter um array. Ignorando.`);
      return [];
    }
    return parsed as T[];
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      console.warn(`[data] Falha ao ler ${file}:`, error);
    }
    return [];
  }
}

const loadExtraCompetitions = cache(() => readCollection<Competition>("competicoes.json"));
const loadJsonFixtures = cache(() => readCollection<Fixture>("partidas.json"));
const loadJsonStandings = cache(() => readCollection<Standings>("classificacoes.json"));
const loadStatBoards = cache(() => readCollection<StatBoard>("estatisticas.json"));
const loadTransfers = cache(() => readCollection<Transfer>("transferencias.json"));
const loadBriefs = cache(() => readCollection<DailyBrief>("rodadas.json"));
const loadBroadcasts = cache(() => readCollection<BroadcastEntry>("transmissoes.json"));

function byNewest<T extends { publishedAt?: string; kickoff?: string; date?: string }>(
  items: T[],
  key: "publishedAt" | "kickoff" | "date",
): T[] {
  return [...items].sort((a, b) => {
    const at = new Date(a[key] ?? 0).getTime();
    const bt = new Date(b[key] ?? 0).getTime();
    return bt - at;
  });
}

/** Lê do banco com segurança: se o banco falhar, registra e devolve o fallback. */
async function fromDb<T>(label: string, run: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  if (!isDbConfigured()) return fallback();
  try {
    return await run();
  } catch (error) {
    console.error(`[data] MongoDB indisponível em ${label}:`, error);
    return fallback();
  }
}

/* ------------------------------- Notícias -------------------------------- */

export type ArticleQuery = {
  sport?: string;
  competition?: string;
  kind?: Article["kind"];
  tag?: string;
  series?: string;
  limit?: number;
  excludeSlug?: string;
};

function articleSortPipeline(filter: Record<string, unknown>, limit?: number) {
  const pipeline: Record<string, unknown>[] = [
    { $match: filter },
    { $addFields: { publishedAtSort: { $toDate: "$publishedAt" } } },
    { $sort: { publishedAtSort: -1 } },
    { $unset: "publishedAtSort" },
  ];
  if (limit && limit > 0) pipeline.push({ $limit: limit });
  return pipeline;
}

export async function getArticles(query: ArticleQuery = {}): Promise<Article[]> {
  return fromDb(
    "articles",
    async () => {
      const db = await getDb();
      const filter: Record<string, unknown> = {};
      if (query.sport) filter.sport = query.sport;
      if (query.competition) filter.competition = query.competition;
      if (query.kind) filter.kind = query.kind;
      if (query.tag) filter.tags = query.tag;
      if (query.series) filter.series = query.series;
      if (query.excludeSlug) {
        filter._id = { $nin: [query.excludeSlug, `article:${query.excludeSlug}`] };
      }

      const cursor = collections(db)
        .articles.aggregate<ArticleDoc & { type?: string }>(
          articleSortPipeline(filter, query.limit),
        );
      return (await cursor.toArray()).map(articleFromDoc);
    },
    async () => [],
  );
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  return fromDb(
    "article",
    async () => {
      const db = await getDb();
      const article = await collections(db).articles.findOne({
        _id: { $in: [slug, `article:${slug}`] },
      });
      return article ? articleFromDoc(article) : null;
    },
    async () => null,
  );
}

export async function getFeaturedArticle(): Promise<Article | null> {
  return fromDb(
    "featured article",
    async () => {
      const articles = collections(await getDb()).articles;
      const featured = await articles
        .aggregate<ArticleDoc & { type?: string }>(articleSortPipeline({ featured: true }, 1))
        .next();
      if (featured) return articleFromDoc(featured);

      const latest = await articles
        .aggregate<ArticleDoc & { type?: string }>(articleSortPipeline({}, 1))
        .next();
      return latest ? articleFromDoc(latest) : null;
    },
    async () => null,
  );
}

/* ----------------------------- Competições ------------------------------- */

const loadCompetitions = cache(async (): Promise<Competition[]> => {
  const fromCatalog = catalog.map(toCompetition);
  const known = new Set(fromCatalog.map((item) => item.slug));
  const extras = (await loadExtraCompetitions()).filter((item) => !known.has(item.slug));
  return [...fromCatalog, ...extras];
});

export async function getCompetitions(sport?: string): Promise<Competition[]> {
  const all = await loadCompetitions();
  const filtered = sport ? all.filter((item) => item.sport === sport) : all;
  return [...filtered].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function getCompetitionBySlug(slug: string): Promise<Competition | null> {
  const all = await loadCompetitions();
  return all.find((item) => item.slug === slug) ?? null;
}

/* ------------------------------- Partidas -------------------------------- */

export type FixtureQuery = {
  sport?: string;
  competition?: string;
  status?: FixtureStatus | FixtureStatus[];
  from?: Date;
  to?: Date;
  limit?: number;
  order?: "asc" | "desc";
};

async function queryFixtures(query: FixtureQuery): Promise<Fixture[]> {
  const statuses = query.status
    ? Array.isArray(query.status)
      ? query.status
      : [query.status]
    : undefined;
  const direction = query.order === "desc" ? -1 : 1;

  return fromDb(
    "fixtures",
    async () => {
      const db = await getDb();
      const filter: Record<string, unknown> = {};
      if (query.sport) filter.sport = query.sport;
      if (query.competition) filter.competition = query.competition;
      if (statuses) filter.status = { $in: statuses };
      if (query.from || query.to) {
        filter.kickoff = {
          ...(query.from ? { $gte: query.from } : {}),
          ...(query.to ? { $lt: query.to } : {}),
        };
      }
      const cursor = collections(db)
        .fixtures.find(filter)
        .sort({ kickoff: direction });
      if (query.limit) cursor.limit(query.limit);
      return (await cursor.toArray()).map(fixtureFromDoc);
    },
    async () => {
      const all = await loadJsonFixtures();
      const filtered = all.filter((fixture) => {
        if (query.sport && fixture.sport !== query.sport) return false;
        if (query.competition && fixture.competition !== query.competition) return false;
        if (statuses && !statuses.includes(fixture.status)) return false;
        const time = new Date(fixture.kickoff).getTime();
        if (query.from && time < query.from.getTime()) return false;
        if (query.to && time >= query.to.getTime()) return false;
        return true;
      });
      filtered.sort(
        (a, b) => direction * (new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()),
      );
      return query.limit ? filtered.slice(0, query.limit) : filtered;
    },
  );
}

/** Acrescenta "onde assistir" da curadoria (content/transmissoes.json). */
async function withBroadcasts(fixtures: Fixture[]): Promise<Fixture[]> {
  const entries = await loadBroadcasts();
  if (entries.length === 0) return fixtures;
  return fixtures.map((fixture) => {
    if (!fixture.home || !fixture.away) return fixture;
    const day = toLocalYmd(fixture.kickoff);
    const entry = entries.find(
      (item) =>
        item.date === day && sameTeam(item.home, fixture.home!.name) && sameTeam(item.away, fixture.away!.name),
    );
    return entry ? { ...fixture, broadcast: entry.channels } : fixture;
  });
}

/**
 * Status de sessões com duração (F1): o banco só é atualizado a cada coleta,
 * mas o início e o fim previstos permitem saber, na hora, se a sessão está no ar.
 */
function withEventStatus(fixtures: Fixture[]): Fixture[] {
  const now = Date.now();
  return fixtures.map((fixture) => {
    if (fixture.kind !== "event" || !fixture.endsAt) return fixture;
    const start = Date.parse(fixture.kickoff);
    const end = Date.parse(fixture.endsAt);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return fixture;
    // Margem de 30 min depois do fim previsto (bandeira vermelha, atrasos).
    const status: FixtureStatus =
      now < start ? "scheduled" : now <= end + 30 * 60 * 1000 ? "live" : "finished";
    return status === fixture.status ? fixture : { ...fixture, status };
  });
}

/** Escudos já coletados (TheSportsDB), por "<esporte>:<nome normalizado>". */
const loadCrests = cache(
  (): Promise<Map<string, string>> =>
    fromDb(
      "crests",
      async () => {
        const db = await getDb();
        const docs = await collections(db).crests.find({ url: { $ne: null } }).toArray();
        return new Map(docs.map((doc) => [doc._id.replace(/^crest:/, ""), doc.url!]));
      },
      async () => new Map<string, string>(),
    ),
);

function crestKey(sport: string, name: string) {
  return `${sport}:${normalizeTeam(name)}`;
}

async function withCrests(fixtures: Fixture[]): Promise<Fixture[]> {
  const crests = await loadCrests();
  if (crests.size === 0) return fixtures;
  return fixtures.map((fixture) => {
    if (!fixture.home || !fixture.away) return fixture;
    const home = fixture.home.crest ?? crests.get(crestKey(fixture.sport, fixture.home.name));
    const away = fixture.away.crest ?? crests.get(crestKey(fixture.sport, fixture.away.name));
    return {
      ...fixture,
      home: home ? { ...fixture.home, crest: home } : fixture.home,
      away: away ? { ...fixture.away, crest: away } : fixture.away,
    };
  });
}

export async function getFixtures(query: FixtureQuery = {}): Promise<Fixture[]> {
  return withCrests(await withBroadcasts(withEventStatus(await queryFixtures(query))));
}

export async function getLiveFixtures(): Promise<Fixture[]> {
  // Um jogo "ao vivo" há mais de 6 horas é dado parado, não jogo em andamento.
  // Sessões de F1 podem estar marcadas como agendadas no banco por alguns
  // minutos; o status é recalculado pelo horário de início e fim.
  const now = Date.now();
  const fixtures = await getFixtures({
    status: ["live", "scheduled"],
    from: new Date(now - 6 * 60 * 60 * 1000),
    to: new Date(now + 60_000),
  });
  return fixtures.filter((fixture) => fixture.status === "live");
}

/** Próximos jogos a partir de agora (nunca inventa: se não houver, retorna vazio). */
export async function getUpcomingFixtures(limit = 6, sport?: string): Promise<Fixture[]> {
  const now = Date.now();
  const fixtures = await getFixtures({
    sport,
    status: ["scheduled", "live"],
    from: new Date(now - 6 * 60 * 60 * 1000),
    to: new Date(now + 30 * 24 * 60 * 60 * 1000),
    limit: 50,
  });
  return fixtures
    .filter((fixture) => fixture.status === "scheduled" || fixture.status === "live")
    .slice(0, limit);
}

export async function getRecentResults(limit = 6, sport?: string): Promise<Fixture[]> {
  return getFixtures({ sport, status: "finished", order: "desc", limit });
}

/** Todas as partidas e eventos de um dia de Brasília. */
export async function getFixturesForDay(ymd: string, sport?: string): Promise<Fixture[]> {
  const { from, to } = localDayBounds(ymd);
  return getFixtures({ sport, from, to });
}

/** Uma partida pelo id (ex.: "espn:401879248"). */
export async function getFixtureById(id: string): Promise<Fixture | null> {
  const found = await fromDb(
    "fixture",
    async () => {
      const db = await getDb();
      const doc = await collections(db).fixtures.findOne({ _id: id });
      return doc ? [fixtureFromDoc(doc)] : [];
    },
    async () => (await loadJsonFixtures()).filter((fixture) => fixture.id === id),
  );
  if (found.length === 0) return null;
  const [enriched] = await withCrests(await withBroadcasts(withEventStatus(found)));
  return enriched ?? null;
}

/* ---------------------------- Classificações ----------------------------- */

const loadStandings = cache(
  (): Promise<Standings[]> =>
    fromDb(
      "standings",
      async () => {
        const db = await getDb();
        const docs = await collections(db).standings.find({}).toArray();
        return docs.map(standingsFromDoc);
      },
      loadJsonStandings,
    ),
);

function priorityOf(slug: string): number {
  return catalog.find((entry) => entry.slug === slug)?.priority ?? 999;
}

export async function getStandings(competition?: string): Promise<Standings[]> {
  const [all, crests] = await Promise.all([loadStandings(), loadCrests()]);
  const scoped = competition ? all.filter((table) => table.competition === competition) : all;
  const filtered = scoped.map((table) => {
    const sport = table.format === "basketball" ? "basquete" : table.format === "motorsport" ? null : "futebol";
    if (!sport || crests.size === 0) return table;
    return {
      ...table,
      rows: table.rows.map((row) => {
        const crest = row.crest ?? crests.get(crestKey(sport, row.team));
        return crest ? { ...row, crest } : row;
      }),
    };
  });
  // Pilotos antes de construtores; demais grupos em ordem alfabética.
  const groupKey = (group?: string) => (group === "Pilotos" ? " " : (group ?? ""));
  return [...filtered].sort(
    (a, b) =>
      priorityOf(a.competition) - priorityOf(b.competition) ||
      groupKey(a.group).localeCompare(groupKey(b.group), "pt-BR"),
  );
}

export async function getStandingsFor(slug: string): Promise<Standings | null> {
  const all = await getStandings(slug);
  return all[0] ?? null;
}

/* ----------------------------- Estatísticas ------------------------------ */

const loadBoards = cache(
  (): Promise<StatBoard[]> =>
    fromDb(
      "stats",
      async () => {
        const db = await getDb();
        const docs = await collections(db).stats.find({}).toArray();
        return docs.map((doc) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _id, updatedAt, type, ...rest } = doc as typeof doc & { type?: string };
          return { ...rest, updatedAt: updatedAt.toISOString() };
        });
      },
      loadStatBoards,
    ),
);

export async function getStatBoards(query: { competition?: string; sport?: string } = {}) {
  const boards = [...(await loadBoards())].sort(
    (a, b) => priorityOf(a.competition) - priorityOf(b.competition),
  );
  if (query.competition) return boards.filter((board) => board.competition === query.competition);
  if (!query.sport) return boards;
  const competitions = await getCompetitions(query.sport);
  const slugs = new Set(competitions.map((competition) => competition.slug));
  return boards.filter((board) => slugs.has(board.competition));
}

/* ---------------------------- Transferências ----------------------------- */

export async function getTransfers(query: { sport?: string; limit?: number } = {}) {
  const all = byNewest(await loadTransfers(), "date");
  const filtered = query.sport ? all.filter((item) => item.sport === query.sport) : all;
  return query.limit ? filtered.slice(0, query.limit) : filtered;
}

/* ------------------------- A rodada em 1 minuto -------------------------- */

/** Rodadas publicadas para o dia (ou o dia anterior mais recente com rodada). */
export async function getDailyBriefs(ymd: string): Promise<DailyBrief[]> {
  const all = await loadBriefs();
  const sameDay = all.filter((brief) => brief.date === ymd);
  if (sameDay.length > 0) return sameDay;
  const previous = all
    .filter((brief) => brief.date < ymd)
    .sort((a, b) => b.date.localeCompare(a.date));
  const latestDate = previous[0]?.date;
  return latestDate ? previous.filter((brief) => brief.date === latestDate) : [];
}

/* ------------------------------- Histórico ------------------------------- */

/**
 * Último confronto direto entre dois times (histórico do Football-Data.co.uk).
 * Só funciona com o banco configurado e o histórico importado.
 */
export async function getLastMeetings(
  pairs: { home: string; away: string }[],
): Promise<Map<string, HistoricalMatch>> {
  const result = new Map<string, HistoricalMatch>();
  if (!isDbConfigured() || pairs.length === 0) return result;
  try {
    const db = await getDb();
    const names = [...new Set(pairs.flatMap((pair) => [normalizeTeam(pair.home), normalizeTeam(pair.away)]))];
    const docs = await collections(db)
      .history.find({ $or: [{ homeKey: { $in: names } }, { awayKey: { $in: names } }] })
      .sort({ date: -1 })
      .limit(2000)
      .toArray();
    for (const pair of pairs) {
      const match = docs.find(
        (doc) =>
          (sameTeam(doc.home, pair.home) && sameTeam(doc.away, pair.away)) ||
          (sameTeam(doc.home, pair.away) && sameTeam(doc.away, pair.home)),
      );
      if (match) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _id, homeKey, awayKey, type, ...rest } = match as typeof match & { type?: string };
        result.set(`${pair.home}|${pair.away}`, rest);
      }
    }
  } catch (error) {
    console.error("[data] Falha ao ler histórico:", error);
  }
  return result;
}
