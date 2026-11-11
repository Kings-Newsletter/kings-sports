import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { getDb, isDbConfigured } from "@/lib/db/mongo";
import { runJob, type JobName } from "@/lib/ingest/run";

/**
 * Coleta agendada.
 *
 *   GET /api/cron/daily  — uma vez por dia (Vercel Cron, ver vercel.json)
 *   GET /api/cron/crests — escudos dos times, uma vez por dia depois do daily
 *   GET /api/cron/season — calendário da temporada inteira (retomável)
 *   GET /api/cron/live   — a cada 15 s a 1 min por um agendador externo (o plano Hobby
 *                          da Vercel só permite cron diário)
 *
 * Autenticação: cabeçalho `Authorization: Bearer <CRON_SECRET>` (é o que a
 * Vercel Cron envia automaticamente quando CRON_SECRET está definida).
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const JOBS: JobName[] = ["daily", "live", "crests", "season"];

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function GET(request: NextRequest, context: { params: Promise<{ job: string }> }) {
  const { job } = await context.params;

  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "Não autorizado" }, { status: 401 });
  }
  if (!JOBS.includes(job as JobName)) {
    return NextResponse.json({ ok: false, error: `Job desconhecido: ${job}` }, { status: 404 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, error: "MONGODB_URI não definida" }, { status: 503 });
  }

  try {
    const summary = await runJob(await getDb(), job as JobName);
    return NextResponse.json({ ok: summary.errors.length === 0, ...summary });
  } catch (error) {
    console.error(`[cron:${job}]`, error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Falha na coleta" },
      { status: 500 },
    );
  }
}
