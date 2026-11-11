import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { getCompetitions, getStandings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { getSport } from "@/lib/sports";
import { SportIcon } from "@/components/ui/sport-icon";
import { CompetitionLogo } from "@/components/sports/competition-logo";

export const metadata: Metadata = buildMetadata({
  title: "Competições",
  description: "Ligas, copas e torneios acompanhados pelo King's Sports, por modalidade.",
  path: "/competicoes",
});

export default async function CompetitionsPage() {
  const [competitions, tables] = await Promise.all([getCompetitions(), getStandings()]);
  const withTable = new Set(tables.map((table) => table.competition));

  const grouped = new Map<string, typeof competitions>();
  for (const competition of competitions) {
    const key = competition.sport;
    grouped.set(key, [...(grouped.get(key) ?? []), competition]);
  }

  return (
    <Container>
      <PageHeader
        section="/competicoes"
        title="Competições"
        description="Cada competição reúne agenda, tabela e estatísticas. Só entra no acervo quando a fonte oficial está definida."
      />

      <div className="space-y-10 py-10 sm:py-12">
        {competitions.length > 0 ? (
          Array.from(grouped.entries()).map(([sportSlug, items]) => {
            const sport = getSport(sportSlug);
            return (
              <section key={sportSlug}>
                <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-flood-400">
                  <SportIcon sport={sportSlug} className="size-4" />
                  {sport?.name ?? sportSlug}
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((competition) => (
                    <li key={competition.slug}>
                      <Link
                        href={`/competicoes/${competition.slug}`}
                        className="scoreboard card-lift group flex h-full items-center gap-4 p-4 shadow-card"
                      >
                        <CompetitionLogo slug={competition.slug} size={56} />
                        <span className="min-w-0">
                          <span className="block text-[0.8125rem] text-mist-500">
                            {competition.country ?? competition.scope ?? "competição"}
                          </span>
                          <span className="mt-1 block font-display text-lg font-bold leading-tight text-mist-100 group-hover:text-flood-300">
                            {competition.name}
                          </span>
                          <span className="mt-0.5 block text-xs text-mist-500">
                            {competition.sport === "automobilismo"
                              ? withTable.has(competition.slug)
                                ? "Classificação, etapas e estatísticas"
                                : "Etapas e estatísticas"
                              : withTable.has(competition.slug)
                                ? "Tabela, jogos e estatísticas"
                                : "Jogos e estatísticas"}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        ) : (
          <EmptyState
            title="Nenhuma competição no acervo"
            description="Cadastre as competições acompanhadas para habilitar agenda, tabela e estatísticas por torneio."
          />
        )}
      </div>
    </Container>
  );
}
