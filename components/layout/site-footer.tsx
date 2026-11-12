import { Mail, Newspaper } from "lucide-react";
import Link from "next/link";

import { Container, KingsLogo } from "@/components/ui/icons";
import { NavIcon } from "@/components/ui/nav-icon";
import { primaryNav, secondaryNav, site } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-line-soft bg-ink-900">
      <Container className="py-14">
        <div className="grid gap-12 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <KingsLogo className="size-9 shrink-0" />
              <span className="font-display text-xl font-extrabold uppercase tracking-wide text-mist-50">King&apos;s Sports</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-mist-400">{site.description}</p>
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-mist-500">
              Placares, tabelas e fotos vêm de provedores de dados (ESPN, SportAPI, OpenF1, Jolpica e TheSportsDB), com a
              fonte indicada. Texto editorial é assinado. Não publicamos odds nem conteúdo de apostas.
            </p>
            <a
              href={site.newsletterUrl}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-flood-300 hover:text-flood-400"
            >
              <Newspaper className="size-4" aria-hidden="true" />
              Leia também a King&apos;s Newsletter
            </a>
          </div>

          {[
            { title: "Cobertura", items: primaryNav },
            { title: "Mais", items: secondaryNav },
          ].map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="font-display text-lg font-bold text-mist-200">{column.title}</h2>
              <ul className="mt-4 grid gap-2.5 text-sm">
                {column.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="inline-flex items-center gap-2 text-mist-300 transition-colors hover:text-flood-300">
                      <NavIcon href={item.href} className="size-4 text-mist-500" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line-soft pt-6 text-xs text-mist-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name}. Todos os direitos reservados.
          </p>
          <p className="inline-flex items-center gap-2">
            <Mail className="size-3.5" aria-hidden="true" />
            Contato editorial:{" "}
            <a href={`mailto:${site.editorialEmail}`} className="text-mist-300 underline decoration-line underline-offset-4 hover:text-flood-300">
              {site.editorialEmail}
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
}
