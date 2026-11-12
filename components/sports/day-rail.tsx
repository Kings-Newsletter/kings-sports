import type { ReactNode } from "react";

import { addDays, toLocalYmd } from "@/lib/dates";

const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });
const month = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

/**
 * Um dia na régua do tempo: o número do dia em corpo de placar numa coluna à
 * esquerda, os jogos à direita. É o mesmo desenho da linha do tempo da home,
 * em escala de dias.
 */
export function DayRail({
  ymd,
  count,
  id,
  stickyTop = "top-[5rem] xl:top-[8.2rem]",
  children,
}: {
  ymd: string;
  count?: number;
  id?: string;
  /** Distância do topo para a data grudar ao rolar (abaixo das barras fixas). */
  stickyTop?: string;
  children: ReactNode;
}) {
  const date = new Date(`${ymd}T12:00:00Z`);
  const today = toLocalYmd();
  const relative = ymd === today ? "Hoje" : ymd === addDays(today, 1) ? "Amanhã" : ymd === addDays(today, -1) ? "Ontem" : null;
  const isToday = ymd === today;
  const label = `${relative ? `${relative}, ` : ""}${weekday.format(date).replace(".", "")} ${date.getUTCDate()} de ${month.format(date).replace(".", "")}`;

  return (
    <section
      id={id}
      aria-label={label}
      className="grid scroll-mt-40 grid-cols-[3rem_minmax(0,1fr)] gap-x-2 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-x-6"
    >
      <h2 className={`sticky ${stickyTop} self-start pt-1 text-right`}>
        <span className={`score block text-[2rem] leading-[0.85] sm:text-[3rem] ${isToday ? "text-flood-300" : "text-mist-100"}`}>
          {String(date.getUTCDate()).padStart(2, "0")}
        </span>
        <span className={`mt-1 block font-display text-[0.95rem] font-semibold leading-tight ${isToday ? "text-flood-300" : "text-mist-400"}`}>
          {relative ?? weekday.format(date).replace(".", "")}
        </span>
        <span className="block text-[0.75rem] text-mist-600">{month.format(date).replace(".", "")}</span>
        {typeof count === "number" ? <span className="sr-only">, {count} {count === 1 ? "evento" : "eventos"}</span> : null}
      </h2>
      <div className={`min-w-0 border-l pb-10 pl-2.5 sm:pl-6 ${isToday ? "border-flood-400" : "border-line"}`}>{children}</div>
    </section>
  );
}
