import "server-only";

import type { Db } from "mongodb";

import { getCatalogEntry } from "@/lib/catalog";
import { addDays, toLocalYmd } from "@/lib/dates";
import { collections, ensureIndexes } from "@/lib/db/collections";
import { ApiClient, BudgetExceededError, ProviderError } from "@/lib/ingest/http";
import {
  espnDateOf,
  espnLeaders,
  espnLeagues,
  espnScoreboard,
  espnScoreboardQuery,
  espnSeasonQueries,
  espnSoccerLeaders,
  espnStandings,
  type IngestStatBoard,
} from "@/lib/ingest/providers/espn";
import { f1Sessions, f1Standings, f1Winners } from "@/lib/ingest/providers/f1";
import {
  basketballLeagues,
  sportapiBasketballByDate,
  sportapiBasketballLive,
  sportapiBasketballStandings,
  sportapiEnabled,
  sportapiFootballByDate,
  sportapiFootballDateOf,
  sportapiFootballLeagueIds,
  sportapiFootballStandings,
} from "@/lib/ingest/providers/sportapi";
import { crestSports, findCrest } from "@/lib/ingest/providers/thesportsdb";
import type { IngestFixture, IngestStandings } from "@/lib/ingest/types";
import { normalizeTeam } from "@/lib/normalize";

/**
 * Jobs de coleta.
 *
 *  - daily: ESPN (fonte principal) de D-1 a D+7 e tabelas de todas as ligas,
 *    ~150 chamadas sem cota. O que a ESPN não entregar cai para a SportAPI
 *    (reserva). Depois, calendário e campeonato da F1.
 *  - live: só chama quem tem jogo em andamento ou prestes a começar. ESPN no
 *    máximo a cada ESPN_LIVE_MIN_INTERVAL_SEC (15 s); SportAPI a cada
 *    LIVE_MIN_INTERVAL_MIN (10), só para competições em modo reserva.
 *  - crests: escudos dos times (TheSportsDB), até 12 por execução.
 *  - season: calendário da temporada inteira de cada liga (ESPN), semanal e
 *    retomável: para em ~45 s e continua de onde parou na execução seguinte.
 *
 * Os jobs nunca tocam no conteúdo editorial (que vive em /content).
 */

export type JobName = "daily" | "live" | "crests" | "season";

export type JobSummary = {
  job: JobName;
  fixtures: number;
  standings: number;
  /** Quadros de estatística gravados (job daily) */
  stats?: number;
  /** Só no job "season": ligas concluídas e as que ficaram para a próxima execução */
  season?: { done: string[]; pending: string[] };
  /** Só no job "crests": escudos ainda por procurar depois desta execução */
  crests?: { pending: number; found: number; missing: string[] };
  calls: Partial<Record<string, number>>;
  skipped: string[];
  errors: string[];
};

const LEAGUE_IDS_KEY = "sportapi:football:leagueIds";
const LEAGUE_IDS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function liveInterval(): number {
  const minutes = Number.parseInt(process.env.LIVE_MIN_INTERVAL_MIN ?? "", 10);
  return (Number.isFinite(minutes) && minutes > 0 ? minutes : 10) * 60 * 1000;
}

async function saveFixtures(db: Db, fixtures: IngestFixture[]): Promise<number> {
  if (fixtures.length === 0) return 0;
  const now = new Date();
  await collections(db).fixtures.bulkWrite(
    fixtures.map((fixture) => {
      const $set: Record<string, unknown> = { updatedAt: now };
      const $unset: Record<string, ""> = {};
      for (const [key, value] of Object.entries(fixture)) {
        if (key === "_id") continue;
        if (value === undefined) $unset[key] = "";
        else $set[key] = value;
      }
      return {
        updateOne: {
          filter: { _id: fixture._id },
          update: Object.keys($unset).length > 0 ? { $set, $unset } : { $set },
          upsert: true,
        },
      };
    }),
    { ordered: false },
  );
  return fixtures.length;
}

