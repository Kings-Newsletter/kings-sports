import Link from "next/link";

import { Portrait } from "@/components/sports/portrait";
import { TeamCrest } from "@/components/sports/team-crest";
import type { CommonsPhoto } from "@/lib/commons";

/**
 * Cartão de jogador ou piloto: retrato, nome, equipe e o número que o coloca
 * em destaque (gols, pontos, posição no campeonato).
 */
export function PersonCard({
  href,
  name,
  photo,
  team,
  crest,
  stat,
  rank,
  commons,
}: {
  href: string;
  name: string;
  photo?: string;
  team?: string;
  crest?: string;
  stat?: { label: string; value: string };
  /** Posição (no campeonato ou no ranking), mostrada sobre o retrato */
  rank?: number;
  /** Foto do Commons: tem prioridade sobre a do provedor */
  commons?: CommonsPhoto;
}) {
  return (
    <Link
      href={href}
      className="card-lift group flex h-full flex-col overflow-hidden rounded-[8px] border border-line-soft bg-ink-850"
    >
      <div className="relative aspect-[4/3.4] overflow-hidden bg-[linear-gradient(180deg,var(--color-ink-800),var(--color-ink-900))]">
        <Portrait
          photo={commons?.src ?? photo}
          cover={Boolean(commons)}
          crest={crest}
          name={name}
        />
        {rank ? (
          <span className="score absolute left-2.5 top-2.5 rounded-[4px] bg-ink-950/75 px-1.5 py-0.5 text-[1.6rem] leading-none text-mist-50">{rank}</span>
        ) : null}
        {crest && (photo || commons) ? (
          <span className="absolute right-3 top-3">
            <TeamCrest url={crest} name={team ?? name} size={26} />
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-line-soft p-3 sm:p-3.5">
        <p className="font-display text-[1.05rem] font-bold leading-tight text-mist-50 [overflow-wrap:anywhere] sm:text-[1.2rem] group-hover:text-flood-300">{name}</p>
        {team ? <p className="break-words text-[0.8125rem] leading-tight text-mist-400">{team}</p> : null}
        {stat ? (
          <p className="mt-auto flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 pt-2">
            <span className="text-[0.8125rem] text-mist-500">{stat.label}</span>
            <span className="score text-[1.35rem] leading-none text-flood-300 sm:text-[1.5rem]">{stat.value}</span>
          </p>
        ) : null}
      </div>
    </Link>
  );
}
