"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { site } from "@/lib/site";

const LIVE_VERSION_URL = `${site.basePath}/api/live`;

/**
 * Mantém o placar ao vivo atualizado sem recarregar a página nem perder a
 * rolagem. Pausa com a aba oculta.
 *
 * A cada `intervalMs` consulta /api/live, uma resposta mínima e cacheada na CDN
 * (a função roda no máximo uma vez a cada 30 s para todos os visitantes). Só
 * chama router.refresh() — que é uma renderização completa no servidor —
 * quando a versão do placar muda: gol, início ou fim de jogo. Antes, cada aba
 * aberta renderizava a página inteira a cada minuto, mesmo sem nada mudar.
 *
 * O placar, o status e o relógio já se atualizam sozinhos no navegador
 * (components/sports/live-score.tsx). Isto fica só na página da partida, para
 * trazer lances e estatísticas quando o placar muda. Nunca use no layout.
 */
export function LiveRefresh({ active, intervalMs = 60_000 }: { active: boolean; intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;

    let lastVersion: string | null = null;
    let refreshAgain = false;
    let inFlight = false;
    let cancelled = false;

    const check = async () => {
      if (document.visibilityState !== "visible" || inFlight) return;
      inFlight = true;
      try {
        const response = await fetch(LIVE_VERSION_URL, { cache: "no-store" });
        if (!response.ok) return;
        const { version } = (await response.json()) as { version?: unknown };
        if (cancelled || typeof version !== "string") return;
        if (lastVersion !== null && version !== lastVersion) {
          router.refresh();
          refreshAgain = true;
        } else if (refreshAgain) {
          // A página fica até 30 s na CDN e os dados até 60 s no cache do
          // servidor: a renderização logo após a mudança pode vir sem ela.
          // Uma segunda renderização no intervalo seguinte garante o placar novo.
          router.refresh();
          refreshAgain = false;
        }
        // A primeira resposta só marca a referência: a página acabou de ser
        // renderizada com dados recentes.
        lastVersion = version;
      } catch {
        // Falha de rede: tenta de novo no próximo intervalo, sem renderizar.
      } finally {
        inFlight = false;
      }
    };

    void check();
    const id = window.setInterval(check, intervalMs);
    document.addEventListener("visibilitychange", check);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, [active, intervalMs, router]);

  return null;
}
