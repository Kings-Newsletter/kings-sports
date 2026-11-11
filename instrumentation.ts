/**
 * Executado uma vez quando o servidor do Next.js sobe.
 * Liga o agendador local da coleta (ver lib/ingest/scheduler.ts).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startLocalScheduler } = await import("./lib/ingest/scheduler");
  startLocalScheduler();
}
