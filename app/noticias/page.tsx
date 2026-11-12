import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Newspaper } from "lucide-react";

import { ArticleCard, ArticleListItem } from "@/components/news/article-card";
import { HistoryFab, type HistoryEntry } from "@/components/news/history-fab";
import { LinkPending } from "@/components/ui/link-pending";
import { SportFilter } from "@/components/sports/sport-filter";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { SportIcon } from "@/components/ui/sport-icon";
import { getArticleEditions, getArticles, getCompetitions } from "@/lib/data";
import { isValidYmd } from "@/lib/dates";
import { buildMetadata } from "@/lib/seo";
import { getSport, sportName } from "@/lib/sports";
import type { Article } from "@/lib/types";

type SearchParams = Promise<{ sport?: string; competition?: string; edicao?: string }>;

/* Datas de edição são dias de calendário ("YYYY-MM-DD"): formatadas ao meio-dia UTC
   para o fuso do servidor nunca empurrar para o dia vizinho. */
const dayLong = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const dayWeekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" });
const atNoon = (day: string) => new Date(`${day}T12:00:00Z`);
const longDay = (day: string) => dayLong.format(atNoon(day));
const weekday = (day: string) => {
  const name = dayWeekday.format(atNoon(day));
  return name.charAt(0).toUpperCase() + name.slice(1);
};

function newsHref(params: { sport?: string; competition?: string; day?: string }) {
  const query = new URLSearchParams();
  if (params.sport) query.set("sport", params.sport);
  if (params.competition) query.set("competition", params.competition);
  if (params.day) query.set("edicao", params.day);
  const text = query.toString();
  return text ? `/noticias?${text}` : "/noticias";
}

/** Agrupa as matérias por modalidade, da que tem mais textos para a que tem menos. */
function groupBySport(articles: Article[]) {
  const groups = new Map<string, Article[]>();
  for (const article of articles) {
    const list = groups.get(article.sport) ?? [];
    list.push(article);
    groups.set(article.sport, list);
  }
  return [...groups.entries()]
    .map(([sport, items]) => ({ sport, name: sportName(sport), items }))
    .sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name, "pt-BR"));
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { sport, edicao } = await searchParams;
  const current = getSport(sport);
  const day = isValidYmd(edicao) ? edicao : undefined;
  const base = current ? `${current.name} — notícias` : "Notícias";
  const title = day ? `${base} de ${longDay(day)}` : base;
  const description = current
    ? `Cobertura de ${current.name.toLowerCase()}: ${current.blurb}`
    : "Últimas notícias esportivas com apuração própria, contexto e assinatura, organizadas em edições diárias.";

  return buildMetadata({
    title,
    description,
    path: newsHref({ sport: current?.slug, day }),
  });
}

