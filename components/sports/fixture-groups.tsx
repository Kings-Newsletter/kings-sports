import Link from "next/link";

import { FixtureRow } from "@/components/sports/fixture-row";
import { CompetitionLogo } from "@/components/sports/competition-logo";
import { catalog } from "@/lib/catalog";
import type { Fixture } from "@/lib/types";

function priority(slug: string): number {
  return catalog.find((item) => item.slug === slug)?.priority ?? 999;
}

/**
 * Partidas agrupadas por competição, na ordem editorial do catálogo
 * (Brasileirão primeiro), cada grupo com cabeçalho e link para a tabela.
 */
export function FixtureGroups({
  fixtures,
  showDate = false,
  notes,
}: {
  fixtures: Fixture[];
  showDate?: boolean;
  notes?: Map<string, string>;
}) {
  const groups = new Map<string, Fixture[]>();
  for (const fixture of fixtures) {
    const list = groups.get(fixture.competition) ?? [];
    list.push(fixture);
    groups.set(fixture.competition, list);
  }
  const ordered = [...groups.entries()].sort(([a], [b]) => priority(a) - priority(b));

  return (
    <div className="space-y-6">
      {ordered.map(([slug, list]) => {
        const entry = catalog.find((item) => item.slug === slug);
        const live = list.filter((fixture) => fixture.status === "live").length;
        const isRacing = list[0]?.sport === "automobilismo";
        return (
          <section key={slug} aria-labelledby={`grupo-${slug}`}>
            <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
              <h3 id={`grupo-${slug}`} className="flex min-w-0 items-center gap-2.5">
                <CompetitionLogo slug={slug} size={30} />
                <Link href={`/competicoes/${slug}`} className="min-w-0 font-display text-lg font-bold leading-tight text-mist-100 hover:text-flood-300">
                  {entry?.name ?? slug}
                </Link>
                {live > 0 ? (
                  <span className="shrink-0 rounded-[3px] bg-live-500/15 px-1.5 py-0.5 font-display text-xs font-bold text-live-400">
                    {live} ao vivo
                  </span>
                ) : null}
              </h3>
              <Link
                href={`/competicoes/${slug}`}
                className="-my-2 hidden shrink-0 py-2 text-xs font-medium text-mist-500 transition-colors hover:text-flood-300 sm:block"
              >
                {isRacing ? "Classificação e etapas" : "Tabela e jogos"}
              </Link>
            </div>
            <ul className="scoreboard divide-y divide-line-soft overflow-hidden shadow-card">
              {list.map((fixture) => (
                <FixtureRow key={fixture.id} fixture={fixture} showDate={showDate} note={notes?.get(fixture.id)} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
