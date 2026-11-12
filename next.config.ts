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
    return [
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
