/**
 * Endereços de pilotos e construtores.
 *
 * As linhas de classificação antigas (coletadas antes de guardarmos o ID da
 * fonte) não têm `driverId`/`constructorId`. Nesses casos, o endereço usa o
 * nome; a página resolve o nome na classificação atual antes de buscar a ficha.
 */

import type { StandingRow } from "@/lib/types";

/** "Andrea Kimi Antonelli" → "andrea-kimi-antonelli" */
export function slugifyName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function driverHref(row: Pick<StandingRow, "team" | "driverId">): string {
  return `/pilotos/${encodeURIComponent(row.driverId?.trim() || slugifyName(row.team))}`;
}

export function constructorHref(row: Pick<StandingRow, "team" | "constructorId">): string {
  return `/construtores/${encodeURIComponent(row.constructorId?.trim() || slugifyName(row.team))}`;
}
