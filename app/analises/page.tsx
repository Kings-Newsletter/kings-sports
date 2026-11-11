import type { Metadata } from "next";

import { ArticleCard } from "@/components/news/article-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { getArticles } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Análises",
  description:
    "Análises, reportagens e entrevistas assinadas. Opinião sempre identificada e separada da cobertura factual.",
  path: "/analises",
});

export default async function AnalysisPage() {
  const [analyses, reportages] = await Promise.all([
    getArticles({ kind: "analise" }),
    getArticles({ kind: "reportagem" }),
  ]);

  return (
    <Container>
      <PageHeader
        section="/analises"
        title="Análises"
        description="Texto analítico é assinado, datado e marcado como opinião. A cobertura factual fica nas seções de notícias e resultados."
      />

      <div className="space-y-12 py-10 sm:py-12">
        {analyses.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {analyses.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhuma análise publicada"
            description="Quando houver colunistas e textos assinados, eles aparecem aqui — com autoria e identificação clara de opinião."
          />
        )}

        {reportages.length > 0 ? (
          <section>
            <h2 className="mb-4 font-display text-lg font-bold text-mist-50">Reportagens</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {reportages.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </Container>
  );
}
