import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import { getSport } from "@/lib/sports";
import type { DailyBrief } from "@/lib/types";
import { SportIcon } from "@/components/ui/sport-icon";

/** "A rodada em 1 minuto": três frases por esporte, assinadas. */
export function DailyBriefs({ briefs, today }: { briefs: DailyBrief[]; today: string }) {
  if (briefs.length === 0) {
    return (
      <EmptyState
        title="A rodada de hoje ainda não saiu"
        description="Três frases por esporte sobre o que realmente importou, escritas pela redação. Publicada depois dos jogos."
      />
    );
  }

  const isOld = briefs[0]!.date !== today;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {briefs.map((brief) => {
        const sport = getSport(brief.sport);
        return (
          <article key={`${brief.date}-${brief.sport}`} className="scoreboard p-5 pl-6 shadow-card">
            <span className="status-bar bg-flood-500" aria-hidden="true" />
            <p className="flex items-center gap-2 font-display text-sm font-bold text-flood-400">
              <SportIcon sport={brief.sport} className="size-4" />
              {sport?.name ?? brief.sport}
            </p>
            <ol className="mt-3 space-y-2.5">
              {brief.lines.slice(0, 3).map((line, index) => (
                <li key={index} className="flex gap-3 text-[0.95rem] leading-snug text-mist-200">
                  <span className="score text-lg leading-none text-mist-600">{index + 1}</span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-mist-500">
              {brief.author}
              {isOld ? `, rodada de ${formatDate(`${brief.date}T12:00:00-03:00`)}` : null}
            </p>
          </article>
        );
      })}
    </div>
  );
}
