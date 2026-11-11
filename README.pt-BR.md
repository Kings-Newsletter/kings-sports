<div align="center">

<img src="./public/og-default.svg" alt="King's Sports" width="640">

### Os jogos de hoje, o placar ao vivo e as histórias por trás deles.

O portal de esportes da King's Newsletter: a programação do dia no futebol, na NBA, na NFL e na Fórmula 1, placar ao vivo, tabelas, notícias e fichas de times, seleções, jogadores e pilotos.

[English](./README.md) · **Português (Brasil)**

<br>

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Banco_de_dados-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20.9%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Licença](https://img.shields.io/badge/Licen%C3%A7a-MIT-2563eb?style=flat-square)](./LICENSE)
[![CI](https://github.com/Kings-Newsletter/kings-sports/actions/workflows/ci.yml/badge.svg)](https://github.com/Kings-Newsletter/kings-sports/actions/workflows/ci.yml)
[![Estrelas no GitHub](https://img.shields.io/github/stars/Kings-Newsletter/kings-sports?style=flat-square)](https://github.com/Kings-Newsletter/kings-sports/stargazers)
[![Issues no GitHub](https://img.shields.io/github/issues/Kings-Newsletter/kings-sports?style=flat-square)](https://github.com/Kings-Newsletter/kings-sports/issues)

</div>

---

## Sumário

- [Sobre](#sobre)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Como começar](#como-começar)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Fontes de dados](#fontes-de-dados)
- [Jobs de coleta](#jobs-de-coleta)
- [Placar ao vivo](#placar-ao-vivo)
- [Imagens](#imagens)
- [Como publicar conteúdo editorial](#como-publicar-conteúdo-editorial)
- [SEO e acessibilidade](#seo-e-acessibilidade)
- [Deploy](#deploy)
- [Como contribuir](#como-contribuir)
- [Licença](#licença)

## Sobre

O King's Sports é a seção de esportes da King's Newsletter, com endereço planejado em **kingsnewsletter.com/sports**. Ele responde, num lugar só, três perguntas do torcedor brasileiro: o que tem hoje, o que aconteceu e quem é quem.

Placares, tabelas e estatísticas vêm sempre de um provedor de dados, com a fonte indicada na página. Nada é inventado: sem dado, a interface mostra um estado vazio explicando o motivo. O portal não publica odds nem conteúdo de apostas.

**Explore:** [Código-fonte](https://github.com/Kings-Newsletter/kings-sports) · [Relatar um problema](https://github.com/Kings-Newsletter/kings-sports/issues) · [Notas de produto](./docs/ideas/kings-sports.md)

## Funcionalidades

- **Guia do dia**: todos os jogos e sessões do dia numa linha do tempo por hora, com a linha do "agora", o próximo jogo em destaque e contagem regressiva. Troque entre ontem, hoje e amanhã e filtre por esporte.
- **Placar ao vivo**: placar e relógio atualizados a cada 15 segundos durante os jogos, com intervalo, fim de período e acréscimos.
- **Resultados e calendário**: resultados e o calendário da temporada inteira, agrupados por dia numa régua de datas.
- **Tabelas e estatísticas**: classificações, artilharia, assistências e líderes da NBA e da NFL.
- **Página de partida**: lances, estatísticas comparadas, escalações e destaques.
- **Times e seleções**: todos os clubes das ligas acompanhadas e as 48 seleções da Copa do Mundo, com escudo ou bandeira, elenco com fotos, jogos e resultados.
- **Jogadores e pilotos**: os líderes de cada liga em cartões com foto e o grid da Fórmula 1 na ordem do campeonato, cada um com ficha completa.
- **Fórmula 1**: fins de semana de corrida com o desenho da pista, o carro de cada equipe na temporada e fichas de pilotos e construtores com resultados e carreira.
- **Notícias e análises**: textos assinados, análises e transferências, publicados a partir de JSON versionado.
- **Interface escura e responsiva**: layout editorial, destaque em `#2563eb`, ícones em todo o site, do celular de 375 px às telas largas.

## Tecnologias

| Área | Tecnologias |
| --- | --- |
| Framework | Next.js 16 (App Router, server components) |
| Interface | React 19, Tailwind CSS 4, ícones Lucide |
| Linguagem | TypeScript (strict) |
| Dados | MongoDB (cluster compartilhado da King's Newsletter, coleção única `sports`) |
| Coleta | Jobs agendados com adaptadores por provedor em `lib/ingest` |
| Hospedagem | Vercel |
| CI | GitHub Actions (checagem de tipos e build de produção no Node.js 20 e 22) |

## Estrutura do projeto

```text
.
├── app/                      # Rotas (App Router)
│   ├── page.tsx              # Home: guia do dia, destaques, notícias, tabelas
│   ├── resultados/           # Resultados ao vivo e encerrados
│   ├── calendario/           # Calendário da temporada por mês
│   ├── classificacoes/       # Tabelas
│   ├── competicoes/          # Índice e páginas de competição (fins de semana da F1)
│   ├── partidas/[id]/        # Página da partida
│   ├── times/                # Índice e páginas de times
│   ├── selecoes/             # Índice de seleções
│   ├── jogadores/            # Índice de jogadores
│   ├── atletas/[liga]/[id]/  # Ficha do atleta
│   ├── pilotos/              # Índice e fichas de pilotos
│   ├── construtores/[id]/    # Ficha do construtor, com o carro da temporada
│   ├── noticias/ · analises/ # Notícias e análises
│   ├── api/cron/[job]/       # Rotas de coleta de dados
│   └── sitemap.ts · robots.ts
├── components/               # Componentes de layout, notícias, esportes e interface
├── lib/
│   ├── data/                 # Camada de dados (única porta de entrada das páginas)
│   ├── ingest/               # Jobs de coleta, agendador e adaptadores de provedores
│   ├── commons.ts            # Fotos de jogadores do Wikimedia Commons
│   ├── f1-media.ts           # Imagens oficiais da F1: carros e circuitos
│   ├── directory.ts          # Índices de times, seleções, jogadores e pilotos
│   ├── catalog.ts            # Competições acompanhadas e caminhos nos provedores
│   └── types.ts              # Contratos de dados
├── content/                  # Conteúdo editorial (JSON versionado)
├── scripts/                  # Importação de histórico e manutenção
├── docs/ideas/               # Decisões de produto
└── public/                   # Arquivos estáticos
```

## Como começar

### Pré-requisitos

- [Node.js 20.9 ou mais novo](https://nodejs.org/)
- Opcional: uma string de conexão do MongoDB. Sem ela, o portal roda em **modo arquivo** e lê `/content`, então dá para desenvolver e fazer o build sem nenhum segredo.

### Instalação

```bash
git clone https://github.com/Kings-Newsletter/kings-sports.git
cd kings-sports
npm install
cp .env.example .env
npm run dev
```

Abra [http://localhost:3000/sports](http://localhost:3000/sports). O portal é servido no caminho base `/sports`, igual ao endereço público planejado. Para servir na raiz, defina `NEXT_PUBLIC_BASE_PATH=""`.

### Comandos

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento. Também liga o agendador local de coleta quando `MONGODB_URI` está definida. |
| `npm run build` | Build de produção. |
| `npm run start` | Serve o build de produção. |
| `npm run typecheck` | Checagem do TypeScript sem gerar arquivos. |
| `npm run import:history -- caminho/BRA.csv` | Importa o histórico do Brasileirão (as colunas de odds são descartadas). |

## Variáveis de ambiente

| Variável | Para que serve |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL pública, usada em canonical, Open Graph, sitemap e robots. |
| `NEXT_PUBLIC_BASE_PATH` | Caminho base (padrão `/sports`). Use `""` para servir na raiz. Se mudar, ajuste os caminhos dos crons em `vercel.json`. |
| `NEXT_PUBLIC_EDITORIAL_EMAIL` | Contato editorial exibido no rodapé e na política editorial. |
| `NEXT_PUBLIC_NEWSLETTER_URL` | Link para a King's Newsletter. |
| `MONGODB_URI` | String de conexão do MongoDB. Sem ela, o portal roda em modo arquivo. |
| `MONGODB_DB` | Nome do banco (o banco da King's Newsletter). |
| `MONGODB_COLLECTION` | Coleção usada pelo portal (padrão `sports`). As coleções da Newsletter nunca são lidas nem alteradas. |
| `CRON_SECRET` | Segredo exigido por `/api/cron/*`, no formato `Authorization: Bearer <CRON_SECRET>`. |
| `SPORTAPI_KEY` | Chave opcional da SportAPI, a fonte reserva (futebol e NBA). |
| `SPORTAPI_DAILY_BUDGET` / `SPORTAPI_MONTHLY_BUDGET` | Tetos de chamadas da SportAPI (padrão 220 por dia e 6.800 por mês). |
| `ESPN_DAILY_BUDGET` | Teto de chamadas à ESPN por dia (padrão 3.000). |
| `ESPN_LIVE_MIN_INTERVAL_SEC` | Segundos mínimos entre coletas ao vivo na ESPN (padrão 15). |
| `LOCAL_SCHEDULER` | `true` para ligar o agendador no `next start`; `false` para desligá-lo no `next dev`. |
| `LOCAL_LIVE_EVERY_SEC` | Frequência do job ao vivo no agendador local (padrão 15). |
| `LIVE_MIN_INTERVAL_MIN` | Minutos mínimos entre coletas ao vivo na SportAPI (padrão 10). |

Mantenha o `.env` privado. Ele é ignorado pelo Git; só o `.env.example` vai para o repositório.

## Fontes de dados

| Dado | Fonte principal | Reserva |
| --- | --- | --- |
| Placares, calendários e tabelas: Brasileirão Séries A e B, Copa do Brasil, Libertadores, Sul-Americana, Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Liga Portugal, NBA e NFL | API pública da ESPN (não documentada, sem chave) | [SportAPI](https://sportapi.ai), para a maioria das ligas de futebol e a NBA |
| Escudos dos times | ESPN | [TheSportsDB](https://www.thesportsdb.com) |
| Seleções | ESPN (seleções da Copa do Mundo, em português) | — |
| Fórmula 1 | [OpenF1](https://openf1.org) e [Jolpica](https://api.jolpi.ca) | — |
| Histórico do Brasileirão | [Football-Data.co.uk](https://www.football-data.co.uk/brazil.php) (só resultados) | — |

As competições acompanhadas e o caminho de cada uma nos provedores ficam em `lib/catalog.ts`. A API da ESPN não é oficial e pode mudar sem aviso; quando uma chamada falha, aquela competição cai para a SportAPI na mesma execução e o motivo fica registrado no resumo do job.

## Jobs de coleta

As páginas só leem do banco, então os limites das APIs nunca dependem do número de visitas. Cada job é uma rota protegida (`Authorization: Bearer $CRON_SECRET`):

| Job | Rota | O que faz |
| --- | --- | --- |
| Diário | `GET /sports/api/cron/daily` | Jogos de ontem até D+7 e tabelas de todas as ligas, além da Fórmula 1. Agendado para 06:00 (Brasília) em `vercel.json`. |
| Temporada | `GET /sports/api/cron/season` | O calendário da temporada inteira de cada liga, renovado toda semana. Retomável: para em ~45 s e continua na execução seguinte. |
| Escudos | `GET /sports/api/cron/crests` | Completa escudos que faltam pelo TheSportsDB, alguns por execução. |
| Ao vivo | `GET /sports/api/cron/live` | Placares ao vivo. Só chama um provedor quando há jogo em andamento. |

Cada chamada é contada na coleção `sports` (`type: "api_usage"`); ao atingir um teto, aquela etapa é pulada.

## Placar ao vivo

- **Localmente**, `npm run dev` (ou `next start` com `LOCAL_SCHEDULER=true`) roda a coleta dentro do próprio servidor, via `instrumentation.ts`: o job ao vivo a cada 15 segundos, com trava própria, para que as coletas diária e da temporada nunca o atrasem.
- **As páginas** se atualizam a cada 15 segundos enquanto houver jogo ao vivo ou começando, sem recarregar nem perder a rolagem.
- **O relógio** mostra o minuto da fonte no futebol e avança entre as coletas sem passar do fim do tempo; acréscimos (`45+2'`), intervalo e fim de período aparecem como a fonte publicou. Basquete e NFL mostram o cronômetro oficial do jogo.
- **Na Vercel** (serverless) não há processo rodando o tempo todo, e o plano Hobby só permite cron diário. Chame `/sports/api/cron/live` de um agendador externo (cron-job.org, GitHub Actions ou `kings-newsletter-worker`) na frequência que precisar.

## Imagens

| Imagem | Fonte |
| --- | --- |
| Pilotos, carros e traçados da Fórmula 1 | Mídia oficial da Fórmula 1 (`media.formula1.com`), no tamanho do espaço onde aparecem. Os caminhos de carros e circuitos ficam por temporada em `lib/f1-media.ts`. |
| Jogadores de futebol, NBA e NFL | [Wikimedia Commons](https://commons.wikimedia.org), localizados pelo Wikidata por nome e esporte. Nomes ambíguos só valem quando o time confere. Na falta, usa a foto do provedor e, depois, o escudo do time. |
| Escudos, bandeiras e logos de liga | ESPN |

> A maioria das fotos do Wikimedia Commons tem licença CC BY ou CC BY-SA, que exige citar o autor e a licença onde a foto aparece. Revise a atribuição antes de publicar.

## Como publicar conteúdo editorial

O conteúdo editorial fica em `content/*.json`; os tipos estão em `lib/types.ts` e há exemplos comentados em [`content/README.md`](./content/README.md).

| Arquivo | Conteúdo |
| --- | --- |
| `noticias.json` | Notícias, análises, reportagens e entrevistas |
| `rodadas.json` | "A rodada em 1 minuto": três frases por esporte e por dia |
| `transmissoes.json` | Onde assistir: data, mandante, visitante e canais |
| `transferencias.json` | Transferências confirmadas |
| `competicoes.json`, `partidas.json`, `classificacoes.json`, `estatisticas.json` | Usados só no modo arquivo |

## SEO e acessibilidade

- URLs limpas, metadados por página e canonical absoluto respeitando o caminho base.
- Open Graph e Twitter Card, `sitemap.xml` dinâmico e `robots.txt`.
- JSON-LD: `NewsMediaOrganization`, `WebSite`, `NewsArticle` e `SportsEvent`.
- `lang="pt-BR"`, hierarquia de títulos, link para pular ao conteúdo, foco visível no teclado e suporte a `prefers-reduced-motion`.

## Deploy

O projeto está configurado para a [Vercel](https://vercel.com/):

1. Importe o repositório na Vercel.
2. Cadastre as variáveis do `.env.example` (`MONGODB_URI`, `MONGODB_DB`, `CRON_SECRET` e, se quiser, `SPORTAPI_KEY`).
3. Os crons diário, de escudos e da temporada já estão em `vercel.json`. Configure um agendador externo para o job ao vivo.
4. Para servir o portal em `kingsnewsletter.com/sports`, é preciso um rewrite no projeto que responde por `kingsnewsletter.com`.

## Como contribuir

Relatos de problemas e melhorias são bem-vindos. Para mudanças maiores, [abra uma issue](https://github.com/Kings-Newsletter/kings-sports/issues) antes de enviar um pull request, e rode `npm run typecheck` e `npm run build` antes.

## Licença

Este projeto está sob a [licença MIT](./LICENSE).

---

<div align="center">

Parte da **King's Newsletter**.

</div>
