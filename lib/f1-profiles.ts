import "server-only";

import { cache } from "react";

import { getStandings } from "@/lib/data";
import { slugifyName } from "@/lib/slugs";
import type { StandingRow } from "@/lib/types";

/**
 * Fichas de pilotos e construtores da Fórmula 1.
 *
 * Fontes públicas, sem chave: Jolpica (sucessor do Ergast) para resultados e
 * classificação, OpenF1 para foto e cor da equipe. Nada é estimado: quando um
 * recorte não vem da fonte, ele simplesmente não é exibido.
 */

const JOLPICA = "https://api.jolpi.ca/ergast/f1";
const OPENF1 = "https://api.openf1.org/v1";
const REVALIDATE = 3600;
/**
 * Teto de páginas de 100 resultados. A carreira de um piloto devolve uma linha
 * por corrida; a de um construtor devolve uma linha por carro, então precisa de
 * mais páginas para chegar à temporada atual.
 */
const MAX_DRIVER_PAGES = 10;
const MAX_CONSTRUCTOR_PAGES = 30;

type JolpicaDriverRef = {
  driverId: string;
  permanentNumber?: string;
  code?: string;
  url?: string;
  givenName: string;
  familyName: string;
  dateOfBirth?: string;
  nationality?: string;
};

type JolpicaConstructorRef = {
  constructorId: string;
  url?: string;
  name: string;
  nationality?: string;
};

type JolpicaResult = {
  number?: string;
  position?: string;
  positionText: string;
  points: string;
  Driver: JolpicaDriverRef;
  Constructor: JolpicaConstructorRef;
  grid?: string;
  laps?: string;
  status?: string;
  Time?: { millis?: string; time?: string };
  FastestLap?: { rank?: string; lap?: string; Time?: { time?: string } };
};

type JolpicaRace = {
  season: string;
  round: string;
  raceName: string;
  date: string;
  time?: string;
  Circuit?: { circuitName: string; Location?: { locality?: string; country?: string } };
  Results?: JolpicaResult[];
  QualifyingResults?: {
    number?: string;
    position?: string;
    Driver: JolpicaDriverRef;
    Constructor: JolpicaConstructorRef;
    Q1?: string;
    Q2?: string;
    Q3?: string;
  }[];
};

type DriverTableResponse = {
  MRData: {
    total?: string;
    offset?: string;
    limit?: string;
    DriverTable: { season?: string; driverId?: string; Drivers: JolpicaDriverRef[] };
  };
};

type ConstructorTableResponse = {
  MRData: {
    total?: string;
    offset?: string;
    limit?: string;
    ConstructorTable: { season?: string; constructorId?: string; Constructors: JolpicaConstructorRef[] };
  };
};

type RaceTableResponse = {
  MRData: {
    total?: string;
    offset?: string;
    limit?: string;
    RaceTable: { season?: string; driverId?: string; constructorId?: string; Races: JolpicaRace[] };
  };
};

type SeasonTableResponse = {
  MRData: { SeasonTable: { driverId?: string; constructorId?: string; Seasons: { season: string }[] } };
};

type OpenF1Driver = {
  driver_number?: number;
  full_name?: string;
  name_acronym?: string;
  team_name?: string;
  team_colour?: string;
  first_name?: string;
  last_name?: string;
  headshot_url?: string;
};

async function getJson<T>(url: string, revalidate = REVALIDATE): Promise<T | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        next: { revalidate, tags: ["f1"] },
        signal: AbortSignal.timeout(10_000),
      });
      if (response.status === 429 && attempt < 2) {
        const retry = Number(response.headers.get("retry-after") ?? "0");
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(retry * 1000 || 700 * (attempt + 1), 3000)),
        );
        continue;
      }
      if (!response.ok) return null;
      return (await response.json()) as T;
    } catch {
      return null;
    }
  }
  return null;
}

