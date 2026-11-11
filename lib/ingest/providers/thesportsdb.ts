import "server-only";

import type { ApiClient } from "@/lib/ingest/http";
import { normalizeTeam } from "@/lib/normalize";

/**
 * TheSportsDB (https://www.thesportsdb.com) — só escudos dos times.
 *
 * A chave pública gratuita (`123`) limita listas, mas a busca de time por nome
 * vem completa, com o link do escudo. Limite: 30 chamadas por minuto.
 */

const BASE = "https://www.thesportsdb.com/api/v1/json";

const SPORT_NAME: Record<string, string> = {
  futebol: "Soccer",
  basquete: "Basketball",
};

export function crestSports(): string[] {
  return Object.keys(SPORT_NAME);
}

type SearchResponse = {
  teams?:
    | {
        strTeam: string;
        strTeamAlternate?: string | null;
        strSport: string;
        strBadge?: string | null;
      }[]
    | null;
};

/** Link do escudo do time, ou null se não encontrado. 1 chamada. */
export async function findCrest(client: ApiClient, name: string, sport: string): Promise<string | null> {
  const key = process.env.THESPORTSDB_KEY || "123";
  const body = await client.getJson<SearchResponse>(
    "thesportsdb",
    `${BASE}/${key}/searchteams.php?t=${encodeURIComponent(name)}`,
  );
  const wanted = SPORT_NAME[sport];
  const candidates = (body.teams ?? []).filter((team) => team.strSport === wanted && team.strBadge);
  if (candidates.length === 0) return null;

  const target = normalizeTeam(name);
  const exact = candidates.find((team) =>
    [team.strTeam, ...(team.strTeamAlternate ?? "").split(",")]
      .map((alias) => normalizeTeam(alias))
      .includes(target),
  );
  return (exact ?? candidates[0])!.strBadge ?? null;
}
