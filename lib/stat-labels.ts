/**
 * Tradução das siglas de estatística da ESPN para o português.
 * [sigla curta, nome completo]. O que não estiver aqui aparece como veio.
 */
const LABELS: Record<string, [string, string]> = {
  // futebol
  STRT: ["TIT", "Jogos como titular"],
  APP: ["J", "Jogos"],
  FC: ["FC", "Faltas cometidas"],
  FA: ["FS", "Faltas sofridas"],
  YC: ["CA", "Cartões amarelos"],
  RC: ["CV", "Cartões vermelhos"],
  G: ["G", "Gols"],
  A: ["A", "Assistências"],
  SHOT: ["FIN", "Finalizações"],
  SOG: ["NO ALVO", "Finalizações no alvo"],
  OFF: ["IMP", "Impedimentos"],
  SV: ["DEF", "Defesas"],
  GA: ["GS", "Gols sofridos"],
  CS: ["SG", "Jogos sem sofrer gol"],
  // basquete
  GP: ["J", "Jogos"],
  GS: ["TIT", "Jogos como titular"],
  MIN: ["MIN", "Minutos por jogo"],
  FG: ["AR", "Arremessos (convertidos-tentados)"],
  "FG%": ["AR%", "Aproveitamento nos arremessos"],
  "3PT": ["3PT", "Bolas de 3 (convertidas-tentadas)"],
  "3P%": ["3P%", "Aproveitamento nas bolas de 3"],
  FT: ["LL", "Lances livres (convertidos-tentados)"],
  "FT%": ["LL%", "Aproveitamento nos lances livres"],
  OR: ["RO", "Rebotes ofensivos"],
  DR: ["RD", "Rebotes defensivos"],
  REB: ["REB", "Rebotes"],
  AST: ["AST", "Assistências"],
  BLK: ["TOC", "Tocos"],
  STL: ["ROU", "Roubos de bola"],
  PF: ["FAL", "Faltas"],
  TO: ["ERR", "Erros"],
  PTS: ["PTS", "Pontos"],
  // futebol americano
  CMP: ["COMP", "Passes completos"],
  ATT: ["TENT", "Tentativas"],
  YDS: ["JDS", "Jardas"],
  TD: ["TD", "Touchdowns"],
  INT: ["INT", "Interceptações"],
  RTG: ["RTG", "Rating"],
  CAR: ["COR", "Corridas"],
  REC: ["REC", "Recepções"],
  AVG: ["MÉD", "Média"],
  SACK: ["SACK", "Sacks"],
  TOT: ["TOT", "Tackles"],
};

export function statLabel(abbreviation: string): { short: string; long: string } {
  const found = LABELS[abbreviation];
  return found ? { short: found[0], long: found[1] } : { short: abbreviation, long: abbreviation };
}

/** "Regular Season" → "Temporada regular" etc. */
export function splitLabel(name: string): string {
  return name
    .replace(/^Regular Season$/i, "Temporada regular")
    .replace(/^Postseason$/i, "Playoffs")
    .replace(/^Career$/i, "Carreira")
    .replace(/International Friendly/i, "Amistosos internacionais")
    .replace(/Futebol Brasileiro/i, "Brasileirão");
}

const POSITIONS: Record<string, string> = {
  Goalkeeper: "Goleiro",
  Defender: "Defensor",
  Midfielder: "Meio-campista",
  Forward: "Atacante",
  Guard: "Armador",
  "Point Guard": "Armador",
  "Shooting Guard": "Ala-armador",
  "Small Forward": "Ala",
  "Power Forward": "Ala-pivô",
  Center: "Pivô",
  Quarterback: "Quarterback",
  "Running Back": "Running back",
  "Wide Receiver": "Wide receiver",
  "Tight End": "Tight end",
};

export function positionLabel(name?: string): string | undefined {
  if (!name) return undefined;
  return POSITIONS[name] ?? name;
}
