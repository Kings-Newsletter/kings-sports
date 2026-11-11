# Acervo editorial (`/content`)

Cada arquivo é um array JSON. Vazio (`[]`) significa **sem conteúdo publicado** — a
interface trata isso com estado vazio, nunca com dado fictício.

Os tipos completos estão em `lib/types.ts`. Abaixo, o formato esperado de cada item.

---

## `noticias.json` → `Article[]`

```json
[
  {
    "slug": "titulo-curto-em-url",
    "title": "Título da matéria",
    "dek": "Linha fina com o resumo em uma frase.",
    "kind": "noticia",
    "sport": "futebol",
    "competition": "brasileirao-serie-a",
    "author": "Nome do autor",
    "publishedAt": "2026-11-10T14:30:00-03:00",
    "updatedAt": "2026-11-10T17:00:00-03:00",
    "readingMinutes": 4,
    "tags": ["mercado", "contratos"],
    "cover": {
      "src": "https://cdn.exemplo.com/foto.jpg",
      "alt": "Descrição objetiva da imagem",
      "credit": "Foto: Agência / Autor"
    },
    "body": "## Primeiro subtítulo\n\nParágrafo com **negrito** e texto normal.\n\n> Citação atribuída a alguém.\n\n- item de lista\n- outro item",
    "featured": true
  }
]
```

Valores aceitos em `kind`: `noticia`, `analise`, `reportagem`, `entrevista`.
`sport` deve ser um slug de `lib/sports.ts`.

## `competicoes.json` → `Competition[]`

```json
[
  {
    "slug": "brasileirao-serie-a",
    "name": "Brasileirão Série A",
    "sport": "futebol",
    "scope": "nacional",
    "season": "2026",
    "country": "Brasil",
    "format": "Pontos corridos, 38 rodadas"
  }
]
```

## `partidas.json` → `Fixture[]`

```json
[
  {
    "id": "2026-11-12-flamengo-palmeiras",
    "sport": "futebol",
    "competition": "brasileirao-serie-a",
    "round": "33ª rodada",
    "kickoff": "2026-11-12T21:30:00-03:00",
    "status": "scheduled",
    "home": { "slug": "flamengo", "name": "Flamengo", "shortName": "FLA", "sport": "futebol" },
    "away": { "slug": "palmeiras", "name": "Palmeiras", "shortName": "PAL", "sport": "futebol" },
    "venue": "Maracanã",
    "broadcast": ["TV aberta"]
  }
]
```

`status`: `scheduled` | `live` | `finished` | `postponed` | `cancelled`.
Quando `live` ou `finished`, inclua `score: { "home": 2, "away": 1 }`; em `live`, também `clock` (ex.: `"67'"`).

## `classificacoes.json` → `Standings[]`

```json
[
  {
    "competition": "brasileirao-serie-a",
    "season": "2026",
    "updatedAt": "2026-11-10T06:00:00-03:00",
    "rows": [
      {
        "position": 1,
        "team": "Palmeiras",
        "played": 32,
        "wins": 20,
        "draws": 7,
        "losses": 5,
        "goalsFor": 58,
        "goalsAgainst": 29,
        "points": 67,
        "form": ["W", "W", "D", "L", "W"]
      }
    ]
  }
]
```

`form` usa `W` (vitória), `D` (empate), `L` (derrota) e é exibido como V/E/D.

## `estatisticas.json` → `StatBoard[]`

```json
[
  {
    "competition": "brasileirao-serie-a",
    "season": "2026",
    "metric": "gols",
    "leaders": [
      { "athlete": "Nome do atleta", "team": "Clube", "value": 18 },
      { "team": "Clube", "value": 54, "extra": "total da equipe" }
    ]
  }
]
```

## `transferencias.json` → `Transfer[]`

```json
[
  {
    "id": "2026-11-09-atleta-clube",
    "player": "Nome do atleta",
    "sport": "futebol",
    "from": "Clube de origem",
    "to": "Clube de destino",
    "type": "transferencia",
    "date": "2026-11-09",
    "fee": "€ 12 mi",
    "competition": "brasileirao-serie-a",
    "source": "Comunicado oficial do clube"
  }
]
```

`type`: `transferencia` | `emprestimo` | `livre` | `renovacao`.

---

## Checklist antes de publicar qualquer item

1. A informação tem fonte primária identificável?
2. Datas estão em ISO 8601 **com fuso** (`-03:00`)?
3. `slug` é único, sem acento e sem espaço?
4. `sport` e `competition` existem nos respectivos arquivos?
5. Números (placar, pontos, estatística) batem com a fonte citada?

---

## `rodadas.json` → `DailyBrief[]` ("A rodada em 1 minuto")

Três frases por esporte e por dia (data de Brasília). Sem rodada do dia, a home mostra a
mais recente, marcada com a data.

```json
[
  {
    "date": "2026-11-10",
    "sport": "futebol",
    "lines": [
      "Primeira frase: o fato principal da rodada.",
      "Segunda frase: o que mudou na tabela.",
      "Terceira frase: o que observar no próximo jogo."
    ],
    "author": "Nome do autor",
    "publishedAt": "2026-11-10T23:30:00-03:00"
  }
]
```

## `transmissoes.json` → `BroadcastEntry[]` ("Onde assistir")

Casado com a partida coletada por data + nome dos times (sem acento e sem caixa;
"Atlético-MG" casa com "Atletico Mineiro"). Confira o canal na fonte oficial.

```json
[
  {
    "date": "2026-11-12",
    "home": "Flamengo",
    "away": "Palmeiras",
    "channels": ["Globo", "Premiere"]
  }
]
```

## Séries editoriais

O campo opcional `"series"` agrupa textos de uma mesma série. A antiga série "Dinheiro em
jogo" saiu do site em novembro de 2026: `/dinheiro-em-jogo` agora redireciona para
`/noticias`, e textos com essa série aparecem como notícias comuns.
