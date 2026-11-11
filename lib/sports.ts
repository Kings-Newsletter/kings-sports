/**
 * Modalidades iniciais do portal.
 *
 * Modalidades com `covered: true` têm dados automáticos (lib/catalog.ts).
 * As demais aparecem só com conteúdo editorial. Nenhum dado esportivo é criado
 * aqui: apenas taxonomia.
 */

export type Sport = {
  slug: string;
  name: string;
  shortName: string;
  /** Emoji usado como marca visual leve enquanto não há ícones próprios. */
  glyph: string;
  blurb: string;
  featured?: boolean;
  /** Tem placar e tabela automáticos (coleta das APIs) */
  covered?: boolean;
};

export const sports: Sport[] = [
  {
    slug: "futebol",
    name: "Futebol",
    shortName: "Futebol",
    glyph: "⚽",
    blurb: "Brasileirão, Copa do Brasil, Libertadores, Sul-Americana e as grandes ligas europeias.",
    featured: true,
    covered: true,
  },
  {
    slug: "futsal",
    name: "Futsal",
    shortName: "Futsal",
    glyph: "🥅",
    blurb: "Ligas nacionais, estaduais e competições continentais.",
  },
  {
    slug: "basquete",
    name: "Basquete",
    shortName: "Basquete",
    glyph: "🏀",
    blurb: "NBA, com placar ao vivo e classificação por conferência.",
    featured: true,
    covered: true,
  },
  {
    slug: "volei",
    name: "Vôlei",
    shortName: "Vôlei",
    glyph: "🏐",
    blurb: "Superliga, seleções e circuitos de praia.",
    featured: true,
  },
  {
    slug: "tenis",
    name: "Tênis",
    shortName: "Tênis",
    glyph: "🎾",
    blurb: "ATP, WTA, Grand Slams e challengers.",
  },
  {
    slug: "mma",
    name: "MMA e lutas",
    shortName: "MMA",
    glyph: "🥊",
    blurb: "UFC, boxe e grappling.",
  },
  {
    slug: "automobilismo",
    name: "Automobilismo",
    shortName: "Automobilismo",
    glyph: "🏁",
    blurb: "Fórmula 1: calendário, vencedores e campeonatos.",
    covered: true,
  },
  {
    slug: "futebol-americano",
    name: "Futebol Americano",
    shortName: "NFL",
    glyph: "🏈",
    blurb: "NFL: placares, calendário e classificação por conferência.",
    covered: true,
  },
  {
    slug: "esports",
    name: "eSports",
    shortName: "eSports",
    glyph: "🎮",
    blurb: "Cenários competitivos de jogos eletrônicos.",
  },
  {
    slug: "olimpiadas",
    name: "Olimpíadas",
    shortName: "Olímpico",
    glyph: "🏅",
    blurb: "Modalidades olímpicas e paralímpicas.",
  },
];

const bySlug = new Map(sports.map((sport) => [sport.slug, sport]));

export function getSport(slug: string | undefined | null): Sport | undefined {
  if (!slug) return undefined;
  return bySlug.get(slug);
}

export function sportName(slug: string | undefined | null): string {
  return getSport(slug)?.name ?? "Modalidade";
}
