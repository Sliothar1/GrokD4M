import Link from "next/link";

export type FactRow = { label: string; value: string };

/** Compact facts, in the spirit of a Wikipedia infobox. Cited fields only. */
export function FactBox({ rows }: { rows: FactRow[] }) {
  if (rows.length === 0) return null;
  return (
    <aside className="hw-card max-w-md px-4 py-3" aria-label="Player facts">
      <dl className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[6.5rem_1fr] gap-2 text-sm">
            <dt className="font-bold uppercase tracking-wide text-galway-ink/50">
              {row.label}
            </dt>
            <dd className="text-galway-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

export type TimelineItem = {
  key: string;
  year: string;
  label: string;
  href?: string;
};

/** A short year line, like a club career list. Cited items only. */
export function CareerTimeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="career-timeline-heading">
      <h2
        id="career-timeline-heading"
        className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-700"
      >
        Timeline
      </h2>
      <ol className="mt-2 max-w-3xl space-y-2 border-l border-[var(--hw-line)] pl-4">
        {items.map((item) => (
          <li key={item.key} className="text-sm leading-relaxed text-galway-ink">
            <span className="font-bold text-galway-maroon">{item.year}</span>
            {" · "}
            {item.href ? (
              <Link href={item.href} className="underline decoration-galway-ink/30">
                {item.label}
              </Link>
            ) : (
              item.label
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
