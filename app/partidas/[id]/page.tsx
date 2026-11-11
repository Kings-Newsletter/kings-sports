import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusPill } from "@/components/sports/fixture-row";
import { TeamCrest } from "@/components/sports/team-crest";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/icons";
import { CompetitionLogo } from "@/components/sports/competition-logo";
import { getCatalogEntry } from "@/lib/catalog";
import { getFixtureById } from "@/lib/data";
import { formatDate, formatTime, formatWeekday } from "@/lib/format";
import { getMatchDetail, type MatchEvent, type MatchLeader, type MatchStat, type Side } from "@/lib/match";
import { fixtureIdFromParam } from "@/lib/match-path";
import { buildMetadata } from "@/lib/seo";
import type { Fixture } from "@/lib/types";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const fixture = await getFixtureById(fixtureIdFromParam(id));
  if (!fixture?.home || !fixture.away) {
    return buildMetadata({ title: "Partida", description: "Placar, lances e estatísticas.", path: `/partidas/${id}` });
  }
  const score = fixture.score ? ` ${fixture.score.home} x ${fixture.score.away} ` : " x ";
  return buildMetadata({
    title: `${fixture.home.name}${score}${fixture.away.name}`,
    description: `${getCatalogEntry(fixture.competition)?.name ?? ""} — ${formatDate(fixture.kickoff)}. Placar, lances e estatísticas.`,
    path: `/partidas/${id}`,
  });
}

/* ------------------------------------------------------------ lances */

const EVENT_STYLE: Record<MatchEvent["kind"], { label: string; icon: React.ReactNode }> = {
  goal: { label: "Gol", icon: <BallIcon /> },
  penalty: { label: "Gol de pênalti", icon: <BallIcon /> },
  "own-goal": { label: "Gol contra", icon: <BallIcon className="text-live-400" /> },
  "penalty-miss": { label: "Pênalti perdido", icon: <BallIcon className="text-mist-500" /> },
  yellow: { label: "Cartão amarelo", icon: <span className="block h-3.5 w-2.5 rounded-[2px] bg-[#f5c518]" /> },
  red: { label: "Cartão vermelho", icon: <span className="block h-3.5 w-2.5 rounded-[2px] bg-live-500" /> },
  sub: { label: "Substituição", icon: <SubIcon /> },
};

