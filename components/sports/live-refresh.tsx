"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Recarrega os dados do servidor a cada `intervalMs` enquanto houver jogo ao
 * vivo — sem recarregar a página nem perder a rolagem. Pausa com a aba oculta.
 */
export function LiveRefresh({ active, intervalMs = 15_000 }: { active: boolean; intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = window.setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [active, intervalMs, router]);

  return null;
}
