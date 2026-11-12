import Link from "next/link";

import { sports } from "@/lib/sports";
import { LinkPending } from "@/components/ui/link-pending";
import { SportIcon } from "@/components/ui/sport-icon";

/**
 * Filtro por modalidade via query string (?sport=futebol).
 * Server-rendered: sem estado no cliente, links compartilháveis e indexáveis.
 */
export function SportFilter({
  basePath,
  active,
  extraParams,
  allLabel = "Todas",
}: {
  basePath: string;
  active?: string;
  extraParams?: Record<string, string | undefined>;
  allLabel?: string;
}) {
  const withParams = (sport?: string) => {
    const params = new URLSearchParams();
    if (sport) params.set("sport", sport);
    for (const [key, value] of Object.entries(extraParams ?? {})) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const options = [{ slug: undefined, name: allLabel }, ...sports];

  return (
    <nav aria-label="Filtrar por modalidade">
      <ul className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto pb-2">
        {options.map((sport) => {
          const isActive = active === sport.slug || (!active && !sport.slug);
          return (
            <li key={sport.slug ?? "all"}>
              <Link
                href={withParams(sport.slug)}
                aria-current={isActive ? "true" : undefined}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-flood-500/60 bg-flood-500/15 text-flood-300"
                    : "border-line bg-ink-850/60 shadow-card text-mist-400 hover:border-mist-600 hover:text-mist-100"
                }`}
              >
                <LinkPending>
                  <SportIcon sport={sport.slug ?? "todos"} className="size-3.5" />
                </LinkPending>
                {sport.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
