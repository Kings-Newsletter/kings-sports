"use client";

import { useLinkStatus } from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Spinner } from "@/components/ui/spinner";

/**
 * Sinal de carregamento de um <Link>. Vai dentro do link: enquanto a próxima
 * página é preparada, acende a barra fina no topo da tela e, se houver
 * `children`, troca esse conteúdo (normalmente o ícone) por um giro.
 *
 * Cobre o que o loading.tsx não cobre: trocar só a query string (filtro de
 * modalidade, mês, edição) mantém a página antiga na tela até a nova chegar.
 */
export function LinkPending({ children }: { children?: ReactNode }) {
  const { pending } = useLinkStatus();
  // Só mostra depois de um instante: navegação já pré-carregada não pisca.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!pending) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), 120);
    return () => window.clearTimeout(timer);
  }, [pending]);

  return (
    <>
      {children !== undefined ? visible ? <Spinner /> : children : null}
      {visible ? createPortal(<span className="route-progress" aria-hidden="true" />, document.body) : null}
    </>
  );
}