async function saveStandings(db: Db, tables: IngestStandings[]): Promise<number> {
  if (tables.length === 0) return 0;
  const now = new Date();
  await collections(db).standings.bulkWrite(
    tables.map((table) => ({
      replaceOne: { filter: { _id: table._id }, replacement: { ...table, updatedAt: now }, upsert: true },
    })),
    { ordered: false },
  );
  return tables.length;
}

/** Executa uma etapa; erro de provedor vira linha no resumo, não derruba o job. */
async function step(summary: JobSummary, label: string, run: () => Promise<void>) {
  try {
    await run();
  } catch (error) {
    if (error instanceof BudgetExceededError) summary.skipped.push(`${label}: orçamento esgotado`);
    else if (error instanceof ProviderError) summary.errors.push(`${label}: ${error.message}`);
    else summary.errors.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function getKv<T>(db: Db, key: string): Promise<{ value: T; updatedAt: Date } | null> {
  const doc = await collections(db).kv.findOne({ _id: `kv:${key}` });
  return doc ? { value: doc.value as T, updatedAt: doc.updatedAt } : null;
}

async function setKv(db: Db, key: string, value: unknown) {
  await collections(db).kv.updateOne({ _id: `kv:${key}` }, { $set: { value, updatedAt: new Date() } }, { upsert: true });
}

/* ---------------------------------------------------------------- daily */

/** Executa `run` para cada item com no máximo `limit` chamadas simultâneas. */
async function mapLimit<T>(items: T[], limit: number, run: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(limit, queue.length) }, async () => {
      while (queue.length > 0) await run(queue.shift()!);
    }),
  );
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Troca os quadros de estatística de uma competição. */
async function replaceStats(db: Db, slug: string, boards: IngestStatBoard[]): Promise<number> {
  if (boards.length === 0) return 0;
  const c = collections(db).stats;
  await c.deleteMany({ competition: slug });
  const now = new Date();
  await c.bulkWrite(
    boards.map((board) => ({
      replaceOne: { filter: { _id: board._id }, replacement: { ...board, updatedAt: now }, upsert: true },
    })),
    { ordered: false },
  );
  return boards.length;
}

/** Troca todas as tabelas de uma competição (os nomes de grupo mudam entre fontes). */
async function replaceStandings(db: Db, slug: string, tables: IngestStandings[]): Promise<number> {
  if (tables.length === 0) return 0;
  await collections(db).standings.deleteMany({ competition: slug });
  return saveStandings(db, tables);
}

