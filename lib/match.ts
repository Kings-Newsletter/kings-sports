import "server-only";

import { getCatalogEntry } from "@/lib/catalog";
import type { Fixture } from "@/lib/types";

/**
 * Detalhe de uma partida (lances, estatísticas, escalações, destaques), lido
 * sob demanda do resumo da ESPN: GET .../{liga}/summary?event={id}.
 * Não é guardado no banco: o cache do Next.js segura 10 min. Com o jogo em
 * andamento, a página usa só o que não muda durante a partida (escalações,
 * momento dos times, confrontos, tabela e desfalques): o portal não tem
 * cobertura ao vivo.
 */

const SITE = "https://site.api.espn.com/apis/site/v2/sports";

export type Side = "home" | "away";

export type MatchEvent = {
  minute?: string;
  kind: "goal" | "own-goal" | "penalty" | "penalty-miss" | "yellow" | "red" | "sub";
  side?: Side;
  player?: string;
  /** Assistência (gol) ou quem saiu (substituição) */
  secondary?: string;
};

export type MatchStat = { key: string; label: string; home: string; away: string; homeValue: number; awayValue: number };

export type Lineup = {
  side: Side;
  formation?: string;
  starters: { id?: string; jersey?: string; name: string; position?: string }[];
  bench: { id?: string; jersey?: string; name: string; position?: string }[];
};

export type MatchLeader = {
  label: string;
  home?: { id?: string; name: string; value: string; photo?: string };
  away?: { id?: string; name: string; value: string; photo?: string };
};

/** Um dos últimos jogos de um time, do ponto de vista dele. */
export type FormGame = {
  result: "W" | "D" | "L";
  opponent: string;
  /** Placar como a fonte publica: mandante–visitante */
  score?: string;
  /** "vs" em casa, "@" fora */
  atVs?: string;
  date?: string;
};

export type SeriesGame = {
  date?: string;
  home: string;
  away: string;
  homeScore?: string;
  awayScore?: string;
};

export type TableRow = {
  side: Side;
  position?: number;
  team: string;
  /** Pontos (futebol) ou campanha "V-D" (ligas americanas) */
  value?: string;
  valueLabel: string;
  played?: string;
};

export type Injury = { name: string; position?: string; status: string; detail?: string };

export type MatchDetail = {
  events: MatchEvent[];
  stats: MatchStat[];
  lineups: Lineup[];
  leaders: MatchLeader[];
  attendance?: number;
  city?: string;
  form: { side: Side; games: FormGame[] }[];
  /** Vitórias de cada time da partida e empates nos confrontos listados */
  series?: { wins: Record<Side, number>; draws: number; games: SeriesGame[] };
  table?: { rows: TableRow[] };
  injuries: { side: Side; players: Injury[] }[];
};

/** Estatísticas exibidas, na ordem: chave da ESPN → [rótulo, é porcentagem 0–1?] */
const STAT_LABELS: Record<string, [string, boolean]> = {
  // futebol
  possessionPct: ["Posse de bola (%)", false],
  totalShots: ["Finalizações", false],
  shotsOnTarget: ["Finalizações no alvo", false],
  wonCorners: ["Escanteios", false],
  saves: ["Defesas", false],
  foulsCommitted: ["Faltas", false],
  offsides: ["Impedimentos", false],
  yellowCards: ["Cartões amarelos", false],
  redCards: ["Cartões vermelhos", false],
  totalPasses: ["Passes", false],
  passPct: ["Precisão de passe (%)", true],
  // basquete
  fieldGoalPct: ["Arremessos (%)", false],
  threePointFieldGoalPct: ["Bolas de 3 (%)", false],
  freeThrowPct: ["Lances livres (%)", false],
  totalRebounds: ["Rebotes", false],
  assists: ["Assistências", false],
  steals: ["Roubos de bola", false],
  blocks: ["Tocos", false],
  turnovers: ["Erros", false],
  // futebol americano
  totalYards: ["Jardas totais", false],
  netPassingYards: ["Jardas de passe", false],
  rushingYards: ["Jardas corridas", false],
  firstDowns: ["First downs", false],
  turnoversNFL: ["Turnovers", false],
  possessionTime: ["Tempo de posse", false],
};

const LEADER_LABELS: Record<string, string> = {
  points: "Pontos",
  rebounds: "Rebotes",
  assists: "Assistências",
  passingYards: "Jardas de passe",
  rushingYards: "Jardas corridas",
  receivingYards: "Jardas de recepção",
};

const EVENT_KINDS: Record<string, MatchEvent["kind"]> = {
  goal: "goal",
  "goal---header": "goal",
  "goal---free-kick": "goal",
  "penalty---scored": "penalty",
  "own-goal": "own-goal",
  "penalty---missed": "penalty-miss",
  "penalty---saved": "penalty-miss",
  "yellow-card": "yellow",
  "red-card": "red",
  "yellow-red-card": "red",
  substitution: "sub",
};

