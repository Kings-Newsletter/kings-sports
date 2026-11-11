import { MapPin } from "lucide-react";

import { FixtureRow } from "@/components/sports/fixture-row";
import { trackForFixture, type TrackMap } from "@/lib/f1-media";
import { formatShortDate } from "@/lib/format";
import type { Fixture } from "@/lib/types";

/** "F1 · São Paulo — Corrida" → "São Paulo" */
function placeOf(fixture: Fixture) {
  return fixture.title?.match(/^F1 · (.+?) — /)?.[1] ?? fixture.venue ?? "Etapa";
}

/** Desenho do traçado, em contorno branco sobre o fundo escuro. */
export function TrackDrawing({ track, className = "" }: { track: TrackMap; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={track.map}
      alt={`Traçado de ${track.name}`}
      loading="lazy"
      className={`object-contain ${className}`}
    />
  );
}

/**
 * Sessões de F1 agrupadas por fim de semana de corrida, cada grupo com o
 * desenho da pista, o nome do circuito e as sessões em ordem.
 */
export function RaceWeekends({ fixtures }: { fixtures: Fixture[] }) {
  const weekends: { place: string; fixtures: Fixture[] }[] = [];
  for (const fixture of fixtures) {
    const place = placeOf(fixture);
    const last = weekends.at(-1);
    if (last?.place === place) last.fixtures.push(fixture);
    else weekends.push({ place, fixtures: [fixture] });
  }

  return (
    <div className="space-y-5">
      {weekends.map((weekend, index) => {
        const first = weekend.fixtures[0]!;
        const lastSession = weekend.fixtures.at(-1)!;
        const track = trackForFixture(first);
        return (
          <section
            key={`${weekend.place}-${index}`}
            className="grid overflow-hidden rounded-[10px] border border-line-soft bg-ink-850 sm:grid-cols-[14rem_minmax(0,1fr)]"
          >
            <div className="flex flex-col gap-3 border-b border-line-soft p-4 sm:border-b-0 sm:border-r">
              <div>
                <h3 className="font-display text-[1.5rem] font-extrabold leading-none text-mist-50">GP de {weekend.place}</h3>
                <p className="mt-1.5 flex items-start gap-1.5 text-[0.8125rem] text-mist-400">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-flood-400" aria-hidden="true" />
                  {first.venue}
                </p>
                <p className="mt-1 text-[0.8125rem] text-mist-500">
                  {formatShortDate(first.kickoff)}
                  {formatShortDate(first.kickoff) !== formatShortDate(lastSession.kickoff) ? ` a ${formatShortDate(lastSession.kickoff)}` : ""}
                </p>
              </div>
              {track ? <TrackDrawing track={track} className="mx-auto aspect-[4/3] w-full max-w-[13rem]" /> : null}
            </div>
            <ul className="divide-y divide-line-soft">
              {weekend.fixtures.map((fixture) => (
                <FixtureRow key={fixture.id} fixture={fixture} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
