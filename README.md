<div align="center">

<img src="./public/og-default.svg" alt="King's Sports" width="640">

### Today's games, live scores and the stories behind them.

A sports portal from King's Newsletter: the day's schedule across football, the NBA, the NFL and Formula 1, live scores, standings, news, and profiles for teams, national teams, players and drivers.

**English** · [Português (Brasil)](./README.pt-BR.md)

<br>

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20.9%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-2563eb?style=flat-square)](./LICENSE)
[![CI](https://github.com/Kings-Newsletter/kings-sports/actions/workflows/ci.yml/badge.svg)](https://github.com/Kings-Newsletter/kings-sports/actions/workflows/ci.yml)
[![GitHub stars](https://img.shields.io/github/stars/Kings-Newsletter/kings-sports?style=flat-square)](https://github.com/Kings-Newsletter/kings-sports/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/Kings-Newsletter/kings-sports?style=flat-square)](https://github.com/Kings-Newsletter/kings-sports/issues)

</div>

---

## Contents

- [About](#about)
- [Features](#features)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Data sources](#data-sources)
- [Data collection jobs](#data-collection-jobs)
- [Live scores](#live-scores)
- [Images](#images)
- [Publishing editorial content](#publishing-editorial-content)
- [SEO and accessibility](#seo-and-accessibility)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## About

King's Sports is the sports section of King's Newsletter, planned to live at **kingsnewsletter.com/sports**. It answers three questions for Brazilian fans in one place: what is on today, what happened, and who is who.

Scores, standings and statistics always come from a data provider, with the source shown on the page. Nothing is made up: without data, the interface shows an empty state explaining why. The portal does not publish betting odds or gambling content.

**Explore:** [Source code](https://github.com/Kings-Newsletter/kings-sports) · [Report an issue](https://github.com/Kings-Newsletter/kings-sports/issues) · [Product notes](./docs/ideas/kings-sports.md)

## Features

- **Daily guide** — every game and session of the day on an hourly timeline, with a "now" line, the next game highlighted and a live countdown. Switch between yesterday, today and tomorrow, and filter by sport.
- **Live scores** — scores and clocks refreshed every 15 seconds while games are on, with halftime, end-of-period and stoppage-time states.
- **Results and calendar** — results and the full season calendar, grouped by day on a date rail.
- **Standings and statistics** — league tables, top scorers, assists and NBA/NFL leaders.
- **Match pages** — play-by-play, team statistics, line-ups and leaders.
- **Teams and national teams** — every club in the covered leagues and the 48 World Cup nations, with crests, flags, squads with photos, fixtures and results.
- **Players and drivers** — league leaders as photo cards, and the Formula 1 grid in championship order, each with a full profile.
- **Formula 1** — race weekends with the circuit layout, each team's current car, and driver and constructor profiles with season results and career stats.
- **News and analysis** — signed articles, analysis and transfers, published from versioned JSON.
- **Responsive dark interface** — editorial layout, `#2563eb` accent, icons throughout, works from 375 px phones to wide screens.

## Technology stack

| Area | Technologies |
| --- | --- |
| Framework | Next.js 16 (App Router, server components) |
| UI | React 19, Tailwind CSS 4, Lucide icons |
| Language | TypeScript (strict) |
| Data | MongoDB (shared King's Newsletter cluster, single `sports` collection) |
| Collection | Scheduled jobs with provider adapters in `lib/ingest` |
| Hosting | Vercel |
| CI | GitHub Actions (typecheck and production build on Node.js 20 and 22) |

## Project structure

```text
.
├── app/                      # Routes (App Router)
│   ├── page.tsx              # Home: daily guide, highlights, news, standings
│   ├── resultados/           # Live and finished results
│   ├── calendario/           # Season calendar by month
│   ├── classificacoes/       # Standings
│   ├── competicoes/          # Competition index and pages (F1 race weekends)
│   ├── partidas/[id]/        # Match page
│   ├── times/                # Teams index and team pages
│   ├── selecoes/             # National teams index
│   ├── jogadores/            # Players index
│   ├── atletas/[liga]/[id]/  # Athlete profile
│   ├── pilotos/              # Driver index and profiles
│   ├── construtores/[id]/    # Constructor profile with the season car
│   ├── noticias/ · analises/ # News and analysis
│   ├── api/cron/[job]/       # Data collection endpoints
│   └── sitemap.ts · robots.ts
├── components/               # Layout, news, sports and UI components
├── lib/
│   ├── data/                 # Data access layer (the only entry point for pages)
│   ├── ingest/               # Collection jobs, scheduler and provider adapters
│   ├── commons.ts            # Wikimedia Commons player photos
│   ├── f1-media.ts           # Official F1 car and circuit images
│   ├── directory.ts          # Teams, national teams, players and drivers indexes
│   ├── catalog.ts            # Covered competitions and provider mappings
│   └── types.ts              # Data contracts
├── content/                  # Editorial content (versioned JSON)
├── scripts/                  # History import and maintenance scripts
├── docs/ideas/               # Product decisions
└── public/                   # Static assets
```

## Getting started

### Prerequisites

- [Node.js 20.9 or newer](https://nodejs.org/)
- Optional: a MongoDB connection string. Without it, the portal runs in **file mode** and reads `/content`, so you can develop and build with no secrets.

### Installation

```bash
git clone https://github.com/Kings-Newsletter/kings-sports.git
cd kings-sports
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000/sports](http://localhost:3000/sports). The portal is served under the `/sports` base path, like the planned public address. To serve it at the root, set `NEXT_PUBLIC_BASE_PATH=""`.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server. Also starts the local collection scheduler when `MONGODB_URI` is set. |
| `npm run build` | Production build. |
| `npm run start` | Serve the production build. |
| `npm run typecheck` | TypeScript check without emitting files. |
| `npm run import:history -- path/BRA.csv` | Import historical Brasileirão results (odds columns are discarded). |

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public URL, used for canonical links, Open Graph, sitemap and robots. |
| `NEXT_PUBLIC_BASE_PATH` | Base path (default `/sports`). Use `""` to serve at the root. If you change it, update the cron paths in `vercel.json`. |
| `NEXT_PUBLIC_EDITORIAL_EMAIL` | Editorial contact shown in the footer and the editorial policy. |
| `NEXT_PUBLIC_NEWSLETTER_URL` | Link to King's Newsletter. |
| `MONGODB_URI` | MongoDB connection string. Without it, the portal runs in file mode. |
| `MONGODB_DB` | Database name (the King's Newsletter database). |
| `MONGODB_COLLECTION` | Collection used by the portal (default `sports`). Newsletter collections are never read or written. |
| `CRON_SECRET` | Secret required by `/api/cron/*` as `Authorization: Bearer <CRON_SECRET>`. |
| `SPORTAPI_KEY` | Optional key for the SportAPI fallback (football and NBA). |
| `SPORTAPI_DAILY_BUDGET` / `SPORTAPI_MONTHLY_BUDGET` | Safety caps for SportAPI calls (default 220 per day, 6,800 per month). |
| `ESPN_DAILY_BUDGET` | Safety cap for ESPN calls per day (default 3,000). |
| `ESPN_LIVE_MIN_INTERVAL_SEC` | Minimum seconds between live ESPN collections (default 15). |
| `LOCAL_SCHEDULER` | `true` to run the in-process scheduler with `next start`; `false` to disable it in `next dev`. |
| `LOCAL_LIVE_EVERY_SEC` | How often the local scheduler runs the live job (default 15). |
| `LIVE_MIN_INTERVAL_MIN` | Minimum minutes between live SportAPI collections (default 10). |

Keep `.env` private. It is ignored by Git; only `.env.example` is committed.

## Data sources

| Data | Primary source | Fallback |
| --- | --- | --- |
| Scores, calendars and standings: Brasileirão Série A and B, Copa do Brasil, Libertadores, Sul-Americana, Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Liga Portugal, NBA and NFL | ESPN public API (undocumented, no key) | [SportAPI](https://sportapi.ai) for most football leagues and the NBA |
| Team crests | ESPN | [TheSportsDB](https://www.thesportsdb.com) |
| National teams | ESPN (FIFA World Cup teams, in Portuguese) | — |
| Formula 1 | [OpenF1](https://openf1.org) and [Jolpica](https://api.jolpi.ca) | — |
| Brasileirão history | [Football-Data.co.uk](https://www.football-data.co.uk/brazil.php) (results only) | — |

Covered competitions and their provider paths are defined in `lib/catalog.ts`. The ESPN API is not official and may change without notice; when a call fails, that competition falls back to SportAPI in the same run and the reason is recorded in the job summary.

## Data collection jobs

Pages only read from the database, so API limits never depend on traffic. Each job is a protected route (`Authorization: Bearer $CRON_SECRET`):

| Job | Endpoint | What it does |
| --- | --- | --- |
| Daily | `GET /sports/api/cron/daily` | Games from yesterday to D+7 and standings for every league, plus Formula 1. Scheduled at 06:00 (Brasília) in `vercel.json`. |
| Season | `GET /sports/api/cron/season` | The full season calendar of each league, refreshed weekly. Resumable: stops after ~45 s and continues on the next run. |
| Crests | `GET /sports/api/cron/crests` | Fills missing team crests from TheSportsDB, a few per run. |
| Live | `GET /sports/api/cron/live` | Live scores. Only calls a provider when a game is in progress. |

Every call is counted in the `sports` collection (`type: "api_usage"`); when a budget is reached, that step is skipped.

## Live scores

- **Locally**, `npm run dev` (or `next start` with `LOCAL_SCHEDULER=true`) runs the collection in-process through `instrumentation.ts`: the live job every 15 seconds with its own lock, so the daily and season jobs never delay it.
- **Pages** refresh every 15 seconds while a game is live or about to start, without reloading or losing the scroll position.
- **The clock** shows the source's minute for football and advances between collections without passing the end of the half; stoppage time (`45+2'`), halftime and end of period are shown as published. Basketball and NFL show the official game clock.
- **On Vercel** (serverless) there is no long-running process, and the Hobby plan only allows daily crons. Call `/sports/api/cron/live` from an external scheduler (cron-job.org, GitHub Actions or `kings-newsletter-worker`) as often as you need.

## Images

| Image | Source |
| --- | --- |
| Formula 1 drivers, cars and circuit layouts | Official Formula 1 media (`media.formula1.com`), sized to the space where they appear. Car and circuit paths are defined per season in `lib/f1-media.ts`. |
| Football, NBA and NFL players | [Wikimedia Commons](https://commons.wikimedia.org), resolved through Wikidata by name and sport. Ambiguous names are only accepted when the team matches. Falls back to the provider photo, then the team crest. |
| Crests, flags and league logos | ESPN |

> Most Wikimedia Commons photos use CC BY or CC BY-SA licenses, which require crediting the author and license where the photo is shown. Review attribution before publishing.

## Publishing editorial content

Editorial content lives in `content/*.json`; the types are in `lib/types.ts` and annotated examples in [`content/README.md`](./content/README.md).

| File | Content |
| --- | --- |
| `noticias.json` | News, analysis, features and interviews |
| `rodadas.json` | "The round in 1 minute": three lines per sport per day |
| `transmissoes.json` | Where to watch: date, home team, away team and channels |
| `transferencias.json` | Confirmed transfers |
| `competicoes.json`, `partidas.json`, `classificacoes.json`, `estatisticas.json` | Only used in file mode |

## SEO and accessibility

- Clean URLs, per-page metadata, absolute canonical links that respect the base path.
- Open Graph and Twitter cards, dynamic `sitemap.xml` and `robots.txt`.
- JSON-LD: `NewsMediaOrganization`, `WebSite`, `NewsArticle` and `SportsEvent`.
- `lang="pt-BR"`, semantic headings, skip link, visible keyboard focus and `prefers-reduced-motion` support.

## Deployment

The project is configured for [Vercel](https://vercel.com/):

1. Import the repository in Vercel.
2. Add the environment variables from `.env.example` (`MONGODB_URI`, `MONGODB_DB`, `CRON_SECRET` and, optionally, `SPORTAPI_KEY`).
3. The daily, crests and season crons are defined in `vercel.json`. Set up an external scheduler for the live job.
4. Serving the portal at `kingsnewsletter.com/sports` requires a rewrite in the project that answers for `kingsnewsletter.com`.

## Contributing

Bug reports and improvements are welcome. Please [open an issue](https://github.com/Kings-Newsletter/kings-sports/issues) to discuss larger changes before sending a pull request, and run `npm run typecheck` and `npm run build` first.

## License

This project is licensed under the [MIT License](./LICENSE).

---

<div align="center">

Part of **King's Newsletter**.

</div>