type Summary = {
  header?: { competitions?: { competitors?: { homeAway: Side; team: { id: string } }[] }[] };
  keyEvents?: {
    type?: { type?: string };
    clock?: { displayValue?: string };
    team?: { id?: string };
    participants?: { athlete?: { displayName?: string } }[];
  }[];
  boxscore?: {
    teams?: { homeAway?: Side; team: { id: string }; statistics?: { name: string; displayValue?: string }[] }[];
  };
  rosters?: {
    homeAway: Side;
    formation?: string;
    roster?: {
      starter?: boolean;
      jersey?: string;
      position?: { abbreviation?: string };
      athlete?: { id?: string; displayName?: string };
    }[];
  }[];
  leaders?: {
    team?: { id?: string };
    leaders?: {
      name: string;
      leaders?: { displayValue?: string; athlete?: { id?: string; displayName?: string; headshot?: { href?: string } } }[];
    }[];
  }[];
  gameInfo?: { attendance?: number; venue?: { address?: { city?: string } } };
  lastFiveGames?: {
    team?: { id?: string };
    events?: { gameResult?: string; score?: string; atVs?: string; gameDate?: string; opponent?: { displayName?: string } }[];
  }[];
  seasonseries?: {
    type?: string;
    summary?: string;
    events?: {
      id?: string;
      date?: string;
      statusType?: { completed?: boolean; state?: string };
      competitors?: { homeAway?: Side; score?: string; winner?: boolean; team?: { id?: string; displayName?: string } }[];
    }[];
  }[];
  standings?: {
    groups?: {
      header?: string;
      standings?: { entries?: { id?: string; team?: string; stats?: { name?: string; displayValue?: string; value?: number }[] }[] };
    }[];
  };
  injuries?: {
    team?: { id?: string };
    injuries?: {
      status?: string;
      athlete?: { displayName?: string; position?: { abbreviation?: string } };
      details?: { type?: string };
    }[];
  }[];
};

const INJURY_STATUS: Record<string, string> = {
  Out: "Fora",
  Questionable: "Dúvida",
  Doubtful: "Improvável",
  "Injured Reserve": "Lista de lesionados",
  "Day-To-Day": "Dia a dia",
  Suspension: "Suspenso",
};

function number(value: string | undefined, pct: boolean): number {
  const n = Number.parseFloat((value ?? "").replace(",", "."));
  if (!Number.isFinite(n)) return 0;
  return pct && n <= 1 ? n * 100 : n;
}

