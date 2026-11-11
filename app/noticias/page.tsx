import type { Metadata } from "next";

import { ArticleCard } from "@/components/news/article-card";
import { SportFilter } from "@/components/sports/sport-filter";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { getArticles, getCompetitions } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { getSport } from "@/lib/sports";

type SearchParams = Promise<{ sport?: string; competition?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { sport } = await searchParams;
  const current = getSport(sport);
  const title = current ? `${current.name} — notícias` : "Notícias";
  const description = current
    ? `Cobertura de ${current.name.toLowerCase()}: ${current.blurb}`
    : "Últimas notícias esportivas com apuração própria, contexto e assinatura.";

  return buildMetadata({
    title,
    description,
    path: current ? `/noticias?sport=${current.slug}` : "/noticias",
  });
}

export default async function NewsPage({ searchParams }: { searchParams: SearchParams }) {
  const { sport, competition } = await searchParams;
  const currentSport = getSport(sport);

  const [articles, competitions] = await Promise.all([
    getArticles({ sport, competition }),
    getCompetitions(sport),
  ]);

  return (
    <Container>
      <PageHeader
        section="/noticias"
        title={currentSport ? `Notícias de ${currentSport.name}` : "Notícias"}
        description={
          currentSport
            ? currentSport.blurb
            : "Reportagens, notas e entrevistas. Cada texto traz assinatura, data de publicação e fontes quando aplicável."
        }
      >
        <SportFilter basePath="/noticias" active={sport} />
      </PageHeader>

      {competition && competitions.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {competitions.map((item) => (
            <a
              key={item.slug}
              href={`/noticias?sport=${item.sport}&competition=${item.slug}`}
              className={`rounded-full border px-3 py-1 text-xs ${
                item.slug === competition
                  ? "border-flood-500/60 bg-flood-500/15 text-flood-300"
                  : "border-line text-mist-400 hover:text-mist-100"
              }`}
            >
              {item.name}
            </a>
          ))}
        </div>
      ) : null}

      <div className="py-10 sm:py-12">
        {articles.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={
              currentSport
                ? `Ainda sem matérias de ${currentSport.name}`
                : "Nenhuma notícia publicada ainda"
            }
            description="O arquivo de notícias está vazio. Quando a redação publicar, os textos aparecem aqui em ordem cronológica, com filtro por modalidade e competição."
          />
        )}
      </div>
    </Container>
  );
}
