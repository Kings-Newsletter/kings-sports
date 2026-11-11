import Link from "next/link";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon,
  compact = false,
}: {
  title: string;
  description: string;
  action?: { label: string; href: string };
  icon?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-start justify-center rounded-card border border-dashed border-line bg-ink-900/40 ${
        compact ? "gap-2 p-5" : "gap-3 p-8 sm:p-10"
      }`}
    >
      {icon ? <span className="text-mist-500">{icon}</span> : null}
      <p className="font-display text-base font-semibold text-mist-100">{title}</p>
      <p className="max-w-lg text-sm leading-relaxed text-mist-500">{description}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-1 text-sm font-medium text-flood-300 underline decoration-flood-500/40 underline-offset-4 transition-colors hover:text-flood-400"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
