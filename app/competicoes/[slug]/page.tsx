import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CompetitionLogo } from "@/components/sports/competition-logo";
import { FixtureRow } from "@/components/sports/fixture-row";
import { StandingsTable } from "@/components/sports/standings-table";
import { StatBoardCard } from "@/components/sports/stat-board-card";
import { TeamCrest } from "@/components/sports/team-crest";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/icons";
import { getArticles, getCompetitionBySlug, getFixtures, getStandings, getStatBoards } from "@/lib/data";
import { nationalityLabel } from "@/lib/f1-profiles";
import { formatShortDate, formatTime } from "@/lib/format";
import { fixturePath } from "@/lib/match-path";
import { RaceWeekends } from "@/components/sports/race-weekends";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { constructorHref, driverHref } from "@/lib/slugs";
import { getSport } from "@/lib/sports";
import type { Fixture, Standings } from "@/lib/types";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ aba?: string }>;

const TABS = [
  { key: "visao-geral", label: "Visão geral" },
  { key: "tabela", label: "Tabela" },
  { key: "jogos", label: "Jogos" },
  { key: "estatisticas", label: "Estatísticas" },
  { key: "times", label: "Times" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const competition = await getCompetitionBySlug(slug);
  if (!competition) return { title: "Competição não encontrada", robots: { index: false, follow: false } };
  const racing = competition.sport === "automobilismo";
  return buildMetadata({
    title: competition.name,
    description: racing
      ? `${competition.name}: classificação de pilotos e construtores, etapas, resultados e estatísticas.`
      : `${competition.name}: jogos, classificação, estatísticas e times.`,
    path: `/competicoes/${competition.slug}`,
  });
}

function SectionTitle({ children, href, label }: { children: React.ReactNode; href?: string; label?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="font-display text-2xl font-extrabold text-mist-50">{children}</h2>
      {href ? (
        <Link href={href} className="text-xs font-medium text-mist-500 hover:text-flood-300">
          {label ?? "Ver tudo"}
        </Link>
      ) : null}
    </div>
  );
}

function FixtureList({ fixtures, racing = false }: { fixtures: Fixture[]; racing?: boolean }) {
  // Automobilismo: sessões agrupadas por fim de semana, com o desenho da pista.
  if (racing && fixtures[0]?.competition === "formula-1") return <RaceWeekends fixtures={fixtures} />;
  return (
    <ul className="scoreboard divide-y divide-line-soft overflow-hidden shadow-card">
      {fixtures.map((fixture) => (
        <FixtureRow key={fixture.id} fixture={fixture} />
      ))}
    </ul>
  );
}

/** Cartão de destaque da visão geral (líder, artilheiro, próximo jogo…). */
function KeyCard({
  label,
  title,
  detail,
  crest,
  href,
}: {
  label: string;
  title: string;
  detail?: string;
  crest?: { url?: string; name: string };
  href?: string;
}) {
  const body = (
    <>
      <p className="text-[0.8125rem] font-medium text-mist-500">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        {crest ? <TeamCrest url={crest.url} name={crest.name} size={36} /> : null}
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold leading-tight text-mist-50">{title}</p>
          {detail ? <p className="truncate text-sm text-mist-400">{detail}</p> : null}
        </div>
      </div>
    </>
  );
  const className = "scoreboard block p-4 shadow-card transition-colors";
  return href ? (
    <Link href={href} className={`${className} hover:border-line`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** Diretório de pilotos e construtores, cada linha abre a ficha completa. */
function RacingDirectory({ drivers, constructors }: { drivers?: Standings; constructors?: Standings }) {
  return (
    <div className="grid gap-8 xl:grid-cols-2">
      {drivers ? (
        <section>
          <SectionTitle>Pilotos</SectionTitle>
          <ul className="grid gap-2 sm:grid-cols-2">
            {drivers.rows.map((row) => (
              <li key={row.driverId ?? row.team}>
                <Link
                  href={driverHref(row)}
                  className="scoreboard card-lift flex items-center gap-3 p-3 shadow-card"
                >
                  <span className="score w-7 shrink-0 text-right text-lg text-mist-500">{row.position}</span>
                  <span
                    className="h-9 w-[3px] shrink-0 rounded"
                    style={{ backgroundColor: row.color ? `#${row.color}` : "#334155" }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-sm font-bold leading-tight text-mist-100">
                      {row.team}
                    </span>
                    <span className="block truncate text-xs text-mist-500">
                      {[row.code, row.detail].filter(Boolean).join(", ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="score block text-base text-mist-50">{row.points ?? "–"}</span>
                    <span className="block text-[0.75rem] text-mist-600">pts</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {constructors ? (
        <section>
          <SectionTitle>Construtores</SectionTitle>
          <ul className="grid gap-2 sm:grid-cols-2">
            {constructors.rows.map((row) => (
              <li key={row.constructorId ?? row.team}>
                <Link
                  href={constructorHref(row)}
                  className="scoreboard card-lift flex items-center gap-3 p-3 shadow-card"
                >
                  <span className="score w-7 shrink-0 text-right text-lg text-mist-500">{row.position}</span>
                  <span
                    className="size-9 shrink-0 rounded-[4px]"
                    style={{ backgroundColor: row.color ? `#${row.color}` : "#334155" }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-sm font-bold leading-tight text-mist-100">
                      {row.team}
                    </span>
                    <span className="block truncate text-xs text-mist-500">
                      {[nationalityLabel(row.nationality), row.wins !== undefined ? `${row.wins} vit.` : null]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="score block text-base text-mist-50">{row.points ?? "–"}</span>
                    <span className="block text-[0.75rem] text-mist-600">pts</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export default async function CompetitionPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const { aba } = await searchParams;
  const competition = await getCompetitionBySlug(slug);
  if (!competition) notFound();
  const isRacing = competition.sport === "automobilismo";
  // No automobilismo a aba de partidas se chama "etapas"; o endereço antigo
  // ("jogos") continua válido para não quebrar links já publicados.
  const vistos: string[] = isRacing ? ["jogos", "etapas"] : ["jogos"];
  const requested = aba && vistos.includes(aba) ? "jogos" : aba;
  const tab: TabKey = TABS.some((t) => t.key === requested) ? (requested as TabKey) : "visao-geral";
  const fixturesTab = isRacing ? "etapas" : "jogos";

  const sport = getSport(competition.sport);
  const [fixtures, tables, boards, articles] = await Promise.all([
    getFixtures({ competition: slug, from: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), limit: 120 }),
    getStandings(slug),
    getStatBoards({ competition: slug }),
    getArticles({ competition: slug, limit: 4 }),
  ]);

  const upcoming = fixtures.filter((f) => f.status !== "finished");
  const results = fixtures.filter((f) => f.status === "finished").reverse();

  // Times: da tabela (com ID) ou, nas copas, dos jogos coletados.
  const teams = new Map<string, { id: string; name: string; crest?: string }>();
  for (const table of tables) {
    for (const row of table.rows) if (row.teamId) teams.set(row.teamId, { id: row.teamId, name: row.team, crest: row.crest });
  }
  for (const fixture of fixtures) {
    for (const team of [fixture.home, fixture.away]) {
      if (team?.id && !teams.has(team.id)) teams.set(team.id, { id: team.id, name: team.name, crest: team.crest });
    }
  }
  const teamList = [...teams.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const leader = tables[0]?.rows[0];
  const driverTable = tables.find((table) => table.group === "Pilotos");
  const constructorTable = tables.find((table) => table.group === "Construtores");
  const topBoard = boards[0];
  const topLeader = topBoard?.leaders[0];
  const next = upcoming[0];
  const last = results[0];
  const base = `/competicoes/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: competition.name,
    sport: sport?.name,
    url: `${site.url}${base}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="border-b border-line-soft bg-[radial-gradient(60rem_22rem_at_15%_0%,rgb(37_99_235_/_0.16),transparent_70%)]">
        <Container className="pt-8 sm:pt-12">
          <nav aria-label="Trilha de navegação" className="text-xs text-mist-500">
            <Link href="/competicoes" className="hover:text-mist-200">
              Competições
            </Link>{" "}
            / <span className="text-mist-300">{competition.name}</span>
          </nav>
          <div className="mt-6 flex items-center gap-5">
            <CompetitionLogo slug={slug} size={88} className="rounded-[8px]" />
            <div className="min-w-0">
              <p className="kicker">{sport?.name ?? "Competição"}</p>
              <h1 className="mt-1 font-display text-[clamp(2.2rem,5vw,3.75rem)] font-extrabold leading-none text-mist-50">
                {competition.name}
              </h1>
              <p className="mt-2 text-sm text-mist-400">
                {[competition.country, competition.format, tables[0]?.season ? `Temporada ${tables[0].season}` : null]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </div>

          <nav aria-label="Seções da competição" className="no-scrollbar -mb-px mt-8 flex gap-1 overflow-x-auto">
            {TABS.filter((t) => !(isRacing && t.key === "times")).map((t) => (
              <Link
                key={t.key}
                href={t.key === "visao-geral" ? base : `${base}?aba=${t.key === "jogos" ? fixturesTab : t.key}`}
                aria-current={t.key === tab ? "page" : undefined}
                className={`whitespace-nowrap border-b-[3px] px-4 py-3 font-display text-base font-bold transition-colors ${
                  t.key === tab ? "border-flood-400 text-flood-300" : "border-transparent text-mist-400 hover:text-mist-100"
                }`}
              >
                {t.key === "jogos" && isRacing ? "Etapas" : t.label}
              </Link>
            ))}
          </nav>
        </Container>
      </section>

      <Container className="space-y-10 py-10 sm:py-12">
        {/* ------------------------------------------------- Visão geral */}
        {tab === "visao-geral" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {leader ? (
                <KeyCard
                  label={isRacing ? "Líder do campeonato" : "Líder"}
                  title={leader.team}
                  detail={`${leader.points ?? leader.wins ?? "–"} ${leader.points !== undefined ? "pontos" : "vitórias"}`}
                  crest={isRacing ? undefined : { url: leader.crest, name: leader.team }}
                  href={isRacing ? driverHref(leader) : leader.teamId ? `/times/${slug}/${leader.teamId}` : undefined}
                />
              ) : null}
              {topBoard && topLeader ? (
                <KeyCard
                  label={topBoard.label ?? topBoard.metric}
                  title={topLeader.athlete ?? topLeader.team}
                  detail={`${topLeader.display ?? topLeader.value}, ${topLeader.team}`}
                  crest={{ url: topLeader.crest, name: topLeader.team }}
                  href={topLeader.athleteId ? `/atletas/${slug}/${topLeader.athleteId}` : undefined}
                />
              ) : null}
              {next ? (
                <KeyCard
                  label={isRacing ? "Próxima etapa" : "Próximo jogo"}
                  title={next.home && next.away ? `${next.home.shortName ?? next.home.name} × ${next.away.shortName ?? next.away.name}` : (next.title ?? "—")}
                  detail={`${formatShortDate(next.kickoff)}, ${formatTime(next.kickoff)}`}
                  href={fixturePath(next)}
                />
              ) : null}
              {last ? (
                <KeyCard
                  label="Último resultado"
                  title={
                    last.home && last.away && last.score
                      ? `${last.home.shortName ?? last.home.name} ${last.score.home}–${last.score.away} ${last.away.shortName ?? last.away.name}`
                      : (last.title ?? "—")
                  }
                  detail={last.result ?? formatShortDate(last.kickoff)}
                  href={fixturePath(last)}
                />
              ) : null}
            </div>

            <div className="grid gap-8 xl:grid-cols-2">
              {upcoming.length > 0 ? (
                <div>
                  <SectionTitle href={`${base}?aba=${fixturesTab}`}>{isRacing ? "Próximas etapas" : "Próximos jogos"}</SectionTitle>
                  <FixtureList fixtures={upcoming.slice(0, isRacing ? 8 : 5)} racing={isRacing} />
                </div>
              ) : null}
              {results.length > 0 ? (
                <div>
                  <SectionTitle href={`${base}?aba=${fixturesTab}`}>Últimos resultados</SectionTitle>
                  <FixtureList fixtures={results.slice(0, isRacing ? 8 : 5)} racing={isRacing} />
                </div>
              ) : null}
            </div>

            <div className="grid gap-8 xl:grid-cols-[1.3fr_1fr]">
              {tables[0] ? (
                <div>
                  <SectionTitle href={`${base}?aba=tabela`} label={isRacing ? "Classificação completa" : "Tabela completa"}>
                    {tables[0].group ?? "Classificação"}
                  </SectionTitle>
                  <StandingsTable table={tables[0]} compact limit={8} />
                  {isRacing ? (
                    <p className="mt-2 text-xs text-mist-500">
                      Toque em um piloto para abrir a ficha com resultados, classificação e estatísticas.
                    </p>
                  ) : null}
                </div>
              ) : null}
              {boards[0] ? (
                <div>
                  <SectionTitle href={`${base}?aba=estatisticas`} label="Todas">
                    Destaques
                  </SectionTitle>
                  <StatBoardCard board={{ ...boards[0], leaders: boards[0].leaders.slice(0, 5) }} competitionName={competition.name} />
                </div>
              ) : null}
            </div>

            {articles.length > 0 ? (
              <section>
                <SectionTitle>Cobertura</SectionTitle>
                <ul className="space-y-2">
                  {articles.map((article) => (
                    <li key={article.slug}>
                      <Link href={`/noticias/${article.slug}`} className="text-sm text-mist-300 underline decoration-line underline-offset-4 hover:text-flood-300">
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {fixtures.length === 0 && tables.length === 0 && boards.length === 0 ? (
              <EmptyState
                title="Sem dados no momento"
                description={
                  isRacing
                    ? "Esta competição não tem etapas nas últimas três semanas nem nos próximos dias, e ainda não há classificação publicada."
                    : "Esta competição não tem jogos nas últimas três semanas nem nos próximos dias, e ainda não há tabela publicada."
                }
              />
            ) : null}
          </>
        ) : null}

        {/* ------------------------------------------------------ Tabela */}
        {tab === "tabela" ? (
          tables.length > 0 ? (
            <>
              <div className="space-y-8">
                {tables.map((table) => (
                  <section key={table.group ?? "geral"}>
                    {table.group ? <SectionTitle>{table.group}</SectionTitle> : null}
                    <StandingsTable table={table} />
                  </section>
                ))}
              </div>
              {isRacing ? (
                <p className="text-xs text-mist-500">
                  Cada linha abre a ficha do piloto ou do construtor, com a campanha completa e o histórico na Fórmula 1.
                </p>
              ) : null}
            </>
          ) : (
            <EmptyState title="Sem tabela" description="Esta competição não tem classificação publicada (copas em mata-mata não têm tabela)." />
          )
        ) : null}

        {/* ------------------------------------------------------- Jogos */}
        {tab === "jogos" ? (
          fixtures.length > 0 ? (
            <div className="grid gap-8 xl:grid-cols-2">
              {upcoming.length > 0 ? (
                <div>
                  <SectionTitle href={`/calendario?competicao=${slug}`} label="Calendário completo">
                    {isRacing ? "Próximas etapas" : "Próximos jogos"}
                  </SectionTitle>
                  <FixtureList fixtures={upcoming.slice(0, 30)} racing={isRacing} />
                </div>
              ) : null}
              {results.length > 0 ? (
                <div>
                  <SectionTitle>Resultados</SectionTitle>
                  <FixtureList fixtures={results} racing={isRacing} />
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState
              title={isRacing ? "Sem etapas" : "Sem jogos"}
              description={
                isRacing
                  ? "Nenhuma etapa desta competição nas últimas três semanas ou nos próximos dias."
                  : "Nenhum jogo desta competição nas últimas três semanas ou nos próximos dias."
              }
            />
          )
        ) : null}

        {/* ------------------------------------------------ Estatísticas */}
        {tab === "estatisticas" ? (
          boards.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {boards.map((board) => (
                <StatBoardCard key={board.metric} board={board} competitionName={competition.name} />
              ))}
            </div>
          ) : isRacing && (driverTable || constructorTable) ? (
            <div className="space-y-6">
              <p className="max-w-2xl text-sm text-mist-400">
                A temporada em números. Cada cartão abre a ficha completa, com resultados etapa a etapa,
                classificação e histórico na Fórmula 1.
              </p>
              <RacingDirectory drivers={driverTable} constructors={constructorTable} />
            </div>
          ) : (
            <EmptyState title="Sem estatísticas" description="Esta competição ainda não tem quadros de líderes publicados." />
          )
        ) : null}

        {/* ------------------------------------------------------- Times */}
        {tab === "times" ? (
          teamList.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {teamList.map((team) => (
                <li key={team.id}>
                  <Link
                    href={`/times/${slug}/${team.id}`}
                    className="scoreboard card-lift flex h-full flex-col items-center gap-3 p-5 text-center shadow-card"
                  >
                    <TeamCrest url={team.crest} name={team.name} size={56} />
                    <span className="font-display text-base font-bold leading-tight text-mist-100">{team.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Sem times" description="Os times aparecem quando a tabela ou os jogos desta competição forem coletados." />
          )
        ) : null}
      </Container>
    </>
  );
}
