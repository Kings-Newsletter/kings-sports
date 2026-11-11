import Link from "next/link";

import { AthletePhoto } from "@/components/sports/athlete-photo";
import { formatNumber } from "@/lib/format";
import type { StatBoard } from "@/lib/types";

/** Quadro de líderes: o primeiro em destaque, os demais com barra relativa ao líder. */
export function StatBoardCard({ board, competitionName }: { board: StatBoard; competitionName: string }) {
  const [first, ...rest] = board.leaders;
  if (!first) return null;
  const top = Math.max(first.value, ...rest.map((leader) => leader.value)) || 1;
  const show = (value: number, display?: string) => display ?? formatNumber(value);
  const name = (leader: (typeof board.leaders)[number], className: string) =>
    leader.athleteId ? (
      <Link href={`/atletas/${board.competition}/${leader.athleteId}`} className={`${className} hover:text-flood-300`}>
        {leader.athlete ?? leader.team}
      </Link>
    ) : (
      <span className={className}>{leader.athlete ?? leader.team}</span>
    );

  return (
    <section className="scoreboard overflow-hidden shadow-card">
      <header className="flex items-baseline justify-between gap-3 border-b border-line-soft px-5 py-3">
        <div className="min-w-0">
          <p className="truncate text-[0.8125rem] font-medium text-mist-500">{competitionName}</p>
          <h3 className="font-display text-xl font-extrabold leading-tight text-mist-50">
            {board.label ?? board.metric}
          </h3>
        </div>
        <span className="shrink-0 text-xs text-mist-600">{board.season}</span>
      </header>

      {/* Líder */}
      <div className="flex items-center gap-4 bg-[linear-gradient(110deg,rgb(37_99_235_/_0.16),transparent_60%)] px-5 py-4">
        <AthletePhoto photo={first.photo} crest={first.crest} name={first.athlete ?? first.team} size={64} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-bold leading-tight text-mist-50">
            {name(first, "")}
          </p>
          <p className="truncate text-sm text-mist-400">
            {first.athlete ? first.team : ""}
            {first.extra ? `, ${first.extra}` : ""}
          </p>
        </div>
        <span className="score text-4xl leading-none text-flood-300">{show(first.value, first.display)}</span>
      </div>

      {/* Demais */}
      <ol className="divide-y divide-line-soft/70">
        {rest.map((leader, index) => (
          <li key={`${leader.athlete ?? leader.team}-${index}`} className="flex items-center gap-3 px-5 py-2">
            <span className="score w-5 shrink-0 text-right text-sm text-mist-600">{index + 2}</span>
            <AthletePhoto photo={leader.photo} crest={leader.crest} name={leader.athlete ?? leader.team} size={30} />
            <span className="min-w-0 flex-1">
              {name(leader, "block truncate text-sm font-medium text-mist-100")}
              <span className="mt-1 block h-1 overflow-hidden rounded-full bg-ink-700" aria-hidden="true">
                <span className="block h-full rounded-full bg-flood-500/70" style={{ width: `${(leader.value / top) * 100}%` }} />
              </span>
            </span>
            <span className="score w-14 shrink-0 text-right text-base text-mist-100">{show(leader.value, leader.display)}</span>
          </li>
        ))}
      </ol>
      {board.source ? <p className="border-t border-line-soft px-5 py-2 text-[0.6875rem] text-mist-600">Fonte: {board.source}</p> : null}
    </section>
  );
}