export async function getMatchDetail(fixture: Fixture): Promise<MatchDetail | null> {
  const espnId = fixture.id.startsWith("espn:") ? fixture.id.slice(5) : null;
  const path = getCatalogEntry(fixture.competition)?.providers.espn;
  if (!espnId || !path) return null;

  let body: Summary;
  try {
    const response = await fetch(`${SITE}/${path}/summary?event=${espnId}`, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    body = (await response.json()) as Summary;
  } catch {
    return null;
  }

  const sideOf = new Map<string, Side>();
  for (const competitor of body.header?.competitions?.[0]?.competitors ?? []) {
    sideOf.set(competitor.team.id, competitor.homeAway);
  }

  const events: MatchEvent[] = (body.keyEvents ?? []).flatMap((event) => {
    const kind = EVENT_KINDS[event.type?.type ?? ""];
    if (!kind) return [];
    const names = (event.participants ?? []).map((p) => p.athlete?.displayName).filter(Boolean) as string[];
    return [
      {
        minute: event.clock?.displayValue || undefined,
        kind,
        side: event.team?.id ? sideOf.get(event.team.id) : undefined,
        player: names[0],
        secondary: names[1],
      },
    ];
  });

  const teams = body.boxscore?.teams ?? [];
  const home = teams.find((t) => (t.homeAway ?? sideOf.get(t.team.id)) === "home");
  const away = teams.find((t) => (t.homeAway ?? sideOf.get(t.team.id)) === "away");
  const stats: MatchStat[] = [];
  if (home && away) {
    for (const [key, [label, pct]] of Object.entries(STAT_LABELS)) {
      const h = home.statistics?.find((s) => s.name === key);
      const a = away.statistics?.find((s) => s.name === key);
      if (!h || !a) continue;
      const homeValue = number(h.displayValue, pct);
      const awayValue = number(a.displayValue, pct);
      stats.push({
        key,
        label,
        home: pct ? `${Math.round(homeValue)}` : (h.displayValue ?? "–"),
        away: pct ? `${Math.round(awayValue)}` : (a.displayValue ?? "–"),
        homeValue,
        awayValue,
      });
    }
  }

  const lineups: Lineup[] = (body.rosters ?? [])
    .filter((roster) => (roster.roster ?? []).length > 0)
    .map((roster) => {
      const players = (roster.roster ?? []).map((p) => ({
        id: p.athlete?.id,
        jersey: p.jersey,
        name: p.athlete?.displayName ?? "—",
        position: p.position?.abbreviation,
        starter: Boolean(p.starter),
      }));
      return {
        side: roster.homeAway,
        formation: roster.formation,
        starters: players.filter((p) => p.starter),
        bench: players.filter((p) => !p.starter),
      };
    });

  const leaders: MatchLeader[] = [];
  const leaderTeams = body.leaders ?? [];
  for (const [key, label] of Object.entries(LEADER_LABELS)) {
    const row: MatchLeader = { label };
    for (const team of leaderTeams) {
      const side = team.team?.id ? sideOf.get(team.team.id) : undefined;
      const top = team.leaders?.find((l) => l.name === key)?.leaders?.[0];
      if (!side || !top?.athlete?.displayName) continue;
      row[side] = {
        id: top.athlete.id,
        name: top.athlete.displayName,
        value: top.displayValue ?? "",
        photo: top.athlete.headshot?.href,
      };
    }
    if (row.home || row.away) leaders.push(row);
  }

  const form = (body.lastFiveGames ?? []).flatMap((team) => {
    const side = team.team?.id ? sideOf.get(team.team.id) : undefined;
    if (!side) return [];
    const games: FormGame[] = (team.events ?? []).flatMap((event) => {
      const result = event.gameResult;
      if (result !== "W" && result !== "D" && result !== "L") return [];
      return [
        {
          result,
          opponent: event.opponent?.displayName ?? "—",
          score: event.score,
          atVs: event.atVs,
          date: event.gameDate,
        },
      ];
    });
    return games.length > 0 ? [{ side, games: games.slice(-5) }] : [];
  });

  // Confrontos recentes já encerrados, do mais novo ao mais antigo (o jogo
  // atual fica de fora). O placar de vitórias é contado aqui, em português.
  const headToHead = body.seasonseries?.find((series) => series.type === "head-to-head") ?? body.seasonseries?.[0];
  const wins: Record<Side, number> = { home: 0, away: 0 };
  let draws = 0;
  const seriesGames: SeriesGame[] = (headToHead?.events ?? [])
    .filter((event) => event.id !== espnId && (event.statusType?.completed || event.statusType?.state === "post"))
    .flatMap((event) => {
      const home = event.competitors?.find((c) => c.homeAway === "home");
      const away = event.competitors?.find((c) => c.homeAway === "away");
      if (!home?.team?.displayName || !away?.team?.displayName) return [];
      const winner = home.winner ? home : away.winner ? away : null;
      const winnerSide = winner?.team?.id ? sideOf.get(winner.team.id) : undefined;
      if (winnerSide) wins[winnerSide] += 1;
      else if (!winner) draws += 1;
      return [
        {
          date: event.date,
          home: home.team.displayName,
          away: away.team.displayName,
          homeScore: home.score,
          awayScore: away.score,
        },
      ];
    })
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const series = seriesGames.length > 0 ? { wins, draws, games: seriesGames } : undefined;

  // Linhas da tabela só dos dois times da partida.
  let table: MatchDetail["table"];
  for (const group of body.standings?.groups ?? []) {
    const entries = group.standings?.entries ?? [];
    const rows: TableRow[] = entries.flatMap((entry, index) => {
      const side = entry.id ? sideOf.get(entry.id) : undefined;
      if (!side) return [];
      const stat = (name: string) => entry.stats?.find((s) => s.name === name);
      const rank = stat("rank")?.value;
      const points = stat("points")?.displayValue;
      return [
        {
          side,
          position: typeof rank === "number" ? rank : index + 1,
          team: entry.team ?? "—",
          value: points ?? stat("overall")?.displayValue,
          valueLabel: points ? "pts" : "campanha",
          played: stat("gamesPlayed")?.displayValue,
        },
      ];
    });
    if (rows.length === 0) continue;
    // Ligas americanas trazem uma tabela por divisão: junta as duas.
    table = { rows: [...(table?.rows ?? []), ...rows] };
  }
  if (table) table.rows.sort((a, b) => (a.side === "home" ? -1 : 1) - (b.side === "home" ? -1 : 1));

  const injuries = (body.injuries ?? []).flatMap((team) => {
    const side = team.team?.id ? sideOf.get(team.team.id) : undefined;
    const players: Injury[] = (team.injuries ?? []).flatMap((injury) =>
      injury.athlete?.displayName
        ? [
            {
              name: injury.athlete.displayName,
              position: injury.athlete.position?.abbreviation,
              status: INJURY_STATUS[injury.status ?? ""] ?? injury.status ?? "—",
              detail: injury.details?.type,
            },
          ]
        : [],
    );
    return side && players.length > 0 ? [{ side, players }] : [];
  });

  return {
    events,
    stats,
    lineups,
    leaders,
    form,
    series,
    table,
    injuries,
    attendance: body.gameInfo?.attendance || undefined,
    city: body.gameInfo?.venue?.address?.city,
  };
}
