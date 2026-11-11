import type { Metadata } from "next";
import Link from "next/link";

import { StatBoardCard } from "@/components/sports/stat-board-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { SportIcon } from "@/components/ui/sport-icon";
import { catalog } from "@/lib/catalog";
import { getStatBoards } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { getSport, sports } from "@/lib/sports";

type SearchParams = Promise<{ sport?: string; competition?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { sport } = await searchParams;
  const current = getSport(sport);
  return buildMetadata({
    title: current ? `Estatísticas de ${current.name}` : "Estatísticas",
    description: "Artilharia, assistências e líderes por fundamento, com foto, fonte e temporada.",
    path: current ? `/estatisticas?sport=${current.slug}` : "/estatisticas",
  });
}

function chip(active: boolean) {
  return `inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] border px-3 py-1.5 text-sm font-medium transition-colors ${
    active ? "border-flood-500/70 bg-flood-500/15 text-flood-300" : "border-line bg-ink-850 text-mist-400 hover:text-mist-100"
  }`;
}

export default async function StatsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const all = await getStatBoards();
  const sportsWithStats = sports.filter((sport) => all.some((board) => board.sport === sport.slug));
  const sport = sportsWithStats.find((item) => item.slug === params.sport)?.slug ?? sportsWithStats[0]?.slug;
  const ofSport = all.filter((board) => board.sport === sport);
  const competitions = catalog.filter((entry) => ofSport.some((board) => board.competition === entry.slug));
  const competition = competitions.find((entry) => entry.slug === params.competition)?.slug ?? competitions[0]?.slug;
  const boards = ofSport.filter((board) => board.competition === competition);
  const name = (slug: string) => catalog.find((entry) => entry.slug === slug)?.name ?? slug;

  return (
    <Container>
      <PageHeader
        section="/estatisticas"
        title="Estatísticas"
        description="Artilharia, assistências e líderes por fundamento. Cada quadro indica a competição, a temporada e a fonte."
      >
        {sportsWithStats.length > 0 ? (
          <div className="space-y-3">
            <nav aria-label="Esporte" className="no-scrollbar flex gap-2 overflow-x-auto">
              {sportsWithStats.map((item) => (
                <Link key={item.slug} href={`/estatisticas?sport=${item.slug}`} className={chip(item.slug === sport)}>
                  <SportIcon sport={item.slug} className="size-4" />
                  {item.name}
                </Link>
              ))}
            </nav>
            {competitions.length > 1 ? (
              <nav aria-label="Competição" className="no-scrollbar flex gap-2 overflow-x-auto">
                {competitions.map((entry) => (
                  <Link
                    key={entry.slug}
                    href={`/estatisticas?sport=${sport}&competition=${entry.slug}`}
                    className={chip(entry.slug === competition)}
                  >
                    {entry.shortName ?? entry.name}
                  </Link>
                ))}
              </nav>
            ) : null}
          </div>
        ) : null}
      </PageHeader>

      <div className="py-10 sm:py-12">
        {boards.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {boards.map((board) => (
              <StatBoardCard key={`${board.competition}-${board.metric}`} board={board} competitionName={name(board.competition)} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhum quadro estatístico"
            description="Os números chegam pela coleta diária, com competição, temporada e fonte ao lado de cada quadro."
          />
        )}
      </div>
    </Container>
  );
}
