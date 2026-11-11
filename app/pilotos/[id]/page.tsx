import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AthletePhoto } from "@/components/sports/athlete-photo";
import { CompetitionLogo } from "@/components/sports/competition-logo";
import { Container } from "@/components/ui/icons";
import {
  f1PositionLabel,
  f1StatusLabel,
  getF1DriverProfile,
  nationalityLabel,
  type F1DriverProfile,
} from "@/lib/f1-profiles";
import { formatDate, formatShortDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";
import { constructorHref } from "@/lib/slugs";

type Params = Promise<{ id: string }>;

const COMPETITION = "formula-1";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const driver = await getF1DriverProfile(id);
  return buildMetadata({
    title: driver ? `${driver.name} — Fórmula 1` : "Piloto",
    description: driver
      ? `${driver.name}${driver.team ? ` (${driver.team.name})` : ""}: posição no campeonato, pontos, vitórias, pódios, resultados e classificação da temporada ${driver.season}.`
      : "Estatísticas de piloto da Fórmula 1.",
    path: `/pilotos/${id}`,
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

function ResultsTable({ driver }: { driver: F1DriverProfile }) {
  if (driver.seasonResults.length === 0) return null;
  return (
    <div className="scoreboard overflow-x-auto shadow-card">
      <table className="w-full min-w-[42rem] text-sm">
        <thead>
          <tr className="border-b border-line-soft font-display text-[0.8125rem] text-mist-500">
            <th scope="col" className="px-4 py-2.5 text-left font-bold">Etapa</th>
            <th scope="col" className="px-2 py-2.5 text-center font-bold">Grid</th>
            <th scope="col" className="px-2 py-2.5 text-center font-bold">Chegada</th>
            <th scope="col" className="px-2 py-2.5 text-center font-bold">Pontos</th>
            <th scope="col" className="px-2 py-2.5 text-left font-bold">Situação</th>
          </tr>
        </thead>
        <tbody>
          {driver.seasonResults.map((result) => (
            <tr key={result.round} className="border-b border-line-soft/60 last:border-b-0">
              <th scope="row" className="px-4 py-2.5 text-left font-medium text-mist-100">
                <span className="block truncate">{result.raceName}</span>
                <span className="block text-xs font-normal text-mist-500">
                  {result.round}ª etapa, {formatShortDate(result.date)}
                </span>
              </th>
              <td className="score px-2 py-2.5 text-center text-base text-mist-400">{result.grid ?? "–"}</td>
              <td className="score px-2 py-2.5 text-center text-base text-mist-200">
                {f1PositionLabel(result.position)}
                {result.fastestLap ? (
                  <span
                    className="ml-1.5 rounded-[2px] bg-[#a855f7]/20 px-1 py-0.5 font-display text-[0.625rem] font-bold text-[#c084fc]"
                    title="Volta mais rápida da corrida"
                  >
                    VR
                  </span>
                ) : null}
              </td>
              <td className="score px-2 py-2.5 text-center text-base text-mist-200">{result.points}</td>
              <td className="px-2 py-2.5 text-xs text-mist-400">{f1StatusLabel(result.status) ?? "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QualifyingTable({ driver }: { driver: F1DriverProfile }) {
  if (driver.seasonQualifying.length === 0) return null;
  return (
    <div className="scoreboard overflow-x-auto shadow-card">
      <table className="w-full min-w-[36rem] text-sm">
        <thead>
          <tr className="border-b border-line-soft font-display text-[0.8125rem] text-mist-500">
            <th scope="col" className="px-4 py-2.5 text-left font-bold">Etapa</th>
            <th scope="col" className="px-2 py-2.5 text-center font-bold">Pos.</th>
            <th scope="col" className="px-2 py-2.5 text-center font-bold">Q1</th>
            <th scope="col" className="px-2 py-2.5 text-center font-bold">Q2</th>
            <th scope="col" className="px-2 py-2.5 text-center font-bold">Q3</th>
          </tr>
        </thead>
        <tbody>
          {driver.seasonQualifying.map((result) => (
            <tr key={result.round} className="border-b border-line-soft/60 last:border-b-0">
              <th scope="row" className="px-4 py-2.5 text-left font-medium text-mist-100">
                {result.raceName}
              </th>
              <td className="score px-2 py-2.5 text-center text-base text-mist-200">
                {f1PositionLabel(result.position)}
              </td>
              <td className="score px-2 py-2.5 text-center text-sm text-mist-400">{result.q1 ?? "–"}</td>
              <td className="score px-2 py-2.5 text-center text-sm text-mist-400">{result.q2 ?? "–"}</td>
              <td className="score px-2 py-2.5 text-center text-sm text-mist-400">{result.q3 ?? "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function DriverPage({ params }: { params: Params }) {
  const { id } = await params;
  const driver = await getF1DriverProfile(id);
  if (!driver) notFound();

  const color = driver.color;
  const points = driver.standing?.points;
  const wins = driver.standing?.wins;

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
              Pilotos
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-mist-200">{driver.familyName}</span>
          </nav>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <div
              className="relative rounded-full"
              style={color ? { boxShadow: `0 0 0 3px #${color}` } : undefined}
            >
              <AthletePhoto photo={driver.photo} name={driver.name} size={128} />
              {driver.number ? (
                <span
                  className="score absolute -bottom-1 -right-1 grid size-9 place-items-center rounded-full bg-ink-950 text-base font-bold text-mist-50 ring-2 ring-ink-950"
                  title={`Número ${driver.number}`}
                >
                  {driver.number}
                </span>
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="kicker">
                {[driver.team?.name, driver.code, driver.number ? `#${driver.number}` : null]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <h1 className="mt-2 font-display text-[clamp(2.4rem,6vw,4.2rem)] font-extrabold leading-[0.95] text-mist-50">
                {driver.name}
              </h1>
              {driver.team ? (
                <p className="mt-2 flex items-center gap-2 text-base text-mist-300">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: color ? `#${color}` : "#64748b" }}
                    aria-hidden="true"
                  />
                  <Link href={constructorHref({ team: driver.team.name, constructorId: driver.team.id })} className="hover:text-flood-300">
                    {driver.team.name}
                  </Link>
                </p>
              ) : null}
            </div>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 lg:grid-cols-6">
            <Fact label="Temporada" value={driver.season} />
            <Fact label="Nacionalidade" value={nationalityLabel(driver.nationality)} />
            <Fact label="Nascimento" value={driver.dateOfBirth ? formatDate(driver.dateOfBirth) : undefined} />
            <Fact label="Idade" value={driver.age ? `${driver.age} anos` : undefined} />
            <Fact label="Código" value={driver.code} />
            <Fact label="Número" value={driver.number ? `#${driver.number}` : undefined} />
          </dl>
        </Container>
      </section>

      <Container className="space-y-10 py-10 sm:py-12">
        <section>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl font-extrabold text-mist-50">Na temporada</h2>
            <span className="text-xs text-mist-500">Fórmula 1 {driver.season}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Posição"
              value={driver.standing?.position ? `${driver.standing.position}º` : "–"}
              hint="no campeonato"
            />
            <StatCard label="Pontos" value={number(points)} hint="na classificação" />
            <StatCard label="Vitórias" value={number(wins)} hint="na temporada" />
            <StatCard label="Pódios" value={number(driver.seasonTotals?.podiums)} hint="top 3 nas corridas" />
            <StatCard label="Poles" value={number(driver.seasonTotals?.poles)} hint="primeiro na classificação" />
            <StatCard label="Voltas rápidas" value={number(driver.seasonTotals?.fastestLaps)} hint="na temporada" />
          </div>
        </section>

        {driver.career ? (
          <section>
            <h2 className="mb-4 font-display text-2xl font-extrabold text-mist-50">Carreira</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <StatCard
                label="Temporadas"
                value={number(driver.career.seasons)}
                hint={driver.seasons.length > 0 ? `na F1 desde ${Math.min(...driver.seasons.map(Number))}` : undefined}
              />
              <StatCard label="Corridas" value={number(driver.career.starts)} />
              <StatCard label="Vitórias" value={number(driver.career.wins)} />
              <StatCard label="Pódios" value={number(driver.career.podiums)} />
              <StatCard label="Voltas rápidas" value={number(driver.career.fastestLaps)} />
              <StatCard label="Pontos" value={number(driver.career.points)} />
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
          {driver.seasonResults.length > 0 ? (
            <ResultsTable driver={driver} />
          ) : (
            <p className="text-sm text-mist-400">
              {driver.resultsUnavailable
                ? "Resultados indisponíveis no momento."
                : "Nenhum resultado publicado para esta temporada."}
            </p>
          )}
        </section>

        {driver.seasonQualifying.length > 0 ? (
          <section>
            <h2 className="mb-4 font-display text-2xl font-extrabold text-mist-50">Classificação</h2>
            <QualifyingTable driver={driver} />
          </section>
        ) : null}

        <p className="text-xs text-mist-600">
          Fonte:{" "}
          <a href="https://api.jolpi.ca" className="hover:text-mist-400" rel="noreferrer noopener" target="_blank">
            Jolpica
          </a>{" "}
          (resultados e classificação) e{" "}
          <a href="https://openf1.org" className="hover:text-mist-400" rel="noreferrer noopener" target="_blank">
            OpenF1
          </a>{" "}
          (foto e cor da equipe).
        </p>
      </Container>
    </>
  );
}
