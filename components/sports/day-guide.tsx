import Link from "next/link";

import { CompetitionLogo } from "@/components/sports/competition-logo";
import { StatusPill } from "@/components/sports/fixture-row";
import { StartsIn } from "@/components/sports/starts-in";
import { TeamCrest } from "@/components/sports/team-crest";
import { EmptyState } from "@/components/ui/empty-state";
import { SportIcon } from "@/components/ui/sport-icon";
import { getCatalogEntry } from "@/lib/catalog";
import { formatTime, startsInText } from "@/lib/format";
import { fixturePath, matchPath } from "@/lib/match-path";
import { sports } from "@/lib/sports";
import type { Fixture } from "@/lib/types";

export type DayTab = { key: string; label: string; ymd: string };

function hrefFor(dayKey: string, sport?: string) {
  const params = new URLSearchParams();
  if (dayKey !== "hoje") params.set("dia", dayKey);
  if (sport) params.set("esporte", sport);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function priority(slug: string): number {
  return getCatalogEntry(slug)?.priority ?? 999;
}

function byKickoff(a: Fixture, b: Fixture) {
  const diff = new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
  return diff !== 0 ? diff : priority(a.competition) - priority(b.competition);
}

function isMatch(fixture: Fixture): fixture is Fixture & Required<Pick<Fixture, "home" | "away">> {
  return fixture.kind !== "event" && Boolean(fixture.home && fixture.away);
}

function hrefOf(fixture: Fixture) {
  return isMatch(fixture) ? matchPath(fixture.id) : fixturePath(fixture);
}

function labelOf(fixture: Fixture) {
  return isMatch(fixture) ? `${fixture.home.name} x ${fixture.away.name}` : (fixture.title ?? "Evento");
}

/** Agrupa por hora cheia de Brasília ("19h"), mantendo a ordem. */
function byHour(list: Fixture[]) {
  const groups: { hour: string; fixtures: Fixture[] }[] = [];
  for (const fixture of list) {
    const hour = `${formatTime(fixture.kickoff).slice(0, 2)}h`;
    const last = groups.at(-1);
    if (last?.hour === hour) last.fixtures.push(fixture);
    else groups.push({ hour, fixtures: [fixture] });
  }
  return groups;
}

/* Coluna das horas: largura única para a linha do tempo inteira. */
const RAIL = "grid grid-cols-[3rem_minmax(0,1fr)] sm:grid-cols-[4.5rem_minmax(0,1fr)]";

function Channels({ channels, className = "" }: { channels?: string[]; className?: string }) {
  if (!channels?.length) return null;
  return (
    <span className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="sr-only">Onde assistir:</span>
      {channels.map((channel) => (
        <span key={channel} className="rounded-[3px] bg-ink-700 px-1.5 py-0.5 text-[0.75rem] font-medium text-mist-200">
          {channel}
        </span>
      ))}
    </span>
  );
}

function CenterBox({ fixture }: { fixture: Fixture }) {
  const hasScore = typeof fixture.score?.home === "number";
  if (!hasScore) {
    return <span className="score text-lg text-mist-300">{formatTime(fixture.kickoff)}</span>;
  }
  return (
    <span className="score inline-flex items-baseline gap-1.5 text-[1.5rem] leading-none text-mist-50">
      {fixture.score!.home}
      <span className="text-base text-mist-600">–</span>
      {fixture.score!.away}
    </span>
  );
}

/** Uma linha da grade: competição, confronto e onde assistir. */
function GuideRow({ fixture, note, past }: { fixture: Fixture; note?: string; past?: boolean }) {
  const entry = getCatalogEntry(fixture.competition);
  const competition = entry?.shortName ?? entry?.name ?? fixture.competition;
  const href = hrefOf(fixture);
  const live = fixture.status === "live";
  const hasScore = typeof fixture.score?.home === "number";
  const finished = fixture.status === "finished" && hasScore;
  const homeWins = finished && fixture.score!.home > fixture.score!.away;
  const awayWins = finished && fixture.score!.away > fixture.score!.home;
  const tone = past ? "text-mist-300" : "text-mist-50";

  const metaBase = (
    <span className="flex min-w-0 items-center gap-2">
      <CompetitionLogo slug={fixture.competition} size={20} />
      <span className="truncate text-[0.8125rem] text-mist-400">{competition}</span>
    </span>
  );

  const meta = (
    <span className="flex min-w-0 items-center gap-2">
      <CompetitionLogo slug={fixture.competition} size={20} />
      <span className="truncate text-[0.8125rem] text-mist-400">{competition}</span>
      {fixture.status !== "scheduled" ? <StatusPill fixture={fixture} /> : null}
    </span>
  );

  const body = isMatch(fixture) ? (
    <>
      {/* Celular: competição em cima, times empilhados, placar ou hora à direita */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between gap-3">
          {meta}
          <Channels channels={fixture.broadcast} />
        </div>
        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
          <span className={`flex min-w-0 items-center gap-2 ${awayWins ? "text-mist-500" : tone} ${homeWins ? "font-semibold" : ""}`}>
            <TeamCrest url={fixture.home.crest} name={fixture.home.name} size={22} />
            <span className="min-w-0 break-words leading-tight">{fixture.home.name}</span>
          </span>
          <span className="score row-span-2 text-right">
            {hasScore ? (
              <span className="grid gap-1.5 text-xl leading-none text-mist-50">
                <span className={awayWins ? "text-mist-500" : ""}>{fixture.score!.home}</span>
                <span className={homeWins ? "text-mist-500" : ""}>{fixture.score!.away}</span>
              </span>
            ) : (
              <span className="text-lg text-mist-300">{formatTime(fixture.kickoff)}</span>
            )}
          </span>
          <span className={`flex min-w-0 items-center gap-2 ${homeWins ? "text-mist-500" : tone} ${awayWins ? "font-semibold" : ""}`}>
            <TeamCrest url={fixture.away.crest} name={fixture.away.name} size={22} />
            <span className="min-w-0 break-words leading-tight">{fixture.away.name}</span>
          </span>
        </div>
      </div>

      {/* Telas maiores: competição | mandante placar visitante | onde assistir */}
      <div className="hidden grid-cols-[7rem_minmax(0,1fr)_5.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-1 sm:grid lg:grid-cols-[7rem_minmax(0,1fr)_5.5rem_minmax(0,1fr)_auto] lg:gap-4">
        {metaBase}
        <span className={`flex min-w-0 items-center justify-end gap-2.5 text-right ${awayWins ? "text-mist-500" : tone} ${homeWins ? "font-semibold" : ""}`}>
          <span className="truncate">{fixture.home.name}</span>
          <TeamCrest url={fixture.home.crest} name={fixture.home.name} size={26} />
        </span>
        <span className="flex flex-col items-center gap-1 text-center">
          <CenterBox fixture={fixture} />
          {fixture.status !== "scheduled" ? <StatusPill fixture={fixture} /> : null}
        </span>
        <span className={`flex min-w-0 items-center gap-2.5 ${homeWins ? "text-mist-500" : tone} ${awayWins ? "font-semibold" : ""}`}>
          <TeamCrest url={fixture.away.crest} name={fixture.away.name} size={26} />
          <span className="truncate">{fixture.away.name}</span>
        </span>
        <Channels channels={fixture.broadcast} className="max-lg:col-span-full max-lg:mt-1 max-lg:justify-end lg:justify-end" />
      </div>
    </>
  ) : (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 sm:grid sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-x-4 sm:gap-y-1 lg:grid-cols-[7rem_minmax(0,1fr)_auto] lg:gap-4">
      {meta}
      <span className="min-w-0">
        <span className={`block font-display text-[1.05rem] font-bold leading-tight ${tone}`}>
          {fixture.title ?? "Evento"}{" "}
          <span className="score font-semibold text-mist-400">{formatTime(fixture.kickoff)}</span>
        </span>
        {fixture.result ? <span className="mt-0.5 block text-sm text-pitch-400">{fixture.result}</span> : null}
      </span>
      <Channels channels={fixture.broadcast} className="max-lg:col-span-full max-lg:justify-end sm:justify-end" />
    </div>
  );

  const rowClass = `block py-3 pl-4 pr-3 transition-colors hover:bg-ink-800/60 sm:pl-5 sm:pr-4 ${live ? "bg-live-500/[0.06]" : ""}`;

  return (
    <li>
      {href ? (
        <Link href={href} className={rowClass} aria-label={`${labelOf(fixture)}: detalhes`}>
          {body}
          {note ? <span className="mt-1.5 block text-[0.75rem] text-mist-500 sm:text-center">{note}</span> : null}
        </Link>
      ) : (
        <div className={rowClass}>
          {body}
          {note ? <span className="mt-1.5 block text-[0.75rem] text-mist-500 sm:text-center">{note}</span> : null}
        </div>
      )}
    </li>
  );
}

function HourGroup({
  hour,
  fixtures,
  notes,
  past,
}: {
  hour: string;
  fixtures: Fixture[];
  notes?: Map<string, string>;
  past?: boolean;
}) {
  return (
    <li className={RAIL}>
      <h3 className={`score pt-2.5 text-[1.375rem] leading-none sm:text-[1.75rem] ${past ? "text-mist-600" : "text-mist-200"}`}>
        {hour}
      </h3>
      <ul className="divide-y divide-line-soft border-l border-line">
        {fixtures.map((fixture) => (
          <GuideRow key={fixture.id} fixture={fixture} note={notes?.get(fixture.id)} past={past} />
        ))}
      </ul>
    </li>
  );
}

/** O próximo jogo do dia, em destaque: a hora em tamanho de placar de estádio. */
function NextUp({ fixture, now }: { fixture: Fixture; now: number }) {
  const entry = getCatalogEntry(fixture.competition);
  const href = hrefOf(fixture);
  const content = (
    <>
      <p className="text-[0.95rem] text-flood-300">
        Próximo jogo, <StartsIn kickoff={fixture.kickoff} initial={startsInText(fixture.kickoff, now)} />
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-4 sm:gap-x-10">
        <time
          dateTime={fixture.kickoff}
          className="score text-[clamp(3.25rem,15vw,8.75rem)] leading-[0.78] tracking-[-0.01em] text-mist-50"
        >
          {formatTime(fixture.kickoff)}
        </time>
        {isMatch(fixture) ? (
          <div className="grid min-w-0 gap-2.5">
            {[fixture.home, fixture.away].map((team) => (
              <span key={team.name} className="flex min-w-0 items-center gap-3">
                <TeamCrest url={team.crest} name={team.name} size={36} />
                <span className="truncate font-display text-[1.6rem] font-bold leading-none text-mist-50 sm:text-[2rem]">
                  {team.name}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <span className="font-display text-[1.75rem] font-bold leading-tight text-mist-50 sm:text-[2.25rem]">
            {fixture.title ?? "Evento"}
          </span>
        )}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-mist-400">
        <span className="flex items-center gap-2">
          <CompetitionLogo slug={fixture.competition} size={22} />
          {entry?.name ?? fixture.competition}
        </span>
        {fixture.venue ? <span>{fixture.venue}</span> : null}
        {fixture.broadcast?.length ? (
          <span className="flex items-center gap-2">
            Onde assistir
            <Channels channels={fixture.broadcast} />
          </span>
        ) : null}
      </div>
    </>
  );

  return (
    <li className={RAIL}>
      <span aria-hidden="true" />
      <article aria-label={`Próximo jogo: ${labelOf(fixture)}`} className="border-l-2 border-flood-400">
        {href ? (
          <Link href={href} className="block py-6 pl-5 pr-3 transition-colors hover:bg-ink-800/40 sm:py-8 sm:pl-7">
            {content}
          </Link>
        ) : (
          <div className="py-6 pl-5 pr-3 sm:py-8 sm:pl-7">{content}</div>
        )}
      </article>
    </li>
  );
}

/** A linha do "agora", com o que está em andamento logo abaixo. */
function NowLine({ live }: { live: Fixture[] }) {
  return (
    <li className={RAIL}>
      <h3 className="score self-start pt-0.5 text-[1.05rem] leading-none text-flood-400 sm:text-[1.25rem]">Agora</h3>
      <div>
        <div className="relative -ml-px mt-2.5 h-0.5 bg-flood-400" aria-hidden="true">
          <span className="absolute -left-[3px] -top-[3px] size-2 rounded-full bg-flood-400" />
        </div>
        {live.length > 0 ? (
          <ul className="mt-3 divide-y divide-line-soft border-l border-live-500/60">
            {live.map((fixture) => (
              <GuideRow key={fixture.id} fixture={fixture} />
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

/**
 * Guia do dia como uma grade de programação: os jogos correm por hora numa
 * linha do tempo. Hoje, a linha do "agora" separa o que já passou do que vem, e
 * o próximo jogo aparece em destaque.
 */
export function DayGuide({
  fixtures,
  allFixtures,
  tabs,
  activeDay,
  activeSport,
  notes,
}: {
  fixtures: Fixture[];
  /** Todas as partidas do dia, sem filtro — para contar por esporte */
  allFixtures: Fixture[];
  tabs: DayTab[];
  activeDay: string;
  activeSport?: string;
  notes?: Map<string, string>;
}) {
  const covered = sports.filter((sport) => sport.covered);
  const countFor = (slug?: string) =>
    slug ? allFixtures.filter((fixture) => fixture.sport === slug).length : allFixtures.length;

  const now = Date.now();
  const sorted = [...fixtures].sort(byKickoff);
  const isToday = activeDay === "hoje";

  const live = isToday ? sorted.filter((fixture) => fixture.status === "live") : [];
  const upcoming = isToday
    ? sorted.filter((fixture) => fixture.status === "scheduled" && new Date(fixture.kickoff).getTime() > now)
    : [];
  const past = isToday ? sorted.filter((fixture) => !live.includes(fixture) && !upcoming.includes(fixture)) : sorted;
  const [next, ...later] = upcoming;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <nav aria-label="Escolher o dia">
          <ul className="inline-flex rounded-[6px] border border-line bg-ink-900 p-1">
            {tabs.map((tab) => {
              const active = tab.key === activeDay;
              return (
                <li key={tab.key}>
                  <Link
                    href={hrefFor(tab.key, activeSport)}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-[4px] px-4 py-1.5 font-display text-[0.95rem] font-bold transition-colors ${
                      active ? "bg-flood-500 text-white" : "text-mist-400 hover:text-mist-100"
                    }`}
                  >
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <nav aria-label="Filtrar por esporte" className="min-w-0">
          <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {[{ slug: undefined, name: "Todos" }, ...covered].map((sport) => {
              const active = activeSport === sport.slug || (!activeSport && !sport.slug);
              const count = countFor(sport.slug);
              return (
                <li key={sport.slug ?? "todos"}>
                  <Link
                    href={hrefFor(activeDay, sport.slug)}
                    aria-current={active ? "true" : undefined}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] border px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "border-flood-500/70 bg-flood-500/15 text-flood-300"
                        : count === 0
                          ? "border-line-soft text-mist-600 hover:text-mist-300"
                          : "border-line bg-ink-850 text-mist-400 hover:text-mist-100"
                    }`}
                  >
                    <SportIcon sport={sport.slug ?? "todos"} className="size-4" />
                    {sport.name}
                    <span className="score text-xs text-mist-500">{count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {fixtures.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Nenhum jogo neste dia"
            description="Quando a coleta encontrar partidas ou sessões das competições acompanhadas, elas aparecem aqui com horário, placar e onde assistir."
          />
        </div>
      ) : (
        <ol className="mt-8 space-y-0" aria-label="Jogos por horário">
          {byHour(past).map((group) => (
            <HourGroup key={`p-${group.hour}`} {...group} notes={notes} past={isToday} />
          ))}

          {isToday ? <NowLine live={live} /> : null}

          {next ? <NextUp fixture={next} now={now} /> : null}

          {byHour(later).map((group) => (
            <HourGroup key={`l-${group.hour}`} {...group} notes={notes} />
          ))}

          {isToday && !next && live.length === 0 ? (
            <li className={RAIL}>
              <span aria-hidden="true" />
              <p className="border-l border-line py-5 pl-5 text-mist-400">
                Os jogos de hoje terminaram.{" "}
                <Link href={hrefFor("amanha", activeSport)} className="font-medium text-flood-300 underline underline-offset-4 hover:text-flood-400">
                  Ver os jogos de amanhã
                </Link>
              </p>
            </li>
          ) : null}
        </ol>
      )}
    </div>
  );
}
