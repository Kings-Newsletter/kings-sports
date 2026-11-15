import NextLink from "next/link";
import type { ComponentProps } from "react";

/**
 * Link do portal: o `next/link` com prefetch desligado por padrão.
 *
 * Com prefetch, cada link que aparece na tela pede a rota ao servidor em
 * segundo plano. As rotas do portal têm `loading.tsx` e muitas são dinâmicas,
 * então cada pedido vira uma renderização (Active CPU na Vercel) — uma visita
 * à home disparava dezenas. Sem prefetch, a rota só é pedida no clique; o
 * `loading.tsx` aparece na hora, então a navegação continua com resposta
 * imediata.
 *
 * Para reativar num link específico, passe `prefetch` explicitamente.
 */
export default function Link({ prefetch = false, ...props }: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={prefetch} {...props} />;
}
