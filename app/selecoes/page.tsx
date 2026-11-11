import type { Metadata } from "next";

import { CrestTile } from "@/components/sports/crest-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { getNationalTeams } from "@/lib/directory";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Seleções",
  description: "As 48 seleções da Copa do Mundo, com bandeira, elenco com fotos e jogos.",
  path: "/selecoes",
});

export default async function NationalTeamsPage() {
  const teams = await getNationalTeams();
  const brazil = teams.find((team) => team.name === "Brasil");
  const others = teams.filter((team) => team !== brazil);

  return (
    <>
      <PageHeader
        section="/selecoes"
        title="Seleções"
        description="As seleções da Copa do Mundo. Abra uma seleção para ver os convocados com fotos, os jogos e os resultados."
      />

      <Container className="py-10 sm:py-12">
        {teams.length === 0 ? (
          <EmptyState
            title="A lista de seleções não carregou"
            description="A lista vem da ESPN e é atualizada uma vez por dia. Recarregue a página em alguns minutos."
            action={{ label: "Ver os times", href: "/times" }}
          />
        ) : (
          <>
            {brazil ? (
              <div className="mb-8 max-w-sm">
                <CrestTile href={brazil.href} name="Seleção Brasileira" image={brazil.crest} detail="Convocados, jogos e resultados" round />
              </div>
            ) : null}
            <h2 className="mb-4 border-b border-line pb-3 font-display text-[1.75rem] font-extrabold leading-none text-mist-50">
              Todas as seleções <span className="score text-base text-mist-500">{teams.length}</span>
            </h2>
            <ul className="grid gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6">
              {others.map((team) => (
                <li key={team.id}>
                  <CrestTile href={team.href} name={team.name} image={team.crest} round />
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-mist-500">Fonte: ESPN.</p>
          </>
        )}
      </Container>
    </>
  );
}
