import type { Metadata } from "next";

import { PersonCard } from "@/components/sports/person-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { getDrivers } from "@/lib/directory";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Pilotos",
  description: "Os pilotos da Fórmula 1 na ordem do campeonato, com foto, equipe, pontos e ficha de carreira.",
  path: "/pilotos",
});

export default async function DriversPage() {
  const { season, drivers } = await getDrivers();
  const [leader] = drivers;

  return (
    <>
      <PageHeader
        section="/pilotos"
        title="Pilotos"
        description={`Fórmula 1${season ? `, temporada ${season}` : ""}: os pilotos na ordem do campeonato. Abra um piloto para ver resultados, carreira e temporadas.`}
      />

      <Container className="py-10 sm:py-12">
        {drivers.length === 0 ? (
          <EmptyState
            title="Classificação de pilotos ainda não coletada"
            description="Os pilotos aparecem aqui quando a coleta diária traz a classificação da Fórmula 1."
            action={{ label: "Ver o calendário da F1", href: "/competicoes/formula-1" }}
          />
        ) : (
          <>
            {leader ? (
              <p className="mb-6 text-mist-300">
                <span className="font-semibold text-mist-50">{leader.name}</span> lidera com{" "}
                <span className="score text-lg text-flood-300">{leader.points ?? 0}</span> pontos
                {drivers[1]?.points !== undefined && leader.points !== undefined
                  ? `, ${leader.points - drivers[1].points} à frente de ${drivers[1].name}.`
                  : "."}
              </p>
            ) : null}
            <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {drivers.map((driver) => (
                <li key={driver.href}>
                  <PersonCard
                    href={driver.href}
                    name={driver.name}
                    photo={driver.photo}
                    team={driver.team}
                    rank={driver.position}
                    stat={{ label: driver.wins ? `${driver.wins} ${driver.wins === 1 ? "vitória" : "vitórias"}` : "Pontos", value: String(driver.points ?? 0) }}
                  />
                </li>
              ))}
            </ol>
          </>
        )}
      </Container>
    </>
  );
}
