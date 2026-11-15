"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

import { formatTime } from "@/lib/format";
import { isLiveCandidate, type LivePayload } from "@/lib/live";
import { site } from "@/lib/site";
import type { Fixture } from "@/lib/types";

/**
 * Placar ao vivo atualizado só no navegador.
 *
 * Um único "store" por aba consulta /api/live (JSON pequeno, cacheado na CDN)
 * enquanto houver na tela algum jogo ao vivo ou prestes a começar. Cada
 * placar, status e relógio lê dali o dado mais recente do seu jogo. Nenhuma
 * renderização no servidor acontece para atualizar o placar.
 *
 * Sem dado novo (ou se a consulta falhar), vale o que veio do servidor.
 */

const LIVE_URL = `${site.basePath}/api/live`;
const POLL_MS = 30_000;

type Snapshot = LivePayload["fixtures"] | null;

let snapshot: Snapshot = null;
let watchers = 0;
let timer: number | undefined;
let inFlight = false;
const listeners = new Set<() => void>();

async function poll() {
  if (inFlight || document.visibilityState !== "visible") return;
  inFlight = true;
  try {
    const response = await fetch(LIVE_URL, { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as Partial<LivePayload>;
    if (payload.fixtures && typeof payload.fixtures === "object") {
      snapshot = payload.fixtures;
      for (const listener of listeners) listener();
    }
  } catch {
    // Falha de rede: mantém o último dado e tenta no próximo intervalo.
  } finally {
    inFlight = false;
  }
}

function onVisible() {
  if (document.visibilityState === "visible") void poll();
}

/** Liga a consulta enquanto houver pelo menos um jogo ao vivo na tela. */
function watch() {
  watchers += 1;
  if (watchers === 1) {
    void poll();
    timer = window.setInterval(poll, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
  }
  return () => {
    watchers -= 1;
    if (watchers === 0) {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => snapshot;
const getServerSnapshot = (): Snapshot => null;

/** O jogo com placar, status e relógio mais recentes. */
export function useLiveFixture(fixture: Fixture): Fixture {
  const candidate = isLiveCandidate(fixture);
  useEffect(() => (candidate ? watch() : undefined), [candidate]);
  const live = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const patch = live?.[fixture.id];
  return useMemo(() => (patch ? { ...fixture, ...patch } : fixture), [fixture, patch]);
}

/** Um lado do placar (número), ou `empty` antes do jogo ter placar. */
export function LiveScoreValue({
  fixture: initial,
  side,
  empty = "",
}: {
  fixture: Fixture;
  side: "home" | "away";
  empty?: string;
}) {
  const fixture = useLiveFixture(initial);
  const value = fixture.score?.[side];
  return <>{typeof value === "number" ? value : empty}</>;
}

/** Placar em texto ("2–1"), ou `empty` sem placar. */
export function LiveScoreText({
  fixture: initial,
  separator = "–",
  empty = "–",
}: {
  fixture: Fixture;
  separator?: string;
  empty?: string;
}) {
  const fixture = useLiveFixture(initial);
  return <>{fixture.score ? `${fixture.score.home}${separator}${fixture.score.away}` : empty}</>;
}

/** Caixa central da linha de jogo: hora antes do início, placar depois. */
export function LiveScoreBox({ fixture: initial }: { fixture: Fixture }) {
  const fixture = useLiveFixture(initial);
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

/** Placar central do guia do dia: hora antes do início, placar depois. */
export function LiveCenterBox({ fixture: initial }: { fixture: Fixture }) {
  const fixture = useLiveFixture(initial);
  const hasScore = typeof fixture.score?.home === "number";
  if (!hasScore) {
    return <span className="score text-lg text-mist-300">{formatTime(fixture.kickoff)}</span>;
  }
  return (
    <span className="score inline-flex items-baseline gap-1.5 text-[1.5rem] leading-none text-mist-50">
      {fixture.score!.home}
      <span className="text-base text-mist-600">–</span>
      {fixture.score!.away}
    </span>
  );
}
