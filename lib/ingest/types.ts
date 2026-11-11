import type { FixtureDoc, StandingsDoc } from "@/lib/db/collections";
import type { CatalogEntry } from "@/lib/catalog";

/** Partida normalizada pronta para gravar (o `updatedAt` é posto na gravação). */
export type IngestFixture = Omit<FixtureDoc, "updatedAt">;
export type IngestStandings = Omit<StandingsDoc, "updatedAt">;

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Rótulo da temporada: ano único no calendário sul-americano,
 * "2026/27" nas ligas europeias e na NBA.
 */
export function seasonLabel(entry: Pick<CatalogEntry, "country" | "sport">, now = new Date()): string {
  const year = now.getUTCFullYear();
  const singleYear =
    entry.sport === "automobilismo" || entry.sport === "futebol-americano" || entry.country === "Brasil" || entry.country === "América do Sul";
  if (singleYear) return String(year);
  const start = now.getUTCMonth() >= 6 ? year : year - 1;
  return `${start}/${String(start + 1).slice(2)}`;
}
