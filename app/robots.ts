import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

/**
 * Robôs de IA que coletam páginas para treinar modelos. Cada URL com filtro
 * (?esporte=, ?mes=…) é uma renderização no servidor, e esses robôs percorrem
 * todas as combinações. Buscadores (Google, Bing) continuam liberados.
 * Robôs que ignoram o robots.txt precisam ser barrados no firewall da Cloudflare.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
  "PerplexityBot",
  "Bytespider",
  "Amazonbot",
  "meta-externalagent",
  "FacebookBot",
  "cohere-ai",
  "Diffbot",
  "ImagesiftBot",
  "omgili",
  "Timpibot",
];

export default function robots(): MetadataRoute.Robots {
  const base = site.url.replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: AI_CRAWLERS,
        disallow: "/",
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
