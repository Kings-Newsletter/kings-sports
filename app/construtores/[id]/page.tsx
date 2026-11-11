import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CompetitionLogo } from "@/components/sports/competition-logo";
import { Container } from "@/components/ui/icons";
import {
  f1PositionLabel,
  getF1ConstructorProfile,
  nationalityLabel,
  type F1ConstructorProfile,
} from "@/lib/f1-profiles";
import { formatShortDate } from "@/lib/format";
import { carImage } from "@/lib/f1-media";
import { buildMetadata } from "@/lib/seo";
import { driverHref } from "@/lib/slugs";

type Params = Promise<{ id: string }>;

const COMPETITION = "formula-1";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const team = await getF1ConstructorProfile(id);
  return buildMetadata({
    title: team ? `${team.name} — Fórmula 1` : "Construtor",
    description: team
      ? `${team.name}: posição no campeonato de construtores, pontos, vitórias, pilotos e resultados da temporada ${team.season}.`
      : "Estatísticas de construtor da Fórmula 1.",
    path: `/construtores/${id}`,
  });
}

function Fact({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === "") return null;
  return (
    <div>
      <dt className="text-[0.8125rem] font-medium text-mist-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-mist-100">{value}</dd>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="scoreboard p-4 shadow-card">
      <p className="text-[0.8125rem] font-medium text-mist-500">{label}</p>
      <p className="score mt-1 text-4xl leading-none text-mist-50">{value}</p>
      {hint ? <p className="mt-1.5 text-xs text-mist-500">{hint}</p> : null}
    </div>
  );
}

function number(value?: number): string {
  return value === undefined ? "–" : value.toLocaleString("pt-BR");
}

