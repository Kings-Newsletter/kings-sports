import type { Metadata } from "next";
import Link from "next/link";

import { DailyBriefs } from "@/components/editorial/daily-briefs";
import { ArticleCard } from "@/components/news/article-card";
import { DayGuide, type DayTab } from "@/components/sports/day-guide";
import { StandingsTable } from "@/components/sports/standings-table";
import { CrestTile } from "@/components/sports/crest-tile";
import { HomeRail } from "@/components/sports/home-rail";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/icons";
import { NavIcon } from "@/components/ui/nav-icon";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  getArticles,
  getDailyBriefs,
  getFixturesForDay,
  getLastMeetings,
  getStandings,
} from "@/lib/data";
import { addDays, toLocalYmd } from "@/lib/dates";
import { getDrivers, getFeaturedPlayers, getNationalTeams } from "@/lib/directory";
import { buildMetadata } from "@/lib/seo";
import { getSport } from "@/lib/sports";
import { site } from "@/lib/site";
import type { Fixture } from "@/lib/types";

export const metadata: Metadata = buildMetadata({
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  path: "/",
});

type SearchParams = Promise<{ dia?: string; esporte?: string }>;

const longDate = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  timeZone: "America/Sao_Paulo",
});

const FEATURED_NATIONS = ["Brasil", "Argentina", "França", "Inglaterra", "Espanha", "Portugal", "Alemanha", "Uruguai"];

