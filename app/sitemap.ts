import type { MetadataRoute } from "next";

import { getArticles, getCompetitions, getStandings } from "@/lib/data";
import { allNav, site } from "@/lib/site";
import { constructorHref, driverHref } from "@/lib/slugs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.url.replace(/\/+$/, "");
  const now = new Date();

  const staticRoutes = allNav.map((item) => ({
    url: `${base}${item.href === "/" ? "" : item.href}`,
    lastModified: now,
    changeFrequency: (item.href === "/" ? "hourly" : "daily") as "hourly" | "daily",
    priority: item.href === "/" ? 1 : 0.8,
  }));

  const [articles, competitions, racingTables] = await Promise.all([
    getArticles(),
    getCompetitions(),
    getStandings("formula-1"),
  ]);

  const articleRoutes = articles.map((article) => ({
    url: `${base}/noticias/${article.slug}`,
    lastModified: new Date(article.updatedAt ?? article.publishedAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const competitionRoutes = competitions.map((competition) => ({
    url: `${base}/competicoes/${competition.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const profileRoutes = racingTables.flatMap((table) =>
    table.rows.map((row) => ({
      url: `${base}${table.group === "Construtores" ? constructorHref(row) : driverHref(row)}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
  );

  return [...staticRoutes, ...articleRoutes, ...competitionRoutes, ...profileRoutes];
}
