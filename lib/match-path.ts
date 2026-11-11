/**
 * Endereço da página de partida. Só partidas da ESPN têm detalhe.
 */

/** "espn:401879248" ↔ "espn-401879248" (o ":" não fica bem em URL). */
export function matchPath(fixtureId: string): string | null {
  return fixtureId.startsWith("espn:") ? `/partidas/espn-${fixtureId.slice(5)}` : null;
}

export function fixtureIdFromParam(param: string): string {
  return param.replace(/^espn-/, "espn:");
}

/**
 * Endereço de qualquer evento: partida da ESPN abre a página de detalhe; os
 * demais (sessões de F1, por exemplo) abrem a competição.
 */
export function fixturePath(fixture: {
  id: string;
  competition: string;
  kind?: "match" | "event";
}): string {
  return matchPath(fixture.id) ?? `/competicoes/${fixture.competition}`;
}