/** "Mercedes" → "MER", "Red Bull" → "RB". Marca visual sem logo do provedor. */
function teamMark(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return words
      .map((word) => word[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();
  }
  return name.slice(0, 3).toUpperCase();
}

function ResultsTable({ team }: { team: F1ConstructorProfile }) {
  if (team.seasonResults.length === 0) return null;
  return (
    <div className="scoreboard overflow-x-auto shadow-card">
      <table className="w-full min-w-[42rem] text-sm">
        <thead>
          <tr className="border-b border-line-soft font-display text-[0.8125rem] text-mist-500">
            <th scope="col" className="px-4 py-2.5 text-left font-bold">Etapa</th>
            <th scope="col" className="px-2 py-2.5 text-left font-bold">Pilotos</th>
            <th scope="col" className="px-2 py-2.5 text-center font-bold">Melhor</th>
            <th scope="col" className="px-2 py-2.5 text-center font-bold">Pontos</th>
          </tr>
        </thead>
        <tbody>
          {team.seasonResults.map((result) => (
            <tr key={result.round} className="border-b border-line-soft/60 last:border-b-0">
              <th scope="row" className="px-4 py-2.5 text-left font-medium text-mist-100">
                <span className="block truncate">{result.raceName}</span>
                <span className="block text-xs font-normal text-mist-500">
                  {result.round}ª etapa, {formatShortDate(result.date)}
                </span>
              </th>
              <td className="px-2 py-2.5">
                <ul className="space-y-0.5">
                  {result.drivers.map((driver) => (
                    <li key={driver.id} className="flex items-baseline gap-2 text-xs">
                      <span className="score w-6 text-right text-sm text-mist-200">
                        {f1PositionLabel(driver.position)}
                      </span>
                      <Link
                        href={driverHref({ team: driver.name, driverId: driver.id })}
                        className="truncate text-mist-300 hover:text-flood-300"
                      >
                        {driver.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </td>
              <td className="score px-2 py-2.5 text-center text-base text-mist-200">
                {result.best !== undefined ? `${result.best}º` : "–"}
              </td>
              <td className="score px-2 py-2.5 text-center text-base text-mist-200">{result.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ConstructorPage({ params }: { params: Params }) {
  const { id } = await params;
  const team = await getF1ConstructorProfile(id);
  if (!team) notFound();
  const car = carImage(team.id);

  const color = team.color;
  const podiums =
    team.seasonResults.length > 0
      ? team.seasonResults.filter(
          (result) => result.best !== undefined && result.best >= 1 && result.best <= 3,
        ).length
      : undefined;

  return (
    <>
      <section className="border-b border-line-soft bg-[radial-gradient(60rem_22rem_at_20%_0%,rgb(37_99_235_/_0.16),transparent_70%)]">
        <Container className="py-8 sm:py-12">
          <nav className="mb-6 flex items-center gap-2 text-sm text-mist-400">
            <CompetitionLogo slug={COMPETITION} size={22} />
            <Link href={`/competicoes/${COMPETITION}`} className="hover:text-flood-300">
              Fórmula 1
            </Link>
            <span aria-hidden="true">/</span>
            <Link href={`/competicoes/${COMPETITION}?aba=tabela`} className="hover:text-flood-300">
              Construtores
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-mist-200">{team.name}</span>
          </nav>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <span
              className="grid size-24 shrink-0 place-items-center rounded-[8px] font-display text-3xl font-extrabold uppercase text-ink-950 sm:size-32 sm:text-4xl"
              style={{ backgroundColor: color ? `#${color}` : "#334155" }}
              aria-hidden="true"
            >
              {teamMark(team.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="kicker">
                {[nationalityLabel(team.nationality), team.standing?.position ? `${team.standing.position}º no campeonato` : null]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <h1 className="mt-2 font-display text-[clamp(2.4rem,6vw,4.2rem)] font-extrabold leading-[0.95] text-mist-50">
                {team.name}
              </h1>
              <p className="mt-2 text-base text-mist-300">Temporada {team.season}</p>
            </div>
          </div>

          {car ? (
            <figure
              className="mt-8 overflow-hidden rounded-[10px] border border-line-soft"
              style={{ backgroundImage: `radial-gradient(60% 80% at 50% 70%, ${color ? `#${color}33` : "rgb(37 99 235 / 0.2)"}, transparent 70%)` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={car}
                alt={`O carro da ${team.name} na temporada ${team.season}`}
                className="mx-auto aspect-[21/8] w-full max-w-5xl object-contain px-4 py-6"
              />
              <figcaption className="flex items-center gap-2 border-t border-line-soft px-4 py-2.5 text-sm text-mist-300">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: color ? `#${color}` : "#2563eb" }} aria-hidden="true" />
                <span className="font-display text-base font-bold text-mist-50">O carro de {team.season}</span>
              </figcaption>
            </figure>
          ) : null}

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <Fact label="Posição" value={team.standing ? `${team.standing.position}º` : undefined} />
            <Fact label="Pontos" value={team.standing?.points !== undefined ? number(team.standing.points) : undefined} />
            <Fact label="Vitórias" value={team.standing?.wins !== undefined ? number(team.standing.wins) : undefined} />
            <Fact label="Nacionalidade" value={nationalityLabel(team.nationality)} />
          </dl>
        </Container>
      </section>

      <Container className="space-y-10 py-10 sm:py-12">
        <section>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl font-extrabold text-mist-50">Na temporada</h2>
            <span className="text-xs text-mist-500">Fórmula 1 {team.season}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Posição" value={team.standing ? `${team.standing.position}º` : "–"} hint="entre construtores" />
            <StatCard label="Pontos" value={number(team.standing?.points)} hint="na classificação" />
            <StatCard label="Vitórias" value={number(team.standing?.wins)} hint="na temporada" />
            <StatCard label="Etapas no pódio" value={number(podiums)} hint="com ao menos um carro no top 3" />
          </div>
        </section>

        {team.drivers.length > 0 ? (
          <section>
            <h2 className="mb-4 font-display text-2xl font-extrabold text-mist-50">Pilotos</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {team.drivers.map((driver) => (
                <li key={driver.id}>
                  <Link
                    href={driverHref({ team: driver.name, driverId: driver.id })}
                    className="scoreboard card-lift flex items-center gap-3 p-4 shadow-card"
                  >
                    <span
                      className="score grid size-12 shrink-0 place-items-center rounded-[6px] bg-ink-800 text-lg font-bold text-mist-100"
                      style={color ? { boxShadow: `inset 0 -3px 0 #${color}` } : undefined}
                    >
                      {driver.number ?? driver.code ?? "–"}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-base font-bold text-mist-100">
                        {driver.name}
                      </span>
                      <span className="block text-xs text-mist-500">
                        {[driver.code, driver.number ? `#${driver.number}` : null].filter(Boolean).join(", ")}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {team.career ? (
          <section>
            <h2 className="mb-4 font-display text-2xl font-extrabold text-mist-50">História na F1</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              <StatCard
                label="Temporadas"
                value={number(team.career.seasons)}
                hint={team.seasons.length > 0 ? `na F1 desde ${Math.min(...team.seasons.map(Number))}` : undefined}
              />
              <StatCard label="Corridas" value={number(team.career.races)} />
              <StatCard label="Vitórias" value={number(team.career.wins)} />
              <StatCard label="Pódios" value={number(team.career.podiums)} />
              <StatCard label="Pontos" value={number(team.career.points)} />
            </div>
          </section>
        ) : null}

        <section>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl font-extrabold text-mist-50">Resultados</h2>
            <Link
              href={`/competicoes/${COMPETITION}?aba=etapas`}
              className="text-xs font-medium text-mist-500 hover:text-flood-300"
            >
              Calendário da temporada
            </Link>
          </div>
          {team.seasonResults.length > 0 ? (
            <ResultsTable team={team} />
          ) : (
            <p className="text-sm text-mist-400">
              {team.resultsUnavailable
                ? "Resultados indisponíveis no momento."
                : "Nenhum resultado publicado para esta temporada."}
            </p>
          )}
        </section>

        <p className="text-xs text-mist-600">
          Fonte:{" "}
          <a href="https://api.jolpi.ca" className="hover:text-mist-400" rel="noreferrer noopener" target="_blank">
            Jolpica
          </a>{" "}
          (resultados e classificação) e{" "}
          <a href="https://openf1.org" className="hover:text-mist-400" rel="noreferrer noopener" target="_blank">
            OpenF1
          </a>{" "}
          (cor da equipe).
        </p>
      </Container>
    </>
  );
}
