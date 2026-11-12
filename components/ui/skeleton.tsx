import type { ReactNode } from "react";

import { Container } from "@/components/ui/icons";
import { SportsLoader } from "@/components/ui/spinner";

/**
 * Esqueletos de carregamento. Reproduzem a silhueta dos cartões, linhas de
 * partida e tabelas do portal para a página não "pular" quando os dados chegam.
 * Ficam escondidos dos leitores de tela: quem anuncia é o <LoadingRegion>.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`skeleton block rounded-[4px] ${className}`} />;
}

/**
 * Envolve um bloco de esqueletos durante o carregamento de uma rota: acende a
 * barra animada no topo da tela, mostra um selo "Carregando…" com o giro logo
 * abaixo do cabeçalho e avisa os leitores de tela uma única vez.
 */
export function LoadingRegion({ label = "Carregando", children }: { label?: string; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="relative">
      <span className="route-progress" aria-hidden="true" />
      <div className="pointer-events-none sticky top-[5rem] z-40 flex h-0 justify-center xl:top-[8.25rem]">
        <span className="loading-badge inline-flex h-14 items-center gap-3 rounded-full border border-flood-500/40 bg-ink-900/95 pl-4 pr-5 font-display text-[1.05rem] font-semibold text-mist-100 shadow-card-hover backdrop-blur">
          <SportsLoader size={22} className="text-flood-300" />
          {label}…
        </span>
      </div>
      {children}
    </div>
  );
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Abertura das páginas internas (trilha, título, descrição e, se houver, filtro). */
export function PageHeaderSkeleton({ filter = false, icon = true }: { filter?: boolean; icon?: boolean }) {
  return (
    <div className="border-b border-line-soft">
      <Container className="pb-8 pt-8 sm:pb-10 sm:pt-12">
        <Skeleton className="mb-4 h-4 w-32" />
        <div className="flex items-center gap-4">
          {icon ? <Skeleton className="hidden size-14 shrink-0 rounded-[10px] sm:block" /> : null}
          <Skeleton className="h-10 w-64 max-w-full sm:h-14 sm:w-80" />
        </div>
        <div className="mt-4 max-w-[62ch] space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        {filter ? <FilterSkeleton className="mt-6" /> : null}
      </Container>
    </div>
  );
}

/** Fileira de pílulas do filtro por modalidade. */
export function FilterSkeleton({ className = "" }: { className?: string }) {
  const widths = ["w-16", "w-24", "w-20", "w-24", "w-16", "w-28", "w-20"];
  return (
    <div className={`flex gap-2 overflow-hidden pb-2 ${className}`}>
      {widths.map((w, i) => (
        <Skeleton key={i} className={`h-7 shrink-0 rounded-full ${w}`} />
      ))}
    </div>
  );
}

/** Título de seção com régua embaixo. */
export function SectionHeadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`mb-5 flex items-center justify-between gap-3 border-b border-line pb-3 ${className}`}>
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

/** Cartão de matéria (capa + texto). */
export function ArticleCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card border border-line-soft bg-ink-850/60 shadow-card">
      <Skeleton className={`rounded-none ${featured ? "aspect-[16/10]" : "aspect-[16/9]"}`} />
      <div className={`flex flex-1 flex-col ${featured ? "gap-3 p-5 sm:p-7" : "gap-2.5 p-5"}`}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className={featured ? "h-8 w-11/12" : "h-5 w-full"} />
        <Skeleton className={featured ? "h-8 w-2/3" : "h-5 w-4/5"} />
        <Skeleton className="mt-1 h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/5" />
      </div>
    </div>
  );
}

