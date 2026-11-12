import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AthletePhoto } from "@/components/sports/athlete-photo";
import { getCommonsPhoto } from "@/lib/commons";
import { CompetitionLogo } from "@/components/sports/competition-logo";
import { TeamCrest } from "@/components/sports/team-crest";
import { Container } from "@/components/ui/icons";
import { getLeague } from "@/lib/catalog";
import { getAthleteProfile } from "@/lib/espn-profiles";
import { formatShortDate, formatTime, formatWeekday } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";
import { positionLabel, splitLabel, statLabel } from "@/lib/stat-labels";

type Params = Promise<{ liga: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { liga, id } = await params;
  const athlete = await getAthleteProfile(liga, id);
  return buildMetadata({
    title: athlete?.name ?? "Atleta",
    description: athlete
      ? `${athlete.name}${athlete.team ? ` (${athlete.team.name})` : ""}: estatísticas da temporada, carreira e últimos jogos.`
      : "Estatísticas de atleta.",
    path: `/atletas/${liga}/${id}`,
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

const RESULT_STYLE: Record<string, string> = {
  W: "bg-pitch-500/20 text-pitch-400",
  D: "bg-ink-700 text-mist-300",
  L: "bg-live-500/15 text-live-400",
};
const RESULT_LABEL: Record<string, string> = { W: "V", D: "E", L: "D" };

export default async function AthletePage({ params }: { params: Params }) {
  const { liga, id } = await params;
  const competition = getLeague(liga);
  const athlete = await getAthleteProfile(liga, id);
  if (!competition || !athlete) notFound();
  const commons = await getCommonsPhoto({ name: athlete.name, team: athlete.team?.name, sport: competition.sport }, 330);

  return (
    <>
      <section className="border-b border-line-soft bg-[radial-gradient(60rem_22rem_at_20%_0%,rgb(37_99_235_/_0.16),transparent_70%)]">
        <Container className="py-8 sm:py-12">
          <nav className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-mist-400">
            <CompetitionLogo slug={liga} size={22} />
            <Link href={liga === "selecoes" ? "/selecoes" : `/competicoes/${liga}`} className="hover:text-flood-300">
              {competition.name}
            </Link>
            {athlete.team ? (
              <>
                <span aria-hidden="true">/</span>
                {athlete.team.id ? (
                  <Link href={`/times/${liga}/${athlete.team.id}`} className="hover:text-flood-300">
                    {athlete.team.name}
                  </Link>
                ) : (
                  <span>{athlete.team.name}</span>
                )}
              </>
            ) : null}
          </nav>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <div className="relative w-fit shrink-0 self-start rounded-full sm:self-auto">
              <AthletePhoto photo={commons?.src ?? athlete.photo} crest={athlete.team?.logo} name={athlete.name} size={128} />
              {athlete.flag ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={athlete.flag}
                  alt={athlete.nationality ?? ""}
                  width={28}
                  height={28}
                  className="absolute -bottom-1 -right-1 size-7 rounded-full object-cover ring-2 ring-ink-950"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="kicker">
                {[positionLabel(athlete.position), athlete.jersey ? `#${athlete.jersey}` : null].filter(Boolean).join(", ")}
              </p>
              <h1 className="mt-2 font-display text-[clamp(2.4rem,6vw,4.2rem)] font-extrabold leading-[0.95] text-mist-50">
                {athlete.name}
              </h1>
              {athlete.team ? (
                <p className="mt-2 flex items-center gap-2 text-base text-mist-300">
                  <TeamCrest url={athlete.team.logo} name={athlete.team.name} size={22} />
                  {athlete.team.name}
                </p>
              ) : null}
            </div>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 lg:grid-cols-6">
            <Fact label="Idade" value={athlete.age ? `${athlete.age} anos` : undefined} />
            <Fact label="Nascimento" value={athlete.birthDate} />
            <Fact label="Naturalidade" value={athlete.birthPlace} />
            <Fact label="Nacionalidade" value={athlete.nationality} />
            <Fact label="Altura" value={athlete.height} />
            <Fact label="Peso" value={athlete.weight} />
            <Fact label="Experiência" value={athlete.experience?.replace(/(\d+)(st|nd|rd|th) Season/, "$1ª temporada")} />
            <Fact label="Draft" value={athlete.draft} />
          </dl>
        </Container>
      </section>

      <Container className="space-y-10 py-10 sm:py-12">
        {/* Destaques da temporada */}
        {athlete.highlights.length > 0 ? (
          <section>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl font-extrabold text-mist-50">Na temporada</h2>
              {athlete.highlightsTitle ? (
                <span className="text-xs text-mist-500">{splitLabel(athlete.highlightsTitle.replace(/ (regular season )?stats$/i, ""))}</span>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {athlete.highlights.map((item) => (
                <div key={item.label} className="scoreboard p-4 shadow-card">
                  <p className="text-[0.8125rem] font-medium text-mist-500">{item.label}</p>
                  <p className="score mt-1 text-4xl leading-none text-mist-50">{item.value}</p>
                  {item.rank ? <p className="mt-1.5 text-xs text-flood-300">{item.rank} na liga</p> : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Temporada, carreira e por competição */}
        {athlete.splits ? (
          <section>
            <h2 className="mb-4 font-display text-2xl font-extrabold text-mist-50">Estatísticas</h2>
            <div className="scoreboard overflow-x-auto shadow-card">
              <table className="w-full min-w-[40rem] text-sm">
                <thead>
                  <tr className="border-b border-line-soft font-display text-[0.8125rem] text-mist-500">
                    <th scope="col" className="px-4 py-2.5 text-left font-bold">
                      Recorte
                    </th>
                    {athlete.splits.labels.map((label) => {
                      const t = statLabel(label);
                      return (
                        <th key={label} scope="col" className="px-2 py-2.5 text-center font-bold">
                          <abbr title={t.long} className="no-underline">
                            {t.short}
                          </abbr>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {athlete.splits.rows.map((row) => (
                    <tr key={row.name} className="border-b border-line-soft/60 last:border-b-0">
                      <th scope="row" className="px-4 py-2.5 text-left font-medium text-mist-100">
                        {splitLabel(row.name)}
                      </th>
                      {row.stats.map((value, index) => (
                        <td key={index} className="score px-2 py-2.5 text-center text-base text-mist-200">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          {/* Últimos jogos */}
          {athlete.lastGames.length > 0 ? (
            <section>
              <h2 className="mb-4 font-display text-2xl font-extrabold text-mist-50">Últimos jogos</h2>
              <div className="scoreboard overflow-x-auto shadow-card">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead>
                    <tr className="border-b border-line-soft font-display text-[0.8125rem] text-mist-500">
                      <th scope="col" className="px-4 py-2.5 text-left font-bold">
                        Jogo
                      </th>
                      {athlete.lastGamesLabels.map((label) => {
                        const t = statLabel(label);
                        return (
                          <th key={label} scope="col" className="px-2 py-2.5 text-center font-bold">
                            <abbr title={t.long} className="no-underline">
                              {t.short}
                            </abbr>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {athlete.lastGames.map((game) => (
                      <tr key={game.id} className="border-b border-line-soft/60 last:border-b-0">
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-2.5">
                            {game.result ? (
                              <span
                                className={`grid size-6 shrink-0 place-items-center rounded-[3px] font-display text-xs font-bold ${RESULT_STYLE[game.result] ?? ""}`}
                              >
                                {RESULT_LABEL[game.result] ?? game.result}
                              </span>
                            ) : null}
                            <span className="text-xs text-mist-500">{game.home ? "vs" : "@"}</span>
                            <TeamCrest url={game.opponentLogo} name={game.opponent} size={20} />
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-mist-100">{game.opponent}</span>
                              <span className="block text-xs text-mist-500">
                                {game.date ? formatShortDate(game.date) : ""} {game.score ? `· ${game.score}` : ""}
                              </span>
                            </span>
                          </span>
                        </td>
                        {game.stats.map((value, index) => (
                          <td key={index} className="score px-2 py-2.5 text-center text-base text-mist-200">
                            {value === "Started" ? "Tit." : value === "Substitute" ? "Res." : value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {athlete.nextGame ? (
            <aside>
              <h2 className="mb-4 font-display text-2xl font-extrabold text-mist-50">Próximo jogo</h2>
              <div className="scoreboard p-5 shadow-card">
                <span className="status-bar bg-flood-500" aria-hidden="true" />
                <p className="font-display text-lg font-bold leading-tight text-mist-50">
                  {athlete.nextGame.name.replace(" at ", " × ")}
                </p>
                <p className="mt-2 text-sm text-mist-400">
                  {formatWeekday(athlete.nextGame.date)}, às {formatTime(athlete.nextGame.date)} (Brasília)
                </p>
              </div>
            </aside>
          ) : null}
        </div>

        <p className="text-xs text-mist-600">Fonte: ESPN.</p>
      </Container>
    </>
  );
}
