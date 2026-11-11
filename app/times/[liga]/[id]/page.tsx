import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AthletePhoto } from "@/components/sports/athlete-photo";
import { getCommonsPhotos } from "@/lib/commons";
import { CompetitionLogo } from "@/components/sports/competition-logo";
import { StandingsTable } from "@/components/sports/standings-table";
import { TeamCrest } from "@/components/sports/team-crest";
import { Container } from "@/components/ui/icons";
import { getLeague } from "@/lib/catalog";
import { getStandings } from "@/lib/data";
import { getTeamProfile } from "@/lib/espn-profiles";
import { formatShortDate, formatTime } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";

type Params = Promise<{ liga: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { liga, id } = await params;
  const team = await getTeamProfile(liga, id);
  return buildMetadata({
    title: team?.name ?? "Time",
    description: team ? `${team.name}: elenco, jogos, resultados e campanha.` : "Time.",
    path: `/times/${liga}/${id}`,
  });
}

const RESULT_STYLE = {
  V: "bg-pitch-500/20 text-pitch-400",
  E: "bg-ink-700 text-mist-300",
  D: "bg-live-500/15 text-live-400",
};

export default async function TeamPage({ params }: { params: Params }) {
  const { liga, id } = await params;
  const competition = getLeague(liga);
  const team = await getTeamProfile(liga, id);
  if (!competition || !team) notFound();

  const [tables, photos] = await Promise.all([
    getStandings(liga),
    getCommonsPhotos(
      team.roster.flatMap((group) => group.players.map((player) => ({ name: player.name, team: team.name, sport: competition.sport }))),
      250,
    ),
  ]);
  const table = tables.find((t) => t.rows.some((row) => row.teamId === id));
  // Jogos vêm em ordem cronológica: resultados do mais recente para o mais antigo.
  const played = team.games.filter((game) => game.state === "post").reverse();
  const upcoming = team.games.filter((game) => game.state !== "post");
  const form = played.slice(0, 5);
  const color = team.color ? `#${team.color}` : undefined;

  return (
    <>
      <section
        className="border-b border-line-soft"
        style={{
          backgroundImage: color
            ? `radial-gradient(60rem 22rem at 15% 0%, ${color}33, transparent 70%)`
            : undefined,
        }}
      >
        <Container className="py-8 sm:py-12">
          <nav className="mb-6 flex items-center gap-2 text-sm text-mist-400">
            <CompetitionLogo slug={liga} size={22} />
            <Link href={liga === "selecoes" ? "/selecoes" : `/competicoes/${liga}`} className="hover:text-flood-300">
              {competition.name}
            </Link>
          </nav>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <TeamCrest url={team.logo} name={team.name} size={112} />
            <div>
              <h1 className="font-display text-[clamp(2.4rem,6vw,4.2rem)] font-extrabold leading-[0.95] text-mist-50">
                {team.name}
              </h1>
              <p className="mt-2 text-base text-mist-300">
                {[team.standing, team.record ? `Campanha ${team.record}` : null]
                  .filter(Boolean)
                  .join(". ")}
              </p>
              {form.length > 0 ? (
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="mr-1 text-[0.8125rem] font-medium text-mist-500">Últimos</span>
                  {form.map((game) =>
                    game.result ? (
                      <span
                        key={game.id}
                        title={`${game.opponent} ${game.us}–${game.them}`}
                        className={`grid size-6 place-items-center rounded-[3px] font-display text-xs font-bold ${RESULT_STYLE[game.result]}`}
                      >
                        {game.result}
                      </span>
                    ) : null,
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </section>

      <Container className="space-y-10 py-10 sm:py-12">
        <div className="grid gap-8 xl:grid-cols-2">
          {upcoming.length > 0 ? (
            <section>
              <h2 className="mb-3 font-display text-2xl font-extrabold text-mist-50">Próximos jogos</h2>
              <ul className="scoreboard divide-y divide-line-soft overflow-hidden shadow-card">
                {upcoming.slice(0, 6).map((game) => (
                  <li key={game.id}>
                    <Link href={`/partidas/espn-${game.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-ink-800/60">
                      <span className="w-16 shrink-0">
                        <span className="block font-display text-xs font-bold text-mist-500">
                          {formatShortDate(game.date)}
                        </span>
                        <span className="score text-base text-mist-200">{formatTime(game.date)}</span>
                      </span>
                      <span className="text-xs text-mist-500">{game.home ? "vs" : "@"}</span>
                      <TeamCrest url={game.opponentLogo} name={game.opponent} size={26} />
                      <span className="truncate font-medium text-mist-100">{game.opponent}</span>
                      {game.state === "in" ? (
                        <span className="ml-auto font-display text-xs font-bold text-live-400">Ao vivo</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {played.length > 0 ? (
            <section>
              <h2 className="mb-3 font-display text-2xl font-extrabold text-mist-50">Resultados</h2>
              <ul className="scoreboard divide-y divide-line-soft overflow-hidden shadow-card">
                {played.slice(0, 8).map((game) => (
                  <li key={game.id}>
                    <Link href={`/partidas/espn-${game.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-ink-800/60">
                      {game.result ? (
                        <span
                          className={`grid size-6 shrink-0 place-items-center rounded-[3px] font-display text-xs font-bold ${RESULT_STYLE[game.result]}`}
                        >
                          {game.result}
                        </span>
                      ) : null}
                      <span className="w-14 shrink-0 font-display text-xs font-bold text-mist-500">
                        {formatShortDate(game.date)}
                      </span>
                      <span className="text-xs text-mist-500">{game.home ? "vs" : "@"}</span>
                      <TeamCrest url={game.opponentLogo} name={game.opponent} size={26} />
                      <span className="min-w-0 flex-1 truncate font-medium text-mist-100">{game.opponent}</span>
                      <span className="score rounded-[3px] bg-ink-950 px-2 py-0.5 text-lg text-mist-50 ring-1 ring-line">
                        {game.us}–{game.them}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {table ? (
          <section>
            <h2 className="mb-3 font-display text-2xl font-extrabold text-mist-50">
              Classificação{table.group ? ` — ${table.group}` : ""}
            </h2>
            <StandingsTable table={table} highlightTeamId={id} />
          </section>
        ) : null}

        {team.roster.length > 0 ? (
          <section>
            <h2 className="mb-4 font-display text-2xl font-extrabold text-mist-50">Elenco</h2>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {team.roster.map((group) => (
                <div key={group.group}>
                  <h3 className="mb-2 text-xs font-semibold text-flood-400">{group.group}</h3>
                  <ul className="scoreboard divide-y divide-line-soft overflow-hidden shadow-card">
                    {group.players.map((player) => (
                      <li key={player.id}>
                        <Link
                          href={`/atletas/${liga}/${player.id}`}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-ink-800/60"
                        >
                          <AthletePhoto photo={photos.get(player.name)?.src ?? player.photo} name={player.name} size={32} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-mist-100">{player.name}</span>
                            <span className="block text-xs text-mist-500">
                              {[player.position, player.age ? `${player.age} anos` : null].filter(Boolean).join(", ")}
                            </span>
                          </span>
                          {player.flag ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={player.flag} alt="" width={18} height={18} loading="lazy" className="size-[18px] rounded-full object-cover" />
                          ) : null}
                          {player.jersey ? <span className="score w-6 text-right text-sm text-mist-500">{player.jersey}</span> : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        <p className="text-xs text-mist-600">Fonte: ESPN.</p>
      </Container>
    </>
  );
}
