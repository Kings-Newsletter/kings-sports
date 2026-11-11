import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleCard } from "@/components/news/article-card";
import { Container } from "@/components/ui/icons";
import { getArticleBySlug, getArticles } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { parseBody, renderInline } from "@/lib/markdown";
import { buildMetadata } from "@/lib/seo";
import { getSport } from "@/lib/sports";
import { site } from "@/lib/site";

export const dynamicParams = true;

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) {
    return { title: "Matéria não encontrada", robots: { index: false, follow: false } };
  }
  return buildMetadata({
    title: article.title,
    description: article.dek,
    path: `/noticias/${article.slug}`,
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    image: article.cover?.src,
  });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const sport = getSport(article.sport);
  const related = await getArticles({ sport: article.sport, limit: 3, excludeSlug: article.slug });
  const blocks = article.body ? parseBody(article.body) : [];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.dek,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    inLanguage: "pt-BR",
    articleSection: sport?.name,
    author: { "@type": "Person", name: article.author },
    publisher: { "@type": "NewsMediaOrganization", name: site.name, url: site.url },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${site.url}/noticias/${article.slug}`,
    },
    ...(article.cover?.src ? { image: [article.cover.src] } : {}),
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <Container className="max-w-3xl pb-12 pt-10 sm:pt-14">
        <nav aria-label="Trilha de navegação" className="text-xs text-mist-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-mist-200">
                Início
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/noticias" className="hover:text-mist-200">
                Notícias
              </Link>
            </li>
            {sport ? (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href={`/noticias?sport=${sport.slug}`} className="hover:text-mist-200">
                    {sport.name}
                  </Link>
                </li>
              </>
            ) : null}
          </ol>
        </nav>

        <header className="mt-6">
          <p className="kicker">
            {sport?.name ?? "Esporte"}
          </p>
          <h1 className="mt-3 font-display text-3xl font-black leading-[1.1] tracking-tight text-mist-50 sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-mist-300 sm:text-lg">{article.dek}</p>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-line-soft py-3 text-xs text-mist-500">
            <span className="font-medium text-mist-200">Por {article.author}</span>
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
            {article.readingMinutes ? <span>{article.readingMinutes} min de leitura</span> : null}
            {article.updatedAt ? (
              <span className="text-mist-600">
                Atualizado em {formatDate(article.updatedAt)}
              </span>
            ) : null}
          </div>
        </header>

        {article.cover?.src ? (
          <figure className="mt-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.cover.src}
              alt={article.cover.alt}
              className="w-full rounded-card border border-line-soft object-cover"
            />
            {article.cover.credit ? (
              <figcaption className="mt-2 text-xs text-mist-600">{article.cover.credit}</figcaption>
            ) : null}
          </figure>
        ) : null}

        <div className="prose-article mt-8">
          {blocks.length > 0 ? (
            blocks.map((block, index) => {
              if (block.type === "h2") return <h2 key={index}>{block.text}</h2>;
              if (block.type === "h3") return <h3 key={index}>{block.text}</h3>;
              if (block.type === "quote") return <blockquote key={index}>{block.text}</blockquote>;
              if (block.type === "list") {
                return (
                  <ul key={index} className="list-disc space-y-2 pl-5">
                    {block.items.map((item, itemIndex) => (
                      <li key={itemIndex}>
                        {renderInline(item).map((part, partIndex) =>
                          part.bold ? <strong key={partIndex}>{part.value}</strong> : part.value,
                        )}
                      </li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={index}>
                  {renderInline(block.text).map((part, partIndex) =>
                    part.bold ? <strong key={partIndex}>{part.value}</strong> : part.value,
                  )}
                </p>
              );
            })
          ) : (
            <p className="text-mist-500">
              O corpo desta matéria ainda não foi cadastrado no acervo editorial.
            </p>
          )}
        </div>

        {article.tags && article.tags.length > 0 ? (
          <ul className="mt-8 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-line px-2.5 py-1 text-xs text-mist-400"
              >
                #{tag}
              </li>
            ))}
          </ul>
        ) : null}
      </Container>

      {related.length > 0 ? (
        <div className="border-t border-line-soft">
          <Container className="py-10 sm:py-12">
            <h2 className="mb-5 font-display text-lg font-bold text-mist-50">Leia também</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ArticleCard key={item.slug} article={item} />
              ))}
            </div>
          </Container>
        </div>
      ) : null}
    </article>
  );
}
