import Link from "next/link";

import { AthletePhoto } from "@/components/sports/athlete-photo";
import { NavIcon } from "@/components/ui/nav-icon";
import { getCatalogEntry } from "@/lib/catalog";
import type { DriverCard, PlayerCard } from "@/lib/directory";

function RailBlock({ title, href, linkLabel, children }: { title: string; href: string; linkLabel: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[8px] border border-line-soft bg-ink-850">
      <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-3">
        <h2 className="flex items-center gap-2 font-display text-[1.3rem] font-extrabold leading-none text-mist-50">
          <NavIcon href={href} className="size-[1.1rem] text-flood-400" />
          {title}
        </h2>
        <Link href={href} className="text-sm text-flood-300 underline decoration-flood-500/40 underline-offset-4 hover:text-flood-400">
          {linkLabel}
        </Link>
      </div>
      {children}
    </section>
  );
}

/**
 * Coluna lateral da capa: quem lidera cada liga e o topo do campeonato de F1,
 * sempre com foto.
 */
export function HomeRail({ players, drivers }: { players: { competition: string; players: PlayerCard[] }[]; drivers: DriverCard[] }) {
  const leaders = players.map((group) => group.players[0]).filter((player) => player !== undefined).slice(0, 5);

  return (
    <aside className="space-y-6" aria-label="Destaques">
      {leaders.length > 0 ? (
        <RailBlock title="Jogadores em destaque" href="/jogadores" linkLabel="Ver todos">
          <ul className="divide-y divide-line-soft">
            {leaders.map((player) => (
              <li key={player.id}>
                <Link href={player.href} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-800/60">
                  <AthletePhoto photo={player.commons?.src ?? player.photo} crest={player.crest} name={player.name} size={48} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-mist-50">{player.name}</span>
                    <span className="block truncate text-[0.8125rem] text-mist-500">
                      {getCatalogEntry(player.competition)?.shortName ?? player.competition}, {player.stat.label.toLowerCase()}
                    </span>
                  </span>
                  <span className="score text-[1.4rem] leading-none text-flood-300">{player.stat.value}</span>
                </Link>
              </li>
            ))}
          </ul>
        </RailBlock>
      ) : null}

      {drivers.length > 0 ? (
        <RailBlock title="Fórmula 1" href="/pilotos" linkLabel="Grid completo">
          <ol className="divide-y divide-line-soft">
            {drivers.map((driver) => (
              <li key={driver.href}>
                <Link href={driver.href} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-ink-800/60">
                  <span className="score w-5 text-right text-lg text-mist-500">{driver.position}</span>
                  <AthletePhoto photo={driver.photo} name={driver.name} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-mist-50">{driver.name}</span>
                    {driver.team ? <span className="block truncate text-[0.8125rem] text-mist-500">{driver.team}</span> : null}
                  </span>
                  <span className="text-right">
                    <span className="score block text-[1.2rem] leading-none text-mist-100">{driver.points ?? 0}</span>
                    <span className="text-[0.75rem] text-mist-500">pts</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </RailBlock>
      ) : null}
    </aside>
  );
}
