"use client";

import { LiveClock } from "@/components/sports/live-clock";
import { useLiveFixture } from "@/components/sports/live-score";
import { liveClockText } from "@/lib/live-clock";
import type { Fixture } from "@/lib/types";

const statusLabel: Record<Fixture["status"], string> = {
  scheduled: "Agendado",
  live: "Ao vivo",
  finished: "Encerrado",
  postponed: "Adiado",
  cancelled: "Cancelado",
};

/** Selo de status: relógio ao vivo, "Fim", "Adiado"… */
export function StatusPill({ fixture: initial }: { fixture: Fixture }) {
  const fixture = useLiveFixture(initial);
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
        className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[3px] px-1.5 py-0.5 font-display text-[0.8125rem] font-bold leading-none ${
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
      <span className="font-display text-[0.875rem] font-semibold text-mist-500 whitespace-nowrap">
        {fixture.clock ?? "Fim"}
      </span>
    );
  }
  if (fixture.status === "postponed" || fixture.status === "cancelled") {
    return (
      <span className="font-display text-[0.875rem] font-semibold text-gold-400 whitespace-nowrap">
        {statusLabel[fixture.status]}
      </span>
    );
  }
  return null;
}
