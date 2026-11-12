import "server-only";

import type {
  AnyBulkWriteOperation,
  Collection,
  Db,
  Document,
  Filter,
  FindCursor,
  UpdateFilter,
  UpdateOptions,
  WithId,
} from "mongodb";

import type { Article, Fixture, HistoricalMatch, Standings, StatBoard } from "@/lib/types";

/**
 * Armazenamento do King's Sports.
 *
 * Tudo fica em UMA coleção (`sports`, ou MONGODB_COLLECTION) dentro do banco da
 * King's Newsletter. Cada documento tem um campo `type` que separa os tipos:
 * fixture, standings, history, api_usage, ingest_run, kv, crest, stats e article.
 * O portal nunca lê nem escreve nas coleções da Newsletter.
 *
 * Quem escreve aqui é a coleta, que roda no worker da King's Newsletter
 * (kings-newsletter-worker, src/sports), e os importadores de scripts/. O
 * worker também cria os índices.
 */

export const COLLECTION_NAME = process.env.MONGODB_COLLECTION || "sports";

export type FixtureDoc = Omit<Fixture, "id" | "kickoff" | "updatedAt"> & {
  _id: string; // "<provedor>:<id no provedor>"
  kickoff: Date;
  updatedAt: Date;
};

export type ArticleDoc = Omit<Article, "publishedAt" | "updatedAt"> & {
  _id: string; // "article:<slug>"
  publishedAt: Date | string;
  updatedAt?: Date | string;
};

export type StandingsDoc = Omit<Standings, "updatedAt"> & {
  _id: string; // "table:<competição>:<grupo>"
  updatedAt: Date;
};

export type HistoryDoc = HistoricalMatch & {
  _id: string; // "fdcouk:…"
  /** Nomes normalizados (lib/normalize) para busca */
  homeKey: string;
  awayKey: string;
};

export type ApiUsageDoc = {
  _id: string; // "usage:<provedor>:<YYYY-MM-DD UTC>"
  provider: string;
  day: string;
  month: string; // YYYY-MM
  calls: number;
  /** Último X-RateLimit-Remaining informado pelo provedor */
  remaining?: number;
  updatedAt: Date;
};

export type IngestRunDoc = {
  job: string;
  startedAt: Date;
  finishedAt: Date;
  ok: boolean;
  summary: unknown;
};

export type KvDoc = { _id: string; value: unknown; updatedAt: Date }; // "kv:<chave>"

/** Escudo de um time (TheSportsDB). `url` nulo = procurado e não encontrado. */
export type CrestDoc = {
  _id: string; // "crest:<esporte>:<nome normalizado>"
  sport: string;
  name: string;
  url: string | null;
  source: string;
  updatedAt: Date;
};

/** Quadro de líderes (artilharia, pontos por jogo…). */
export type StatsDoc = Omit<StatBoard, "updatedAt"> & {
  _id: string; // "stats:<competição>:<métrica>"
  updatedAt: Date;
};

type DocType =
  | "fixture"
  | "standings"
  | "history"
  | "api_usage"
  | "ingest_run"
  | "kv"
  | "crest"
  | "stats"
  | "article";

/**
 * Visão de um tipo dentro da coleção compartilhada: injeta `type` em toda
 * consulta e escrita, para que um tipo nunca enxergue documentos de outro.
 */
class TypedView<T extends Document> {
  constructor(
    private collection: Collection<Document>,
    private type: DocType,
  ) {}

  private scope(filter: Filter<T> = {}): Filter<Document> {
    return { ...(filter as Filter<Document>), type: this.type };
  }

  find(filter: Filter<T> = {}): FindCursor<WithId<T>> {
    return this.collection.find(this.scope(filter)) as unknown as FindCursor<WithId<T>>;
  }

  findOne(filter: Filter<T>): Promise<WithId<T> | null> {
    return this.collection.findOne(this.scope(filter)) as Promise<WithId<T> | null>;
  }

  updateOne(filter: Filter<T>, update: UpdateFilter<T>, options?: UpdateOptions) {
    const scoped = update as UpdateFilter<Document>;
    return this.collection.updateOne(
      this.scope(filter),
      { ...scoped, $set: { ...(scoped.$set ?? {}), type: this.type } },
      options,
    );
  }

  deleteMany(filter: Filter<T>) {
    return this.collection.deleteMany(this.scope(filter));
  }

  insertOne(doc: T) {
    return this.collection.insertOne({ ...doc, type: this.type });
  }

  aggregate<R extends Document>(pipeline: Document[]) {
    return this.collection.aggregate<R>([{ $match: { type: this.type } }, ...pipeline]);
  }

  bulkWrite(operations: AnyBulkWriteOperation<T>[], options?: { ordered?: boolean }) {
    const scoped = operations.map((operation) => {
      const op = operation as AnyBulkWriteOperation<Document>;
      if ("updateOne" in op) {
        const update = op.updateOne.update as UpdateFilter<Document>;
        return {
          updateOne: {
            ...op.updateOne,
            filter: { ...op.updateOne.filter, type: this.type },
            update: { ...update, $set: { ...(update.$set ?? {}), type: this.type } },
          },
        };
      }
      if ("replaceOne" in op) {
        return {
          replaceOne: {
            ...op.replaceOne,
            filter: { ...op.replaceOne.filter, type: this.type },
            replacement: { ...op.replaceOne.replacement, type: this.type },
          },
        };
      }
      throw new Error("Operação não suportada na coleção compartilhada.");
    });
    return this.collection.bulkWrite(scoped, options);
  }
}

export function collections(db: Db) {
  const shared = db.collection<Document>(COLLECTION_NAME);
  return {
    articles: new TypedView<ArticleDoc>(shared, "article"),
    fixtures: new TypedView<FixtureDoc>(shared, "fixture"),
    standings: new TypedView<StandingsDoc>(shared, "standings"),
    history: new TypedView<HistoryDoc>(shared, "history"),
    apiUsage: new TypedView<ApiUsageDoc>(shared, "api_usage"),
    ingestRuns: new TypedView<IngestRunDoc>(shared, "ingest_run"),
    kv: new TypedView<KvDoc>(shared, "kv"),
    crests: new TypedView<CrestDoc>(shared, "crest"),
    stats: new TypedView<StatsDoc>(shared, "stats"),
  };
}

export function fixtureFromDoc(doc: WithId<FixtureDoc> & { type?: string }): Fixture {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, kickoff, updatedAt, type, ...rest } = doc;
  return { ...rest, id: _id, kickoff: kickoff.toISOString(), updatedAt: updatedAt.toISOString() };
}

export function articleFromDoc(doc: WithId<ArticleDoc> & { type?: string }): Article {
  const { _id, publishedAt, updatedAt, type: _type, ...rest } = doc;
  const slug = _id.startsWith("article:") ? _id.slice("article:".length) : _id;
  const toIsoString = (value: Date | string) => {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) {
      throw new Error(`Data inválida no artigo "${slug}".`);
    }
    return date.toISOString();
  };
  return {
    ...rest,
    slug,
    publishedAt: toIsoString(publishedAt),
    ...(updatedAt ? { updatedAt: toIsoString(updatedAt) } : {}),
  };
}

export function standingsFromDoc(doc: WithId<StandingsDoc> & { type?: string }): Standings {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, updatedAt, type, ...rest } = doc;
  return { ...rest, updatedAt: updatedAt.toISOString() };
}