async function daily(db: Db, client: ApiClient, summary: JobSummary) {
  const today = toLocalYmd();
  const days = Array.from({ length: 8 }, (_, index) => addDays(today, index - 1));
  // A ESPN data pelo horário de Nova York: D-1 a D+7 cobre a semana de Brasília.
  const espnDays = [...days, addDays(today, 7)].map((day) => day.replaceAll("-", ""));
  const failedFixtures = new Set<string>();
  const failedTables = new Set<string>();

  // 1. ESPN — fonte principal de placares e tabelas.
  // 3 ligas por vez × 4 dias por vez: ~150 chamadas em cerca de 15 s.
  await mapLimit(espnLeagues(), 3, async (entry) => {
    const found: IngestFixture[] = [];
    let ok = true;
    await mapLimit(espnDays, 4, async (date) => {
      try {
        found.push(...(await espnScoreboard(client, entry, date)));
      } catch (error) {
        ok = false;
        summary.skipped.push(`ESPN ${entry.slug} ${date}: ${message(error)}`);
      }
    });
    {
      const added = await saveFixtures(db, found);
      summary.fixtures += added;
    }
    if (ok) {
      // A ESPN cobriu a semana: remove partidas desta competição vindas da reserva.
      await collections(db).fixtures.deleteMany({ competition: entry.slug, _id: { $regex: "^sportapi:" } });
    } else {
      failedFixtures.add(entry.slug);
    }

    try {
      {
        const added = await replaceStandings(db, entry.slug, await espnStandings(client, entry));
        summary.standings += added;
      }
    } catch (error) {
      failedTables.add(entry.slug);
      summary.skipped.push(`ESPN tabela ${entry.slug}: ${message(error)}`);
    }
  });

  // 1b. Estatísticas (artilharia, líderes da NBA e da NFL) — ESPN.
  await mapLimit(espnLeagues(), 4, async (entry) => {
    try {
      const boards = entry.sport === "futebol" ? await espnSoccerLeaders(client, entry) : await espnLeaders(client, entry);
      const added = await replaceStats(db, entry.slug, boards);
      summary.stats = (summary.stats ?? 0) + added;
    } catch (error) {
      summary.skipped.push(`ESPN estatísticas ${entry.slug}: ${message(error)}`);
    }
  });

  // 2. SportAPI — reserva, só para o que a ESPN não entregou.
  const has = (slug: string, key: "sportapiFootball" | "sportapiBasketball") =>
    Boolean(getCatalogEntry(slug)?.providers[key]);
  const footballFixtures = [...failedFixtures].filter((slug) => has(slug, "sportapiFootball"));
  const basketballFixtures = [...failedFixtures].filter((slug) => has(slug, "sportapiBasketball"));
  const footballTables = [...failedTables].filter((slug) => has(slug, "sportapiFootball"));
  const basketballTables = [...failedTables].filter((slug) => has(slug, "sportapiBasketball"));
  const needsFallback =
    footballFixtures.length + basketballFixtures.length + footballTables.length + basketballTables.length > 0;

  if (needsFallback && !sportapiEnabled()) {
    summary.errors.push(
      `Sem reserva (SPORTAPI_KEY não definida) para: ${[...new Set([...failedFixtures, ...failedTables])].join(", ")}`,
    );
  } else if (needsFallback) {
    if (footballFixtures.length > 0) {
      // O SportAPI data no horário da Europa Central: um dia a mais na frente.
      for (const day of [...days, addDays(today, 7)]) {
        await step(summary, `reserva futebol ${day}`, async () => {
          const fixtures = await sportapiFootballByDate(client, day);
          {
            const added = await saveFixtures(db, fixtures.filter((f) => footballFixtures.includes(f.competition)));
            summary.fixtures += added;
          }
        });
      }
    }
    if (basketballFixtures.length > 0) {
      for (const day of days) {
        await step(summary, `reserva basquete ${day}`, async () => {
          const games = await sportapiBasketballByDate(client, day);
          {
            const added = await saveFixtures(db, games.filter((g) => basketballFixtures.includes(g.competition)));
            summary.fixtures += added;
          }
        });
      }
    }
    if (footballTables.length > 0) {
      await step(summary, "reserva tabelas de futebol", async () => {
        let ids = await getKv<Record<string, number>>(db, LEAGUE_IDS_KEY);
        if (!ids || Date.now() - ids.updatedAt.getTime() > LEAGUE_IDS_TTL_MS) {
          const fresh = await sportapiFootballLeagueIds(client);
          await setKv(db, LEAGUE_IDS_KEY, fresh);
          ids = { value: fresh, updatedAt: new Date() };
        }
        for (const slug of footballTables) {
          const leagueId = ids.value[slug];
          if (!leagueId) continue;
          await step(summary, `reserva tabela ${slug}`, async () => {
            {
              const added = await replaceStandings(db, slug, await sportapiFootballStandings(client, slug, leagueId));
              summary.standings += added;
            }
          });
        }
      });
    }
    for (const slug of basketballTables) {
      const league = getCatalogEntry(slug)!.providers.sportapiBasketball!;
      await step(summary, `reserva tabela ${slug}`, async () => {
        {
          const added = await replaceStandings(db, slug, await sportapiBasketballStandings(client, league));
          summary.standings += added;
        }
      });
    }
  }

  // 3. Fórmula 1 — OpenF1 + Jolpica.
  await step(summary, "F1 calendário", async () => {
    const winners = await f1Winners(client);
    {
      const added = await saveFixtures(db, await f1Sessions(client, Number(today.slice(0, 4)), winners));
      summary.fixtures += added;
    }
  });
  await step(summary, "F1 campeonato", async () => {
    {
      const added = await saveStandings(db, await f1Standings(client));
      summary.standings += added;
    }
  });
}

