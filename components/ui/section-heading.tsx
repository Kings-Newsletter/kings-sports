import Link from "next/link";

export function SectionHeading({
  title,
  href,
  linkLabel = "Ver tudo",
  description,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  description?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-line pb-3">
      <div className="min-w-0">
        <h2 className="font-display text-[1.75rem] font-extrabold leading-none text-mist-50 sm:text-[2.125rem]">
          {title}
        </h2>
        {description ? <p className="mt-1.5 max-w-xl text-sm text-mist-500">{description}</p> : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="shrink-0 text-sm font-medium text-flood-300 underline decoration-flood-500/40 underline-offset-4 transition-colors hover:text-flood-400 hover:decoration-flood-400"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
