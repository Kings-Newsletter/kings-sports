import "server-only";

import type { ApiClient } from "@/lib/ingest/http";
import type { IngestFixture, IngestStandings } from "@/lib/ingest/types";
import type { FixtureStatus } from "@/lib/types";

/**
 * Fórmula 1, sem chave de API:
 *  - OpenF1 (https://openf1.org): calendário de sessões.
 *  - Jolpica (https://api.jolpi.ca, sucessor do Ergast): vencedores e campeonatos.
 */

const OPENF1 = "https://api.openf1.org/v1";
const JOLPICA = "https://api.jolpi.ca/ergast/f1";
const COMPETITION = "formula-1";
const SPORT = "automobilismo";

/** Sessões que entram no guia do dia. Treinos livres ficam de fora. */
const SESSION_LABEL: Record<string, string> = {
  Race: "Corrida",
  Qualifying: "Classificação",
  Sprint: "Sprint",
  "Sprint Qualifying": "Classificação sprint",
  "Sprint Shootout": "Classificação sprint",
};

type Session = {
  session_key: number;
  session_name: string;
  date_start: string;
  date_end: string;
  location: string;
  circuit_short_name: string;
  country_name: string;
  is_cancelled?: boolean;
};

type JolpicaRace = {
  round: string;
  raceName: string;
  date: string;
  Results?: {
    position: string;
    Driver: { givenName: string; familyName: string };
    Constructor: { name: string };
  }[];
};

function sessionStatus(session: Session, now: number): FixtureStatus {
  if (session.is_cancelled) return "cancelled";
  const start = Date.parse(session.date_start);
  const end = Date.parse(session.date_end);
  if (now < start) return "scheduled";
  // Margem de 30 min após o fim previsto (bandeira vermelha, atrasos).
  if (now <= end + 30 * 60 * 1000) return "live";
  return "finished";
}

/** Vencedores das corridas da temporada atual, por data da corrida (YYYY-MM-DD). */
export async function f1Winners(client: ApiClient): Promise<Map<string, string>> {
  const body = await client.getJson<{ MRData: { RaceTable: { Races: JolpicaRace[] } } }>(
    "jolpica",
    `${JOLPICA}/current/results/1.json?limit=100`,
  );
  const winners = new Map<string, string>();
  for (const race of body.MRData.RaceTable.Races) {
    const first = race.Results?.[0];
    if (first) {
      winners.set(
        race.date,
        `Vencedor: ${first.Driver.givenName} ${first.Driver.familyName} (${first.Constructor.name})`,
      );
    }
  }
  return winners;
}

export async function f1Sessions(
  client: ApiClient,
  year: number,
  winners: Map<string, string>,
): Promise<IngestFixture[]> {
  const sessions = await client.getJson<Session[]>("openf1", `${OPENF1}/sessions?year=${year}`);
  const now = Date.now();
  return sessions
    .filter((session) => SESSION_LABEL[session.session_name])
    .map((session) => {
      const status = sessionStatus(session, now);
      const label = SESSION_LABEL[session.session_name];
      const raceDay = session.date_start.slice(0, 10);
      const result = session.session_name === "Race" && status === "finished" ? winners.get(raceDay) : undefined;
      return {
        _id: `openf1:${session.session_key}`,
        sport: SPORT,
        competition: COMPETITION,
        kind: "event" as const,
        kickoff: new Date(session.date_start),
        endsAt: new Date(session.date_end).toISOString(),
        status,
        title: `F1 · ${session.location} — ${label}`,
        result,
        venue: `${session.circuit_short_name}, ${session.country_name}`,
        source: result ? "OpenF1 + Jolpica" : "OpenF1",
      };
    });
}

