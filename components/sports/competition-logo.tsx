import { SportIcon } from "@/components/ui/sport-icon";
import { getCatalogEntry } from "@/lib/catalog";
import { espnResized } from "@/lib/images";

/** Logo da competição sobre um quadrado neutro; sem logo, o ícone do esporte. */
export function CompetitionLogo({
  slug,
  size = 28,
  className = "",
}: {
  slug: string;
  size?: number;
  className?: string;
}) {
  const entry = getCatalogEntry(slug);
  const box = { width: size, height: size };
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-[4px] bg-ink-800 ring-1 ring-line ${className}`}
      style={box}
    >
      {entry?.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={espnResized(entry.logo, size * 2)}
          alt=""
          width={Math.round(size * 0.72)}
          height={Math.round(size * 0.72)}
          loading="lazy"
          className="object-contain"
        />
      ) : (
        <SportIcon sport={entry?.sport} className="text-flood-400" style={{ width: size * 0.55, height: size * 0.55 }} />
      )}
    </span>
  );
}
