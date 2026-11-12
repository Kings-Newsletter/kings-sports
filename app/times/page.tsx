import type { Metadata } from "next";
import Link from "next/link";

import { CompetitionLogo } from "@/components/sports/competition-logo";
import { CrestTile } from "@/components/sports/crest-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { getCatalogEntry } from "@/lib/catalog";
import { getTeamsByCompetition } from "@/lib/directory";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Times",
  description: "Todos os times das ligas acompanhadas, com escudo, elenco, jogos e campanha.",
  path: "/times",
});

export default async function TeamsPage() {
  const groups = await getTeamsByCompetition();

  return (
    <>
      <PageHeader
        section="/times"
        title="Times"
        description="Os clubes de cada liga acompanhada. Abra um time para ver elenco com fotos, próximos jogos, resultados e a posição na tabela."
      >
        {groups.length > 1 ? (
          <nav aria-label="Ir para a liga" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {groups.map((group) => (
              <a
                key={group.competition}
                href={`#liga-${group.competition}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-[6px] border border-line bg-ink-850 px-3 py-1.5 text-sm text-mist-300 hover:text-mist-50"
              >
                <CompetitionLogo slug={group.competition} size={18} className="!bg-transparent !ring-0" />
                {getCatalogEntry(group.competition)?.shortName ?? group.competition}
              </a>
            ))}
          </nav>
        ) : null}
      </PageHeader>

      <Container className="space-y-14 py-10 sm:py-12">
        {groups.length === 0 ? (
          <EmptyState
            title="Nenhum time carregado ainda"
            description="Os times aparecem aqui quando a coleta traz as tabelas das ligas."
            action={{ label: "Ver as seleções", href: "/selecoes" }}
          />
        ) : (
          groups.map((group) => {
            const entry = getCatalogEntry(group.competition);
            return (
              <section key={group.competition} id={`liga-${group.competition}`} className="scroll-mt-36">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                  <h2 className="flex items-center gap-3 font-display text-[1.75rem] font-extrabold leading-none text-mist-50">
                    <CompetitionLogo slug={group.competition} size={34} />
                    {entry?.name ?? group.competition}
                    <span className="score text-base text-mist-500">{group.teams.length}</span>
                  </h2>
                  <Link
                    href={`/competicoes/${group.competition}`}
                    className="-my-2 py-2 text-sm font-medium text-flood-300 underline decoration-flood-500/40 underline-offset-4 hover:text-flood-400"
                  >
                    Tabela e jogos
                  </Link>
                </div>
                <ul className="grid gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {group.teams.map((team) => (
                    <li key={team.id}>
                      <CrestTile href={team.href} name={team.name} image={team.crest} detail={team.position ? `${team.position}º na tabela` : undefined} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </Container>
    </>
  );
}
