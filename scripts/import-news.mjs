#!/usr/bin/env node
/**
 * Importa o acervo legado de content/noticias.json para a coleção do portal.
 *
 *   node --env-file=.env.local scripts/import-news.mjs
 *
 * Upsert por "article:<slug>"; artigos não listados no JSON não são removidos.
 */
import { readFile } from "node:fs/promises";
import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI não definida (use --env-file=.env.local).");
  process.exit(1);
}

const source = new URL("../content/noticias.json", import.meta.url);
const articles = JSON.parse(await readFile(source, "utf8"));
if (!Array.isArray(articles)) {
  throw new Error("content/noticias.json deve conter um array de artigos.");
}

const docs = articles.map((article, index) => {
  if (
    !article ||
    typeof article.slug !== "string" ||
    typeof article.title !== "string" ||
    typeof article.dek !== "string" ||
    typeof article.sport !== "string" ||
    typeof article.author !== "string" ||
    typeof article.publishedAt !== "string"
  ) {
    throw new Error(`Artigo inválido na posição ${index}: confira os campos obrigatórios.`);
  }

  const publishedAt = new Date(article.publishedAt);
  const updatedAt = article.updatedAt ? new Date(article.updatedAt) : undefined;
  if (!Number.isFinite(publishedAt.getTime()) || (updatedAt && !Number.isFinite(updatedAt.getTime()))) {
    throw new Error(`Artigo "${article.slug}" tem data de publicação/atualização inválida.`);
  }

  const { slug, publishedAt: _publishedAt, updatedAt: _updatedAt, ...fields } = article;
  return {
    replaceOne: {
      filter: { _id: `article:${slug}`, type: "article" },
      replacement: {
        ...fields,
        _id: `article:${slug}`,
        type: "article",
        publishedAt,
        ...(updatedAt ? { updatedAt } : {}),
      },
      upsert: true,
    },
  };
});

const client = new MongoClient(process.env.MONGODB_URI, { appName: "kings-sports-news-import" });
await client.connect();
try {
  const articlesCollection = client
    .db(process.env.MONGODB_DB || undefined)
    .collection(process.env.MONGODB_COLLECTION || "sports");
  await Promise.all([
    articlesCollection.createIndex({ type: 1, publishedAt: -1 }),
    articlesCollection.createIndex({ type: 1, sport: 1, publishedAt: -1 }),
    articlesCollection.createIndex({ type: 1, competition: 1, publishedAt: -1 }),
  ]);
  if (docs.length > 0) {
    await articlesCollection.bulkWrite(docs, { ordered: true });
  }
  console.log(`Artigos importados/atualizados: ${docs.length}.`);
} finally {
  await client.close();
}