type DriverStandings = {
  MRData: {
    StandingsTable: {
      season: string;
      StandingsLists: {
        DriverStandings?: {
          position?: string;
          positionText: string;
          points: string;
          wins: string;
          Driver: {
            driverId: string;
            permanentNumber?: string;
            code?: string;
            givenName: string;
            familyName: string;
            nationality?: string;
          };
          Constructors: { constructorId: string; name: string }[];
        }[];
        ConstructorStandings?: {
          position?: string;
          positionText: string;
          points: string;
          wins: string;
          Constructor: { constructorId: string; name: string; nationality?: string };
        }[];
      }[];
    };
  };
};

type OpenF1Driver = { last_name?: string; team_name?: string; team_colour?: string; headshot_url?: string };

/** Sobrenome sem acento e sem caixa, para casar Jolpica com OpenF1. */
function key(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Fotos e cores das equipes (OpenF1, sessão mais recente). Sem foto se a chamada falhar. */
async function f1DriverMedia(client: ApiClient) {
  const photos = new Map<string, { photo?: string; color?: string }>();
  const teamColors = new Map<string, string>();
  try {
    const drivers = await client.getJson<OpenF1Driver[]>("openf1", `${OPENF1}/drivers?session_key=latest`);
    for (const driver of drivers) {
      if (driver.last_name) {
        photos.set(key(driver.last_name), { photo: driver.headshot_url, color: driver.team_colour });
      }
      if (driver.team_name && driver.team_colour) teamColors.set(key(driver.team_name), driver.team_colour);
    }
  } catch {
    // Fotos são enfeite: a tabela sai sem elas.
  }
  return { photos, teamColors };
}

function teamColor(teamColors: Map<string, string>, name: string): string | undefined {
  const target = key(name);
  for (const [team, color] of teamColors) {
    if (team.includes(target) || target.includes(team)) return color;
  }
  return undefined;
}

export async function f1Standings(client: ApiClient): Promise<IngestStandings[]> {
  const [drivers, constructors, media] = await Promise.all([
    client.getJson<DriverStandings>("jolpica", `${JOLPICA}/current/driverstandings.json?limit=100`),
    client.getJson<DriverStandings>("jolpica", `${JOLPICA}/current/constructorstandings.json?limit=100`),
    f1DriverMedia(client),
  ]);
  const season = drivers.MRData.StandingsTable.season;
  const driverRows = drivers.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
  const constructorRows = constructors.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? [];
  const position = (row: { position?: string; positionText: string }, index: number) =>
    Number.parseInt(row.position ?? row.positionText, 10) || index + 1;

  return [
    {
      _id: `table:${COMPETITION}:Pilotos`,
      competition: COMPETITION,
      season,
      format: "motorsport",
      group: "Pilotos",
      rows: driverRows.map((row, index) => {
        const extra = media.photos.get(key(row.Driver.familyName));
        return {
          position: position(row, index),
          team: `${row.Driver.givenName} ${row.Driver.familyName}`,
          detail: row.Constructors.map((c) => c.name).join(" / "),
          points: Number.parseFloat(row.points),
          wins: Number.parseInt(row.wins, 10),
          crest: extra?.photo,
          color: extra?.color ?? teamColor(media.teamColors, row.Constructors[0]?.name ?? ""),
          driverId: row.Driver.driverId,
          constructorId: row.Constructors[0]?.constructorId,
          code: row.Driver.code,
          number: row.Driver.permanentNumber,
          nationality: row.Driver.nationality,
        };
      }),
      source: "Jolpica + OpenF1",
    },
    {
      _id: `table:${COMPETITION}:Construtores`,
      competition: COMPETITION,
      season,
      format: "motorsport",
      group: "Construtores",
      rows: constructorRows.map((row, index) => ({
        position: position(row, index),
        team: row.Constructor.name,
        points: Number.parseFloat(row.points),
        wins: Number.parseInt(row.wins, 10),
        color: teamColor(media.teamColors, row.Constructor.name),
        constructorId: row.Constructor.constructorId,
        nationality: row.Constructor.nationality,
      })),
      source: "Jolpica",
    },
  ];
}