export default async function NewsPage({ searchParams }: { searchParams: SearchParams }) {
  const { sport, competition, edicao } = await searchParams;
  const currentSport = getSport(sport);

  const [editions, competitions] = await Promise.all([
    getArticleEditions({ sport, competition }),
    getCompetitions(sport),
  ]);

  // Edição pedida no endereço; se não existir (ou não tiver matérias desta modalidade),
  // mostra a mais recente e avisa.
  const requested = isValidYmd(edicao) ? edicao : undefined;
  const found = requested ? editions.find((item) => item.day === requested) : undefined;
  const edition = found ?? editions[0];
  const missing = Boolean(edicao && !found && edition);
  const latestDay = editions[0]?.day;
  const isLatest = edition?.day === latestDay;

  const articles = edition ? await getArticles({ sport, competition, day: edition.day }) : [];
  const lead = articles.find((article) => article.featured) ?? articles[0];
  const rest = articles.filter((article) => article !== lead);
  // Índice "Nesta edição" conta a manchete; as seções abaixo dela trazem o restante.
  const modalityIndex = currentSport ? [] : groupBySport(articles);
  const byModality = modalityIndex.length > 1;
  const groups = byModality ? groupBySport(rest) : [];
  const sectionIds = new Set(groups.map((group) => group.sport));
  const sideList = byModality ? [] : rest.slice(0, 4);
  const gridItems = byModality ? [] : rest.slice(4);
  const modalities = new Set(articles.map((article) => article.sport)).size;

  const index = edition ? editions.indexOf(edition) : -1;
  const older = index >= 0 ? editions[index + 1] : undefined;
  const newer = index > 0 ? editions[index - 1] : undefined;
  const hrefFor = (day: string) =>
    newsHref({ sport, competition, day: day === latestDay ? undefined : day });

  const history: HistoryEntry[] = editions.map((item) => ({
    day: item.day,
    label: longDay(item.day),
    count: item.count,
    href: hrefFor(item.day),
    latest: item.day === latestDay,
  }));

  return (
    <Container>
      <PageHeader
        section="/noticias"
        title={currentSport ? `Notícias de ${currentSport.name}` : "Notícias"}
        description={
          currentSport
            ? currentSport.blurb
            : "Reportagens, notas e entrevistas organizadas em edições diárias. Cada texto traz assinatura, data de publicação e fontes quando aplicável."
        }
      >
        <SportFilter
          basePath="/noticias"
          active={sport}
          extraParams={{ edicao: edition && !isLatest ? edition.day : undefined }}
        />
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

      <div className="pb-24 pt-10 sm:pt-12">
        {edition && lead ? (
          <section aria-labelledby="edicao-titulo">
            <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b-2 border-mist-200/70 pb-5">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-flood-300">
                  <Newspaper aria-hidden="true" className="size-4" />
                  {isLatest ? "Edição mais recente" : "Edição de arquivo"}
                </p>
                <h2
                  id="edicao-titulo"
                  className="mt-2 font-display text-[clamp(1.875rem,4.5vw,2.75rem)] font-extrabold leading-none"
                >
                  {weekday(edition.day)}, {longDay(edition.day)}
                </h2>
              </div>
              <p className="flex items-center gap-2 text-sm text-mist-400">
                <CalendarDays aria-hidden="true" className="size-4 text-mist-500" />
                {plural(articles.length, "matéria", "matérias")}
                {modalities > 1 ? ` em ${plural(modalities, "modalidade", "modalidades")}` : ""}
              </p>
            </header>

            {missing ? (
              <p className="mt-5 rounded-card border border-gold-500/40 bg-gold-500/10 px-4 py-3 text-sm text-gold-300">
                {currentSport
                  ? `Não há matérias de ${currentSport.name} na data pedida. Mostrando a edição mais recente com ${currentSport.name}.`
                  : "Não há edição publicada na data pedida. Mostrando a mais recente."}
              </p>
            ) : null}

            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-10">
              <ArticleCard article={lead} featured />

              {byModality ? (
                <nav aria-label="Modalidades desta edição" className="self-start lg:sticky lg:top-32">
                  <p className="border-b border-line-soft pb-3 font-display text-lg font-bold text-mist-50">
                    Nesta edição
                  </p>
                  <ul>
                    {modalityIndex.map((group) => (
                      <li key={group.sport} className="border-b border-line-soft last:border-b-0">
                        <a
                          href={sectionIds.has(group.sport) ? `#modalidade-${group.sport}` : "#edicao-titulo"}
                          className="flex items-center gap-3 py-3 text-mist-300 transition-colors hover:text-flood-300"
                        >
                          <SportIcon sport={group.sport} className="size-4 text-flood-400" />
                          <span className="flex-1 font-medium">{group.name}</span>
                          <span className="text-xs tabular-nums text-mist-500">
                            {plural(group.items.length, "matéria", "matérias")}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : sideList.length > 0 ? (
                <div className="self-start">
                  <p className="border-b border-line-soft pb-3 font-display text-lg font-bold text-mist-50">
                    Também nesta edição
                  </p>
                  {sideList.map((article) => (
                    <ArticleListItem key={article.slug} article={article} />
                  ))}
                </div>
              ) : null}
            </div>

            {byModality
              ? groups.map((group) => (
                  <section
                    key={group.sport}
                    id={`modalidade-${group.sport}`}
                    aria-labelledby={`modalidade-${group.sport}-titulo`}
                    className="mt-14 scroll-mt-36"
                  >
                    <h3
                      id={`modalidade-${group.sport}-titulo`}
                      className="flex items-baseline gap-3 border-b border-line-soft pb-3 font-display text-2xl font-bold"
                    >
                      <SportIcon sport={group.sport} className="size-5 translate-y-0.5 self-center text-flood-400" />
                      {group.name}
                      <span className="font-sans text-sm font-normal text-mist-500">
                        {plural(group.items.length, "matéria", "matérias")}
                      </span>
                    </h3>
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {group.items.map((article) => (
                        <ArticleCard key={article.slug} article={article} />
                      ))}
                    </div>
                  </section>
                ))
              : gridItems.length > 0 ? (
                  <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {gridItems.map((article) => (
                      <ArticleCard key={article.slug} article={article} />
                    ))}
                  </div>
                ) : null}

            {older || newer ? (
              <nav aria-label="Outras edições" className="mt-16 grid gap-3 border-t border-line-soft pt-6 sm:grid-cols-2">
                {older ? (
                  <Link
                    href={hrefFor(older.day)}
                    className="flex items-center gap-3 rounded-card border border-line bg-ink-850/60 px-4 py-3.5 transition-colors hover:border-flood-500/60 hover:bg-flood-500/10"
                  >
                    <span className="grid size-5 shrink-0 place-items-center text-flood-400">
                      <LinkPending>
                        <ChevronLeft aria-hidden="true" className="size-5" />
                      </LinkPending>
                    </span>
                    <span className="grid">
                      <small className="text-xs text-mist-500">Edição anterior</small>
                      <strong className="font-display text-lg text-mist-50">{longDay(older.day)}</strong>
                    </span>
                  </Link>
                ) : null}
                {newer ? (
                  <Link
                    href={hrefFor(newer.day)}
                    className="flex items-center justify-end gap-3 rounded-card border border-line bg-ink-850/60 px-4 py-3.5 text-right transition-colors hover:border-flood-500/60 hover:bg-flood-500/10 sm:col-start-2"
                  >
                    <span className="grid">
                      <small className="text-xs text-mist-500">
                        {newer.day === latestDay ? "Edição mais recente" : "Próxima edição"}
                      </small>
                      <strong className="font-display text-lg text-mist-50">{longDay(newer.day)}</strong>
                    </span>
                    <span className="grid size-5 shrink-0 place-items-center text-flood-400">
                      <LinkPending>
                        <ChevronRight aria-hidden="true" className="size-5" />
                      </LinkPending>
                    </span>
                  </Link>
                ) : null}
              </nav>
            ) : null}
          </section>
        ) : (
          <EmptyState
            title={
              currentSport
                ? `Ainda sem matérias de ${currentSport.name}`
                : "Nenhuma notícia publicada ainda"
            }
            description="O arquivo de notícias está vazio. Quando a redação publicar, cada dia vira uma edição, com as anteriores no botão de histórico."
          />
        )}
      </div>

      <HistoryFab entries={history} current={edition?.day} />
    </Container>
  );
}