function BallIcon({ className = "text-mist-50" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`size-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7.2 3.4 2.5-1.3 4h-4.2l-1.3-4Z" />
    </svg>
  );
}

function SubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M8 4v14m0 0-3-3m3 3 3-3" stroke="#37d68a" />
      <path d="M16 20V6m0 0-3 3m3-3 3 3" stroke="#ff5c6c" />
    </svg>
  );
}

function Timeline({ events, showSubs }: { events: MatchEvent[]; showSubs: boolean }) {
  const shown = events.filter((event) => showSubs || event.kind !== "sub");
  if (shown.length === 0) return <p className="text-sm text-mist-500">Nenhum lance registrado.</p>;
  return (
    <ol className="relative space-y-1 before:absolute before:inset-y-0 before:left-1/2 before:w-px before:bg-line-soft">
      {shown.map((event, index) => {
        const style = EVENT_STYLE[event.kind];
        const text = (
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-mist-100">{event.player ?? style.label}</span>
            <span className="block truncate text-xs text-mist-500">
              {event.kind === "sub" && event.secondary
                ? `Sai ${event.secondary}`
                : event.kind === "goal" && event.secondary
                  ? `Assistência: ${event.secondary}`
                  : style.label}
            </span>
          </span>
        );
        const marker = (
          <span className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full border border-line bg-ink-900">
            {style.icon}
          </span>
        );
        return (
          <li key={index} className="grid grid-cols-[1fr_3rem_1fr] items-center gap-2 py-1">
            <span className={`flex items-center justify-end gap-2 text-right ${event.side === "home" ? "" : "invisible"}`}>
              {event.side === "home" ? text : null}
              {event.side === "home" ? marker : null}
            </span>
            <span className="relative z-10 mx-auto rounded-[3px] bg-ink-800 px-1.5 py-0.5 font-display text-xs font-bold text-mist-300">
              {event.minute ?? "–"}
            </span>
            <span className={`flex items-center gap-2 ${event.side === "away" ? "" : "invisible"}`}>
              {event.side === "away" ? marker : null}
              {event.side === "away" ? text : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------- estatísticas */

function StatBars({ stats }: { stats: MatchStat[] }) {
  return (
    <ul className="space-y-4">
      {stats.map((stat) => {
        const total = stat.homeValue + stat.awayValue;
        const homePct = total > 0 ? (stat.homeValue / total) * 100 : 50;
        const homeLeads = stat.homeValue > stat.awayValue;
        const awayLeads = stat.awayValue > stat.homeValue;
        return (
          <li key={stat.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className={`score text-lg ${homeLeads ? "text-mist-50" : "text-mist-400"}`}>{stat.home}</span>
              <span className="text-center text-xs font-medium text-mist-500">{stat.label}</span>
              <span className={`score text-lg ${awayLeads ? "text-mist-50" : "text-mist-400"}`}>{stat.away}</span>
            </div>
            <div className="flex h-1.5 gap-1" aria-hidden="true">
              <span className="flex flex-1 justify-end overflow-hidden rounded-full bg-ink-700">
                <span className={`h-full rounded-full ${homeLeads ? "bg-flood-400" : "bg-mist-500"}`} style={{ width: `${homePct}%` }} />
              </span>
              <span className="flex flex-1 overflow-hidden rounded-full bg-ink-700">
                <span className={`h-full rounded-full ${awayLeads ? "bg-gold-400" : "bg-mist-500"}`} style={{ width: `${100 - homePct}%` }} />
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Leaders({ leaders, competition }: { leaders: MatchLeader[]; competition: string }) {
  const person = (p: MatchLeader["home"], align: "left" | "right") =>
    p ? (
      <span className={`flex min-w-0 items-center gap-3 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
        {p.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.photo} alt="" width={44} height={44} loading="lazy" className="size-11 shrink-0 rounded-full bg-ink-700 object-cover" />
        ) : null}
        <span className="min-w-0">
          {p.id ? (
            <Link href={`/atletas/${competition}/${p.id}`} className="block truncate text-sm font-medium text-mist-100 hover:text-flood-300">
              {p.name}
            </Link>
          ) : (
            <span className="block truncate text-sm font-medium text-mist-100">{p.name}</span>
          )}
          <span className="score text-xl text-mist-50">{p.value}</span>
        </span>
      </span>
    ) : (
      <span />
    );
  return (
    <ul className="divide-y divide-line-soft">
      {leaders.map((leader) => (
        <li key={leader.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-3">
          {person(leader.home, "left")}
          <span className="text-[0.8125rem] font-medium text-mist-500">{leader.label}</span>
          {person(leader.away, "right")}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------- página */

function TeamBlock({
  team,
  winner,
  competition,
}: {
  team: NonNullable<Fixture["home"]>;
  side: Side;
  winner: boolean;
  competition: string;
}) {
  const content = (
    <>
      <TeamCrest url={team.crest} name={team.name} size={88} />
      <p className={`font-display text-xl font-bold leading-tight sm:text-2xl ${winner ? "text-mist-50" : "text-mist-200"}`}>
        {team.name}
      </p>
    </>
  );
  return team.id ? (
    <Link href={`/times/${competition}/${team.id}`} className="group flex flex-col items-center gap-3 text-center [&_p]:group-hover:text-flood-300">
      {content}
    </Link>
  ) : (
    <div className="flex flex-col items-center gap-3 text-center">{content}</div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="scoreboard p-5 shadow-card sm:p-6">
      <h2 className="mb-4 font-display text-lg font-bold text-mist-50">{title}</h2>
      {children}
    </section>
  );
}

export default async function MatchPage({ params }: { params: Params }) {
  const { id } = await params;
  const fixture = await getFixtureById(fixtureIdFromParam(id));
  if (!fixture || !fixture.home || !fixture.away) notFound();

  const competition = getCatalogEntry(fixture.competition);
  const detail = await getMatchDetail(fixture);
  const hasScore = typeof fixture.score?.home === "number";
  const homeWins = fixture.status === "finished" && hasScore && fixture.score!.home > fixture.score!.away;
  const awayWins = fixture.status === "finished" && hasScore && fixture.score!.away > fixture.score!.home;
  const isFootball = fixture.sport === "futebol";
  const home = detail?.lineups.find((l) => l.side === "home");
  const away = detail?.lineups.find((l) => l.side === "away");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${fixture.home.name} x ${fixture.away.name}`,
    startDate: fixture.kickoff,
    location: fixture.venue ? { "@type": "Place", name: fixture.venue } : undefined,
    homeTeam: { "@type": "SportsTeam", name: fixture.home.name },
    awayTeam: { "@type": "SportsTeam", name: fixture.away.name },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Placar */}
      <section className="relative overflow-hidden border-b border-line-soft bg-[radial-gradient(60rem_22rem_at_50%_0%,rgb(37_99_235_/_0.16),transparent_70%)]">
        <Container className="py-8 sm:py-12">
          <nav className="mb-6 flex flex-wrap items-center justify-center gap-2 text-sm text-mist-400">
            <CompetitionLogo slug={fixture.competition} size={26} />
            <Link href={`/competicoes/${fixture.competition}`} className="font-semibold text-mist-200 hover:text-flood-300">
              {competition?.name ?? fixture.competition}
            </Link>
            {fixture.round ? <span>· {fixture.round}</span> : null}
          </nav>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-10">
            <TeamBlock team={fixture.home} side="home" winner={homeWins} competition={fixture.competition} />
            <div className="flex flex-col items-center gap-3">
              {hasScore ? (
                <p
                  className={`score flex items-center gap-3 text-[clamp(3rem,10vw,5.5rem)] leading-none ${
                    fixture.status === "live" ? "text-mist-50" : "text-mist-100"
                  }`}
                >
                  <span className={awayWins ? "text-mist-500" : ""}>{fixture.score!.home}</span>
                  <span className="text-[0.5em] text-mist-600">–</span>
                  <span className={homeWins ? "text-mist-500" : ""}>{fixture.score!.away}</span>
                </p>
              ) : (
                <p className="score text-[clamp(2.4rem,7vw,4rem)] leading-none text-mist-200">{formatTime(fixture.kickoff)}</p>
              )}
              <StatusPill fixture={fixture} />
              {fixture.status === "scheduled" ? (
                <p className="font-display text-sm font-semibold text-mist-400">
                  {formatWeekday(fixture.kickoff)}
                </p>
              ) : null}
            </div>
            <TeamBlock team={fixture.away} side="away" winner={awayWins} competition={fixture.competition} />
          </div>

          <p className="mt-8 text-center text-xs text-mist-500">
            {formatDate(fixture.kickoff)}, às {formatTime(fixture.kickoff)} (Brasília)
            {fixture.venue ? `. ${fixture.venue}` : ""}
            {detail?.city ? `, ${detail.city}` : ""}
            {detail?.attendance ? `. Público: ${detail.attendance.toLocaleString("pt-BR")}` : ""}
          </p>
          {fixture.broadcast?.length ? (
            <p className="mt-2 text-center text-sm text-mist-300">Onde assistir: {fixture.broadcast.join(", ")}</p>
          ) : null}
        </Container>
      </section>

      <Container className="py-10 sm:py-12">
        {!detail ? (
          <EmptyState
            title="Detalhes indisponíveis"
            description="A fonte não respondeu agora. O placar acima continua sendo atualizado pela coleta."
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {isFootball && (detail.events.length > 0 || fixture.status !== "scheduled") ? (
              <Panel title="Lances">
                <Timeline events={detail.events} showSubs={false} />
              </Panel>
            ) : null}

            {detail.leaders.length > 0 ? (
              <Panel title="Destaques">
                <Leaders leaders={detail.leaders} competition={fixture.competition} />
              </Panel>
            ) : null}

            {detail.stats.length > 0 ? (
              <Panel title="Estatísticas">
                <div className="mb-4 flex items-center justify-between text-xs font-semibold">
                  <span className="text-flood-300">{fixture.home.shortName ?? fixture.home.name}</span>
                  <span className="text-gold-300">{fixture.away.shortName ?? fixture.away.name}</span>
                </div>
                <StatBars stats={detail.stats} />
              </Panel>
            ) : null}

            {home && away ? (
              <Panel title="Escalações">
                <div className="grid grid-cols-2 gap-6">
                  {[home, away].map((lineup) => (
                    <div key={lineup.side}>
                      <p className="mb-3 flex items-baseline justify-between gap-2">
                        <span className="truncate font-display text-sm font-bold text-mist-200">
                          {(lineup.side === "home" ? fixture.home : fixture.away)?.name}
                        </span>
                        {lineup.formation ? <span className="score text-sm text-flood-300">{lineup.formation}</span> : null}
                      </p>
                      <ul className="space-y-1.5 text-sm">
                        {lineup.starters.map((player) => (
                          <li key={`${player.jersey}-${player.name}`} className="flex items-center gap-2">
                            <span className="score w-6 shrink-0 text-right text-mist-500">{player.jersey}</span>
                            {player.id ? (
                              <Link href={`/atletas/${fixture.competition}/${player.id}`} className="truncate text-mist-100 hover:text-flood-300">
                                {player.name}
                              </Link>
                            ) : (
                              <span className="truncate text-mist-100">{player.name}</span>
                            )}
                            {player.position ? <span className="ml-auto text-[0.6875rem] text-mist-600">{player.position}</span> : null}
                          </li>
                        ))}
                      </ul>
                      {lineup.bench.length > 0 ? (
                        <details className="mt-3 text-sm">
                          <summary className="cursor-pointer text-[0.8125rem] font-medium text-mist-500 hover:text-mist-300">
                            Reservas ({lineup.bench.length})
                          </summary>
                          <ul className="mt-2 space-y-1">
                            {lineup.bench.map((player) => (
                              <li key={`${player.jersey}-${player.name}`} className="flex gap-2 text-mist-400">
                                <span className="score w-6 shrink-0 text-right text-mist-600">{player.jersey}</span>
                                <span className="truncate">{player.name}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}

            {isFootball && detail.events.some((e) => e.kind === "sub") ? (
              <Panel title="Substituições">
                <Timeline events={detail.events.filter((e) => e.kind === "sub")} showSubs />
              </Panel>
            ) : null}

            {detail.events.length === 0 && detail.stats.length === 0 && detail.leaders.length === 0 && !home ? (
              <div className="lg:col-span-2">
                <EmptyState
                  title={fixture.status === "scheduled" ? "A partida ainda não começou" : "Sem detalhes para esta partida"}
                  description={
                    fixture.status === "scheduled"
                      ? "Escalações, lances e estatísticas aparecem aqui quando a fonte publicar — normalmente perto do início do jogo."
                      : "A fonte não publicou lances nem estatísticas desta partida."
                  }
                />
              </div>
            ) : null}
          </div>
        )}
        <p className="mt-8 text-xs text-mist-600">Fonte: {fixture.source ?? "ESPN"}. Horários em Brasília.</p>
      </Container>
    </>
  );
}
