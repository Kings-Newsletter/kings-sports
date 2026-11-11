"use client";

import { useEffect, useRef, useState } from "react";

import { sharpPhoto } from "@/lib/images";

/**
 * Foto do atleta com reserva: se a foto não existir (comum no futebol), mostra
 * o escudo do time; sem escudo, as iniciais.
 */
export function AthletePhoto({
  photo,
  crest,
  name,
  size = 40,
}: {
  photo?: string;
  crest?: string;
  name: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  const style = { width: size, height: size };

  // Se a imagem falhou antes da hidratação, o onError não dispara: confere aqui.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (photo && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={ref}
        src={sharpPhoto(photo, size)}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailed(true)}
        className="shrink-0 rounded-full bg-ink-700 object-cover object-top ring-1 ring-line"
        style={style}
      />
    );
  }
  if (crest) {
    const src = crest.replace(
      /^https:\/\/a\.espncdn\.com(\/i\/teamlogos\/[^?]+)$/,
      `https://a.espncdn.com/combiner/i?img=$1&w=${size * 2}&h=${size * 2}`,
    );
    return (
      <span className="grid shrink-0 place-items-center rounded-full bg-ink-800 ring-1 ring-line" style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" width={size * 0.62} height={size * 0.62} loading="lazy" className="object-contain" />
      </span>
    );
  }
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-ink-700 font-display text-sm font-bold uppercase text-mist-400"
      style={style}
    >
      {initials}
    </span>
  );
}
