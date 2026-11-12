import type { Metadata } from "next";
import Link from "next/link";

import { CompetitionLogo } from "@/components/sports/competition-logo";
import { PersonCard } from "@/components/sports/person-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { getCatalogEntry } from "@/lib/catalog";
import { getFeaturedPlayers } from "@/lib/directory";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Jogadores",
  description: "Os jogadores que lideram as estatísticas de cada liga, com foto, time e ficha completa.",
  path: "/jogadores",
});

export default async function PlayersPage() {
  const groups = await getFeaturedPlayers();

  return (
    <>
      <PageHeader
        section="/jogadores"
        title="Jogadores"
        description="Quem lidera as estatísticas de cada liga. Abra um jogador para ver a temporada, os últimos jogos e o próximo compromisso."
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
            title="Nenhum jogador em destaque ainda"
            description="Os jogadores aparecem aqui quando a coleta traz as estatísticas das ligas. Veja enquanto isso as tabelas e os times."
            action={{ label: "Ver os times", href: "/times" }}
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
                  </h2>
                  <Link
                    href={`/estatisticas?competition=${group.competition}`}
                    className="-my-2 py-2 text-sm font-medium text-flood-300 underline decoration-flood-500/40 underline-offset-4 hover:text-flood-400"
                  >
                    Todas as estatísticas
                  </Link>
                </div>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
                  {group.players.map((player) => (
                    <li key={player.id}>
                      <PersonCard
                        href={player.href}
                        name={player.name}
                        photo={player.photo}
                        team={player.team}
                        crest={player.crest}
                        stat={player.stat}
                        commons={player.commons}
                      />
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
