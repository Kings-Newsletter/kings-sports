import Link from "next/link";

import { Container, KingsLogo } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <KingsLogo className="size-12" />
      <p className="kicker mt-6">Erro 404</p>
      <h1 className="mt-3 font-display text-3xl font-black tracking-tight text-mist-50 sm:text-4xl">
        Essa página saiu de campo
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-mist-400">
        O endereço não existe ou o conteúdo foi movido. Use a navegação principal ou volte ao
        início.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-flood-400 px-6 py-3 text-sm font-bold text-ink-950 transition-colors hover:bg-flood-300"
        >
          Voltar ao início
        </Link>
        <Link
          href="/noticias"
          className="rounded-lg border border-line px-6 py-3 text-sm font-semibold text-mist-200 transition-colors hover:border-flood-500/60 hover:text-flood-300"
        >
          Ver notícias
        </Link>
      </div>
    </Container>
  );
}
