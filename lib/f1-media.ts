import type { Fixture } from "@/lib/types";

/**
 * Imagens da Fórmula 1 do site oficial (media.formula1.com): o carro de cada
 * equipe e o desenho de cada pista da temporada. São só endereços montados
 * por padrão, sem consulta a outra fonte. Atualizar a cada temporada.
 */

const SEASON = "2026";
const MEDIA = "https://media.formula1.com/image/upload";

/** ID da equipe na Jolpica -> nome da equipe nos arquivos da F1. */
const TEAM_SLUGS: Record<string, string> = {
  alpine: "alpine",
  aston_martin: "astonmartin",
  audi: "audi",
  cadillac: "cadillac",
  ferrari: "ferrari",
  haas: "haasf1team",
  mclaren: "mclaren",
  mercedes: "mercedes",
  rb: "racingbulls",
  red_bull: "redbullracing",
  williams: "williams",
};

/** Foto do carro da temporada, de perfil, sobre fundo transparente. */
export function carImage(constructorId: string, width = 1280): string | undefined {
  const slug = TEAM_SLUGS[constructorId];
  if (!slug) return undefined;
  return `${MEDIA}/c_fit,w_${width}/q_auto/d_common:f1:${SEASON}:fallback:car:${SEASON}fallbackcarright.webp/v1740000001/common/f1/${SEASON}/${slug}/${SEASON}${slug}carright.webp`;
}

/**
 * Lugar da sessão (como vem da OpenF1) -> nome da pista nos arquivos da F1.
 * As chaves estão sem acento e em minúsculas.
 */
const TRACK_KEYS: Record<string, string> = {
  melbourne: "melbourne",
  shanghai: "shanghai",
  suzuka: "suzuka",
  sakhir: "sakhir",
  jeddah: "jeddah",
  miami: "miami",
  montreal: "montreal",
  monaco: "montecarlo",
  "monte carlo": "montecarlo",
  barcelona: "catalunya",
  spielberg: "spielberg",
  silverstone: "silverstone",
  "spa francorchamps": "spafrancorchamps",
  spa: "spafrancorchamps",
  budapest: "hungaroring",
  zandvoort: "zandvoort",
  monza: "monza",
  madrid: "madring",
  baku: "baku",
  "marina bay": "singapore",
  singapore: "singapore",
  austin: "austin",
  "mexico city": "mexicocity",
  "sao paulo": "interlagos",
  "las vegas": "lasvegas",
  lusail: "lusail",
  "yas island": "yasmarinacircuit",
  "yas marina": "yasmarinacircuit",
  "abu dhabi": "yasmarinacircuit",
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type TrackMap = {
  /** Nome curto do circuito, como vem da sessão (ex.: "Interlagos") */
  name: string;
  /** Desenho do traçado em contorno branco (para o fundo escuro) */
  map: string;
};

/**
 * Pista de uma sessão de F1. As sessões trazem o lugar no título
 * ("F1 · São Paulo — Corrida") e o circuito no local ("Interlagos, Brazil").
 */
export function trackForFixture(fixture: Fixture): TrackMap | undefined {
  if (fixture.competition !== "formula-1") return undefined;
  const place = normalize(fixture.title?.match(/^F1 · (.+?) — /)?.[1] ?? "");
  const circuit = (fixture.venue ?? "").split(",")[0]?.trim() ?? "";
  const key = TRACK_KEYS[place] ?? TRACK_KEYS[normalize(circuit)];
  if (!key) return undefined;
  return {
    name: circuit || place,
    map: `${MEDIA}/c_lfill,w_3392/v1740000001/common/f1/${SEASON}/track/${SEASON}track${key}whiteoutline.svg`,
  };
}