export function ArticleGridSkeleton({ count = 6, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {range(count).map((i) => (
        <ArticleCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Linha de matéria em lista (título + meta). */
export function ArticleListItemSkeleton() {
  return (
    <div className="space-y-2 border-b border-line-soft py-4 last:border-b-0">
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-2/3" />
    </div>
  );
}

/** Uma partida: horário à esquerda, dois times e o placar. */
export function FixtureRowSkeleton() {
  return (
    <li className="relative flex items-center gap-4 px-4 py-3.5">
      <div className="w-[4.5rem] shrink-0 space-y-1.5">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-5 w-12" />
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-6 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-36 max-w-full" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-6 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-28 max-w-full" />
        </div>
      </div>
      <Skeleton className="h-9 w-[5.5rem] shrink-0" />
    </li>
  );
}

/** Bloco de partidas de uma competição. */
export function FixtureGroupSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2.5">
        <Skeleton className="size-6 rounded-[4px]" />
        <Skeleton className="h-5 w-44" />
      </div>
      <ul className="scoreboard divide-y divide-line-soft overflow-hidden shadow-card">
        {range(rows).map((i) => (
          <FixtureRowSkeleton key={i} />
        ))}
      </ul>
    </div>
  );
}

/** Um dia do calendário/resultados: data na régua lateral e grupos de partidas. */
export function DayRailSkeleton({ groups = 2 }: { groups?: number }) {
  return (
    <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-2 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-x-6">
      <div className="flex flex-col items-end gap-1.5 pt-1">
        <Skeleton className="h-8 w-9 sm:h-11 sm:w-14" />
        <Skeleton className="h-3.5 w-8 sm:w-12" />
      </div>
      <div className="space-y-6 border-l border-line pb-10 pl-2.5 sm:pl-6">
        {range(groups).map((i) => (
          <FixtureGroupSkeleton key={i} rows={i === 0 ? 3 : 2} />
        ))}
      </div>
    </div>
  );
}

/** Tabela genérica (classificação, transferências). */
export function TableSkeleton({ rows = 8, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="surface overflow-hidden">
      <div className="flex items-center gap-4 border-b border-line-soft bg-ink-900/60 px-4 py-3">
        <Skeleton className="h-3.5 w-6" />
        <Skeleton className="h-3.5 flex-1" />
        {range(columns - 2).map((i) => (
          <Skeleton key={i} className="hidden h-3.5 w-8 sm:block" />
        ))}
        <Skeleton className="h-3.5 w-8" />
      </div>
      {range(rows).map((row) => (
        <div key={row} className="flex items-center gap-4 border-b border-line-soft px-4 py-3 last:border-b-0">
          <Skeleton className="h-4 w-6" />
          <div className="flex flex-1 items-center gap-2.5">
            <Skeleton className="size-6 shrink-0 rounded-full" />
            <Skeleton className={`h-4 ${row % 3 === 0 ? "w-40" : row % 3 === 1 ? "w-32" : "w-36"} max-w-full`} />
          </div>
          {range(columns - 2).map((i) => (
            <Skeleton key={i} className="hidden h-4 w-8 sm:block" />
          ))}
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
}

/** Cartão de pessoa (jogador, piloto): retrato grande e nome. */
export function PersonCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[8px] border border-line-soft bg-ink-850">
      <Skeleton className="aspect-[4/3.4] rounded-none" />
      <div className="flex flex-1 flex-col gap-2 border-t border-line-soft p-3 sm:p-3.5">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3.5 w-1/2" />
        <div className="mt-auto flex items-end justify-between pt-2">
          <Skeleton className="h-3.5 w-12" />
          <Skeleton className="h-6 w-8" />
        </div>
      </div>
    </div>
  );
}

export function PersonGridSkeleton({
  count = 6,
  className = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6",
}: {
  count?: number;
  /** Classes da grade inteira (substitui a padrão). */
  className?: string;
}) {
  return (
    <div className={className}>
      {range(count).map((i) => (
        <PersonCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Ladrilho com escudo (times, seleções). */
export function CrestTileSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-[8px] border border-line-soft bg-ink-850 p-3 sm:flex-col sm:gap-3 sm:p-4">
      <Skeleton className="size-12 shrink-0 rounded-[8px] sm:size-[4.5rem]" />
      <div className="w-full space-y-1.5 sm:flex sm:flex-col sm:items-center">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function CrestGridSkeleton({ count = 12, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`grid gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 ${className}`}>
      {range(count).map((i) => (
        <CrestTileSkeleton key={i} />
      ))}
    </div>
  );
}

/** Cartão compacto com ícone e duas linhas (competições, atalhos). */
export function TileSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-card border border-line-soft bg-ink-850 p-4 shadow-card">
      <Skeleton className="size-12 shrink-0 rounded-[8px]" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
      </div>
    </div>
  );
}

/** Quadro de ranking (estatísticas): título e lista curta de líderes. */
export function StatBoardSkeleton() {
  return (
    <div className="surface p-5">
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className="mt-2 h-6 w-44" />
      <div className="mt-5 space-y-3">
        {range(5).map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-5" />
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Abertura das fichas (time, atleta, piloto, competição, partida). */
export function ProfileHeroSkeleton({ round = false }: { round?: boolean }) {
  return (
    <div className="border-b border-line-soft">
      <Container className="pb-8 pt-8 sm:pb-10 sm:pt-12">
        <Skeleton className="mb-6 h-4 w-48" />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Skeleton
            className={`size-24 shrink-0 sm:size-32 ${round ? "rounded-full" : "rounded-[10px]"}`}
          />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-72 max-w-full sm:h-12" />
            <div className="flex flex-wrap gap-2 pt-1">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

/** Faixa de números-chave (ficha técnica). */
export function StatStripSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {range(count).map((i) => (
        <div key={i} className="surface space-y-2 p-4">
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-8 w-14" />
        </div>
      ))}
    </div>
  );
}

/** Texto corrido (corpo de matéria, biografia). */
export function ProseSkeleton({ paragraphs = 4 }: { paragraphs?: number }) {
  const lines = ["w-full", "w-full", "w-11/12", "w-4/6"];
  return (
    <div className="space-y-7">
      {range(paragraphs).map((p) => (
        <div key={p} className="space-y-2.5">
          {lines.map((w, i) => (
            <Skeleton key={i} className={`h-[1.05rem] ${w}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
