"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { Container, KingsLogo } from "@/components/ui/icons";
import { LinkPending } from "@/components/ui/link-pending";
import { NavIcon } from "@/components/ui/nav-icon";
import { allNav, primaryNav, secondaryNav, site } from "@/lib/site";

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  // Fichas de seleção usam a rota de times: o item ativo é "Seleções".
  if (pathname.startsWith("/times/selecoes/")) return href === "/selecoes";
  if (pathname.startsWith("/atletas/selecoes/")) return href === "/selecoes";
  if (pathname.startsWith("/atletas/")) return href === "/jogadores";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const menu = useRef<HTMLDetailsElement>(null);

  // Fecha o menu móvel ao trocar de página; o cabeçalho persiste entre rotas.
  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-line-soft bg-ink-950/95 backdrop-blur-md">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="group flex min-w-0 items-center gap-2.5 leading-none" aria-label={`${site.name}, página inicial`}>
            <KingsLogo className="size-9 shrink-0" />
            <LinkPending />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-display text-[1.5rem] font-extrabold uppercase leading-none tracking-wide text-mist-50">
                King&apos;s Sports
              </span>
              <span className="mt-1 hidden truncate text-[0.75rem] text-mist-500 sm:block">{site.tagline}</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/resultados"
              className="hidden items-center gap-2 rounded-full border border-live-500/40 bg-live-500/10 px-3 py-1.5 font-display text-[0.95rem] font-bold text-live-400 transition-colors hover:bg-live-500/20 sm:inline-flex"
            >
              <span className="inline-flex size-1.5 rounded-full bg-live-400" aria-hidden="true" />
              Ao vivo
              <LinkPending />
            </Link>

            <details ref={menu} className="group xl:hidden">
              <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-[6px] border border-line text-mist-200 transition-colors hover:bg-ink-800 [&::-webkit-details-marker]:hidden">
                <Menu className="size-5 group-open:hidden" aria-hidden="true" />
                <X className="hidden size-5 group-open:block" aria-hidden="true" />
                <span className="sr-only">Abrir menu</span>
              </summary>

              <div className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-line bg-ink-900 px-4 pb-8 pt-3 shadow-2xl">
                <nav aria-label="Navegação móvel">
                  <ul className="grid gap-0.5 sm:grid-cols-2 sm:gap-x-4">
                    {allNav.map((item) => {
                      const active = isActive(item.href, pathname);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className={`flex items-center gap-3 rounded-[6px] px-3 py-3 transition-colors ${
                              active ? "bg-flood-500/15 text-flood-300" : "text-mist-200 hover:bg-ink-800"
                            }`}
                          >
                            <span className="grid size-5 place-items-center text-flood-400">
                              <LinkPending>
                                <NavIcon href={item.href} className="size-5" />
                              </LinkPending>
                            </span>
                            <span className="font-medium">{item.label}</span>
                            {item.description ? (
                              <span className="ml-auto max-w-[50%] text-right text-xs text-mist-500">{item.description}</span>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            </details>
          </div>
        </div>
      </Container>

      {/* Seções principais: barra própria, com ícones, em telas largas */}
      <div className="hidden border-t border-line-soft xl:block">
        <Container>
          <nav aria-label="Navegação principal" className="flex items-center justify-between gap-6">
            <ul className="flex items-center gap-1">
              {primaryNav.map((item) => {
                const active = isActive(item.href, pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`relative flex items-center gap-2 whitespace-nowrap px-3 py-3 font-display text-[1.05rem] font-bold transition-colors ${
                        active ? "text-mist-50" : "text-mist-300 hover:text-mist-50"
                      }`}
                    >
                      <span className={`grid size-4 place-items-center ${active ? "text-flood-400" : "text-mist-500"}`}>
                        <LinkPending>
                          <NavIcon href={item.href} className="size-4" />
                        </LinkPending>
                      </span>
                      {item.label}
                      {active ? <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-flood-500" /> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <ul className="flex items-center gap-4 text-sm text-mist-500">
              {secondaryNav.slice(0, 4).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href, pathname) ? "page" : undefined}
                    className={`whitespace-nowrap transition-colors hover:text-flood-300 ${isActive(item.href, pathname) ? "text-flood-300" : ""}`}
                  >
                    {item.label}
                    <LinkPending />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </div>
    </header>
  );
}