function normalize(value: string | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/* ------------------------------ OpenF1 (mídia) ---------------------------- */

const openF1Drivers = cache(async (): Promise<OpenF1Driver[]> => {
  return (await getJson<OpenF1Driver[]>(`${OPENF1}/drivers?session_key=latest`, 1800)) ?? [];
});

function findOpenF1Driver(
  list: OpenF1Driver[],
  target: { number?: string; familyName?: string },
): OpenF1Driver | undefined {
  if (target.number) {
    const byNumber = list.find((driver) => String(driver.driver_number ?? "") === target.number);
    if (byNumber) return byNumber;
  }
  const family = normalize(target.familyName);
  return family ? list.find((driver) => normalize(driver.last_name) === family) : undefined;
}

function openF1Colour(list: OpenF1Driver[], name: string): string | undefined {
  const target = normalize(name);
  if (!target) return undefined;
  const exact = list.find((driver) => normalize(driver.team_name) === target);
  if (exact?.team_colour) return exact.team_colour;
  const loose = list.find((driver) => {
    const team = normalize(driver.team_name);
    return team.length > 2 && (team.includes(target) || target.includes(team));
  });
  return loose?.team_colour;
}

/* ------------------------------- Resolução -------------------------------- */

const currentDrivers = cache(async (): Promise<JolpicaDriverRef[]> => {
  const body = await getJson<DriverTableResponse>(`${JOLPICA}/current/drivers.json?limit=100`);
  return body?.MRData.DriverTable.Drivers ?? [];
});

const currentConstructors = cache(async (): Promise<JolpicaConstructorRef[]> => {
  const body = await getJson<ConstructorTableResponse>(`${JOLPICA}/current/constructors.json?limit=100`);
  return body?.MRData.ConstructorTable.Constructors ?? [];
});

/**
 * Aceita tanto o ID da fonte ("antonelli") quanto o nome em endereço
 * ("andrea-kimi-antonelli"), inclusive para linhas antigas da tabela que ainda
 * não guardavam o `driverId`.
 */
async function resolveDriverId(param: string): Promise<string | null> {
  const target = normalize(decodeURIComponent(param)).replace(/\s+/g, "-");
  if (!target) return null;

  const [tables, drivers] = await Promise.all([getStandings("formula-1"), currentDrivers()]);
  const rows = tables.find((table) => table.group === "Pilotos")?.rows ?? [];
  const row = rows.find(
    (item) => normalize(item.driverId) === target || slugifyName(item.team) === target,
  );

  if (row?.driverId) return row.driverId;
  const byId = drivers.find((driver) => normalize(driver.driverId) === target.replace(/-/g, "_"));
  if (byId) return byId.driverId;

  const byName = drivers.find(
    (driver) => slugifyName(`${driver.givenName} ${driver.familyName}`) === target,
  );
  if (byName) return byName.driverId;

  if (row) {
    const fromRow = drivers.find(
      (driver) => slugifyName(`${driver.givenName} ${driver.familyName}`) === slugifyName(row.team),
    );
    if (fromRow) return fromRow.driverId;
  }
  return null;
}

async function resolveConstructorId(param: string): Promise<string | null> {
  const target = normalize(decodeURIComponent(param)).replace(/\s+/g, "-");
  if (!target) return null;

  const [tables, constructors] = await Promise.all([getStandings("formula-1"), currentConstructors()]);
  const rows = tables.find((table) => table.group === "Construtores")?.rows ?? [];
  const row = rows.find(
    (item) => normalize(item.constructorId) === target || slugifyName(item.team) === target,
  );

  if (row?.constructorId) return row.constructorId;
  const byId = constructors.find((item) => normalize(item.constructorId) === target.replace(/-/g, "_"));
  if (byId) return byId.constructorId;

  const byName = constructors.find((item) => slugifyName(item.name) === target);
  if (byName) return byName.constructorId;

  if (row) {
    const fromRow = constructors.find((item) => slugifyName(item.name) === slugifyName(row.team));
    if (fromRow) return fromRow.constructorId;
  }
  return null;
}

/* --------------------------- Carreira paginada ---------------------------- */

/**
 * A paginação do Ergast conta linhas de resultado, não corridas: a mesma etapa
 * pode aparecer em duas páginas (um carro em cada). Aqui as partes são unidas
 * por etapa, sem duplicar pilotos.
 */
function mergeRaces(list: JolpicaRace[]): JolpicaRace[] {
  const byRace = new Map<string, JolpicaRace>();
  for (const race of list) {
    const key = `${race.season}-${race.round}`;
    const existing = byRace.get(key);
    if (!existing) {
      byRace.set(key, { ...race, Results: [...(race.Results ?? [])] });
      continue;
    }
    const results = new Map((existing.Results ?? []).map((item) => [item.Driver.driverId, item]));
    for (const item of race.Results ?? []) results.set(item.Driver.driverId, item);
    existing.Results = [...results.values()];
  }
  return [...byRace.values()];
}

type CareerRaces = { races: JolpicaRace[]; complete: boolean };

async function fetchRacePages(
  url: (offset: number) => string,
  first: RaceTableResponse,
  pages: number,
): Promise<CareerRaces> {
  const races = [...first.MRData.RaceTable.Races];
  let complete = true;
  const batchSize = 3;
  for (let start = 0; start < pages; start += batchSize) {
    const batch = Array.from(
      { length: Math.min(batchSize, pages - start) },
      (_, index) => getJson<RaceTableResponse>(url((start + index + 1) * 100)),
    );
    const bodies = await Promise.all(batch);
    for (const body of bodies) {
      if (body) races.push(...body.MRData.RaceTable.Races);
      else complete = false;
    }
  }
  return { races: mergeRaces(races), complete };
}

async function careerDriverRaces(driverId: string): Promise<CareerRaces> {
  const url = (offset: number) =>
    `${JOLPICA}/drivers/${driverId}/results.json?limit=100&offset=${offset}`;
  const first = await getJson<RaceTableResponse>(url(0));
  if (!first) return { races: [], complete: false };
  const total = Number(first.MRData.total ?? first.MRData.RaceTable.Races.length);
  const pages = Math.min(Math.ceil(total / 100), MAX_DRIVER_PAGES) - 1;
  return pages > 0
    ? fetchRacePages(url, first, pages)
    : { races: mergeRaces(first.MRData.RaceTable.Races), complete: true };
}

async function careerConstructorRaces(constructorId: string): Promise<CareerRaces> {
  const url = (offset: number) =>
    `${JOLPICA}/constructors/${constructorId}/results.json?limit=100&offset=${offset}`;
  const first = await getJson<RaceTableResponse>(url(0));
  if (!first) return { races: [], complete: false };
  const total = Number(first.MRData.total ?? first.MRData.RaceTable.Races.length);
  const pages = Math.min(Math.ceil(total / 100), MAX_CONSTRUCTOR_PAGES) - 1;
  return pages > 0
    ? fetchRacePages(url, first, pages)
    : { races: mergeRaces(first.MRData.RaceTable.Races), complete: true };
}

function isPodium(position?: string): boolean {
  const value = Number(position);
  return Number.isFinite(value) && value >= 1 && value <= 3;
}

/** Nome completo → partes, sem inventar nada além do que já está na tabela. */
function splitName(name: string): { givenName: string; familyName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { givenName: parts[0] ?? name, familyName: parts[0] ?? name };
  return {
    givenName: parts.slice(0, -1).join(" "),
    familyName: parts[parts.length - 1]!,
  };
}

/**
 * Ficha mínima a partir da classificação já coletada. Serve quando a fonte
 * externa está fora do ar ou limitando chamadas: posição, pontos e vitórias
 * continuam disponíveis, sem inventar resultados.
 */
function fallbackDriverProfile(row: StandingRow, season: string, param: string): F1DriverProfile {
  const { givenName, familyName } = splitName(row.team);
  return {
    id: row.driverId?.trim() || slugifyName(row.team) || param,
    name: row.team,
    givenName,
    familyName,
    code: row.code,
    number: row.number,
    nationality: row.nationality,
    photo: row.crest,
    color: row.color,
    season,
    team: row.constructorId
      ? { id: row.constructorId, name: row.detail ?? "" }
      : undefined,
    standing: { position: row.position, points: row.points, wins: row.wins },
    seasonResults: [],
    seasonQualifying: [],
    seasons: [],
    resultsUnavailable: true,
  };
}

function fallbackConstructorProfile(
  row: StandingRow,
  season: string,
  param: string,
): F1ConstructorProfile {
  return {
    id: row.constructorId?.trim() || slugifyName(row.team) || param,
    name: row.team,
    nationality: row.nationality,
    color: row.color,
    season,
    standing: { position: row.position, points: row.points, wins: row.wins },
    drivers: [],
    seasonResults: [],
    seasons: [],
    resultsUnavailable: true,
  };
}

/* --------------------------------- Piloto --------------------------------- */

export type F1DriverProfile = {
  id: string;
  name: string;
  givenName: string;
  familyName: string;
  code?: string;
  number?: string;
  nationality?: string;
  dateOfBirth?: string;
  age?: number;
  url?: string;
  photo?: string;
  color?: string;
  season: string;
  team?: { id?: string; name: string };
  standing?: { position: number; points?: number; wins?: number };
  seasonTotals?: { podiums: number; poles: number; fastestLaps: number };
  seasonResults: {
    round: number;
    raceName: string;
    date: string;
    position?: string;
    points: number;
    grid?: string;
    status?: string;
    fastestLap?: boolean;
  }[];
  seasonQualifying: {
    round: number;
    raceName: string;
    date: string;
    position?: string;
    q1?: string;
    q2?: string;
    q3?: string;
  }[];
  career?: {
    seasons: number;
    starts: number;
    wins: number;
    podiums: number;
    fastestLaps: number;
    points: number;
  };
  /** A fonte falhou ao trazer a carreira; a ficha mostra só a classificação. */
  resultsUnavailable?: boolean;
  seasons: string[];
};

export const getF1DriverProfile = cache(
  async (param: string): Promise<F1DriverProfile | null> => {
    const tables = await getStandings("formula-1");
    const driverTable = tables.find((table) => table.group === "Pilotos");
    const rows = driverTable?.rows ?? [];
    const target = normalize(decodeURIComponent(param)).replace(/\s+/g, "-");
    const row = rows.find(
      (item) => normalize(item.driverId) === target || slugifyName(item.team) === target,
    );

    const id = await resolveDriverId(param);
    const info = id
      ? await getJson<DriverTableResponse>(`${JOLPICA}/current/drivers/${id}.json`, 3600)
      : null;
    const driver = info?.MRData.DriverTable.Drivers[0];
    if (!driver) {
      return row ? fallbackDriverProfile(row, driverTable?.season ?? "", param) : null;
    }
    const season = info?.MRData.DriverTable.season ?? "";

    const [careerData, qualifying, seasonsBody, media] = await Promise.all([
      careerDriverRaces(id!),
      getJson<RaceTableResponse>(`${JOLPICA}/current/drivers/${id}/qualifying.json?limit=100`),
      getJson<SeasonTableResponse>(`${JOLPICA}/drivers/${id}/seasons.json?limit=100`),
      openF1Drivers(),
    ]);
    const races = careerData.races;
    const complete = careerData.complete;

    const seasonRaces = races
      .filter((race) => race.season === season)
      .sort((a, b) => Number(a.round) - Number(b.round));

    const seasonResults: F1DriverProfile["seasonResults"] = complete
      ? seasonRaces.map((race) => {
          const result =
            race.Results?.find((item) => item.Driver.driverId === id) ?? race.Results?.[0];
          return {
            round: Number(race.round),
            raceName: race.raceName,
            date: race.date,
            position: result?.positionText,
            points: Number(result?.points ?? 0),
            grid: result?.grid,
            status: result?.status,
            fastestLap: result?.FastestLap?.rank === "1",
          };
        })
      : [];

    const seasonQualifying: F1DriverProfile["seasonQualifying"] = (
      qualifying?.MRData.RaceTable.Races ?? []
    )
      .map((race) => {
        const result = race.QualifyingResults?.find((item) => item.Driver.driverId === id);
        return {
          round: Number(race.round),
          raceName: race.raceName,
          date: race.date,
          position: result?.position,
          q1: result?.Q1,
          q2: result?.Q2,
          q3: result?.Q3,
        };
      })
      .sort((a, b) => a.round - b.round);

    const driverRow = rows.find(
      (item) =>
        (item.driverId && item.driverId === id) ||
        slugifyName(item.team) === slugifyName(`${driver.givenName} ${driver.familyName}`),
    );

    const lastRace = seasonRaces[seasonRaces.length - 1];
    const lastConstructor = lastRace?.Results?.[0]?.Constructor;
    const team = driverRow?.constructorId
      ? { id: driverRow.constructorId, name: driverRow.detail ?? "" }
      : lastConstructor
        ? { id: lastConstructor.constructorId, name: lastConstructor.name }
        : undefined;

    const mediaDriver = findOpenF1Driver(media, {
      number: driver.permanentNumber,
      familyName: driver.familyName,
    });

    const allResults = races.flatMap((race) => race.Results ?? []);
    const career =
      complete && allResults.length > 0
        ? {
            seasons: seasonsBody?.MRData.SeasonTable.Seasons.length ?? 0,
            starts: allResults.length,
            wins: allResults.filter((result) => result.position === "1").length,
            podiums: allResults.filter((result) => isPodium(result.position)).length,
            fastestLaps: allResults.filter((result) => result.FastestLap?.rank === "1").length,
            points: allResults.reduce((total, result) => total + Number(result.points || 0), 0),
          }
        : undefined;

    const seasonPoints = driverRow?.points;
    const seasonWins = driverRow?.wins;

    return {
      id: id as string,
      name: `${driver.givenName} ${driver.familyName}`,
      givenName: driver.givenName,
      familyName: driver.familyName,
      code: driver.code,
      number: driver.permanentNumber,
      nationality: driver.nationality,
      dateOfBirth: driver.dateOfBirth,
      age: driver.dateOfBirth
        ? Math.max(
            0,
            Math.floor(
              (Date.now() - Date.parse(driver.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000),
            ),
          )
        : undefined,
      url: driver.url,
      photo: mediaDriver?.headshot_url,
      color: driverRow?.color ?? mediaDriver?.team_colour,
      season,
      team,
      standing: driverRow
        ? { position: driverRow.position, points: seasonPoints, wins: seasonWins }
        : undefined,
      seasonTotals:
        complete && seasonResults.length > 0
          ? {
              podiums: seasonResults.filter((result) => isPodium(result.position)).length,
              poles: seasonQualifying.filter((result) => result.position === "1").length,
              fastestLaps: seasonResults.filter((result) => result.fastestLap).length,
            }
          : undefined,
      seasonResults,
      seasonQualifying,
      career,
      resultsUnavailable: !complete,
      seasons: (seasonsBody?.MRData.SeasonTable.Seasons ?? [])
        .map((item) => item.season)
        .sort((a, b) => Number(b) - Number(a)),
    };
  },
);

/* ------------------------------- Construtor ------------------------------- */

export type F1ConstructorProfile = {
  id: string;
  name: string;
  nationality?: string;
  url?: string;
  color?: string;
  season: string;
  standing?: { position: number; points?: number; wins?: number };
  drivers: { id: string; name: string; code?: string; number?: string }[];
  seasonResults: {
    round: number;
    raceName: string;
    date: string;
    best?: number;
    points: number;
    drivers: { id: string; name: string; position?: string; points: number }[];
  }[];
  career?: {
    seasons: number;
    races: number;
    wins: number;
    podiums: number;
    points: number;
  };
  /** A fonte falhou ao trazer a carreira; a ficha mostra só a classificação. */
  resultsUnavailable?: boolean;
  seasons: string[];
};

export const getF1ConstructorProfile = cache(
  async (param: string): Promise<F1ConstructorProfile | null> => {
    const tables = await getStandings("formula-1");
    const rows = tables.find((table) => table.group === "Construtores")?.rows ?? [];
    const target = normalize(decodeURIComponent(param)).replace(/\s+/g, "-");
    const row = rows.find(
      (item) => normalize(item.constructorId) === target || slugifyName(item.team) === target,
    );

    const id = (await resolveConstructorId(param)) ?? row?.constructorId ?? null;
    if (!id) return row ? fallbackConstructorProfile(row, tables[0]?.season ?? "", param) : null;

    const info = await getJson<ConstructorTableResponse>(
      `${JOLPICA}/current/constructors/${id}.json`,
      3600,
    );
    const constructor = info?.MRData.ConstructorTable.Constructors[0];
    if (!constructor) {
      return row ? fallbackConstructorProfile(row, tables[0]?.season ?? "", param) : null;
    }
    const season = info?.MRData.ConstructorTable.season ?? tables[0]?.season ?? "";

    const [careerData, driversBody, seasonsBody, media] = await Promise.all([
      careerConstructorRaces(id),
      getJson<DriverTableResponse>(`${JOLPICA}/current/constructors/${id}/drivers.json?limit=100`),
      getJson<SeasonTableResponse>(`${JOLPICA}/constructors/${id}/seasons.json?limit=100`),
      openF1Drivers(),
    ]);
    const races = careerData.races;
    const complete = careerData.complete;

    const seasonRaces = races
      .filter((race) => race.season === season)
      .sort((a, b) => Number(a.round) - Number(b.round));

    const seasonResults: F1ConstructorProfile["seasonResults"] = complete
      ? seasonRaces.map((race) => {
          const results = (race.Results ?? []).filter(
            (item) => item.Constructor.constructorId === id,
          );
          const positions = results
            .map((item) => Number(item.position))
            .filter((value) => Number.isFinite(value));
          return {
            round: Number(race.round),
            raceName: race.raceName,
            date: race.date,
            best: positions.length > 0 ? Math.min(...positions) : undefined,
            points: results.reduce((total, item) => total + Number(item.points || 0), 0),
            drivers: results.map((item) => ({
              id: item.Driver.driverId,
              name: `${item.Driver.givenName} ${item.Driver.familyName}`,
              position: item.positionText,
              points: Number(item.points || 0),
            })),
          };
        })
      : [];

    const constructorRow =
      row ??
      rows.find(
        (item) =>
          (item.constructorId && item.constructorId === id) ||
          slugifyName(item.team) === slugifyName(constructor.name),
      );

    const allResults = races.flatMap((race) => race.Results ?? []);
    const career =
      complete && races.length > 0
        ? {
            seasons: seasonsBody?.MRData.SeasonTable.Seasons.length ?? 0,
            races: races.length,
            wins: races.filter((race) =>
              (race.Results ?? []).some((result) => result.position === "1"),
            ).length,
            podiums: allResults.filter((result) => isPodium(result.position)).length,
            points: allResults.reduce((total, result) => total + Number(result.points || 0), 0),
          }
        : undefined;

    return {
      id,
      name: constructor.name,
      nationality: constructor.nationality,
      url: constructor.url,
      color: constructorRow?.color ?? openF1Colour(media, constructor.name),
      season,
      standing: constructorRow
        ? { position: constructorRow.position, points: constructorRow.points, wins: constructorRow.wins }
        : undefined,
      drivers: (driversBody?.MRData.DriverTable.Drivers ?? []).map((driver) => ({
        id: driver.driverId,
        name: `${driver.givenName} ${driver.familyName}`,
        code: driver.code,
        number: driver.permanentNumber,
      })),
      seasonResults,
      career,
      resultsUnavailable: !complete,
      seasons: (seasonsBody?.MRData.SeasonTable.Seasons ?? [])
        .map((item) => item.season)
        .sort((a, b) => Number(b) - Number(a)),
    };
  },
);

/* --------------------------- Rótulos de exibição -------------------------- */

const NATIONALITY_LABELS: Record<string, string> = {
  Italian: "Italiano",
  British: "Britânico",
  Dutch: "Holandês",
  German: "Alemão",
  French: "Francês",
  Spanish: "Espanhol",
  Monegasque: "Monegasco",
  Mexican: "Mexicano",
  Australian: "Australiano",
  Japanese: "Japonês",
  Brazilian: "Brasileiro",
  Canadian: "Canadense",
  American: "Norte-americano",
  Thai: "Tailandês",
  Danish: "Dinamarquês",
  Finnish: "Finlandês",
  Chinese: "Chinês",
  Swiss: "Suíço",
  Austrian: "Austríaco",
  "New Zealander": "Neozelandês",
  Argentine: "Argentino",
  Belgian: "Belga",
  Swedish: "Sueco",
  Portuguese: "Português",
  Russian: "Russo",
  Polish: "Polonês",
  Indonesian: "Indonésio",
  Colombian: "Colombiano",
};

export function nationalityLabel(value?: string): string | undefined {
  if (!value) return undefined;
  return NATIONALITY_LABELS[value] ?? value;
}

const STATUS_LABELS: Record<string, string> = {
  Finished: "Classificado",
  Disqualified: "Desclassificado",
  Retired: "Abandonou",
  "Did not start": "Não largou",
  "Did not qualify": "Não se classificou",
  "Not classified": "Não classificado",
  "Withdrew": "Retirou-se",
  "Did not prequalify": "Não pré-classificou",
  Accident: "Acidente",
  Collision: "Colisão",
  Engine: "Motor",
  Gearbox: "Câmbio",
  Brakes: "Freios",
  Suspension: "Suspensão",
  "Power Unit": "Unidade de potência",
  Overheating: "Superaquecimento",
  "Out of fuel": "Sem combustível",
  "Undertray": "Assoalho",
  "Mechanical": "Problema mecânico",
  "Spun off": "Rodou",
  "Collision damage": "Dano de colisão",
  "Wheel": "Roda",
};

export function f1StatusLabel(status?: string): string | undefined {
  if (!status) return undefined;
  return STATUS_LABELS[status] ?? status;
}

/** "R" no Ergast é abandono; o resto vira o número da posição. */
export function f1PositionLabel(position?: string): string {
  if (!position) return "–";
  return position === "R" ? "AB" : position;
}
