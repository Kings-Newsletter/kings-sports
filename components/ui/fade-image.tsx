"use client";

import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

/**
 * <img> que mostra o esqueleto até a foto baixar e então surge suave.
 * O pai precisa ser `relative` (o esqueleto ocupa o quadro inteiro).
 * Use `key={src}` ao trocar de foto para recomeçar o carregamento.
 *
 * Se a imagem tiver `srcSet` e a versão escolhida falhar (ex.: largura maior
 * que o original no Wikimedia), tenta de novo só com o `src`.
 */
export function FadeImage({
  className = "",
  onError,
  alt = "",
  srcSet,
  sizes,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [plain, setPlain] = useState(false);
  const activeSrcSet = plain ? undefined : srcSet;

  const fail = (img: HTMLImageElement) => {
    if (activeSrcSet) {
      setPlain(true);
      return;
    }
    onError?.({ currentTarget: img, target: img } as unknown as React.SyntheticEvent<HTMLImageElement>);
  };

  // A foto pode terminar (ou falhar) antes da hidratação, sem disparar onLoad/onError.
  useEffect(() => {
    const img = ref.current;
    if (!img?.complete) return;
    if (img.naturalWidth > 0) setLoaded(true);
    else fail(img);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {!loaded ? <span aria-hidden="true" className="skeleton absolute inset-0" /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        alt={alt}
        {...props}
        key={plain ? "plain" : "set"}
        srcSet={activeSrcSet}
        sizes={activeSrcSet ? sizes : undefined}
        data-loaded={loaded}
        onLoad={() => setLoaded(true)}
        onError={(event) => fail(event.currentTarget)}
        className={`img-fade ${className}`}
      />
    </>
  );
}
