import "server-only";

import { MongoClient, type Db } from "mongodb";

/**
 * Conexão com o MongoDB da King's Newsletter. O King's Sports usa o mesmo
 * cluster e banco, mas só a coleção `sports` (ver lib/db/collections.ts).
 *
 * MONGODB_DB deve ser o mesmo banco da Newsletter (kings_newsletter em produção,
 * kings_newsletter_preview fora dela). Sem MONGODB_DB, vale o banco da URI.
 *
 * Sem MONGODB_URI, o portal funciona em modo arquivo (lê /content) — útil para
 * desenvolvimento e para o build sem segredos.
 */

const globalForMongo = globalThis as unknown as {
  __kingsSportsMongo?: Promise<MongoClient>;
};

export function isDbConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

function getClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI não definida.");

  if (!globalForMongo.__kingsSportsMongo) {
    const client = new MongoClient(uri, {
      appName: "kings-sports",
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8_000,
    });
    globalForMongo.__kingsSportsMongo = client.connect().catch((error) => {
      // Permite nova tentativa na próxima requisição.
      globalForMongo.__kingsSportsMongo = undefined;
      throw error;
    });
  }
  return globalForMongo.__kingsSportsMongo;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(process.env.MONGODB_DB || undefined);
}
