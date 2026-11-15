import type { NextConfig } from "next";

/**
 * O portal será publicado em https://kingsnewsletter.com/sports.
 * O basePath vem de variável de ambiente para permitir rodar na raiz
 * (local ou preview) sem mudar código.
 *
 * Defina NEXT_PUBLIC_BASE_PATH="" para servir na raiz do domínio.
 */
const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH === undefined
    ? "/sports"
    : process.env.NEXT_PUBLIC_BASE_PATH;

const nextConfig: NextConfig = {
  basePath,
  // Pasta de build alternativa (ex.: rodar `next build` com o `next dev` aberto).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      // Libere aqui os domínios de imagem que a redação usar (CDN, agência, etc.).
    ],
  },
  async redirects() {
    return [
      // A série "Dinheiro em jogo" saiu do site; links antigos levam às notícias.
      { source: "/dinheiro-em-jogo", destination: "/noticias", permanent: true },
      // Com basePath, a raiz do domínio próprio da Vercel (kings-sports.vercel.app)
      // daria 404. Leva quem chega lá para o portal.
      ...(basePath
        ? [{ source: "/", destination: basePath, basePath: false as const, permanent: false }]
        : []),
    ];
  },
  async headers() {
    // Cache das páginas na CDN da Vercel. As páginas com filtro na URL
    // (?esporte=, ?mes=, ?competicao=…) são dinâmicas: sem isto, cada visita
    // renderizava a página no servidor e consumia Active CPU. Nenhuma página
    // do portal é personalizada (não há login, cookies nem headers lidos),
    // então a mesma URL pode ser servida a todos por algum tempo.
    //
    // Vercel-CDN-Cache-Control vale só para a CDN da Vercel: o navegador e o
    // proxy da Cloudflare continuam sem guardar o HTML. A Vercel separa no
    // cache o HTML das respostas RSC da navegação pelo header Vary que o Next
    // já envia. /_next (arquivos com hash, já imutáveis) e /api ficam de fora.
    //
    // Quando duas regras valem para a mesma URL, vale a última: a regra geral
    // vem primeiro e as seções mais estáveis a sobrescrevem com cache maior.
    const cdn = (seconds: number) => [
      { key: "Vercel-CDN-Cache-Control", value: `s-maxage=${seconds}, stale-while-revalidate=${seconds * 6}` },
    ];
    // Home, resultados, calendário e partidas: mudam ao longo do dia.
    const dayToDay = cdn(60);
    // Tabelas, notícias e competições: mudam algumas vezes por dia.
    const hourly = cdn(300);
    // Fichas e páginas institucionais: quase não mudam.
    const stable = cdn(1800);
    const section = (paths: string[], headers: { key: string; value: string }[]) =>
      paths.map((path) => [
        { source: `/${path}`, headers },
        { source: `/${path}/:rest*`, headers },
      ]).flat();
    return [
      { source: "/", headers: dayToDay },
      { source: "/:path((?!_next/|api/).+)", headers: dayToDay },
      ...section(["classificacoes", "competicoes", "noticias", "estatisticas", "transferencias", "analises"], hourly),
      ...section(["times", "atletas", "jogadores", "pilotos", "construtores", "selecoes", "sobre"], stable),
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
