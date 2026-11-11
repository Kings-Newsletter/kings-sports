import "server-only";

import { catalog, getCatalogEntry } from "@/lib/catalog";
import { getCommonsPhotos, type CommonsPhoto } from "@/lib/commons";
import { getStandings, getStatBoards } from "@/lib/data";
import { driverHref } from "@/lib/slugs";

/**
 * Índices de pessoas e equipes (jogadores, pilotos, times, seleções), montados
 * a partir do que a coleta já guarda: líderes de estatística, classificações e,
 * para as seleções, a lista pública da ESPN.
 */

function priority(slug: string) {
  return getCatalogEntry(slug)?.priority ?? 999;
}

/* ------------------------------------------------------------- jogadores */

export type PlayerCard = {
  id: string;
  name: string;
  photo?: string;
  team: string;
  teamId?: string;
  crest?: string;
  competition: string;
  stat: { label: string; value: string };
  href: string;
  /** Foto do Wikimedia Commons (com autor e licença), quando encontrada */
  commons?: CommonsPhoto;
};

/** Jogadores em destaque: os líderes de cada estatística, sem repetir atleta. */
export async function getFeaturedPlayers(): Promise<{ competition: string; players: PlayerCard[] }[]> {
  const boards = await getStatBoards();
  const byCompetition = new Map<string, Map<string, PlayerCard>>();
  for (const board of boards) {
    const list = byCompetition.get(board.competition) ?? new Map<string, PlayerCard>();
    for (const leader of board.leaders.slice(0, 8)) {
      if (!leader.athleteId || !leader.athlete || list.has(leader.athleteId)) continue;
      list.set(leader.athleteId, {
        id: leader.athleteId,
        name: leader.athlete,
        photo: leader.photo,
        team: leader.team,
        teamId: leader.teamId,
        crest: leader.crest,
        competition: board.competition,
        stat: { label: board.label ?? board.metric, value: leader.display ?? String(leader.value) },
        href: `/atletas/${board.competition}/${leader.athleteId}`,
      });
    }
    byCompetition.set(board.competition, list);
  }
  const all = [...byCompetition.values()].flatMap((list) => [...list.values()]);
  const photos = await getCommonsPhotos(
    all.map((player) => ({ name: player.name, team: player.team, sport: getCatalogEntry(player.competition)?.sport ?? "" })),
  );
  for (const player of all) player.commons = photos.get(player.name);

  return [...byCompetition.entries()]
    .sort(([a], [b]) => priority(a) - priority(b))
    .map(([competition, players]) => ({ competition, players: [...players.values()] }))
    .filter((group) => group.players.length > 0);
}

/* --------------------------------------------------------------- pilotos */

export type DriverCard = {
  name: string;
  photo?: string;
  team?: string;
  position: number;
  points?: number;
  wins?: number;
  href: string;
};

export async function getDrivers(): Promise<{ season?: string; drivers: DriverCard[] }> {
  const tables = await getStandings("formula-1");
  const table = tables.find((item) => item.group === "Pilotos") ?? tables[0];
  if (!table) return { drivers: [] };
  return {
    season: table.season,
    drivers: table.rows.map((row) => ({
      name: row.team,
      photo: row.crest,
      team: row.detail,
      position: row.position,
      points: row.points,
      wins: row.wins,
      href: driverHref(row),
    })),
  };
}

/* ----------------------------------------------------------------- times */

export type TeamCard = { id: string; name: string; crest?: string; position?: number; href: string };

/** Times de cada liga com tabela, na ordem editorial do catálogo. */
export async function getTeamsByCompetition(): Promise<{ competition: string; teams: TeamCard[] }[]> {
  const tables = await getStandings();
  const groups = new Map<string, Map<string, TeamCard>>();
  for (const table of tables) {
    if (table.format === "motorsport" || table.competition === "formula-1") continue;
    const list = groups.get(table.competition) ?? new Map<string, TeamCard>();
    for (const row of table.rows) {
      if (!row.teamId || list.has(row.teamId)) continue;
      list.set(row.teamId, {
        id: row.teamId,
        name: row.team,
        crest: row.crest,
        position: row.position,
        href: `/times/${table.competition}/${row.teamId}`,
      });
    }
    groups.set(table.competition, list);
  }
  return [...groups.entries()]
    .filter(([slug]) => catalog.some((entry) => entry.slug === slug))
    .sort(([a], [b]) => priority(a) - priority(b))
    .map(([competition, teams]) => ({
      competition,
      teams: [...teams.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    }))
    .filter((group) => group.teams.length > 0);
}

/* -------------------------------------------------------------- seleções */

/** Seleções vêm da Copa do Mundo na ESPN; a página do time usa este caminho. */
export const NATIONAL_LEAGUE = "selecoes";
export const NATIONAL_ESPN_PATH = "soccer/fifa.world";

type EspnTeamList = {
  sports?: { leagues?: { teams?: { team: { id: string; displayName: string; abbreviation?: string; logos?: { href: string }[] } }[] }[] }[];
};

export async function getNationalTeams(): Promise<TeamCard[]> {
  try {
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${NATIONAL_ESPN_PATH}/teams?lang=pt&region=br`,
      { next: { revalidate: 86_400 }, signal: AbortSignal.timeout(10_000) },
    );
    if (!response.ok) return [];
    const data = (await response.json()) as EspnTeamList;
    const teams = data.sports?.[0]?.leagues?.[0]?.teams ?? [];
    return teams
      .map(({ team }) => ({
        id: team.id,
        name: team.displayName,
        crest: team.logos?.[0]?.href,
        href: `/times/${NATIONAL_LEAGUE}/${team.id}`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  } catch {
    return [];
  }
}
