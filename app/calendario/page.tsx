import type { Metadata } from "next";
import Link from "next/link";

import { CompetitionLogo } from "@/components/sports/competition-logo";
import { DayRail } from "@/components/sports/day-rail";
import { FixtureGroups } from "@/components/sports/fixture-groups";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/icons";
import { LinkPending } from "@/components/ui/link-pending";
import { PageHeader } from "@/components/ui/page-header";
import { SportIcon } from "@/components/ui/sport-icon";
import { catalog } from "@/lib/catalog";
import { getFixtures } from "@/lib/data";
import { localDayBounds, toLocalYmd } from "@/lib/dates";
import { buildMetadata } from "@/lib/seo";
import { getSport, sports } from "@/lib/sports";
import type { Fixture } from "@/lib/types";

type SearchParams = Promise<{ mes?: string; esporte?: string; competicao?: string }>;

const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

function parseMonth(value: string | undefined): string {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : toLocalYmd().slice(0, 7);
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { esporte } = await searchParams;
  const current = getSport(esporte);
  return buildMetadata({
    title: current ? `Calendário de ${current.name}` : "Calendário",
    description: "Calendário completo da temporada, mês a mês: jogos, corridas e resultados, em horário de Brasília.",
    path: "/calendario",
  });
}

export default async function CalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const month = parseMonth(params.mes);
  const competition = catalog.find((entry) => entry.slug === params.competicao);
  const sport = competition?.sport ?? (getSport(params.esporte)?.covered ? params.esporte : undefined);

  const from = localDayBounds(`${month}-01`).from;
  const to = localDayBounds(`${shiftMonth(month, 1)}-01`).from;
  const fixtures = await getFixtures({ from, to, sport, competition: competition?.slug });

  const byDay = new Map<string, Fixture[]>();
  for (const fixture of fixtures) {
    const day = toLocalYmd(fixture.kickoff);
    byDay.set(day, [...(byDay.get(day) ?? []), fixture]);
  }
  const today = toLocalYmd();

  const href = (changes: { mes?: string; esporte?: string | null; competicao?: string | null }) => {
    const next = new URLSearchParams();
    const m = changes.mes ?? month;
    if (m !== today.slice(0, 7)) next.set("mes", m);
    const s = changes.esporte === null ? undefined : (changes.esporte ?? (competition ? undefined : sport));
    const c = changes.competicao === null ? undefined : (changes.competicao ?? competition?.slug);
    if (c) next.set("competicao", c);
    else if (s) next.set("esporte", s);
    const query = next.toString();
    return query ? `/calendario?${query}` : "/calendario";
  };

  const chip = (active: boolean) =>
    `inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[4px] border px-3 py-1.5 text-sm font-medium transition-colors ${
      active ? "border-flood-500/70 bg-flood-500/15 text-flood-300" : "border-line bg-ink-850 text-mist-400 hover:text-mist-100"
    }`;
  const covered = sports.filter((item) => item.covered);
  const competitionsOfSport = sport ? catalog.filter((entry) => entry.sport === sport) : [];

  return (
    <Container>
      <PageHeader
        section="/calendario"
        title="Calendário"
        description="A temporada inteira, mês a mês: jogos, corridas e resultados de todas as competições acompanhadas. Horários de Brasília."
      >
        <div className="space-y-3">
          <nav aria-label="Esporte" className="no-scrollbar flex gap-2 overflow-x-auto">
            <Link href={href({ esporte: null, competicao: null })} className={chip(!sport)}>
              <SportIcon sport="todos" className="size-4" />
              Todos
            </Link>
            {covered.map((item) => (
              <Link key={item.slug} href={href({ esporte: item.slug, competicao: null })} className={chip(sport === item.slug && !competition)}>
                <SportIcon sport={item.slug} className="size-4" />
                {item.name}
              </Link>
            ))}
          </nav>
          {competitionsOfSport.length > 1 ? (
            <nav aria-label="Competição" className="no-scrollbar flex gap-2 overflow-x-auto">
              {competitionsOfSport.map((entry) => (
                <Link
                  key={entry.slug}
                  href={href({ competicao: competition?.slug === entry.slug ? null : entry.slug, esporte: entry.sport })}
                  className={chip(competition?.slug === entry.slug)}
                >
                  <CompetitionLogo slug={entry.slug} size={18} className="!bg-transparent !ring-0" />
                  {entry.shortName ?? entry.name}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </PageHeader>

      {/* Navegação por mês */}
      <div className="sticky top-[4.05rem] z-30 xl:top-[7.2rem] -mx-4 flex items-center justify-between gap-2 border-b border-line-soft bg-ink-950/90 px-4 py-3 backdrop-blur sm:mx-0 sm:gap-3 sm:px-0">
        <Link href={href({ mes: shiftMonth(month, -1) })} aria-label={`Mês anterior: ${monthName.format(new Date(`${shiftMonth(month, -1)}-15T12:00:00Z`))}`} className="shrink-0 rounded-[4px] border border-line px-2.5 py-1.5 text-sm text-mist-300 hover:text-mist-50 sm:px-3">
          <LinkPending />
          <span aria-hidden="true" className="sm:hidden">‹</span>
          <span className="hidden sm:inline">‹ {monthName.format(new Date(`${shiftMonth(month, -1)}-15T12:00:00Z`))}</span>
        </Link>
        <div className="min-w-0 text-center">
          <p className="truncate font-display text-lg font-extrabold leading-none text-mist-50 sm:text-2xl">
            {capitalize(monthName.format(new Date(`${month}-15T12:00:00Z`)))}
          </p>
          <p className="mt-1 text-xs text-mist-500">
            {fixtures.length} {fixtures.length === 1 ? "evento" : "eventos"}
            {month !== today.slice(0, 7) ? (
              <>
                {", "}
                <Link href={href({ mes: today.slice(0, 7) })} className="text-flood-300 underline underline-offset-2">
                  voltar ao mês atual
                  <LinkPending />
                </Link>
              </>
            ) : null}
          </p>
        </div>
        <Link href={href({ mes: shiftMonth(month, 1) })} aria-label={`Próximo mês: ${monthName.format(new Date(`${shiftMonth(month, 1)}-15T12:00:00Z`))}`} className="shrink-0 rounded-[4px] border border-line px-2.5 py-1.5 text-sm text-mist-300 hover:text-mist-50 sm:px-3">
          <LinkPending />
          <span aria-hidden="true" className="sm:hidden">›</span>
          <span className="hidden sm:inline">{monthName.format(new Date(`${shiftMonth(month, 1)}-15T12:00:00Z`))} ›</span>
        </Link>
      </div>

      <div className="py-10">
        {byDay.size > 0 ? (
          [...byDay.entries()].map(([day, list]) => (
            <DayRail key={day} ymd={day} count={list.length} id={`dia-${day}`} stickyTop="top-[9rem] xl:top-[12.2rem]">
              <FixtureGroups fixtures={list} />
            </DayRail>
          ))
        ) : (
          <EmptyState
            title="Nenhum evento neste mês"
            description="Não há jogos nem corridas das competições acompanhadas neste mês com o filtro escolhido."
          />
        )}
      </div>
    </Container>
  );
}
