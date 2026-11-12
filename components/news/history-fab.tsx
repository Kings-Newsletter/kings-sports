"use client";

import Link from "next/link";
import { History, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { LinkPending } from "@/components/ui/link-pending";

export type HistoryEntry = {
  day: string;
  label: string;
  count: number;
  href: string;
  latest: boolean;
};

const STEP = 15;

/**
 * Botão flutuante com o histórico de edições de notícias. Abre um painel que sobe
 * do canto da tela, sem bloquear a página: fecha com Esc, com o X, ao clicar fora
 * ou ao escolher uma edição.
 */
export function HistoryFab({ entries, current }: { entries: HistoryEntry[]; current?: string }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(STEP);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (returnFocus: boolean) => {
      setOpen(false);
      if (returnFocus) buttonRef.current?.focus({ preventScroll: true });
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);

    const panel = panelRef.current;
    const first =
      panel?.querySelector<HTMLElement>('[aria-current="page"]') ?? panel?.querySelector<HTMLElement>("a, button");
    first?.focus({ preventScroll: true });
    // Rola só a lista do painel até a edição marcada (scrollIntoView rolaria a página).
    const list = first?.closest<HTMLElement>("[data-history-scroll]");
    if (list && first) list.scrollTop = Math.max(0, first.offsetTop - list.offsetTop - 48);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  if (entries.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Fechar histórico de edições" : "Abrir histórico de edições"}
        title="Histórico de edições"
        aria-expanded={open}
        aria-controls="historico-edicoes"
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 grid size-13 place-items-center rounded-full bg-flood-500 text-white shadow-[0_8px_24px_rgb(37_99_235/0.45)] transition-[background-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:bg-flood-600 active:scale-95 sm:right-6 sm:size-14"
      >
        {open ? <X aria-hidden="true" className="size-6" /> : <History aria-hidden="true" className="size-6" />}
        {!open ? (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 min-w-5 rounded-full border-2 border-ink-950 bg-gold-400 px-1 font-display text-[0.7rem] font-bold leading-4 text-ink-950 tabular-nums"
          >
            {entries.length > 99 ? "99+" : entries.length}
          </span>
        ) : null}
      </button>

      <div
        ref={panelRef}
        id="historico-edicoes"
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        inert={!open}
        className={`fixed inset-x-3 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4.25rem)] z-40 grid max-h-[65dvh] origin-bottom-right grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-card border border-line bg-ink-850 shadow-card-hover transition-[opacity,transform,visibility] ease-out sm:inset-x-auto sm:right-6 sm:max-h-[min(70dvh,34rem)] sm:w-[22rem] sm:bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4.75rem)] motion-reduce:transform-none ${
          open
            ? "visible translate-y-0 scale-100 opacity-100 duration-200 [transition-property:opacity,transform]"
            : "invisible translate-y-3 scale-[0.97] opacity-0 duration-150"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line-soft py-3 pl-5 pr-3">
          <h2 id={titleId} className="flex items-center gap-2 font-display text-xl font-bold text-mist-50">
            <History aria-hidden="true" className="size-5 text-flood-400" />
            Histórico de edições
          </h2>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              buttonRef.current?.focus({ preventScroll: true });
            }}
            aria-label="Fechar histórico de edições"
            className="grid size-10 place-items-center rounded-md border border-line text-mist-400 transition-colors hover:border-mist-600 hover:text-mist-100"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <div data-history-scroll className="grid content-start gap-3 overflow-y-auto overscroll-contain p-3">
          <p className="px-2 text-xs text-mist-500">
            {entries.length} {entries.length === 1 ? "edição publicada" : "edições publicadas"}
          </p>
          <ol>
            {entries.slice(0, shown).map((entry) => {
              const isCurrent = entry.day === current;
              return (
                <li key={entry.day} className="border-b border-line-soft last:border-b-0">
                  <Link
                    href={entry.href}
                    aria-current={isCurrent ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`grid gap-0.5 rounded-md px-3 py-2.5 transition-colors ${
                      isCurrent
                        ? "bg-flood-500/15 shadow-[inset_3px_0_0_var(--color-flood-500)]"
                        : "hover:bg-ink-800"
                    }`}
                  >
                    <strong className="font-display text-[1.05rem] font-semibold text-mist-50">{entry.label}</strong>
                    <span className="text-xs text-mist-500">
                      {entry.latest ? "Mais recente · " : ""}
                      {entry.count} {entry.count === 1 ? "matéria" : "matérias"}
                    </span>
                    <LinkPending />
                  </Link>
                </li>
              );
            })}
          </ol>
          {shown < entries.length ? (
            <button
              type="button"
              onClick={() => setShown((value) => value + STEP)}
              className="justify-self-start rounded-full border border-line px-3.5 py-1.5 text-xs font-medium text-mist-300 transition-colors hover:border-mist-600 hover:text-mist-100"
            >
              Mostrar mais edições
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}
