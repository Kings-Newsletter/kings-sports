import "server-only";

import { getLeague } from "@/lib/catalog";

/**
 * Perfis de atleta e de time, lidos sob demanda da ESPN (mesma API pública
 * usada na coleta), com cache de 1 h (calendário do time: 10 min).
 */

const WEB = "https://site.web.api.espn.com/apis/common/v3/sports";
const SITE = "https://site.api.espn.com/apis/site/v2/sports";

async function getJson<T>(url: string, revalidate: number): Promise<T | null> {
  try {
    const response = await fetch(url, { next: { revalidate }, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/* --------------------------------------------------------------- atleta */

export type AthleteProfile = {
  id: string;
  name: string;
  photo?: string;
  flag?: string;
  nationality?: string;
  position?: string;
  jersey?: string;
  age?: number;
  height?: string;
  weight?: string;
  birthDate?: string;
  birthPlace?: string;
  experience?: string;
  draft?: string;
  team?: { id?: string; name: string; logo?: string };
  /** Destaques da temporada (com posição no ranking da liga, quando houver) */
  highlights: { label: string; value: string; rank?: string }[];
  highlightsTitle?: string;
  /** Temporada, carreira, por competição */
  splits: { labels: string[]; rows: { name: string; stats: string[] }[] } | null;
  lastGames: {
    id: string;
    date: string;
    home: boolean;
    opponent: string;
    opponentLogo?: string;
    score?: string;
    result?: string;
    stats: string[];
  }[];
  lastGamesLabels: string[];
  nextGame?: { date: string; name: string };
};

type AthleteBio = {
  athlete?: {
    displayName: string;
    headshot?: { href?: string };
    flag?: { href?: string };
    citizenship?: string;
    position?: { displayName?: string };
    jersey?: string;
    age?: number;
    displayHeight?: string;
    displayWeight?: string;
    displayDOB?: string;
    birthPlace?: { city?: string; state?: string; country?: string };
    displayExperience?: string;
    displayDraft?: string;
    team?: { id?: string; displayName?: string; logos?: { href: string }[] };
    statsSummary?: {
      displayName?: string;
      statistics?: { displayName?: string; abbreviation?: string; displayValue?: string; rankDisplayValue?: string }[];
    };
  };
};

type AthleteOverview = {
  statistics?: { labels?: string[]; splits?: { displayName: string; stats: string[] }[] };
  gameLog?: {
    statistics?: { labels?: string[]; events?: { eventId: string; stats: string[] }[] }[];
    events?: Record<
      string,
      {
        gameDate?: string;
        atVs?: string;
        score?: string;
        gameResult?: string;
        opponent?: { displayName?: string; logo?: string };
      }
    >;
  };
  nextGame?: { league?: { events?: { date?: string; name?: string }[] } };
};

const SUMMARY_LABELS: Record<string, string> = {
  "Points Per Game": "Pontos por jogo",
  "Rebounds Per Game": "Rebotes por jogo",
  "Assists Per Game": "Assistências por jogo",
  "Field Goal Percentage": "Aproveitamento nos arremessos",
  "Starts-Substitute Appearances": "Titular (reserva)",
  "Total Goals": "Gols",
  Goals: "Gols",
  Assists: "Assistências",
  Shots: "Finalizações",
  "Passing Yards": "Jardas de passe",
  "Passing Touchdowns": "Touchdowns de passe",
  "Rushing Yards": "Jardas corridas",
  "Receiving Yards": "Jardas de recepção",
  Receptions: "Recepções",
  "Total Tackles": "Tackles",
  Sacks: "Sacks",
};

export async function getAthleteProfile(league: string, id: string): Promise<AthleteProfile | null> {
  const path = getLeague(league)?.providers.espn;
  if (!path || !/^\d+$/.test(id)) return null;

  const [bio, overview] = await Promise.all([
    getJson<AthleteBio>(`${WEB}/${path}/athletes/${id}`, 3600),
    getJson<AthleteOverview>(`${WEB}/${path}/athletes/${id}/overview`, 3600),
  ]);
  const a = bio?.athlete;
  if (!a) return null;

  let highlights = (a.statsSummary?.statistics ?? []).map((s) => ({
    label: SUMMARY_LABELS[s.displayName ?? ""] ?? s.displayName ?? s.abbreviation ?? "",
    value: s.displayValue ?? "–",
    rank: s.rankDisplayValue?.replace(/(\d+)(st|nd|rd|th)/, "$1º"),
  }));
  let highlightsTitle = a.statsSummary?.displayName;

  // No futebol, o resumo da ESPN às vezes vem de outra competição (zerado).
  // Nesse caso, usa a competição em que o atleta mais jogou na temporada.
  const labels = overview?.statistics?.labels ?? [];
  const splits = overview?.statistics?.splits ?? [];
  const allZero = highlights.length > 0 && highlights.every((h) => /^0(\s*\(0\))?$/.test(h.value));
  if (allZero && splits.length > 0) {
    const at = (name: string) => labels.indexOf(name);
    const games = at("STRT") >= 0 ? at("STRT") : at("APP");
    const best = [...splits].sort(
      (x, y) => Number(y.stats[games] ?? 0) - Number(x.stats[games] ?? 0),
    )[0]!;
    const pick: [string, string][] = [
      ["STRT", "Jogos como titular"],
      ["G", "Gols"],
      ["A", "Assistências"],
      ["SHOT", "Finalizações"],
    ];
    highlights = pick
      .filter(([key]) => at(key) >= 0)
      .map(([key, label]) => ({ label, value: best.stats[at(key)] ?? "–", rank: undefined }));
    highlightsTitle = best.displayName;
  }

  const log = overview?.gameLog?.statistics?.[0];
  const events = overview?.gameLog?.events ?? {};
  const next = overview?.nextGame?.league?.events?.[0];
  const birthPlace = [a.birthPlace?.city, a.birthPlace?.state, a.birthPlace?.country].filter(Boolean).join(", ");

  return {
    id,
    name: a.displayName,
    photo: a.headshot?.href,
    flag: a.flag?.href,
    nationality: a.citizenship,
    position: a.position?.displayName,
    jersey: a.jersey,
    age: a.age,
    height: a.displayHeight,
    weight: a.displayWeight,
    birthDate: a.displayDOB,
    birthPlace: birthPlace || undefined,
    experience: a.displayExperience,
    draft: a.displayDraft,
    team: a.team?.displayName ? { id: a.team.id, name: a.team.displayName, logo: a.team.logos?.[0]?.href } : undefined,
    highlightsTitle,
    highlights,
    splits:
      overview?.statistics?.labels && overview.statistics.splits?.length
        ? {
            labels: overview.statistics.labels,
            rows: overview.statistics.splits.map((split) => ({ name: split.displayName, stats: split.stats })),
          }
        : null,
    lastGamesLabels: log?.labels ?? [],
    lastGames: (log?.events ?? []).slice(0, 8).map((event) => {
      const info = events[event.eventId];
      return {
        id: event.eventId,
        date: info?.gameDate ?? "",
        home: info?.atVs !== "@",
        opponent: info?.opponent?.displayName ?? "—",
        opponentLogo: info?.opponent?.logo,
        score: info?.score,
        result: info?.gameResult,
        stats: event.stats,
      };
    }),
    nextGame: next?.date && next.name ? { date: next.date, name: next.name } : undefined,
  };
}

/* ----------------------------------------------------------------- time */

export type TeamProfile = {
  id: string;
  name: string;
  logo?: string;
  color?: string;
  record?: string;
  standing?: string;
  roster: { group: string; players: { id: string; name: string; jersey?: string; position?: string; age?: number; flag?: string; photo?: string }[] }[];
  games: {
    id: string;
    date: string;
    state: "pre" | "in" | "post";
    statusName?: string;
    home: boolean;
    opponent: string;
    opponentLogo?: string;
    us?: string;
    them?: string;
    result?: "V" | "E" | "D";
  }[];
};

type RosterAthlete = {
  id: string;
  displayName: string;
  jersey?: string;
  age?: number;
  position?: { displayName?: string; abbreviation?: string };
  flag?: { href?: string };
  headshot?: { href?: string };
};

type ScheduleEvent = {
  id: string;
  date: string;
  competitions?: {
    status?: { type?: { state?: "pre" | "in" | "post"; name?: string } };
    competitors?: {
      homeAway: "home" | "away";
      winner?: boolean;
      score?: { displayValue?: string } | string;
      team?: { id?: string; displayName?: string; logos?: { href: string }[]; logo?: string };
    }[];
  }[];
};

const GROUP_ORDER = ["Goleiro", "Defensor", "Meio-campista", "Atacante"];

export async function getTeamProfile(league: string, id: string): Promise<TeamProfile | null> {
  // "selecoes" não é uma competição do catálogo: são as seleções da Copa do Mundo.
  const national = league === "selecoes";
  const path = getLeague(league)?.providers.espn;
  if (!path || !/^\d+$/.test(id)) return null;
  const lang = national ? "?lang=pt&region=br" : "";

  const [info, roster, schedule] = await Promise.all([
    getJson<{
      team?: {
        displayName: string;
        logos?: { href: string }[];
        color?: string;
        record?: { items?: { summary?: string }[] };
        standingSummary?: string;
        nextEvent?: ScheduleEvent[];
      };
    }>(`${SITE}/${path}/teams/${id}${lang}`, 3600),
    getJson<{ athletes?: (RosterAthlete | { position?: string; items?: RosterAthlete[] })[] }>(
      `${SITE}/${path}/teams/${id}/roster`,
      3600,
    ),
    getJson<{ events?: ScheduleEvent[] }>(`${SITE}/${path}/teams/${id}/schedule${lang}`, 600),
  ]);
  const team = info?.team;
  if (!team) return null;

  // Elenco: plano (futebol, NBA) ou agrupado por posição (NFL).
  const flat: RosterAthlete[] = [];
  for (const item of roster?.athletes ?? []) {
    if ("items" in item && Array.isArray(item.items)) flat.push(...item.items);
    else if ("id" in item) flat.push(item as RosterAthlete);
  }
  const groups = new Map<string, TeamProfile["roster"][number]["players"]>();
  for (const athlete of flat) {
    const position = athlete.position?.displayName;
    const group = translateGroup(position);
    groups.set(group, [
      ...(groups.get(group) ?? []),
      {
        id: athlete.id,
        name: athlete.displayName,
        jersey: athlete.jersey,
        position: athlete.position?.abbreviation,
        age: athlete.age,
        flag: athlete.flag?.href,
        photo: athlete.headshot?.href,
      },
    ]);
  }
  const rosterGroups = [...groups.entries()]
    .sort(([a], [b]) => (GROUP_ORDER.indexOf(a) + 99) % 99 - (GROUP_ORDER.indexOf(b) + 99) % 99)
    .map(([group, players]) => ({ group, players }));

  // O calendário da ESPN traz os jogos encerrados; o próximo vem à parte.
  const known = new Set((schedule?.events ?? []).map((event) => event.id));
  const allEvents = [...(schedule?.events ?? []), ...(team.nextEvent ?? []).filter((event) => !known.has(event.id))];
  const games: TeamProfile["games"] = allEvents.flatMap((event) => {
    const competition = event.competitions?.[0];
    const us = competition?.competitors?.find((c) => c.team?.id === id);
    const them = competition?.competitors?.find((c) => c.team?.id !== id);
    if (!us || !them) return [];
    const score = (c: typeof us) => (typeof c.score === "string" ? c.score : c.score?.displayValue);
    const state = competition?.status?.type?.state ?? "pre";
    const usScore = score(us);
    const themScore = score(them);
    let result: "V" | "E" | "D" | undefined;
    if (state === "post" && usScore !== undefined && themScore !== undefined) {
      result = us.winner ? "V" : them.winner ? "D" : Number(usScore) === Number(themScore) ? "E" : Number(usScore) > Number(themScore) ? "V" : "D";
    }
    return [
      {
        id: event.id,
        date: event.date,
        state,
        statusName: competition?.status?.type?.name,
        home: us.homeAway === "home",
        opponent: them.team?.displayName ?? "—",
        opponentLogo: them.team?.logos?.[0]?.href ?? them.team?.logo,
        us: usScore,
        them: themScore,
        result,
      },
    ];
  });

  games.sort((x, y) => Date.parse(x.date) - Date.parse(y.date));

  return {
    id,
    name: team.displayName,
    logo: team.logos?.[0]?.href,
    color: team.color,
    record: team.record?.items?.[0]?.summary,
    standing: team.standingSummary
      ?.replace(/^(\d+)(st|nd|rd|th) in /, "$1º lugar — ")
      .replace("Brazilian Serie A", "Brasileirão"),
    roster: rosterGroups,
    games,
  };
}

function translateGroup(position?: string): string {
  const map: Record<string, string> = {
    Goalkeeper: "Goleiro",
    Defender: "Defensor",
    Midfielder: "Meio-campista",
    Forward: "Atacante",
  };
  return (position && map[position]) ?? position ?? "Elenco";
}
