import { getFixtures } from "@/lib/data";
import { liveFingerprint, toLivePatch, type LivePatch, type LivePayload } from "@/lib/live";

/**
 * Placar ao vivo em JSON, para o navegador atualizar só o placar, o status e
 * o relógio, sem renderizar a página no servidor.
 *
 * A resposta é estática e revalidada a cada 30 s (ISR + s-maxage na CDN): a
 * função roda no máximo uma vez a cada 30 s, para todos os visitantes juntos.
 *
 * Inclui, além dos jogos ao vivo, os que começam nos próximos minutos (para
 * virar "ao vivo" sem recarregar) e os que terminaram nas últimas horas (para
 * mostrar o placar final de quem estava com a página aberta).
 *
 * `version` ignora o relógio de propósito: muda só com gol, início ou fim de
 * jogo. A página da partida usa isso para buscar lances e estatísticas.
 */
export const revalidate = 30;

export async function GET() {
  const now = Date.now();
  const recent = await getFixtures({
    status: ["live", "scheduled", "finished"],
    from: new Date(now - 6 * 60 * 60 * 1000),
    to: new Date(now + 15 * 60 * 1000),
  });

  const fixtures: Record<string, LivePatch> = {};
  for (const fixture of recent) fixtures[fixture.id] = toLivePatch(fixture);

  const version = Object.entries(fixtures)
    .filter(([, patch]) => patch.status !== "scheduled")
    .map(([id, patch]) => liveFingerprint(id, patch))
    .sort()
    .join("|");

  const payload: LivePayload = { version, fixtures };
  return Response.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=30",
    },
  });
}
