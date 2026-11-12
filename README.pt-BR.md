<div align="center">

<img src="./app/icon.svg" alt="King's Sports" width="96">

# King's Sports

### Os jogos de hoje, o placar ao vivo e quem faz o espetáculo.

Um portal de esportes para o torcedor brasileiro: a programação do dia no futebol, na NBA, na NFL e na Fórmula 1, placar ao vivo, tabelas, notícias e fichas de times, seleções, jogadores e pilotos.

[English](./README.md) · **Português (Brasil)**

<br>

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Sports-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Serverless-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)
[![Licença](https://img.shields.io/badge/Licen%C3%A7a-MIT-blue?style=flat-square)](./LICENSE)
[![CI](https://github.com/Kings-Newsletter/kings-sports/actions/workflows/ci.yml/badge.svg)](https://github.com/Kings-Newsletter/kings-sports/actions/workflows/ci.yml)
[![Issues no GitHub](https://img.shields.io/github/issues/Kings-Newsletter/kings-sports?style=flat-square)](https://github.com/Kings-Newsletter/kings-sports/issues)

</div>

---

## Sumário

- [Sobre](#sobre)
- [Funcionalidades](#funcionalidades)
- [Fontes de dados](#fontes-de-dados)
- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Como começar](#como-começar)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Coleta de dados](#coleta-de-dados)
- [Rotas](#rotas)
- [Verificações de qualidade](#verificações-de-qualidade)
- [Notas de segurança](#notas-de-segurança)
- [Deploy](#deploy)
- [Como contribuir](#como-contribuir)
- [Licença](#licença)

## Sobre

O King's Sports é o braço esportivo da [King's Newsletter](https://kingsnewsletter.com), com identidade visual própria. Funciona como o caderno de esportes de um jornal: a home abre com os jogos do dia numa linha do tempo, o placar se atualiza durante as partidas, e cada time, seleção, jogador e piloto tem uma ficha com fotos.

A interface é em português do Brasil e o endereço planejado é **kingsnewsletter.com/sports**.

**Explore:** [Código-fonte](https://github.com/Kings-Newsletter/kings-sports) · [Relatar um problema](https://github.com/Kings-Newsletter/kings-sports/issues) · [King's Newsletter](https://kingsnewsletter.com)

## Funcionalidades

- **Guia do dia**: todos os jogos e sessões do dia numa linha do tempo por hora, com a linha do "agora", o próximo jogo em destaque com contagem regressiva e filtros por dia (ontem, hoje, amanhã) e por esporte.
- **Placar ao vivo**: placar e relógio atualizados a cada 15 segundos durante os jogos, com intervalo, fim de período e acréscimos (`45+2'`).
- **Resultados e calendário**: resultados recentes e o calendário da temporada inteira, agrupados por dia.
- **Tabelas e estatísticas**: classificações, artilharia, assistências e líderes da NBA e da NFL.
- **Página da partida**: lances, estatísticas dos times, escalações e destaques.
- **Times e seleções**: todos os clubes das ligas acompanhadas e as 48 seleções da Copa do Mundo, com escudos e bandeiras, elencos com fotos, jogos e resultados.
- **Jogadores e pilotos**: os líderes de cada liga em cartões com foto e o grid da Fórmula 1 na ordem do campeonato, cada um com ficha completa.
- **Fórmula 1**: fins de semana de corrida com o desenho da pista, o carro atual de cada equipe e fichas de pilotos e construtores com resultados da temporada e números da carreira.
- **Notícias e análises**: textos assinados e análises lidos do MongoDB, com os demais dados editoriais versionados em JSON.
- **Responsivo e acessível**: layout editorial escuro com ícones, do celular de 375 px às telas largas, navegação por teclado, foco visível e suporte a movimento reduzido.

## Fontes de dados

| Dado | Fonte | Observações |
| --- | --- | --- |
| Placares, calendários, tabelas e estatísticas de 15 competições (Brasileirão, Libertadores, ligas europeias, NBA, NFL) | API pública da ESPN | Não documentada, sem chave; pode mudar sem aviso |
| Reserva para a maioria das ligas de futebol e a NBA | [SportAPI](https://sportapi.ai/) | Exige chave; tetos diário e mensal |
| Seleções | ESPN | As 48 seleções da Copa do Mundo, com nomes em português |
| Sessões, classificações e fichas da Fórmula 1 | [OpenF1](https://openf1.org/) e [Jolpica](https://api.jolpi.ca/) | Grátis, sem chave |
| Fotos, carros e traçados da Fórmula 1 | Mídia oficial da Fórmula 1 | Caminhos definidos por temporada em `lib/f1-media.ts` |
| Fotos de jogadores de futebol, NBA e NFL | [Wikimedia Commons](https://commons.wikimedia.org/) via Wikidata | Localizadas por nome e esporte; nomes ambíguos exigem o time certo |
| Escudos que faltam | [TheSportsDB](https://www.thesportsdb.com/) | Chave pública |
| Histórico do Brasileirão | [Football-Data.co.uk](https://www.football-data.co.uk/brazil.php) | Só resultados; colunas de odds são descartadas |

Nenhum valor é inventado. Quando uma fonte não responde, a página mostra um estado vazio explicando o motivo. O portal não publica odds nem conteúdo de apostas.

## Tecnologias

| Área | Tecnologias |
| --- | --- |
| Frontend | Next.js 16 (App Router, server components), React 19, TypeScript (strict) |
| Estilo | Tailwind CSS 4 com tokens de design, fontes auto-hospedadas via `next/font` (Barlow, Barlow Condensed) |
| Ícones | Lucide |
| Servidor | Server components do Next.js; o portal só lê do banco |
| Coleta de dados | Roda no worker da King's Newsletter (`kings-newsletter-worker`), fora da Vercel |
| Dados | MongoDB (driver oficial para Node.js), coleção única `sports` |
| Qualidade | TypeScript, GitHub Actions |

## Estrutura do projeto

```text
.
├── app/
│   ├── page.tsx             # Home: guia do dia, destaques, notícias, tabelas
│   ├── resultados/          # Resultados
│   ├── calendario/          # Calendário da temporada
│   ├── classificacoes/      # Tabelas
│   ├── competicoes/         # Páginas de competição, incluindo os fins de semana da F1
│   ├── partidas/            # Páginas de partida
│   ├── times/               # Índice e páginas de times (clubes e seleções)
│   ├── selecoes/            # Índice de seleções
│   ├── jogadores/           # Índice de jogadores
│   ├── atletas/             # Fichas de atletas
│   ├── pilotos/             # Pilotos da F1
│   ├── construtores/        # Construtores da F1
│   ├── noticias/            # Notícias
│   └── analises/            # Análises
├── components/
│   ├── layout/              # Cabeçalho e rodapé
│   ├── sports/              # Linha do tempo, placares, tabelas, cartões de ficha
│   └── ui/                  # Cabeçalhos de página, ícones, estados vazios
├── lib/
│   ├── data/                # Camada de dados usada por todas as páginas
│   ├── catalog.ts           # Competições acompanhadas e caminhos nos provedores
│   ├── directory.ts         # Índices de times, seleções, jogadores e pilotos
│   ├── commons.ts           # Fotos de jogadores do Wikimedia Commons
│   └── f1-media.ts          # Imagens oficiais da F1: carros e circuitos
├── content/                 # Curadoria editorial e migração legada de notícias (JSON)
├── .github/workflows/ci.yml # Checagem de tipos e build
└── vercel.json              # Configurações do projeto na Vercel
```

## Como começar

### Pré-requisitos

- [Node.js 20.9 ou mais novo](https://nodejs.org/)
- Uma string de conexão do MongoDB para notícias e dados esportivos (necessária para exibir notícias; outros dados ainda podem usar `content/`)

### Instalação

```bash
git clone https://github.com/Kings-Newsletter/kings-sports.git
cd kings-sports
npm install
cp .env.example .env
```

Preencha o `.env` (veja abaixo) e inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:3000/sports](http://localhost:3000/sports).

### Comandos

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção, incluindo a checagem de tipos |
| `npm run start` | Serve o build de produção |
| `npm run typecheck` | Só a checagem de tipos |
| `npm run import:history -- caminho/BRA.csv` | Importa o histórico de resultados do Brasileirão |
| `npm run import:news` | Migra `content/noticias.json` para a coleção do portal, sem remover artigos existentes |

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Em produção | URL pública, usada em canonical, Open Graph e sitemap (padrão `https://kingsnewsletter.com/sports`). |
| `NEXT_PUBLIC_BASE_PATH` | Não | Caminho base (padrão `/sports`). Use `""` para servir na raiz. |
| `MONGODB_URI` | Para notícias e dados esportivos | String de conexão do MongoDB. Só no servidor. |
| `MONGODB_DB` | Para notícias e dados esportivos | Nome do banco. |
| `MONGODB_COLLECTION` | Não | Coleção usada pelo portal (padrão `sports`). |

Variáveis com o prefixo `NEXT_PUBLIC_` vão no JavaScript publicado. As do MongoDB não têm prefixo e nunca chegam ao navegador. As chaves e os tetos de chamadas dos provedores ficam configurados no worker, não aqui.

## Coleta de dados

As páginas só leem do banco, então os limites dos provedores nunca dependem do número de visitas. Toda a coleta roda no worker da King's Newsletter (`kings-newsletter-worker`, em `src/sports`), um serviço que fica no ar 24 horas por dia. Assim o portal não dispara crons nem execuções serverless na Vercel.

| Job | Quando roda | O que faz |
| --- | --- | --- |
| `live` | A cada 15 segundos | Placar e relógio ao vivo; só chama um provedor quando há jogo em andamento ou prestes a começar |
| `daily` | Quando a última execução tem mais de 12 horas | Jogos de ontem até sete dias à frente, tabelas e estatísticas de todas as ligas, além da Fórmula 1 |
| `crests` | Depois de cada `daily` | Escudos de times que faltam |
| `season` | A cada 2 minutos | Calendário da temporada inteira de cada liga, renovado toda semana; continua de onde parou |

O worker grava na mesma coleção `sports` que este portal lê. Ao incluir uma competição, atualize juntos o `lib/catalog.ts` daqui e o `src/sports/catalog.js` do worker: o worker usa o catálogo para saber o que coletar, e o portal, para exibir.

## Rotas

Todas as rotas ficam sob o caminho base `/sports`:

| Rota | Página |
| --- | --- |
| `/` | Guia do dia (`?dia=ontem` ou `?dia=amanha`, `?esporte=<esporte>`) |
| `/resultados` · `/calendario` · `/classificacoes` | Resultados, calendário e tabelas |
| `/competicoes/<slug>` | Página da competição (por exemplo, `/competicoes/formula-1`) |
| `/partidas/<id>` | Página da partida |
| `/times` · `/times/<liga>/<id>` | Índice de times e página do time |
| `/selecoes` · `/times/selecoes/<id>` | Índice de seleções e página da seleção |
| `/jogadores` · `/atletas/<liga>/<id>` | Índice de jogadores e ficha do atleta |
| `/pilotos` · `/pilotos/<id>` · `/construtores/<id>` | Pilotos da F1, ficha do piloto e ficha do construtor |
| `/noticias` · `/noticias/<slug>` · `/analises` | Notícias, página da notícia e análises |

## Verificações de qualidade

```bash
npm run typecheck
npm run build
```

O GitHub Actions roda a checagem de tipos e o build de produção no Node.js 20 e 22 a cada push e pull request para a `main`. O build não precisa de banco nem de chaves.

## Notas de segurança

- **MongoDB:** acessado só no servidor. O portal lê uma única coleção e nunca toca nas coleções da King's Newsletter. O repositório ignora os arquivos `.env`; configure os segredos no provedor de hospedagem.
- **ESPN:** a API é pública, mas não documentada. Se um endpoint mudar, a competição afetada cai para a SportAPI e o motivo fica registrado no resumo do job no worker.
- **Imagens:** as fotos de jogadores do Wikimedia Commons têm licenças livres que costumam exigir atribuição; o site ainda não exibe os créditos.

## Deploy

O projeto está pronto para a [Vercel](https://vercel.com/). Cadastre `NEXT_PUBLIC_SITE_URL`, `MONGODB_URI` e `MONGODB_DB` em **Settings → Environment Variables** antes do deploy. O portal não tem crons: a coleta de dados roda no worker. Para servir o portal em `kingsnewsletter.com/sports`, é preciso um rewrite no projeto que responde por `kingsnewsletter.com`.

## Como contribuir

Relatos de problemas e ideias são bem-vindos. [Abra uma issue](https://github.com/Kings-Newsletter/kings-sports/issues) antes de mudanças maiores, e rode `npm run typecheck` e `npm run build` antes de enviar um pull request. Os dados esportivos precisam ser exatos: nunca invente placares ou estatísticas, e mantenha a fonte na página.

## Licença

Este projeto está sob a [licença MIT](./LICENSE).

---

<div align="center">

Parte da família <a href="https://kingsnewsletter.com">King's Newsletter</a>.

</div>
