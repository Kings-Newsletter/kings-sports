/**
 * Texto do relógio de um evento ao vivo.
 *
 * O dado do provedor chega a cada 15 s. Entre uma coleta e outra, o componente
 * cliente só avança o que corre sem parar. Nunca inventa placar.
 *
 *  - F1 e eventos com duração: tempo decorrido desde o início (relógio real).
 *  - Futebol: minuto da fonte + minutos passados desde a coleta (no máximo 2),
 *    sem passar do fim do tempo. Acréscimos ("45+2'") e intervalo ficam como a
 *    fonte publicou.
 *  - Basquete/NFL: o cronômetro do jogo para a todo momento, então mostramos
 *    exatamente o da fonte, que chega a cada 15 s.
 */

export type LiveClockInput = {
  kickoff: string;
  updatedAt?: string;
  clock?: string;
  status: string;
  sport: string;
  kind?: string;
};

function elapsed(totalMs: number): string {
  const seconds = Math.max(0, Math.floor(totalMs / 1000));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function liveClockText(input: LiveClockInput, now = Date.now()): string {
  const { kickoff, updatedAt, clock, status, sport, kind } = input;
  if (status !== "live") return clock ?? "";

  if (kind === "event" || sport === "automobilismo") {
    const start = Date.parse(kickoff);
    return Number.isFinite(start) ? elapsed(now - start) : (clock ?? "Ao vivo");
  }

  if (!clock) return "Ao vivo";

  const anchor = updatedAt ? Date.parse(updatedAt) : now;
  // Se a coleta atrasou, não deixa o relógio disparar: no máximo 2 min de avanço.
  const sinceUpdate = Number.isFinite(anchor) ? Math.max(0, Math.min(now - anchor, 2 * 60_000)) : 0;

  // Futebol: "67'", ou acréscimo "45'+2'" (ESPN) / "45+2'". Nos acréscimos o
  // minuto não avança sozinho: mostra o que a fonte publicou.
  if (sport === "futebol" || clock.includes("'")) {
    const minute = clock.match(/^(\d+)'?(?:\+(\d+)'?)?$/);
    if (minute) {
      if (minute[2]) return `${minute[1]}+${minute[2]}'`;
      const base = Number(minute[1]);
      // Não passa do fim do tempo (45, 90, prorrogação): dali em diante só a fonte sabe.
      const limit = base <= 45 ? 45 : base <= 90 ? 90 : base <= 105 ? 105 : 120;
      return `${Math.min(base + Math.floor(sinceUpdate / 60_000), limit)}'`;
    }
  }

  // Basquete e futebol americano: o cronômetro da fonte, como veio.
  return clock;
}
