const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "America/Sao_Paulo",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  timeZone: "America/Sao_Paulo",
});

function toDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | Date): string {
  const date = toDate(value);
  return date ? dateFormatter.format(date) : "Data não informada";
}

export function formatShortDate(value: string | Date): string {
  const date = toDate(value);
  return date ? shortDateFormatter.format(date).replace(".", "") : "—";
}

export function formatTime(value: string | Date): string {
  const date = toDate(value);
  return date ? timeFormatter.format(date) : "—";
}

export function formatWeekday(value: string | Date): string {
  const date = toDate(value);
  return date ? weekdayFormatter.format(date).replace(".", "") : "—";
}

/** "em 1 h 05 min" até o instante dado. */
export function startsInText(kickoff: string | Date, now = Date.now()): string {
  const date = toDate(kickoff);
  if (!date) return "";
  const minutes = Math.round((date.getTime() - now) / 60_000);
  if (minutes <= 0) return "começando agora";
  if (minutes < 60) return `em ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours >= 6 || rest === 0) return `em ${hours} h`;
  return `em ${hours} h ${String(rest).padStart(2, "0")} min`;
}

export function formatDateRange(from: string | Date, to: string | Date): string {
  return `${formatTime(from)} – ${formatTime(to)}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function relativeTime(value: string | Date): string {
  const date = toDate(value);
  if (!date) return "";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (Math.abs(minutes) < 1) return "agora";
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  if (Math.abs(minutes) < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return rtf.format(-days, "day");
  return formatDate(date);
}
