import "server-only";

import { catalog } from "@/lib/catalog";
import { TIME_ZONE } from "@/lib/dates";
import type { ApiClient } from "@/lib/ingest/http";
import { seasonLabel, slugify, type IngestFixture, type IngestStandings } from "@/lib/ingest/types";
import type { FixtureStatus, StandingRow } from "@/lib/types";

/**
 * SportAPI (https://sportapi.ai) — futebol e basquete.
 * Documentação: https://sportapi.ai/pt/docs · Especificação: /api/openapi.json
 *
 * Uma chamada a /fixtures/date/{data} traz TODAS as ligas do dia, então o custo
 * do futebol é ~1 chamada por dia consultado, não por liga.
 */

const BASE = "https://sportapi.ai/api";
const SOURCE = "SportAPI";

export function sportapiEnabled(): boolean {
  return Boolean(process.env.SPORTAPI_KEY);
}

function headers() {
  return { "X-Api-Key": process.env.SPORTAPI_KEY ?? "" };
}

/* -------------------------------------------------------------- Futebol */

type FootballFixture = {
  id: number;
  kickoff_utc: string;
  home_score: number | null;
  away_score: number | null;
  status: "Scheduled" | "LIVE" | "FT" | "AET" | "PENS" | "Postponed" | "Cancelled" | "Suspended";
  minute: string | number | null;
  stage?: string;
  league_id: number;
  league_name: string;
  home_team: string;
  home_short?: string;
  away_team: string;
  away_short?: string;
  penalty_home?: number | null;
  penalty_away?: number | null;
};

const footballBySportapiName = new Map(
  catalog
    .filter((entry) => entry.providers.sportapiFootball)
    .map((entry) => [entry.providers.sportapiFootball!.toLowerCase(), entry]),
);

function footballStatus(status: FootballFixture["status"]): FixtureStatus {
  switch (status) {
    case "LIVE":
      return "live";
    case "FT":
    case "AET":
    case "PENS":
      return "finished";
    case "Postponed":
    case "Suspended":
      return "postponed";
    case "Cancelled":
      return "cancelled";
    default:
      return "scheduled";
  }
}

function footballClock(row: FootballFixture): string | undefined {
  if (row.status === "AET") return "Prorrogação";
  if (row.status === "PENS") {
    return row.penalty_home != null && row.penalty_away != null
      ? `Pênaltis ${row.penalty_home}–${row.penalty_away}`
      : "Pênaltis";
  }
  if (row.status !== "LIVE" || row.minute == null || row.minute === "") return undefined;
  if (String(row.minute).toUpperCase() === "HT") return "Intervalo";
  return /^\d+(\+\d+)?$/.test(String(row.minute)) ? `${row.minute}'` : String(row.minute);
}

export async function sportapiFootballByDate(client: ApiClient, date: string): Promise<IngestFixture[]> {
  const body = await client.getJson<{ data?: FootballFixture[] }>(
    "sportapi",
    `${BASE}/fixtures/date/${date}`,
    headers(),
  );
  const rows = body.data ?? [];
  const result: IngestFixture[] = [];
  for (const row of rows) {
    const entry = footballBySportapiName.get(row.league_name?.toLowerCase());
    if (!entry || !row.kickoff_utc) continue;
    const status = footballStatus(row.status);
    const hasScore = row.home_score != null && row.away_score != null && status !== "scheduled";
    result.push({
      _id: `sportapi:football:${row.id}`,
      sport: entry.sport,
      competition: entry.slug,
      kind: "match",
      round: row.stage || undefined,
      kickoff: new Date(row.kickoff_utc),
      status,
      home: { slug: slugify(row.home_team), name: row.home_team, shortName: row.home_short, sport: entry.sport },
      away: { slug: slugify(row.away_team), name: row.away_team, shortName: row.away_short, sport: entry.sport },
      ...(hasScore ? { score: { home: row.home_score!, away: row.away_score! } } : {}),
      clock: footballClock(row),
      source: SOURCE,
    });
  }
  return result;
}

/** Data (YYYY-MM-DD) que o SportAPI usa para a partida: o dia no horário da Europa Central. */
export function sportapiFootballDateOf(kickoff: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(kickoff);
}

type LeaguesResponse = {
  data?: { country: string; leagues: { id: number; name: string; has_standings: boolean }[] }[];
};

/** Mapa slug do catálogo → ID da liga no SportAPI (1 chamada). */
export async function sportapiFootballLeagueIds(client: ApiClient): Promise<Record<string, number>> {
  const body = await client.getJson<LeaguesResponse>("sportapi", `${BASE}/leagues`, headers());
  const ids: Record<string, number> = {};
  for (const group of body.data ?? []) {
    for (const league of group.leagues) {
      const entry = footballBySportapiName.get(league.name.toLowerCase());
      if (entry && league.has_standings) ids[entry.slug] = league.id;
    }
  }
  return ids;
}

type FootballStandingRow = {
  position: number;
  group?: string | null;
  team: { name: string; short_name?: string };
  played: number;
  won: number;
  draw: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  points: number;
  form?: { result: "W" | "D" | "L" }[];
};

