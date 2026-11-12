import Link from "next/link";

import { espnResized } from "@/lib/images";

/** Bloco de time, seleção ou competição: escudo (ou bandeira) grande e nome. */
export function CrestTile({
  href,
  name,
  image,
  detail,
  round = false,
}: {
  href: string;
  name: string;
  image?: string;
  detail?: string;
  /** Bandeiras ficam melhores em círculo */
  round?: boolean;
}) {
  return (
    <Link
      href={href}
      className="card-lift group flex items-center gap-3 rounded-[8px] border border-line-soft bg-ink-850 p-3 sm:flex-col sm:gap-3 sm:p-4 sm:text-center"
    >
      <span
        className={`grid size-12 shrink-0 place-items-center overflow-hidden bg-ink-800 ring-1 ring-line sm:size-[4.5rem] ${round ? "rounded-full" : "rounded-[8px]"}`}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.includes("espncdn.com") ? espnResized(image, 160) : image}
            alt=""
            loading="lazy"
            className={round ? "size-full object-cover" : "size-[72%] object-contain"}
          />
        ) : (
          <span className="font-display text-xl font-extrabold text-mist-500">{name.charAt(0)}</span>
        )}
      </span>
      <span className="min-w-0">
        <span className="block break-words font-display text-[1.05rem] font-bold leading-tight text-mist-100 group-hover:text-flood-300 sm:whitespace-normal">
          {name}
        </span>
        {detail ? <span className="mt-0.5 block text-[0.8125rem] text-mist-500">{detail}</span> : null}
      </span>
    </Link>
  );
}
