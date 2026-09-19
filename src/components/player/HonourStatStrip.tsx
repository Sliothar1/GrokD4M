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
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
        {shown.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-galway-gold/35 bg-galway-maroon px-3 py-3 text-center text-white shadow-sm"
          >
            <dd className="text-xl font-black leading-none text-galway-gold sm:text-2xl">
              {s.value}
            </dd>
            <dt className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-white/75">
              {s.label}
            </dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
