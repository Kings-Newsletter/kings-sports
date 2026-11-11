import Link from "next/link";

import { Container } from "@/components/ui/icons";
import { NavIcon } from "@/components/ui/nav-icon";

/**
 * Abertura das páginas internas: trilha de navegação, ícone da seção, título
 * em corpo de placar e uma frase do que a página mostra.
 */
export function PageHeader({
  title,
  description,
  section,
  children,
}: {
  title: string;
  description?: string;
  /** Endereço da seção (ex.: "/times"): define o ícone e a trilha. */
  section?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-line-soft">
      <Container className="pb-8 pt-8 sm:pb-10 sm:pt-12">
        <nav aria-label="Trilha" className="mb-4 text-sm text-mist-500">
          <Link href="/" className="hover:text-flood-300">
            Início
          </Link>
          <span aria-hidden="true" className="mx-2 text-mist-600">
            /
          </span>
          <span className="text-mist-300">{title}</span>
        </nav>
        <div className="flex items-center gap-4">
          {section ? (
            <span className="hidden size-14 shrink-0 place-items-center rounded-[10px] bg-flood-500/15 text-flood-400 ring-1 ring-flood-500/30 sm:grid">
              <NavIcon href={section} className="size-7" />
            </span>
          ) : null}
          <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] font-extrabold leading-none text-mist-50">{title}</h1>
        </div>
        {description ? (
          <p className="mt-3 max-w-[62ch] text-[0.95rem] leading-relaxed text-mist-400 sm:text-base">{description}</p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </Container>
    </div>
  );
}
