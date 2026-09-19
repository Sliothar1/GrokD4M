export type HonourStat = {
  label: string;
  value: string;
};

/** 3–6 signal counters. Renders nothing when empty. */
export function HonourStatStrip({ stats }: { stats: HonourStat[] }) {
  const shown = stats.filter((s) => s.value.trim()).slice(0, 6);
  if (shown.length === 0) return null;

  return (
    <section aria-label="Honour strip">
      <dl className="flex overflow-hidden rounded-2xl border-2 border-galway-gold bg-galway-maroon text-white shadow-sm">
        {shown.map((s, i) => (
          <div
            key={s.label}
            className={`min-w-0 flex-1 px-3 py-3 text-center ${
              i > 0 ? "border-l border-galway-gold/40" : ""
            }`}
          >
            <dd className="truncate text-lg font-black leading-none text-galway-gold sm:text-2xl">
              {s.value}
            </dd>
            <dt className="mt-1.5 truncate text-[10px] font-bold uppercase tracking-wide text-white/75 sm:text-[11px]">
              {s.label}
            </dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
