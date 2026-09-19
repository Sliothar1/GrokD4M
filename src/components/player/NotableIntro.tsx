/** Seed `notable` is the first text under the name. Archive `note` is secondary. */
export function NotableIntro({
  notable,
  note,
}: {
  notable: string | null;
  note: string | null;
}) {
  if (!notable && !note) return null;

  return (
    <section className="space-y-4">
      {notable ? (
        <div className="relative overflow-hidden rounded-3xl border-2 border-galway-gold/45 bg-gradient-to-br from-white via-galway-cream to-galway-gold/20 px-6 py-7 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-galway-maroon/70">
            About
          </p>
          <p className="mt-3 text-2xl font-semibold leading-snug tracking-tight text-galway-ink sm:text-[1.7rem] sm:leading-snug">
            {notable}
          </p>
        </div>
      ) : null}
      {note ? (
        <div className="rounded-2xl border border-galway-maroon/15 bg-white px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-galway-ink/45">
            Also noted
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-galway-ink/65">{note}</p>
        </div>
      ) : null}
    </section>
  );
}
