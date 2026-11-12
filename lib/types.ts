/**
 * Contratos de dados do portal.
 *
 * A interface depende destes tipos, nunca de uma API específica.
 * Dados esportivos vêm do MongoDB, alimentado pela coleta do worker (kings-newsletter-worker).
 * Notícias também vêm do MongoDB; os demais conteúdos editoriais vêm de /content.
 * Ver lib/data/index.ts.
 */

export type ArticleKind = "noticia" | "analise" | "reportagem" | "entrevista";

export type Article = {
  slug: string;
  title: string;
  /** Linha fina / subtítulo */
  dek: string;
  kind: ArticleKind;
  sport: string;
  competition?: string;
  author: string;
  publishedAt: string; // ISO 8601
  updatedAt?: string;
  readingMinutes?: number;
  tags?: string[];
  cover?: {
    src: string;
    alt: string;
    credit?: string;
  };
  /** Corpo em markdown simples (parágrafos, ## títulos, > citação). */
  body?: string;
  featured?: boolean;
  /** Série editorial à qual o texto pertence (ex.: "dinheiro-em-jogo"). */
  series?: string;
};

export type Competition = {
  slug: string;
  name: string;
  /** Nome curto para listas e placares (ex.: "Brasileirão") */
  shortName?: string;
  sport: string;
  scope?: "nacional" | "internacional" | "estadual" | "regional";
  season?: string;
  country?: string;
  format?: string;
  /** Ordem de exibição no guia do dia (menor = primeiro) */
  priority?: number;
  /** Logo da competição (URL) */
  logo?: string;
};

/**
 * "A rodada em 1 minuto": três frases editoriais por esporte e por dia.
 * Fica em content/rodadas.json (curadoria versionada).
 */
export type DailyBrief = {
  date: string; // YYYY-MM-DD, fuso de Brasília
  sport: string;
  lines: string[];
  author: string;
  publishedAt: string;
};

/**
 * "Onde assistir": curadoria manual em content/transmissoes.json.
 * O casamento com a partida é por data + nomes dos times (sem acento, sem caixa).
 */
export type BroadcastEntry = {
  date: string; // YYYY-MM-DD, fuso de Brasília
  home: string;
  away: string;
  channels: string[];
};

/** Resultado histórico importado do Football-Data.co.uk (sem odds). */
export type HistoricalMatch = {
  league: string;
  season: string;
  date: string; // YYYY-MM-DD
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
};

export type Team = {
  /** ID do time na ESPN (para a página do time) */
  id?: string;
  slug: string;
  name: string;
  shortName?: string;
  sport: string;
  competition?: string;
  crest?: string;
};

export type FixtureStatus = "scheduled" | "live" | "finished" | "postponed" | "cancelled";

/**
 * Uma partida (time contra time) ou um evento (sessão de F1, por exemplo).
 * Eventos usam `title` em vez de `home`/`away`.
 */
export type Fixture = {
  id: string;
  sport: string;
  competition: string; // slug da competição
  kind?: "match" | "event";
  round?: string;
  kickoff: string; // ISO 8601 com fuso
  status: FixtureStatus;
  home?: Team;
  away?: Team;
  /** Nome do evento quando kind = "event" (ex.: "GP de São Paulo — Corrida") */
  title?: string;
  /** Fim previsto de eventos com duração (sessão de F1), para derivar o status */
  endsAt?: string;
  /** Resultado em texto para eventos (ex.: "Vencedor: Kimi Antonelli") */
  result?: string;
  score?: { home: number; away: number };
  /** Minuto/período atual quando status = "live" */
  clock?: string;
  venue?: string;
  /** Onde assistir — preenchido pela curadoria (content/transmissoes.json) */
  broadcast?: string[];
  /** Origem do dado, para transparência (ex.: "SportAPI") */
  source?: string;
  updatedAt?: string;
};

export type StandingsFormat = "football" | "basketball" | "motorsport";

export type StandingRow = {
  position: number;
  team: string;
  /** Linha secundária (equipe do piloto, conferência…) */
  detail?: string;
  /** ID do time na ESPN (para a página do time) */
  teamId?: string;
  /** Link do escudo (TheSportsDB), quando conhecido */
  crest?: string;
  played?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  points?: number;
  /** Basquete */
  winPct?: number;
  gamesBehind?: number;
  streak?: string;
  form?: ("W" | "D" | "L")[];
  change?: "up" | "down" | "same";
  /** Zona da tabela (classificação, rebaixamento…), com a cor da fonte */
  note?: { color: string; label: string };
  /** Cor da equipe (F1), em hex sem # */
  color?: string;
  /** IDs da fonte (F1), para ligar a linha à ficha do piloto/construtor */
  driverId?: string;
  constructorId?: string;
  code?: string;
  number?: string;
  nationality?: string;
};

export type Standings = {
  competition: string; // slug
  season: string;
  format?: StandingsFormat;
  group?: string;
  updatedAt: string;
  source?: string;
  rows: StandingRow[];
};

export type StatLeader = {
  team: string;
  athlete?: string;
  /** IDs na ESPN (para as páginas de atleta e de time) */
  athleteId?: string;
  teamId?: string;
  value: number;
  /** Valor formatado pela fonte (ex.: "39.3", ".512") */
  display?: string;
  extra?: string;
  /** Foto do atleta */
  photo?: string;
  /** Escudo do time */
  crest?: string;
};

export type StatBoard = {
  competition: string;
  season: string;
  /** Chave da métrica (ex.: "gols", "pontos-por-jogo") */
  metric: string;
  /** Rótulo para exibir (ex.: "Artilharia") */
  label?: string;
  sport?: string;
  leaders: StatLeader[];
  source?: string;
  updatedAt?: string;
};

export type TransferType = "transferencia" | "emprestimo" | "livre" | "renovacao";

export type Transfer = {
  id: string;
  player: string;
  sport: string;
  from: string;
  to: string;
  type: TransferType;
  date: string; // ISO 8601
  fee?: string; // texto livre: "€ 12 mi", "sem custos"
  competition?: string;
  source?: string;
};