/* ----------------------------------------------------------------- live */

/** Partidas que podem estar em andamento agora (começam em até 15 min ou começaram há até 4 h). */
async function activeFixtures(db: Db, idPrefix: string) {
  const now = Date.now();
  return collections(db)
    .fixtures.find({
      _id: { $regex: `^${idPrefix}` },
      status: { $in: ["scheduled", "live"] },
      kickoff: { $gte: new Date(now - 4 * 60 * 60 * 1000), $lte: new Date(now + 15 * 60 * 1000) },
    })
    .toArray();
}

/** Respeita o intervalo mínimo entre coletas ao vivo de cada fonte. */
async function throttled(db: Db, key: string, intervalMs = liveInterval()): Promise<boolean> {
  const last = await getKv<number>(db, `live:${key}`);
  if (last && Date.now() - last.updatedAt.getTime() < intervalMs) return true;
  await setKv(db, `live:${key}`, Date.now());
  return false;
}

/**
 * Intervalo mínimo entre coletas ao vivo na ESPN: 15 s por padrão, para placar
 * e relógio acompanharem o jogo. Ajuste com ESPN_LIVE_MIN_INTERVAL_SEC (ou o
 * antigo ESPN_LIVE_MIN_INTERVAL_MIN, em minutos).
 */
function espnLiveInterval(): number {
  const seconds = Number.parseInt(process.env.ESPN_LIVE_MIN_INTERVAL_SEC ?? "", 10);
  if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
  const minutes = Number.parseInt(process.env.ESPN_LIVE_MIN_INTERVAL_MIN ?? "", 10);
  return (Number.isFinite(minutes) && minutes > 0 ? minutes * 60 : 15) * 1000;
}

async function live(db: Db, client: ApiClient, summary: JobSummary) {
  // ESPN: sem cota, então o intervalo mínimo é curto (15 s por padrão).
  const espnActive = await activeFixtures(db, "espn:");
  if (espnActive.length === 0) summary.skipped.push("ESPN: nenhum jogo em andamento");
  else if (await throttled(db, "espn", espnLiveInterval())) summary.skipped.push("ESPN: intervalo mínimo");
  else {
    const requests = new Map<string, { slug: string; date: string }>();
    for (const fixture of espnActive) {
      const date = espnDateOf(fixture.kickoff);
      requests.set(`${fixture.competition}:${date}`, { slug: fixture.competition, date });
    }
    await mapLimit([...requests.values()], 4, async ({ slug, date }) => {
      const entry = getCatalogEntry(slug);
      if (!entry?.providers.espn) return;
      await step(summary, `ESPN ao vivo ${slug} ${date}`, async () => {
        {
          const added = await saveFixtures(db, await espnScoreboard(client, entry, date));
          summary.fixtures += added;
        }
      });
    });
  }

  // SportAPI: só para competições que estão em modo reserva.
  if (sportapiEnabled()) {
    const football = await activeFixtures(db, "sportapi:football:");
    if (football.length > 0 && !(await throttled(db, "sportapi-football"))) {
      const dates = [...new Set(football.map((fixture) => sportapiFootballDateOf(fixture.kickoff)))];
      const slugs = new Set(football.map((fixture) => fixture.competition));
      for (const date of dates) {
        await step(summary, `reserva futebol ao vivo ${date}`, async () => {
          const fixtures = await sportapiFootballByDate(client, date);
          {
            const added = await saveFixtures(db, fixtures.filter((f) => slugs.has(f.competition)));
            summary.fixtures += added;
          }
        });
      }
    }

    const basketball = await activeFixtures(db, "sportapi:basketball:");
    if (basketball.length > 0 && !(await throttled(db, "sportapi-basketball"))) {
      await step(summary, "reserva basquete ao vivo", async () => {
        const liveGames = await sportapiBasketballLive(client);
        {
          const added = await saveFixtures(db, liveGames);
          summary.fixtures += added;
        }
        const stillLive = new Set(liveGames.map((game) => game._id));
        if (basketball.some((game) => game.status === "live" && !stillLive.has(game._id))) {
          {
            const added = await saveFixtures(db, await sportapiBasketballByDate(client, toLocalYmd()));
            summary.fixtures += added;
          }
        }
      });
    }
  }

  // F1: o status vem do horário da sessão, sem gastar chamada. Depois da
  // corrida, busca o vencedor (Jolpica não exige chave).
  const f1 = await collections(db)
    .fixtures.find({
      _id: { $regex: "^openf1:" },
      kickoff: { $gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), $lte: new Date(Date.now() + 15 * 60 * 1000) },
    })
    .toArray();
  if (f1.length > 0 && !(await throttled(db, "f1"))) {
    await step(summary, "F1 ao vivo", async () => {
      const winners = await f1Winners(client);
      const year = Number(toLocalYmd().slice(0, 4));
      const sessions = await f1Sessions(client, year, winners);
      const recent = new Set(f1.map((item) => item._id));
      {
        const added = await saveFixtures(db, sessions.filter((session) => recent.has(session._id)));
        summary.fixtures += added;
      }
    });
  }
}

