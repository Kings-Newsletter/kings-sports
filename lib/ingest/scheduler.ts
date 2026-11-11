import "server-only";

import { collections } from "@/lib/db/collections";
import { getDb, isDbConfigured } from "@/lib/db/mongo";
import { runJob, type JobName } from "@/lib/ingest/run";

/**
 * Agendador local: roda a coleta dentro do próprio processo do Next.js, sem
 * depender de cron externo. Ligado por padrão em desenvolvimento
 * (`npm run dev`); em produção, só com LOCAL_SCHEDULER=true.
 *
 *  - live:   a cada LOCAL_LIVE_EVERY_SEC (15 s), com trava própria: não espera
 *            a coleta diária nem a da temporada terminarem. Só chama a fonte se
 *            houver jogo em andamento e respeita o intervalo mínimo de cada fonte.
 *  - daily:  ao iniciar, se a última execução tiver mais de 12 h, e depois a
 *            cada 30 min verifica de novo.
 *  - crests: logo depois de cada daily.
 *  - season: calendário da temporada inteira; cada liga é renovada por semana.
 *
 * Em serverless (Vercel) o processo não fica vivo: lá use as rotas /api/cron/*.
 */

const globalForScheduler = globalThis as unknown as { __kingsSportsScheduler?: boolean };

const DAILY_MAX_AGE_MS = 12 * 60 * 60 * 1000;

function seconds(name: string, fallback: number): number {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return (Number.isFinite(value) && value > 0 ? value : fallback) * 1000;
}

export function schedulerEnabled(): boolean {
  if (process.env.LOCAL_SCHEDULER === "false") return false;
  if (process.env.LOCAL_SCHEDULER === "true") return true;
  return process.env.NODE_ENV === "development";
}

export function startLocalScheduler() {
  if (globalForScheduler.__kingsSportsScheduler || !isDbConfigured() || !schedulerEnabled()) return;
  globalForScheduler.__kingsSportsScheduler = true;

  let busy = false;
  let liveBusy = false;
  const run = async (job: JobName) => {
    const db = await getDb();
    const summary = await runJob(db, job);
    const calls = Object.entries(summary.calls)
      .map(([provider, count]) => `${provider}:${count}`)
      .join(" ");
    if (summary.fixtures > 0 || summary.errors.length > 0 || job !== "live") {
      console.log(
        `[agendador] ${job}: ${summary.fixtures} partidas, ${summary.standings} tabelas` +
          (calls ? ` · chamadas ${calls}` : "") +
          (summary.errors.length > 0 ? ` · ${summary.errors.length} erro(s): ${summary.errors[0]}` : ""),
      );
    }
  };

  const guarded = async (task: () => Promise<void>) => {
    if (busy) return;
    busy = true;
    try {
      await task();
    } catch (error) {
      console.error("[agendador] falha:", error instanceof Error ? error.message : error);
    } finally {
      busy = false;
    }
  };

  const dailyIfStale = () =>
    guarded(async () => {
      const db = await getDb();
      const [last] = await collections(db)
        .ingestRuns.find({ job: "daily" })
        .sort({ startedAt: -1 })
        .limit(1)
        .toArray();
      if (last && Date.now() - last.startedAt.getTime() < DAILY_MAX_AGE_MS) return;
      await run("daily");
      await run("crests");
    });

  // Ao vivo tem trava própria: a coleta diária e a da temporada demoram e não
  // podem atrasar placar e relógio.
  const live = async () => {
    if (liveBusy) return;
    liveBusy = true;
    try {
      await run("live");
    } catch (error) {
      console.error("[agendador] falha ao vivo:", error instanceof Error ? error.message : error);
    } finally {
      liveBusy = false;
    }
  };
  // Calendário da temporada: cada liga é renovada uma vez por semana; o job
  // para em ~45 s e continua na próxima chamada, então rodar sempre é barato.
  const season = () =>
    guarded(async () => {
      const db = await getDb();
      const summary = await runJob(db, "season");
      if (summary.season && (summary.season.done.length > 0 || summary.season.pending.length > 0)) {
        console.log(
          `[agendador] temporada: ${summary.season.done.length} liga(s) atualizada(s)` +
            (summary.season.pending.length > 0 ? `, faltam ${summary.season.pending.length}` : ""),
        );
      }
    });

  console.log("[agendador] ligado: ao vivo a cada", seconds("LOCAL_LIVE_EVERY_SEC", 15) / 1000, "s");
  // Dá alguns segundos para o servidor terminar de subir.
  setTimeout(() => void dailyIfStale().then(season).then(live), 5_000);
  setInterval(() => void live(), seconds("LOCAL_LIVE_EVERY_SEC", 15)).unref?.();
  setInterval(() => void dailyIfStale().then(season), 30 * 60 * 1000).unref?.();
  // Enquanto a primeira carga da temporada não termina, continua a cada 2 min.
  setInterval(() => void season(), 2 * 60 * 1000).unref?.();
}
