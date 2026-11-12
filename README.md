<div align="center">

<img src="./app/icon.svg" alt="King's Sports" width="96">

# King's Sports

### Today's games, live scores, and the people behind them.

A sports portal for Brazilian fans: the day's schedule across football, the NBA, the NFL, and Formula 1, live scores, standings, news, and profiles for teams, national teams, players, and drivers.

**English** · [Português (Brasil)](./README.pt-BR.md)

<br>

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Sports-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Serverless-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](./LICENSE)
[![CI](https://github.com/Kings-Newsletter/kings-sports/actions/workflows/ci.yml/badge.svg)](https://github.com/Kings-Newsletter/kings-sports/actions/workflows/ci.yml)
[![GitHub issues](https://img.shields.io/github/issues/Kings-Newsletter/kings-sports?style=flat-square)](https://github.com/Kings-Newsletter/kings-sports/issues)

</div>

---

## Contents

- [About](#about)
- [Features](#features)
- [Data sources](#data-sources)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Data collection](#data-collection)
- [Routes](#routes)
- [Quality checks](#quality-checks)
- [Security notes](#security-notes)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## About

King's Sports is the sports branch of [King's Newsletter](https://kingsnewsletter.com), with its own visual identity. It works like the sports section of a newspaper: the home page opens with the day's games on a timeline, scores update while games are on, and every team, national team, player, and driver has a profile with photos.

The interface is in Brazilian Portuguese and is planned to be served at **kingsnewsletter.com/sports**.

**Explore:** [Source code](https://github.com/Kings-Newsletter/kings-sports) · [Report an issue](https://github.com/Kings-Newsletter/kings-sports/issues) · [King's Newsletter](https://kingsnewsletter.com)

## Features

- **Daily guide** — every game and session of the day on an hourly timeline, with a "now" line, the next game highlighted with a countdown, and filters by day (yesterday, today, tomorrow) and sport.
- **Live scores** — scores and clocks refreshed every 15 seconds while games are on, including halftime, end of period, and stoppage time (`45+2'`).
- **Results and calendar** — recent results and the full season calendar, grouped by day.
- **Standings and statistics** — league tables, top scorers, assists, and NBA and NFL leaders.
- **Match pages** — play-by-play, team statistics, line-ups, and leaders.
- **Teams and national teams** — every club in the covered leagues and the 48 World Cup nations, with crests and flags, squads with photos, fixtures, and results.
- **Players and drivers** — each league's leaders as photo cards and the Formula 1 grid in championship order, each with a full profile.
- **Formula 1** — race weekends with the circuit layout, each team's current car, and driver and constructor profiles with season results and career stats.
- **News and analysis** — signed articles and analysis read from MongoDB, with other editorial data versioned in JSON.
- **Responsive and accessible** — dark editorial layout with icons, from 375 px phones to wide screens, keyboard navigation, visible focus, and reduced-motion support.

## Data sources

| Data | Source | Notes |
| --- | --- | --- |
| Scores, calendars, standings, and statistics for 15 competitions (Brasileirão, Libertadores, European leagues, NBA, NFL) | ESPN public API | Undocumented, no key; may change without notice |
| Fallback for most football leagues and the NBA | [SportAPI](https://sportapi.ai/) | Key required; daily and monthly caps |
| National teams | ESPN | The 48 FIFA World Cup teams, with names in Portuguese |
| Formula 1 sessions, standings, and profiles | [OpenF1](https://openf1.org/) and [Jolpica](https://api.jolpi.ca/) | Free, no key |
| Formula 1 photos, cars, and circuit layouts | Official Formula 1 media | Paths defined per season in `lib/f1-media.ts` |
| Football, NBA, and NFL player photos | [Wikimedia Commons](https://commons.wikimedia.org/) via Wikidata | Matched by name and sport; ambiguous names need a matching team |
| Missing team crests | [TheSportsDB](https://www.thesportsdb.com/) | Public key |
| Brasileirão history | [Football-Data.co.uk](https://www.football-data.co.uk/brazil.php) | Results only; odds columns are discarded |

No value is invented. When a source does not respond, the page shows an empty state explaining why. The portal does not publish betting odds or gambling content.

## Technology stack

| Area | Technologies |
| --- | --- |
| Frontend | Next.js 16 (App Router, server components), React 19, TypeScript (strict) |
| Styling | Tailwind CSS 4 with design tokens, self-hosted fonts via `next/font` (Barlow, Barlow Condensed) |
| Icons | Lucide |
| Server | Next.js server components; the portal only reads from the database |
| Data collection | Runs in the King's Worker (`kings-worker`), outside Vercel |
| Data | MongoDB (official Node.js driver), single `sports` collection |
| Quality | TypeScript, GitHub Actions |

## Project structure

```text
.
├── app/
│   ├── page.tsx             # Home: daily guide, highlights, news, standings
│   ├── resultados/          # Results
│   ├── calendario/          # Season calendar
│   ├── classificacoes/      # Standings
│   ├── competicoes/         # Competition pages, including F1 race weekends
│   ├── partidas/            # Match pages
│   ├── times/               # Teams index and team pages (clubs and national teams)
│   ├── selecoes/            # National teams index
│   ├── jogadores/           # Players index
│   ├── atletas/             # Athlete profiles
│   ├── pilotos/             # F1 drivers
│   ├── construtores/        # F1 constructors
│   ├── noticias/            # News
│   └── analises/            # Analysis
├── components/
│   ├── layout/              # Header and footer
│   ├── sports/              # Guide timeline, scoreboards, tables, profile cards
│   └── ui/                  # Page headers, icons, empty states
├── lib/
│   ├── data/                # Data access layer used by every page
│   ├── catalog.ts           # Covered competitions and provider mappings
│   ├── directory.ts         # Teams, national teams, players, and drivers indexes
│   ├── commons.ts           # Wikimedia Commons player photos
│   └── f1-media.ts          # Official F1 car and circuit images
├── content/                 # Editorial curation and legacy news import (JSON)
├── .github/workflows/ci.yml # Type check and build
└── vercel.json              # Vercel project settings
```

## Getting started

### Prerequisites

- [Node.js 20.9 or newer](https://nodejs.org/)
- A MongoDB connection string for news, scores, and standings (required for news; other data can still use `content/`)

### Installation

```bash
git clone https://github.com/Kings-Newsletter/kings-sports.git
cd kings-sports
npm install
cp .env.example .env
```

Fill in `.env` (see below), then start the development server:

```bash
npm run dev
```

Open [http://localhost:3000/sports](http://localhost:3000/sports).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build, including the type check |
| `npm run start` | Serve the production build |
| `npm run typecheck` | Type check only |
| `npm run import:history -- path/BRA.csv` | Import historical Brasileirão results |
| `npm run import:news` | Migrate `content/noticias.json` into the portal collection without deleting existing articles |

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | In production | Public URL, used for canonical links, Open Graph, and the sitemap (default `https://kingsnewsletter.com/sports`). |
| `NEXT_PUBLIC_BASE_PATH` | No | Base path (default `/sports`). Use `""` to serve at the root. |
| `MONGODB_URI` | For news and sports data | MongoDB connection string. Server only. |
| `MONGODB_DB` | For news and sports data | Database name. |
| `MONGODB_COLLECTION` | No | Collection used by the portal (default `sports`). |

Variables prefixed with `NEXT_PUBLIC_` are embedded in the published JavaScript. MongoDB variables have no prefix and never reach the browser. Provider keys and call budgets are configured in the worker, not here.

## Data collection

Pages only read from the database, so provider limits never depend on traffic. All collection runs in the King's Worker (`kings-worker`, under `src/sports`), a service that stays online 24/7, so the portal triggers no cron jobs or serverless invocations on Vercel.

| Job | Schedule | What it does |
| --- | --- | --- |
| `live` | Every 15 seconds | Live scores and clock; calls a provider only while a game is in progress or about to start |
| `daily` | When the last run is more than 12 hours old | Games from yesterday to seven days ahead, standings, and statistics for every league, plus Formula 1 |
| `crests` | After each `daily` run | Missing team crests |
| `season` | Every 2 minutes | Full season calendar of each league, refreshed weekly; resumes where it stopped |

The worker writes to the same `sports` collection this portal reads. When adding a competition, update `lib/catalog.ts` here and `src/sports/catalog.js` in the worker together: the worker uses the catalog to know what to collect, and the portal uses it to display it.

## Routes

All routes are served under the `/sports` base path:

| Route | Page |
| --- | --- |
| `/` | Daily guide (`?dia=ontem` or `?dia=amanha`, `?esporte=<sport>`) |
| `/resultados` · `/calendario` · `/classificacoes` | Results, calendar, and standings |
| `/competicoes/<slug>` | Competition page (for example, `/competicoes/formula-1`) |
| `/partidas/<id>` | Match page |
| `/times` · `/times/<league>/<id>` | Teams index and team page |
| `/selecoes` · `/times/selecoes/<id>` | National teams index and national team page |
| `/jogadores` · `/atletas/<league>/<id>` | Players index and athlete profile |
| `/pilotos` · `/pilotos/<id>` · `/construtores/<id>` | F1 drivers, driver profile, and constructor profile |
| `/noticias` · `/noticias/<slug>` · `/analises` | News, story page, and analysis |

## Quality checks

```bash
npm run typecheck
npm run build
```

GitHub Actions runs the type check and production build on Node.js 20 and 22 on every push and pull request to `main`. The build needs no database or keys.

## Security notes

- **MongoDB:** accessed only on the server. The portal reads a single collection and never touches King's Newsletter collections. The repository ignores `.env` files; configure secrets in the hosting provider.
- **ESPN:** the API is public but undocumented. If an endpoint changes, the affected competition falls back to SportAPI and the reason is recorded in the worker's job summary.
- **Images:** player photos from Wikimedia Commons are under free licenses that usually require attribution; the site does not display credits yet.

## Deployment

The project is ready for [Vercel](https://vercel.com/). Add `NEXT_PUBLIC_SITE_URL`, `MONGODB_URI`, and `MONGODB_DB` under **Settings → Environment Variables** before deploying. The portal has no cron jobs: data collection runs in the worker. Serving the portal at `kingsnewsletter.com/sports` requires a rewrite in the project behind `kingsnewsletter.com`.

## Contributing

Bug reports and ideas are welcome. Please [open an issue](https://github.com/Kings-Newsletter/kings-sports/issues) before larger changes, and run `npm run typecheck` and `npm run build` before submitting a pull request. Sports data must stay accurate: never invent scores or statistics, and keep the source on the page.

## License

This project is licensed under the [MIT License](./LICENSE).

---

<div align="center">

Part of the <a href="https://kingsnewsletter.com">King's Newsletter</a> family.

</div>
