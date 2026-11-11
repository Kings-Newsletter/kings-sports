import type { Metadata } from "next";

import { DayRail } from "@/components/sports/day-rail";
import { FixtureGroups } from "@/components/sports/fixture-groups";
import { SportFilter } from "@/components/sports/sport-filter";
import { EmptyState } from "@/components/ui/empty-state";
import { Container, LiveDot } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { getFixtures, getRecentResults } from "@/lib/data";
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
      ? "Etapas ao vivo e resultados encerrados do automobilismo, com status explícito e horário de atualização."
      : "Placares ao vivo e resultados encerrados, com status explícito e horário de atualização.",
    path: current ? `/resultados?sport=${current.slug}` : "/resultados",
  });
}

export default async function ResultsPage({ searchParams }: { searchParams: SearchParams }) {
  const { sport } = await searchParams;
  const current = getSport(sport);
  const racing = current?.slug === "automobilismo";

  const [live, finished] = await Promise.all([
    getFixtures({ sport, status: "live" }),
    getRecentResults(120, sport),
  ]);

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
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-mist-50">
            {live.length > 0 ? <LiveDot /> : null}
            Ao vivo
            {live.length > 0 ? (
              <span className="rounded-full bg-live-500/15 px-2 py-0.5 text-xs font-semibold text-live-400">
                {live.length}
              </span>
            ) : null}
          </h2>
          {live.length > 0 ? (
            <FixtureGroups fixtures={live} />
          ) : (
            <EmptyState
              compact
              title={racing ? "Nenhuma etapa em andamento" : "Nenhuma partida em andamento"}
              description={
                racing
                  ? "Quando houver etapa ao vivo, o tempo de sessão e o resultado aparecem aqui e na faixa superior do site."
                  : "Quando houver cobertura ao vivo, o placar é atualizado aqui e na faixa superior do site."
              }
            />
          )}
        </section>

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
