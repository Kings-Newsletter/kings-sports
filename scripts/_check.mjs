import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.log("sem MONGODB_URI");
  process.exit(0);
}
const client = new MongoClient(uri);
await client.connect();
const db = client.db(process.env.MONGODB_DB || undefined);
const col = db.collection(process.env.MONGODB_COLLECTION || "sports");

const now = new Date();
const live = await col.find({ type: "fixture", status: "live" }).project({ _id: 1, sport: 1, competition: 1, kickoff: 1, clock: 1, updatedAt: 1, title: 1 }).toArray();
const f1 = await col.find({ type: "fixture", competition: "formula-1" }).sort({ kickoff: 1 }).project({ _id: 1, status: 1, kickoff: 1, title: 1, result: 1 }).toArray();
const tables = await col.find({ type: "standings", competition: "formula-1" }).toArray();
const runs = await col.find({ type: "ingest_run" }).sort({ startedAt: -1 }).limit(5).project({ job: 1, startedAt: 1, ok: 1 }).toArray();

console.log("agora:", now.toISOString());
console.log("ao vivo:", live.length);
for (const row of live.slice(0, 10)) console.log(" ", row._id, row.sport, row.competition, row.clock, row.title ?? "", row.kickoff?.toISOString(), "upd", row.updatedAt?.toISOString());
console.log("F1 fixtures:", f1.length);
for (const row of f1.slice(-12)) console.log(" ", row._id, row.status, row.kickoff?.toISOString(), row.title, row.result ?? "");
console.log("F1 tabelas:", tables.length);
for (const table of tables) {
  console.log(" ", table.group, table.season, "rows", table.rows?.length, "upd", table.updatedAt?.toISOString());
  for (const row of (table.rows ?? []).slice(0, 5)) console.log("    ", JSON.stringify(row));
}
console.log("últimas execuções:");
for (const run of runs) console.log(" ", run.job, run.startedAt?.toISOString(), run.ok);

await client.close();
