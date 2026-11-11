import Link from "next/link";

import { TeamCrest } from "@/components/sports/team-crest";
import { constructorHref, driverHref } from "@/lib/slugs";
import type { StandingRow, Standings } from "@/lib/types";

function FormBadge({ result }: { result: "W" | "D" | "L" }) {
  const map = {
    W: { label: "V", className: "bg-pitch-500/20 text-pitch-400", title: "Vitória" },
    D: { label: "E", className: "bg-ink-700 text-mist-400", title: "Empate" },
    L: { label: "D", className: "bg-live-500/15 text-live-400", title: "Derrota" },
  } as const;
  const item = map[result];
  return (
    <span
      className={`grid size-5 place-items-center rounded-[3px] font-display text-[0.75rem] font-bold ${item.className}`}
      title={item.title}
    >
      {item.label}
    </span>
  );
}

type Column = {
  key: string;
  label: string;
  title: string;
  value: (row: StandingRow) => string | number | undefined;
  strong?: boolean;
  full?: boolean; // só na versão completa
};

const pct = (value?: number) =>
  value === undefined ? undefined : value.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).replace(/^0/, "");

const columns: Record<NonNullable<Standings["format"]>, Column[]> = {
  football: [
    { key: "p", label: "P", title: "Pontos", value: (r) => r.points, strong: true },
    { key: "j", label: "J", title: "Jogos", value: (r) => r.played },
    { key: "v", label: "V", title: "Vitórias", value: (r) => r.wins, full: true },
    { key: "e", label: "E", title: "Empates", value: (r) => r.draws, full: true },
    { key: "d", label: "D", title: "Derrotas", value: (r) => r.losses, full: true },
    {
      key: "sg",
      label: "SG",
      title: "Saldo de gols",
      value: (r) => (r.goalsFor !== undefined && r.goalsAgainst !== undefined ? r.goalsFor - r.goalsAgainst : undefined),
      full: true,
    },
  ],
  basketball: [
    { key: "v", label: "V", title: "Vitórias", value: (r) => r.wins, strong: true },
    { key: "d", label: "D", title: "Derrotas", value: (r) => r.losses },
    { key: "pct", label: "%", title: "Aproveitamento", value: (r) => pct(r.winPct) },
    { key: "gb", label: "JA", title: "Jogos atrás do líder", value: (r) => (r.gamesBehind ? r.gamesBehind : "–"), full: true },
    { key: "seq", label: "Seq.", title: "Sequência", value: (r) => r.streak?.replace("W", "V").replace("L", "D"), full: true },
  ],
  motorsport: [
    { key: "pts", label: "Pts", title: "Pontos", value: (r) => r.points, strong: true },
    { key: "v", label: "Vit.", title: "Vitórias", value: (r) => r.wins },
  ],
};

