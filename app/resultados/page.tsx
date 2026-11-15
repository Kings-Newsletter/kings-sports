import type { Metadata } from "next";

import { DayRail } from "@/components/sports/day-rail";
import { FixtureGroups } from "@/components/sports/fixture-groups";
import { SportFilter } from "@/components/sports/sport-filter";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { getRecentResults } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { toLocalYmd } from "@/lib/dates";
import { getSport } from "@/lib/sports";
import type { Fixture } from "@/lib/types";

type SearchParams = Promise<{ sport?: string }>;

/** Agrupa por dia de Brasília, do mais recente para o mais antigo. */
function byDay(fixtures: Fixture[]): [string, Fixture[]][] {
  const days = new Map<string, Fixture[]>();
  for (const fixture of fixtures) {
    const day = toLocalYmd(fixture.kickoff);
    days.set(day, [...(days.get(day) ?? []), fixture]);
  }
  return [...days.entries()];
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { sport } = await searchParams;
  const current = getSport(sport);
  const racing = current?.slug === "automobilismo";
  return buildMetadata({
    title: current ? `Resultados de ${current.name}` : "Resultados",
    description: racing
      ? "Resultados encerrados do automobilismo, com status explícito e horário de atualização."
      : "Resultados encerrados, com status explícito e horário de atualização.",
    path: current ? `/resultados?sport=${current.slug}` : "/resultados",
  });
}

export default async function ResultsPage({ searchParams }: { searchParams: SearchParams }) {
  const { sport } = await searchParams;
  const current = getSport(sport);
  const racing = current?.slug === "automobilismo";

  const finished = await getRecentResults(120, sport);

  return (
    <Container>
      <PageHeader
        section="/resultados"
        title={current ? `Resultados de ${current.name}` : "Resultados"}
        description={
          racing
            ? "Cada etapa carrega status, horário de início e resultado. Sem fonte, não há resultado publicado."
            : "Cada partida carrega status, horário de início e placar. Sem fonte, não há resultado publicado."
        }
      >
        <SportFilter basePath="/resultados" active={sport} />
      </PageHeader>

      <div className="space-y-10 py-10 sm:py-12">
        <section>
          <h2 className="mb-4 font-display text-lg font-bold text-mist-50">Últimos resultados</h2>
          {finished.length > 0 ? (
            <div>
              {byDay(finished).map(([day, list]) => (
                <DayRail key={day} ymd={day} count={list.length}>
                  <FixtureGroups fixtures={list} />
                </DayRail>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sem resultados registrados"
              description="Os placares chegam pela coleta automática, com a fonte indicada. Nenhum resultado é digitado ou estimado."
            />
          )}
        </section>
      </div>
    </Container>
  );
}
