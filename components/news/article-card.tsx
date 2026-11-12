import Link from "next/link";

import { formatDate } from "@/lib/format";
import { wikimediaSrcSet } from "@/lib/images";
import { getSport } from "@/lib/sports";
import type { Article } from "@/lib/types";
import { FadeImage } from "@/components/ui/fade-image";
import { SportIcon } from "@/components/ui/sport-icon";

const kindLabel: Record<Article["kind"], string> = {
  noticia: "Notícia",
  analise: "Análise",
  reportagem: "Reportagem",
  entrevista: "Entrevista",
};

export function ArticleMeta({ article }: { article: Article }) {
  const sport = getSport(article.sport);
  return (
    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[0.8125rem] text-mist-500">
      <span className="font-display text-[0.95rem] font-semibold text-flood-300">{sport?.name ?? article.sport}</span>
      <span>{kindLabel[article.kind]}</span>
      <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
    </p>
  );
}

export function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  return (
    <article
      className={`card-lift group relative flex h-full flex-col overflow-hidden rounded-card border border-line-soft bg-ink-850/60 shadow-card ${
        featured ? "border-l-4 border-l-flood-500" : ""
      }`}
    >
      <div
        className={`relative overflow-hidden bg-ink-800 ${
          article.cover?.src
            ? featured
              ? "aspect-[16/10]"
              : "aspect-[16/9]"
            : featured
              ? "h-44"
              : "h-24"
        }`}
      >
        {article.cover?.src ? (
          <FadeImage
            src={article.cover.src}
            srcSet={wikimediaSrcSet(article.cover.src, [500, 960, 1280])}
            sizes={
              featured
                ? "(min-width: 64rem) 50vw, (min-width: 40rem) 50vw, 100vw"
                : "(min-width: 64rem) 25vw, (min-width: 40rem) 50vw, 100vw"
            }
            alt={article.cover.alt}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="grid size-full place-items-center">
            <SportIcon
              sport={article.sport}
              className={`relative text-flood-500/30 ${featured ? "size-16" : "size-9"}`}
            />
          </div>
        )}
      </div>

      <div className={`flex flex-1 flex-col ${featured ? "gap-3 p-5 sm:p-7" : "gap-2.5 p-5"}`}>
        <ArticleMeta article={article} />
        <h3
          className={`font-display font-bold leading-[1.15] text-mist-50 ${
            featured ? "text-2xl sm:text-[1.75rem]" : "text-[1.0625rem]"
          }`}
        >
          <Link href={`/noticias/${article.slug}`} className="focus-visible:outline-none">
            <span className="absolute inset-0" aria-hidden="true" />
            {article.title}
          </Link>
        </h3>
        <p className={`text-mist-400 ${featured ? "text-sm sm:text-base" : "line-clamp-2 text-[0.8125rem]"}`}>
          {article.dek}
        </p>
        {featured ? (
          <p className="mt-auto pt-2 text-xs text-mist-500">
            Por {article.author}
            {article.readingMinutes ? `, ${article.readingMinutes} min de leitura` : ""}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function ArticleListItem({ article, index }: { article: Article; index?: number }) {
  return (
    <article className="group relative flex gap-4 border-b border-line-soft py-4 last:border-b-0">
      {typeof index === "number" ? (
        <span className="mt-0.5 w-5 shrink-0 font-display text-sm font-bold text-ink-700">
          {String(index + 1).padStart(2, "0")}
        </span>
      ) : null}
      <div className="min-w-0">
        <ArticleMeta article={article} />
        <h3 className="mt-1.5 font-display text-[1.0625rem] font-bold leading-snug text-mist-100 transition-colors group-hover:text-flood-300">
          <Link href={`/noticias/${article.slug}`}>
            <span className="absolute inset-0" aria-hidden="true" />
            {article.title}
          </Link>
        </h3>
      </div>
    </article>
  );
}