/* ------------------------------------------------------------- execução */

/* --------------------------------------------------------------- season */

const SEASON_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SEASON_TIME_BUDGET_MS = 45_000;
const SEASON_HORIZON_DAYS = 200;

/**
 * Calendário completo: para cada liga, lê o calendário publicado pela ESPN e
 * consulta os dias com jogo. Na primeira vez traz a temporada inteira (inclusive
 * resultados já disputados); depois, uma vez por semana, só o que falta jogar.
 * A coleta diária continua cuidando da semana corrente e dos placares.
 */
async function season(db: Db, client: ApiClient, summary: JobSummary) {
  const started = Date.now();
  const todayKey = toLocalYmd().replaceAll("-", "");
  const weekAgo = addDays(toLocalYmd(), -7).replaceAll("-", "");
  summary.season = { done: [], pending: [] };

  for (const entry of espnLeagues()) {
    const state = await getKv<{ full: boolean }>(db, `season:${entry.slug}`);
    const fresh = state && Date.now() - state.updatedAt.getTime() < SEASON_TTL_MS;
    if (fresh) continue;
    if (Date.now() - started > SEASON_TIME_BUDGET_MS) {
      summary.season.pending.push(entry.slug);
      continue;
    }

    try {
      const all = await espnSeasonQueries(client, entry, { horizonDays: SEASON_HORIZON_DAYS, listFromDay: weekAgo });
      // Primeira vez: temporada inteira. Depois: só de ontem em diante.
      const queries = state?.value.full ? all.filter((q) => q.day >= weekAgo || q.day >= todayKey) : all;
      let ok = true;
      const found: IngestFixture[] = [];
      await mapLimit(queries, 6, async (q) => {
        try {
          found.push(...(await espnScoreboardQuery(client, entry, q.query)));
        } catch (error) {
          ok = false;
          summary.skipped.push(`temporada ${entry.slug} ${q.query}: ${message(error)}`);
        }
      });
      const added = await saveFixtures(db, found);
      summary.fixtures += added;
      if (ok) {
        await setKv(db, `season:${entry.slug}`, { full: true });
        summary.season.done.push(`${entry.slug} (${queries.length} consultas, ${added} jogos)`);
      } else {
        summary.season.pending.push(entry.slug);
      }
    } catch (error) {
      summary.season.pending.push(entry.slug);
      summary.errors.push(`temporada ${entry.slug}: ${message(error)}`);
    }
  }
}

/* --------------------------------------------------------------- crests */

