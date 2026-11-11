import Link from "next/link";

import { LiveClock } from "@/components/sports/live-clock";
import { TeamCrest } from "@/components/sports/team-crest";
import { Container } from "@/components/ui/icons";
import { fixturePath } from "@/lib/match-path";
import { liveClockText } from "@/lib/live-clock";
import type { Fixture } from "@/lib/types";

/**
 * Faixa de placares ao vivo, logo abaixo do cabeçalho. Sem evento ao vivo,
 * informa isso em vez de exibir dados fictícios. O relógio corre a cada segundo.
 */
export function LiveStrip({ fixtures }: { fixtures: Fixture[] }) {
  const hasLive = fixtures.length > 0;
  // Sem jogo ao vivo, a faixa some: o selo "Ao vivo" do cabeçalho já leva aos resultados.
  if (!hasLive) return null;

  return (
    <div className={`border-b ${hasLive ? "border-live-500/30 bg-live-500/[0.06]" : "border-line-soft bg-ink-900/70"}`}>
      <Container>
        <div className="flex items-center gap-3 py-2">
          <span className="inline-flex shrink-0 items-center gap-2 font-display text-[0.95rem] font-bold text-live-400">
            <span className="relative flex size-2" aria-hidden="true">
              {hasLive ? (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-live-400 opacity-75" />
              ) : null}
              <span className="relative inline-flex size-2 rounded-full bg-live-500" />
            </span>
            {hasLive ? `${fixtures.length} ao vivo` : "Ao vivo"}
          </span>

          <div className="h-4 w-px bg-line" aria-hidden="true" />

          {hasLive ? (
            <ul className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
              {fixtures.slice(0, 12).map((fixture) => {
                const href = fixturePath(fixture);
                const clock = {
                  kickoff: fixture.kickoff,
                  updatedAt: fixture.updatedAt,
                  clock: fixture.clock,
                  status: fixture.status,
                  sport: fixture.sport,
                  kind: fixture.kind,
                };
                const content =
                  fixture.home && fixture.away ? (
                    <>
                      <TeamCrest url={fixture.home.crest} name={fixture.home.name} size={16} />
                      <span className="font-medium text-mist-100">{fixture.home.shortName ?? fixture.home.name}</span>
                      <span className="score rounded-[3px] bg-ink-950 px-1.5 text-sm text-mist-50">
                        {fixture.score ? `${fixture.score.home}–${fixture.score.away}` : "–"}
                      </span>
                      <span className="font-medium text-mist-100">{fixture.away.shortName ?? fixture.away.name}</span>
                      <TeamCrest url={fixture.away.crest} name={fixture.away.name} size={16} />
                      <LiveClock
                        input={clock}
                        initial={liveClockText(clock)}
                        className="font-display text-xs font-bold text-live-400"
                        title="Relógio ao vivo"
                      />
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-mist-100">{fixture.title}</span>
                      <LiveClock
                        input={clock}
                        initial={liveClockText(clock)}
                        className="score text-xs font-bold text-live-400"
                        title="Tempo decorrido da sessão"
                      />
                    </>
                  );
                const chip =
                  "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[4px] border border-line bg-ink-900/80 px-2 py-1 text-xs transition-colors";
                return (
                  <li key={fixture.id}>
                    <Link href={href} className={`${chip} hover:border-live-500/50`}>
                      {content}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="min-w-0 flex-1 truncate text-xs text-mist-500">
              Nenhum evento ao vivo agora.{" "}
              <span className="text-mist-600">Quando a cobertura começar, os placares aparecem aqui e atualizam sozinhos.</span>
            </p>
          )}

          <Link
            href="/resultados"
            className="hidden shrink-0 text-xs font-medium text-mist-400 transition-colors hover:text-flood-300 sm:block"
          >
            Todos os resultados
          </Link>
        </div>
      </Container>
    </div>
  );
}
