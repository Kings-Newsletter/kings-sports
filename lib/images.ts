/**
 * Fotos de piloto da F1 (media.formula1.com) vêm da OpenF1 no menor tamanho,
 * "1col" (93 px). O mesmo servidor tem a foto em vários tamanhos; escolhe o
 * menor que cubra o espaço exibido em telas de alta densidade (2x).
 */
const F1_SIZES: [number, string][] = [
  [93, "1col"],
  [206, "2col"],
  [319, "3col"],
  [432, "4col"],
  [658, "6col"],
  [864, "4col-retina"],
];

export function sharpPhoto(url: string | undefined, displayPx: number): string | undefined {
  if (!url || !/media\.formula1\.com\/.+\.transform\/[^/]+\/image\.png$/.test(url)) return url;
  const needed = displayPx * 2;
  const size = F1_SIZES.find(([px]) => px >= needed)?.[1] ?? "4col-retina";
  return url.replace(/\.transform\/[^/]+\/image\.png$/, `.transform/${size}/image.png`);
}

/**
 * Versão reduzida de imagens da ESPN (escudos, logos de liga): o original tem
 * 500 px (~30 KB); o redimensionador da própria ESPN devolve ~1 KB.
 */
export function espnResized(url: string, px: number): string {
  const path = url.match(/^https?:\/\/a\.espncdn\.com(\/i\/[^?]+\.png)$/)?.[1];
  if (path) return `https://a.espncdn.com/combiner/i?img=${path}&w=${px}&h=${px}&transparent=true`;
  // Já é uma URL do redimensionador: troca só o tamanho.
  if (/a\.espncdn\.com\/combiner\/i\?img=/.test(url)) {
    return url.replace(/([?&])w=\d+/, `$1w=${px}`).replace(/([?&])h=\d+/, `$1h=${px}`);
  }
  return url;
}

/**
 * Miniaturas do Wikimedia Commons vêm num tamanho fixo (ex.: "960px-Foto.jpg"),
 * pequeno para telas retina e grande demais para cartões. O próprio servidor
 * gera outras larguras trocando esse prefixo: monta um srcset com elas.
 * Uma largura maior que o original devolve erro 400; quem usa o srcset deve
 * cair para o `src` original nesse caso (o <FadeImage> já faz isso).
 */
const WIKIMEDIA_THUMB =
  /^(https:\/\/(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/thumb\/[^?]+\/)\d+px-([^/?]+)(?:\?.*)?$/;

export function wikimediaSrcSet(url: string | undefined, widths: number[]): string | undefined {
  const match = url?.match(WIKIMEDIA_THUMB);
  if (!match) return undefined;
  const [, base, name] = match;
  return widths.map((w) => `${base}${w}px-${name} ${w}w`).join(", ");
}