/** Atalhos para as seções de fichas, com ícone. */
const DIRECTORY = [
  { href: "/times", label: "Times", text: "Elencos, jogos e campanha" },
  { href: "/selecoes", label: "Seleções", text: "As 48 da Copa do Mundo" },
  { href: "/jogadores", label: "Jogadores", text: "Quem lidera cada liga" },
  { href: "/pilotos", label: "Pilotos", text: "O grid da Fórmula 1" },
];

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Uma frase sobre o dia: quantos jogos, quantos ao vivo, quantos faltam. */
function daySummary(day: string, fixtures: Fixture[]) {
  const total = fixtures.length;
  if (total === 0) return "Nenhum jogo das competições acompanhadas.";
  const games = `${total} ${total === 1 ? "jogo ou sessão" : "jogos e sessões"}`;
  if (day === "ontem") return `${games} no dia.`;
  if (day === "amanha") return `${games} na programação.`;
  const live = fixtures.filter((fixture) => fixture.status === "live").length;
  const ahead = fixtures.filter(
    (fixture) => fixture.status === "scheduled" && new Date(fixture.kickoff).getTime() > Date.now(),
  ).length;
  const parts = [
    live > 0 ? `${live} ao vivo` : null,
    ahead > 0 ? `${ahead} ainda por começar` : null,
  ].filter(Boolean);
  return parts.length > 0 ? `${games} hoje, ${parts.join(" e ")}.` : `${games} hoje, todos encerrados.`;
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const today = toLocalYmd();
  const tabs: DayTab[] = [
    { key: "ontem", label: "Ontem", ymd: addDays(today, -1) },
    { key: "hoje", label: "Hoje", ymd: today },
    { key: "amanha", label: "Amanhã", ymd: addDays(today, 1) },
  ];
  const activeTab = tabs.find((tab) => tab.key === params.dia) ?? tabs[1]!;
  const sport = getSport(params.esporte)?.covered ? params.esporte : undefined;

  const [dayFixtures, briefs, latest, standings, players, drivers, nations] = await Promise.all([
    getFixturesForDay(activeTab.ymd),
    getDailyBriefs(today),
    getArticles({ limit: 8 }),
    getStandings(),
    getFeaturedPlayers(),
    getDrivers(),
    getNationalTeams(),
  ]);
  const featured = nations.filter((team) => FEATURED_NATIONS.includes(team.name));

  const fixtures = sport ? dayFixtures.filter((fixture) => fixture.sport === sport) : dayFixtures;

  // Último confronto direto nos jogos do Brasileirão (histórico importado).
  const brazilian = fixtures.filter(
    (fixture) => fixture.competition === "brasileirao-serie-a" && fixture.home && fixture.away,
  );
  const meetings = await getLastMeetings(
    brazilian.map((fixture) => ({ home: fixture.home!.name, away: fixture.away!.name })),
  );
  const notes = new Map<string, string>();
  for (const fixture of brazilian) {
    const match = meetings.get(`${fixture.home!.name}|${fixture.away!.name}`);
    if (match) {
      notes.set(
        fixture.id,
        `Último confronto (${match.season}): ${match.home} ${match.homeGoals}–${match.awayGoals} ${match.away}`,
      );
    }
  }

  const news = latest.slice(0, 4);
  const tables = [
    standings.find((table) => table.competition === "brasileirao-serie-a"),
    standings.find((table) => table.competition === "formula-1" && table.group === "Pilotos"),
  ].filter((table) => table !== undefined);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    inLanguage: "pt-BR",
    publisher: { "@type": "NewsMediaOrganization", name: site.name, url: site.url },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* --------------------------------------- Capa: guia do dia + coluna */}
      <section className="border-b border-line-soft">
        <Container className="grid gap-10 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0">
            <div className="mb-6">
              <h1 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-none text-mist-50">
                <span className="sr-only">{activeTab.key === "ontem" ? "Jogos de ontem" : activeTab.key === "amanha" ? "Jogos de amanhã" : "Jogos de hoje"}, </span>
                {capitalize(longDate.format(new Date(`${activeTab.ymd}T12:00:00-03:00`)))}
              </h1>
              <p className="mt-2 text-mist-400">{daySummary(activeTab.key, fixtures)}</p>
            </div>

            <DayGuide
              fixtures={fixtures}
              allFixtures={dayFixtures}
              tabs={tabs}
              activeDay={activeTab.key}
              activeSport={sport}
              notes={notes}
            />
          </div>

          <HomeRail players={players} drivers={drivers.drivers.slice(0, 5)} />
        </Container>
      </section>

      {/* ------------------------------------------------- Notícias */}
      <section className="border-b border-line-soft">
        <Container className="py-10 sm:py-14">
          <SectionHeading title="Últimas notícias" href="/noticias" linkLabel="Todas as notícias" />
          {news.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {news.map((article, index) => (
                <ArticleCard key={article.slug} article={article} featured={index === 0} />
              ))}
            </div>
          ) : (
            <EmptyState
              compact
              title="Nenhuma notícia publicada ainda"
              description="Cada texto passa por checagem de fonte, autoria e revisão antes de entrar no ar. Enquanto isso, acompanhe os resultados."
              action={{ label: "Ver os resultados", href: "/resultados" }}
            />
          )}
        </Container>
      </section>

      {/* -------------------------------------------- A rodada em 1 minuto */}
      {briefs.length > 0 ? (
        <section className="border-b border-line-soft bg-ink-900/60">
          <Container className="py-10 sm:py-14">
            <SectionHeading
              title="A rodada em 1 minuto"
              description="O que importou, em três frases por esporte."
              href="/resultados"
              linkLabel="Todos os resultados"
            />
            <DailyBriefs briefs={briefs} today={today} />
          </Container>
        </section>
      ) : null}

      {/* -------------------------------------------------------- Tabelas */}
      <section className="border-b border-line-soft">
        <Container className="py-10 sm:py-14">
          <SectionHeading title="Classificações" href="/classificacoes" linkLabel="Todas as tabelas" />
          {tables.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {tables.map((table) => (
                <div key={`${table.competition}-${table.group ?? ""}`}>
                  <h3 className="mb-2 font-display text-xl font-bold text-mist-100">
                    {table.competition === "formula-1" ? "Pilotos da F1" : "Brasileirão Série A"}
                  </h3>
                  <StandingsTable table={table} compact limit={10} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Tabelas ainda não coletadas"
              description="As classificações chegam pela coleta diária, com a fonte e a hora da atualização."
            />
          )}
        </Container>
      </section>

      {/* ------------------------------------------------- Seleções */}
      {featured.length > 0 ? (
        <section className="border-b border-line-soft">
          <Container className="py-10 sm:py-14">
            <SectionHeading title="Seleções" href="/selecoes" linkLabel="Todas as 48 seleções" />
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-8">
              {featured.map((team) => (
                <li key={team.id}>
                  <CrestTile href={team.href} name={team.name} image={team.crest} round />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {/* ------------------------------------------------- Atalhos */}
      <section>
        <Container className="py-10 sm:py-14">
          <h2 className="sr-only">Fichas</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DIRECTORY.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="card-lift group flex items-center gap-4 rounded-[8px] border border-line-soft bg-ink-850 p-4"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-[8px] bg-flood-500 text-white">
                    <NavIcon href={item.href} className="size-6" />
                  </span>
                  <span>
                    <span className="block font-display text-xl font-bold leading-tight text-mist-50 group-hover:text-flood-300">{item.label}</span>
                    <span className="block text-sm text-mist-400">{item.text}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
