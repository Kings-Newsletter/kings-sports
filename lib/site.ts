/**
 * Configuração central do portal.
 * Tudo que é "identidade" fica aqui para ser reutilizado por páginas, SEO e componentes.
 */

export const site = {
  name: "King's Sports",
  shortName: "Kings Sports",
  tagline: "Jogos, resultados e notícias do esporte",
  description:
    "Jogos do dia, placares ao vivo, tabelas e notícias de futebol, NBA, NFL e Fórmula 1, com fichas de times, seleções, jogadores e pilotos.",
  newsletterUrl: process.env.NEXT_PUBLIC_NEWSLETTER_URL ?? "https://kingsnewsletter.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://kingsnewsletter.com/sports",
  basePath:
    process.env.NEXT_PUBLIC_BASE_PATH === undefined
      ? "/sports"
      : process.env.NEXT_PUBLIC_BASE_PATH,
  locale: "pt-BR",
  lang: "pt-BR",
  editorialEmail:
    process.env.NEXT_PUBLIC_EDITORIAL_EMAIL ?? "editorial@kingsnewsletter.com",
  foundingYear: 2026,
} as const;

/** Monta URL absoluta a partir de um caminho interno (ex.: "/noticias"). */
export function absoluteUrl(path = "/"): string {
  const base = site.url.replace(/\/+$/, "");
  if (path === "/" || path === "") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export type NavItem = {
  label: string;
  href: string;
  description?: string;
  primary?: boolean;
};

export const primaryNav: NavItem[] = [
  { label: "Hoje", href: "/", primary: true },
  { label: "Resultados", href: "/resultados", primary: true },
  { label: "Tabelas", href: "/classificacoes", primary: true },
  { label: "Notícias", href: "/noticias", primary: true },
  { label: "Times", href: "/times", primary: true },
  { label: "Seleções", href: "/selecoes", primary: true },
  { label: "Jogadores", href: "/jogadores", primary: true },
  { label: "Pilotos", href: "/pilotos", primary: true },
];

export const secondaryNav: NavItem[] = [
  { label: "Calendário", href: "/calendario", description: "Jogos e corridas do mês" },
  { label: "Competições", href: "/competicoes", description: "Ligas, copas e torneios acompanhados" },
  { label: "Estatísticas", href: "/estatisticas", description: "Líderes de cada liga" },
  { label: "Transferências", href: "/transferencias", description: "Mercado e movimentações" },
  { label: "Análises", href: "/analises", description: "Opinião assinada e contexto" },
  { label: "Sobre", href: "/sobre", description: "Quem somos e como apuramos" },
];

export const allNav: NavItem[] = [...primaryNav, ...secondaryNav];