export async function sportapiFootballStandings(
  client: ApiClient,
  slug: string,
  leagueId: number,
): Promise<IngestStandings[]> {
  const entry = catalog.find((item) => item.slug === slug)!;
  const body = await client.getJson<{ data?: FootballStandingRow[] }>(
    "sportapi",
    `${BASE}/standings/${leagueId}`,
    headers(),
  );
  const groups = new Map<string, StandingRow[]>();
  for (const row of body.data ?? []) {
    const key = row.group ?? "";
    const rows = groups.get(key) ?? [];
    rows.push({
      position: row.position,
      team: row.team.name,
      played: row.played,
      wins: row.won,
      draws: row.draw,
      losses: row.lost,
      goalsFor: row.goals_for,
      goalsAgainst: row.goals_against,
      points: row.points,
      form: row.form?.map((item) => item.result).filter((r) => r === "W" || r === "D" || r === "L"),
    });
    groups.set(key, rows);
  }
  return [...groups.entries()].map(([group, rows]) => ({
    _id: `table:${slug}:${group || "geral"}`,
    competition: slug,
    season: seasonLabel(entry),
    format: "football",
    ...(group ? { group } : {}),
    rows,
    source: SOURCE,
  }));
}

/* ------------------------------------------------------------- Basquete */

type BasketballGame = {
  id: number;
  league: { slug: string };
  stage?: string | null;
  round?: string | null;
  start: string;
  status: string;
  live: boolean;
  period?: number | null;
  clock?: string | null;
  venue?: string | null;
  home: { name: string; slug: string; abbreviation?: string; score?: number | null };
  away: { name: string; slug: string; abbreviation?: string; score?: number | null };
};

const basketballBySlug = new Map(
  catalog
    .filter((entry) => entry.providers.sportapiBasketball)
    .map((entry) => [entry.providers.sportapiBasketball!, entry]),
);

export function basketballLeagues(): string[] {
  return [...basketballBySlug.keys()];
}

function basketballStatus(game: BasketballGame): FixtureStatus {
  const status = game.status?.toUpperCase();
  if (game.live) return "live";
  if (status === "FT" || status === "AOT") return "finished";
  if (status === "POST" || status === "PST" || status === "PPD" || status === "SUSP") return "postponed";
  if (status === "CANC") return "cancelled";
  return "scheduled";
}

function basketballClock(game: BasketballGame): string | undefined {
  const status = game.status?.toUpperCase();
  if (status === "AOT") return "Prorrogação";
  if (!game.live) return undefined;
  if (status === "HT") return "Intervalo";
  return [status, game.clock].filter(Boolean).join(" ") || undefined;
}

function mapBasketball(game: BasketballGame): IngestFixture | null {
  const entry = basketballBySlug.get(game.league?.slug);
  if (!entry || !game.start) return null;
  const status = basketballStatus(game);
  const hasScore = game.home.score != null && game.away.score != null && status !== "scheduled";
  return {
    _id: `sportapi:basketball:${game.id}`,
    sport: entry.sport,
    competition: entry.slug,
    kind: "match",
    round: game.round || undefined,
    kickoff: new Date(game.start),
    status,
    home: { slug: game.home.slug, name: game.home.name, shortName: game.home.abbreviation, sport: entry.sport },
    away: { slug: game.away.slug, name: game.away.name, shortName: game.away.abbreviation, sport: entry.sport },
    ...(hasScore ? { score: { home: game.home.score!, away: game.away.score! } } : {}),
    clock: basketballClock(game),
    venue: game.venue || undefined,
    source: SOURCE,
  };
}

/** Jogos de basquete de um dia de Brasília (o SportAPI aceita o fuso). */
export async function sportapiBasketballByDate(client: ApiClient, ymd: string): Promise<IngestFixture[]> {
  const leagues = basketballLeagues().join(",");
  const body = await client.getJson<{ data?: BasketballGame[] }>(
    "sportapi",
    `${BASE}/basketball/games/date/${ymd}?league=${leagues}&tz=${encodeURIComponent(TIME_ZONE)}`,
    headers(),
  );
  return (body.data ?? []).map(mapBasketball).filter((item): item is IngestFixture => item !== null);
}

export async function sportapiBasketballLive(client: ApiClient): Promise<IngestFixture[]> {
  const leagues = basketballLeagues().join(",");
  const body = await client.getJson<{ data?: BasketballGame[] }>(
    "sportapi",
    `${BASE}/basketball/games/live?league=${leagues}`,
    headers(),
  );
  return (body.data ?? []).map(mapBasketball).filter((item): item is IngestFixture => item !== null);
}

type BasketballStandings = {
  data?: {
    group: string;
    table: {
      position: number;
      team: { name: string };
      played: number;
      won: number;
      lost: number;
      win_pct: number;
      games_behind: number | null;
      streak?: string | null;
    }[];
  }[];
};

export async function sportapiBasketballStandings(client: ApiClient, leagueSlug: string): Promise<IngestStandings[]> {
  const entry = basketballBySlug.get(leagueSlug)!;
  const body = await client.getJson<BasketballStandings>(
    "sportapi",
    `${BASE}/basketball/standings/${leagueSlug}`,
    headers(),
  );
  return (body.data ?? []).map((group) => ({
    _id: `table:${entry.slug}:${group.group || "geral"}`,
    competition: entry.slug,
    season: seasonLabel(entry),
    format: "basketball",
    group: group.group?.replace("Eastern Conference", "Conferência Leste").replace("Western Conference", "Conferência Oeste"),
    rows: group.table.map((row) => ({
      position: row.position,
      team: row.team.name,
      played: row.played,
      wins: row.won,
      losses: row.lost,
      winPct: row.win_pct,
      gamesBehind: row.games_behind ?? undefined,
      streak: row.streak ?? undefined,
    })),
    source: SOURCE,
  }));
}
