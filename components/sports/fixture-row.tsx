import Link from "next/link";

import { LiveClock } from "@/components/sports/live-clock";
import { TeamCrest } from "@/components/sports/team-crest";
import { formatShortDate, formatTime } from "@/lib/format";
import { liveClockText } from "@/lib/live-clock";
import { fixturePath, matchPath } from "@/lib/match-path";
import type { Fixture } from "@/lib/types";

const statusLabel: Record<Fixture["status"], string> = {
  scheduled: "Agendado",
  live: "Ao vivo",
  finished: "Encerrado",
  postponed: "Adiado",
  cancelled: "Cancelado",
};

const barColor: Record<Fixture["status"], string> = {
  scheduled: "bg-flood-500/70",
  live: "bg-live-500",
  finished: "bg-mist-600/40",
  postponed: "bg-gold-500/70",
  cancelled: "bg-mist-600/30",
};

/** Selo de status: relógio ao vivo, "Fim", "Adiado"… */
export function StatusPill({ fixture }: { fixture: Fixture }) {
  if (fixture.status === "live") {
    const clock = {
      kickoff: fixture.kickoff,
      updatedAt: fixture.updatedAt,
      clock: fixture.clock,
      status: fixture.status,
      sport: fixture.sport,
      kind: fixture.kind,
    };
    // Intervalo / fim de período: o jogo está parado, então o selo não pisca.
    const paused = /^(Intervalo|Fim do)/.test(fixture.clock ?? "");
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-[3px] px-1.5 py-0.5 font-display text-[0.8125rem] font-bold leading-none ${
          paused ? "bg-gold-500/15 text-gold-300" : "bg-live-500/15 text-live-400"
        }`}
      >
        <span className={`size-1.5 rounded-full ${paused ? "bg-gold-400" : "animate-pulse bg-live-400"}`} aria-hidden="true" />
        <LiveClock input={clock} initial={liveClockText(clock)} title="Relógio ao vivo" />
      </span>
    );
  }
  if (fixture.status === "finished") {
    return (
      <span className="font-display text-[0.875rem] font-semibold text-mist-500">
        {fixture.clock ?? "Fim"}
      </span>
    );
  }
  if (fixture.status === "postponed" || fixture.status === "cancelled") {
    return (
      <span className="font-display text-[0.875rem] font-semibold text-gold-400">
        {statusLabel[fixture.status]}
      </span>
    );
  }
  return null;
}

function Broadcast({ channels }: { channels?: string[] }) {
  if (!channels || channels.length === 0) return null;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className="sr-only">Onde assistir:</span>
      <svg viewBox="0 0 24 24" className="size-3.5 text-flood-400" aria-hidden="true" fill="none">
        <rect x="3" y="5" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 20h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      {channels.map((channel) => (
        <span key={channel} className="rounded-[3px] bg-ink-700 px-1.5 py-0.5 font-medium text-mist-200">
          {channel}
        </span>
      ))}
    </span>
  );
}

function ScoreBox({ fixture }: { fixture: Fixture }) {
  const hasScore = typeof fixture.score?.home === "number";
  const live = fixture.status === "live";
  if (!hasScore) {
    return (
      <span className="score inline-flex min-w-[5rem] justify-center rounded-[4px] border border-line bg-ink-900 px-3 py-1.5 text-lg text-mist-300 lg:min-w-[5.5rem]">
        {formatTime(fixture.kickoff)}
      </span>
    );
  }
  return (
    <span
      className={`score inline-flex min-w-[5.5rem] items-center justify-center gap-2 rounded-[4px] px-3 py-1 text-[1.6rem] leading-none ${
        live ? "bg-live-500/10 text-mist-50 ring-1 ring-live-500/50" : "bg-ink-950 text-mist-50 ring-1 ring-line"
      }`}
    >
      <span>{fixture.score!.home}</span>
      <span className="text-base text-mist-600">–</span>
      <span>{fixture.score!.away}</span>
    </span>
  );
}

export function FixtureRow({
  fixture,
  showDate = true,
  note,
}: {
  fixture: Fixture;
  showDate?: boolean;
  /** Linha extra (ex.: último confronto) */
  note?: string;
}) {
  const href =
    fixture.kind === "event" || !fixture.home || !fixture.away
      ? fixturePath(fixture)
      : matchPath(fixture.id);
  const hasScore = typeof fixture.score?.home === "number";
  const finished = fixture.status === "finished" && hasScore;
  const homeWins = finished && fixture.score!.home > fixture.score!.away;
  const awayWins = finished && fixture.score!.away > fixture.score!.home;
  const loser = "text-mist-400";
  const meta = [fixture.round, fixture.venue].filter(Boolean).join(", ");
  const footer = (
    <>
      {fixture.broadcast?.length || note ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] text-mist-500">
          <Broadcast channels={fixture.broadcast} />
          {note ? <span>{note}</span> : null}
        </div>
      ) : null}
    </>
  );

  // Eventos (sessões de F1): título + resultado.
  if (fixture.kind === "event" || !fixture.home || !fixture.away) {
    const eventBody = (
      <>
        <span className={`status-bar ${barColor[fixture.status]}`} aria-hidden="true" />
        <div className="w-[4.5rem] shrink-0">
          {showDate ? (
            <span className="block font-display text-xs font-bold text-mist-500">
              {formatShortDate(fixture.kickoff)}
            </span>
          ) : null}
          <span className="score text-base text-mist-200">{formatTime(fixture.kickoff)}</span>
          <span className="mt-0.5 block">
            <StatusPill fixture={fixture} />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold leading-tight text-mist-50">
            {fixture.title ?? "Evento"}
          </p>
          {fixture.result ? (
            <p className="mt-0.5 text-sm font-medium text-pitch-400">{fixture.result}</p>
          ) : fixture.venue ? (
            <p className="mt-0.5 truncate text-sm text-mist-500">{fixture.venue}</p>
          ) : null}
        </div>
        {href ? (
          <span aria-hidden="true" className="text-mist-600 transition-transform group-hover:translate-x-0.5 group-hover:text-flood-300">
            ›
          </span>
        ) : null}
      </>
    );
    const eventClass =
      "group relative flex items-center gap-4 py-3 pl-5 pr-4 transition-colors hover:bg-ink-800/60";
    return (
      <li>
        {href ? (
          <Link href={href} className={eventClass} aria-label={`${fixture.title ?? "Evento"}: ver a competição`}>
            {eventBody}
          </Link>
        ) : (
          <div className={eventClass}>{eventBody}</div>
        )}
      </li>
    );
  }

  const body = (
    <>
      <span className={`status-bar ${barColor[fixture.status]}`} aria-hidden="true" />

      {/* Celular: times empilhados, placar à direita */}
      <div className="flex items-start gap-3 sm:hidden">
        <div className="w-14 shrink-0 pt-0.5">
          {showDate ? (
            <span className="block font-display text-[0.6875rem] font-bold text-mist-500">
              {formatShortDate(fixture.kickoff)}
            </span>
          ) : null}
          {fixture.status === "scheduled" ? (
            <span className="score text-base text-mist-200">{formatTime(fixture.kickoff)}</span>
          ) : (
            <StatusPill fixture={fixture} />
          )}
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5">
          <span className={`flex min-w-0 items-center gap-2 ${awayWins ? loser : "text-mist-100"} ${homeWins ? "font-semibold" : ""}`}>
            <TeamCrest url={fixture.home.crest} name={fixture.home.name} size={22} />
            <span className="truncate">{fixture.home.name}</span>
          </span>
          <span className={`score text-xl leading-none ${hasScore ? (awayWins ? loser : "text-mist-50") : "text-mist-600"}`}>
            {hasScore ? fixture.score!.home : ""}
          </span>
          <span className={`flex min-w-0 items-center gap-2 ${homeWins ? loser : "text-mist-100"} ${awayWins ? "font-semibold" : ""}`}>
            <TeamCrest url={fixture.away.crest} name={fixture.away.name} size={22} />
            <span className="truncate">{fixture.away.name}</span>
          </span>
          <span className={`score text-xl leading-none ${hasScore ? (homeWins ? loser : "text-mist-50") : "text-mist-600"}`}>
            {hasScore ? fixture.score!.away : ""}
          </span>
        </div>
      </div>

      {/* Telas maiores: mandante | placar | visitante, como um placar de TV */}
      <div className="hidden grid-cols-[4.5rem_1fr_auto_1fr_0.75rem] items-center gap-3 sm:grid lg:grid-cols-[5.5rem_1fr_auto_1fr_1.25rem] lg:gap-4">
        <div className="leading-tight">
          {showDate ? (
            <span className="block font-display text-xs font-bold text-mist-500">
              {formatShortDate(fixture.kickoff)}
            </span>
          ) : null}
          {fixture.status !== "scheduled" ? <StatusPill fixture={fixture} /> : null}
        </div>
        <span
          className={`flex min-w-0 items-center justify-end gap-3 text-right text-[1.02rem] ${
            awayWins ? loser : "text-mist-50"
          } ${homeWins ? "font-semibold" : ""}`}
        >
          <span className="truncate">{fixture.home.name}</span>
          <TeamCrest url={fixture.home.crest} name={fixture.home.name} size={30} />
        </span>
        <ScoreBox fixture={fixture} />
        <span
          className={`flex min-w-0 items-center gap-3 text-[1.02rem] ${homeWins ? loser : "text-mist-50"} ${
            awayWins ? "font-semibold" : ""
          }`}
        >
          <TeamCrest url={fixture.away.crest} name={fixture.away.name} size={30} />
          <span className="truncate">{fixture.away.name}</span>
        </span>
        <span aria-hidden="true" className="text-mist-600 transition-transform group-hover:translate-x-0.5 group-hover:text-flood-300">
          {href ? "›" : ""}
        </span>
      </div>
      {meta ? <p className="mt-1.5 hidden text-center text-[0.75rem] text-mist-600 sm:block">{meta}</p> : null}
      {footer}
      <span className="sr-only">{statusLabel[fixture.status]}</span>
    </>
  );

  const rowClass = `group relative block py-3 pl-5 pr-4 transition-colors ${
    fixture.status === "live" ? "bg-live-500/[0.04]" : ""
  } hover:bg-ink-800/60`;

  return (
    <li>
      {href ? (
        <Link href={href} className={rowClass} aria-label={`${fixture.home.name} x ${fixture.away.name}: detalhes da partida`}>
          {body}
        </Link>
      ) : (
        <div className={rowClass}>{body}</div>
      )}
    </li>
  );
}
