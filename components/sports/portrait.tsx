"use client";

import { useEffect, useRef, useState } from "react";

import { sharpPhoto } from "@/lib/images";

/**
 * Retrato grande (cartões de jogador e piloto). Sem foto, ou se ela falhar,
 * mostra o escudo do time; sem escudo, as iniciais. As fotos da ESPN e da F1
 * têm fundo transparente: o atleta fica apoiado na base do quadro.
 */
export function Portrait({
  photo,
  crest,
  name,
  displayPx = 320,
  cover = false,
  className = "",
}: {
  photo?: string;
  crest?: string;
  name: string;
  /** Largura em que o retrato aparece, para pedir a foto no tamanho certo */
  displayPx?: number;
  /** Foto comum (Commons) preenche o quadro; recortes da ESPN/F1 ficam apoiados na base */
  cover?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, [photo]);

  if (photo && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={ref}
        src={sharpPhoto(photo, displayPx)}
        alt={`Foto de ${name}`}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`size-full ${cover ? "object-cover object-[50%_22%]" : "object-contain object-bottom"} ${className}`}
      />
    );
  }
  if (crest) {
    return (
      <span className="grid size-full place-items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={crest} alt="" loading="lazy" className="size-1/2 object-contain opacity-80" />
      </span>
    );
  }
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  return (
    <span className="grid size-full place-items-center font-display text-4xl font-extrabold uppercase text-mist-600">
      {initials}
    </span>
  );
}
