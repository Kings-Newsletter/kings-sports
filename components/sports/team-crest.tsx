import { espnResized } from "@/lib/images";

/** Versão pequena do escudo (2x o tamanho exibido, para telas de alta densidade). */
function resized(url: string, px: number): string {
  // TheSportsDB: variante "tiny" (50 px).
  if (/thesportsdb\.com/.test(url) && !/\/(tiny|small|medium)$/.test(url)) return `${url}/tiny`;
  return espnResized(url, px);
}

/**
 * Escudo do time. Decorativo: o nome do time sempre aparece ao lado, então o
 * alt é vazio. Sem escudo, mostra a inicial num círculo neutro para manter o
 * alinhamento.
 */
export function TeamCrest({ url, name, size = 20 }: { url?: string; name: string; size?: number }) {
  if (!url) {
    return (
      <span
        aria-hidden="true"
        className="grid shrink-0 place-items-center rounded-full bg-ink-700 font-display text-[0.625rem] font-bold uppercase text-mist-500"
        style={{ width: size, height: size }}
      >
        {name.trim().charAt(0)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resized(url, size * 2)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  );
}