// O limite real da chave grátis é menor que os 30/min anunciados: em teste,
// bloqueou (HTTP 429 da Cloudflare) após ~10 buscas com 2 s de intervalo.
const CRESTS_PER_RUN = 12;
const CRESTS_SPACING_MS = 4_000;
const CREST_RETRY_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Escudos: procura no TheSportsDB os times que aparecem nas partidas e tabelas
 * e ainda não têm escudo. Até 12 por execução (~45 s); para no primeiro 429.
 * Times não encontrados são tentados de novo depois de 30 dias.
 */
async function crests(db: Db, client: ApiClient, summary: JobSummary) {
  const c = collections(db);
  const wanted = new Map<string, { name: string; sport: string }>();
  const add = (name: string | undefined, sport: string) => {
    if (!name || !crestSports().includes(sport)) return;
    wanted.set(`crest:${sport}:${normalizeTeam(name)}`, { name, sport });
  };

  // Partidas e tabelas da ESPN já trazem o escudo: só procura quem veio sem.
  const fixtures = await c.fixtures
    .find({ sport: { $in: crestSports() } })
    .project<{ sport: string; home?: { name: string; crest?: string }; away?: { name: string; crest?: string } }>({
      sport: 1,
      home: 1,
      away: 1,
    })
    .toArray();
  for (const fixture of fixtures) {
    if (!fixture.home?.crest) add(fixture.home?.name, fixture.sport);
    if (!fixture.away?.crest) add(fixture.away?.name, fixture.sport);
  }
  const tables = await c.standings.find({ format: { $in: ["football", "basketball"] } }).toArray();
  for (const table of tables) {
    const sport = table.format === "basketball" ? "basquete" : "futebol";
    for (const row of table.rows) if (!row.crest) add(row.team, sport);
  }

  const known = await c.crests.find({ _id: { $in: [...wanted.keys()] } }).toArray();
  const fresh = new Set(
    known
      .filter((doc) => doc.url !== null || Date.now() - doc.updatedAt.getTime() < CREST_RETRY_MS)
      .map((doc) => doc._id),
  );
  const pending = [...wanted.entries()].filter(([id]) => !fresh.has(id));
  summary.crests = { pending: pending.length, found: 0, missing: [] };

  let done = 0;
  for (const [id, team] of pending.slice(0, CRESTS_PER_RUN)) {
    if (done > 0) await new Promise((resolve) => setTimeout(resolve, CRESTS_SPACING_MS));
    try {
      const url = await findCrest(client, team.name, team.sport);
      await c.crests.updateOne(
        { _id: id },
        { $set: { sport: team.sport, name: team.name, url, source: "TheSportsDB", updatedAt: new Date() } },
        { upsert: true },
      );
      done += 1;
      if (url) summary.crests.found += 1;
      else summary.crests.missing.push(team.name);
    } catch (error) {
      if (error instanceof ProviderError && error.status === 429) {
        // Bloqueado pelo limite de chamadas: para aqui e continua na próxima execução.
        summary.skipped.push("escudos: limite do TheSportsDB atingido, continua na próxima execução");
        break;
      }
      summary.errors.push(`escudo ${team.name}: ${error instanceof Error ? error.message : String(error)}`);
      done += 1;
    }
  }
  summary.crests.pending -= done;
}

export async function runJob(db: Db, job: JobName): Promise<JobSummary> {
  await ensureIndexes(db);
  const client = new ApiClient(db);
  const summary: JobSummary = { job, fixtures: 0, standings: 0, calls: client.calls, skipped: [], errors: [] };
  const startedAt = new Date();

  if (job === "daily") await daily(db, client, summary);
  else if (job === "crests") await crests(db, client, summary);
  else if (job === "season") await season(db, client, summary);
  else await live(db, client, summary);

  // Ao vivo e temporada rodam com frequência: só registram quando fizeram algo (ou falharam).
  const idle =
    summary.errors.length === 0 &&
    ((job === "live" && summary.fixtures === 0) ||
      (job === "season" && !summary.season?.done.length && !summary.season?.pending.length));
  if (!idle) {
    await collections(db).ingestRuns.insertOne({
      job,
      startedAt,
      finishedAt: new Date(),
      ok: summary.errors.length === 0,
      summary,
    });
  }
  return summary;
}
