#!/usr/bin/env node
/**
 * Importa o histórico de resultados do Football-Data.co.uk para o MongoDB.
 *
 *   1. Baixe o CSV do Brasil em https://www.football-data.co.uk/brazil.php
 *      (link "CSV"; o arquivo se chama BRA.csv).
 *   2. Rode:  node --env-file=.env.local scripts/import-history.mjs caminho/BRA.csv
 *
 * Só resultados entram no banco. Todas as colunas de odds/cotações são
 * descartadas na leitura — o King's Sports não publica dado de aposta.
 *
 * Crédito: dados de https://www.football-data.co.uk (ver Notes.txt do site).
 */
import { readFile } from "node:fs/promises";
import { MongoClient } from "mongodb";

const NOISE = new Set(["fc", "ec", "sc", "cf", "ac", "afc", "clube", "club", "de", "da", "do", "the"]);
// Mesma regra de lib/normalize.ts
function normalizeTeam(name) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((word) => word && !NOISE.has(word))
    .join(" ");
}

/** CSV simples (o arquivo não usa aspas com vírgulas internas). */
function parseCsv(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((line) => line.trim());
  const header = lines[0].split(",").map((cell) => cell.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(header.map((key, index) => [key, (cells[index] ?? "").trim()]));
  });
}

/** "dd/mm/yyyy" ou "dd/mm/yy" → "yyyy-mm-dd" */
function toYmd(value) {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const year = y.length === 2 ? `20${y}` : y;
  return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

const file = process.argv[2];
if (!file) {
  console.error("Uso: node --env-file=.env.local scripts/import-history.mjs caminho/BRA.csv");
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI não definida (use --env-file=.env.local).");
  process.exit(1);
}

const rows = parseCsv(await readFile(file, "utf8"));
const docs = [];
for (const row of rows) {
  // Colunas de resultado: Home, Away, HG, AG (arquivos "extra leagues")
  // ou HomeTeam, AwayTeam, FTHG, FTAG (ligas principais).
  const home = row.Home ?? row.HomeTeam;
  const away = row.Away ?? row.AwayTeam;
  const homeGoals = Number.parseInt(row.HG ?? row.FTHG, 10);
  const awayGoals = Number.parseInt(row.AG ?? row.FTAG, 10);
  const date = toYmd(row.Date ?? "");
  if (!home || !away || !date || Number.isNaN(homeGoals) || Number.isNaN(awayGoals)) continue;

  const league = row.League ?? row.Div ?? "Serie A";
  const season = row.Season ?? date.slice(0, 4);
  docs.push({
    _id: `fdcouk:${league}:${date}:${normalizeTeam(home)}:${normalizeTeam(away)}`,
    type: "history",
    league,
    season: String(season),
    date,
    home,
    away,
    homeKey: normalizeTeam(home),
    awayKey: normalizeTeam(away),
    homeGoals,
    awayGoals,
  });
}

const client = new MongoClient(process.env.MONGODB_URI, { appName: "kings-sports-import" });
await client.connect();
try {
  // Mesma coleção compartilhada do portal (lib/db/collections.ts), tipo "history".
  const history = client
    .db(process.env.MONGODB_DB || undefined)
    .collection(process.env.MONGODB_COLLECTION || "sports");
  await history.createIndex({ type: 1, homeKey: 1, date: -1 });
  await history.createIndex({ type: 1, awayKey: 1, date: -1 });
  for (let i = 0; i < docs.length; i += 1000) {
    const chunk = docs.slice(i, i + 1000);
    await history.bulkWrite(
      chunk.map((doc) => ({
        replaceOne: { filter: { _id: doc._id, type: "history" }, replacement: doc, upsert: true },
      })),
      { ordered: false },
    );
  }
  console.log(`Histórico importado: ${docs.length} partidas (${rows.length - docs.length} linhas ignoradas). Odds descartadas.`);
} finally {
  await client.close();
}
