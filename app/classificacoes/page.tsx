import type { Metadata } from "next";
import Link from "next/link";

import { StandingsTable } from "@/components/sports/standings-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { getCompetitions, getStandings } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";
import { getSport } from "@/lib/sports";
import { CompetitionLogo } from "@/components/sports/competition-logo";

type SearchParams = Promise<{ competition?: string }>;

export const metadata: Metadata = buildMetadata({
  title: "Classificações",
  description:
    "Tabelas de classificação por competição, com pontos, jogos, saldo e últimos resultados.",
  path: "/classificacoes",
});

export default async function StandingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { competition } = await searchParams;
  const [tables, competitions] = await Promise.all([getStandings(competition), getCompetitions()]);
  const competitionBySlug = new Map(competitions.map((item) => [item.slug, item]));

  return (
    <Container>
      <PageHeader
        section="/classificacoes"
        title="Classificações"
        description="Dados oficiais da competição, com data da última atualização. Critérios de desempate seguem o regulamento de cada torneio."
      >
        {competitions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/classificacoes"
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${
                !competition
                  ? "border-flood-500/60 bg-flood-500/15 text-flood-300"
                  : "border-line text-mist-400 hover:text-mist-100"
              }`}
            >
              Todas
            </Link>
            {competitions.map((item) => (
              <Link
                key={item.slug}
                href={`/classificacoes?competition=${item.slug}`}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${
                  competition === item.slug
                    ? "border-flood-500/60 bg-flood-500/15 text-flood-300"
                    : "border-line text-mist-400 hover:text-mist-100"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        ) : null}
      </PageHeader>

      <div className="space-y-10 py-10 sm:py-12">
        {tables.length > 0 ? (
          tables.map((table) => {
            const meta = competitionBySlug.get(table.competition);
            const sport = getSport(meta?.sport);
            return (
              <section key={`${table.competition}-${table.group ?? "geral"}`}>
                <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <CompetitionLogo slug={table.competition} size={40} />
                    <div>
                      <p className="kicker">{sport?.name ?? "Competição"}</p>
                      <h2 className="mt-1 font-display text-2xl font-extrabold leading-none text-mist-50">
                        <Link href={`/competicoes/${table.competition}`} className="hover:text-flood-300">
                          {meta?.name ?? table.competition}
                        </Link>
                        {table.group ? <span className="text-mist-400">{` — ${table.group}`}</span> : null}
                      </h2>
                    </div>
                  </div>
                  <p className="text-xs text-mist-500">
                    Temporada {table.season}, atualizado em {formatDate(table.updatedAt)}
                  </p>
                </header>
                <StandingsTable table={table} />
              </section>
            );
          })
        ) : (
          <EmptyState
            title="Nenhuma classificação publicada"
            description="As tabelas chegam pela coleta diária, com fonte e hora da atualização. Pontos, saldo e sequência vêm do provedor, nunca são estimados."
          />
        )}
      </div>
    </Container>
  );
}