export function StandingsTable({
  table,
  compact = false,
  limit,
  highlightTeamId,
}: {
  table: Standings;
  compact?: boolean;
  limit?: number;
  /** Destaca a linha deste time (página do time) */
  highlightTeamId?: string;
}) {
  const format = table.format ?? "football";
  const visible = columns[format].filter((column) => !compact || !column.full);
  const showForm = format === "football" && table.rows.some((row) => row.form && row.form.length > 0);
  const rows = limit ? table.rows.slice(0, limit) : table.rows;
  const teamLabel = format === "motorsport" && table.group === "Pilotos" ? "Piloto" : "Equipe";
  // Legenda das zonas (Libertadores, rebaixamento…), na ordem em que aparecem.
  const legend = [
    ...new Map(
      table.rows.filter((row) => row.note).map((row) => [row.note!.label, row.note!] as const),
    ).values(),
  ];

  return (
    <div className="scoreboard overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className={`w-full border-collapse text-sm ${compact ? "" : "min-w-[34rem]"}`}>
          <caption className="sr-only">
            Classificação de {table.competition} — {table.season}
            {table.group ? ` — ${table.group}` : ""}
          </caption>
          <thead>
            <tr className="border-b border-line-soft font-display text-[0.75rem] text-mist-500">
              <th scope="col" className="py-2.5 pl-4 pr-2 text-left font-bold">
                #
              </th>
              <th scope="col" className="px-2 py-2.5 text-left font-bold">
                {teamLabel}
              </th>
              {visible.map((column) => (
                <th key={column.key} scope="col" className="px-2 py-2.5 text-center font-bold">
                  <abbr title={column.title} className="no-underline">
                    {column.label}
                  </abbr>
                </th>
              ))}
              {showForm && !compact ? (
                <th scope="col" className="py-2.5 pl-2 pr-4 text-right font-bold">
                  Últimos
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const accent = row.note?.color ?? (format === "motorsport" ? row.color : undefined);
              const isDriver = format === "motorsport" && table.group === "Pilotos";
              const rowHref =
                format === "motorsport"
                  ? table.group === "Pilotos"
                    ? driverHref(row)
                    : table.group === "Construtores"
                      ? constructorHref(row)
                      : undefined
                  : row.teamId
                    ? `/times/${table.competition}/${row.teamId}`
                    : undefined;
              return (
              <tr
                key={`${row.position}-${row.team}`}
                className={`border-b border-line-soft/60 last:border-b-0 hover:bg-ink-800/40 ${
                  highlightTeamId && row.teamId === highlightTeamId ? "bg-flood-500/10" : ""
                }`}
              >
                <td className="relative py-2.5 pl-4 pr-2 text-left">
                  {accent ? (
                    <span
                      className="absolute inset-y-1 left-0 w-[3px] rounded-r"
                      style={{ backgroundColor: `#${accent}` }}
                      title={row.note?.label}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className={`score text-base ${row.position <= 3 ? "text-mist-100" : "text-mist-500"}`}>
                    {row.position}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <span className="flex items-center gap-2.5">
                    {isDriver ? (
                      row.crest ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.crest}
                          alt=""
                          width={32}
                          height={32}
                          loading="lazy"
                          className="size-8 shrink-0 rounded-full object-cover object-top ring-2"
                          style={{ backgroundColor: row.color ? `#${row.color}33` : undefined, ["--tw-ring-color" as string]: row.color ? `#${row.color}` : undefined }}
                        />
                      ) : (
                        <TeamCrest name={row.team} size={32} />
                      )
                    ) : format !== "motorsport" ? (
                      <TeamCrest url={row.crest} name={row.team} size={22} />
                    ) : (
                      <span
                        className="size-[22px] shrink-0 rounded-[3px]"
                        style={{ backgroundColor: row.color ? `#${row.color}` : "#334155" }}
                        aria-hidden="true"
                      />
                    )}
                    <span className="min-w-0">
                      {rowHref ? (
                        <Link
                          href={rowHref}
                          className="block truncate font-medium text-mist-100 hover:text-flood-300"
                        >
                          {row.team}
                        </Link>
                      ) : (
                        <span className="block truncate font-medium text-mist-100">{row.team}</span>
                      )}
                      {row.detail && !compact ? (
                        <span className="block truncate text-xs text-mist-500">{row.detail}</span>
                      ) : null}
                    </span>
                  </span>
                </td>
                {visible.map((column) => (
                  <td
                    key={column.key}
                    className={`px-2 py-2.5 text-center tabular-nums ${
                      column.strong ? "score text-base text-mist-50" : "text-mist-400"
                    }`}
                  >
                    {column.value(row) ?? "–"}
                  </td>
                ))}
                {showForm && !compact ? (
                  <td className="py-2.5 pl-2 pr-4">
                    <div className="flex justify-end gap-1">
                      {row.form?.slice(-5).map((result, index) => (
                        <FormBadge key={index} result={result} />
                      ))}
                    </div>
                  </td>
                ) : null}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {legend.length > 0 && !compact ? (
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line-soft px-4 py-2.5 text-xs text-mist-400">
          {legend.map((item) => (
            <li key={item.label} className="flex items-center gap-2">
              <span className="h-3 w-[3px] rounded" style={{ backgroundColor: `#${item.color}` }} aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
      ) : null}
      {table.source ? (
        <p className="border-t border-line-soft px-4 py-2 text-[0.6875rem] text-mist-600">
          Fonte: {table.source}, atualizado em{" "}
          {new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Sao_Paulo",
          }).format(new Date(table.updatedAt))}
        </p>
      ) : null}
    </div>
  );
}
