import type { Fixture } from "@/lib/types";

/** Campos do jogo que mudam durante a partida e chegam por /api/live. */
export type LivePatch = Pick<Fixture, "status" | "score" | "clock" | "updatedAt" | "result">;

export type LivePayload = {
  /** Muda só com gol, início/fim de jogo ou resultado (sem o relógio). */
  version: string;
  fixtures: Record<string, LivePatch>;
};

/** Janela em que um jogo agendado já pode virar "ao vivo". */
const PRE_KICKOFF_MS = 15 * 60 * 1000;
const POST_KICKOFF_MS = 30 * 60 * 1000;

/** O jogo pode mudar de placar ou de status agora? (mesma regra do needsLiveRefresh) */
export function isLiveCandidate(fixture: Pick<Fixture, "status" | "kickoff">, now = Date.now()): boolean {
  if (fixture.status === "live") return true;
  if (fixture.status !== "scheduled") return false;
  const untilKickoff = new Date(fixture.kickoff).getTime() - now;
  return untilKickoff < PRE_KICKOFF_MS && untilKickoff > -POST_KICKOFF_MS;
}

export function toLivePatch(fixture: Fixture): LivePatch {
  return {
    status: fixture.status,
    score: fixture.score,
    clock: fixture.clock,
    updatedAt: fixture.updatedAt,
    result: fixture.result,
  };
}

export function liveFingerprint(id: string, patch: LivePatch): string {
  const score = patch.score ? `${patch.score.home}-${patch.score.away}` : "";
  return `${id}:${patch.status}:${score}:${patch.result ?? ""}`;
}
