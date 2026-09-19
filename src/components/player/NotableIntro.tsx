/** Seed `notable` is the first text under the name. Archive `note` is secondary. */
function noteParagraphs(note: string): string[] {
  return note
    .split(/(?<=[.!?])\s+(?=[A-Z“"])/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function NotableIntro({
  notable,
  note,
}: {
  notable: string | null;
  note: string | null;
}) {
  if (!notable && !note) return null;
  const archive = note ? noteParagraphs(note) : [];

  return (
    <section className="space-y-4">
      {notable ? (
        <div className="relative overflow-hidden rounded-3xl border-2 border-galway-gold/45 bg-gradient-to-br from-white via-galway-cream to-galway-gold/20 px-6 py-6 shadow-sm sm:px-7 sm:py-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-galway-maroon/70">
            About
          </p>
          <p className="mt-3 max-w-3xl text-lg font-medium leading-relaxed text-galway-ink sm:text-xl sm:leading-relaxed">
            {notable}
          </p>
        </div>
      ) : null}
      {archive.length > 0 ? (
        <div className="rounded-2xl border border-galway-maroon/12 bg-white/80 px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-galway-ink/40">
            Also noted
          </p>
          <div className="mt-2 space-y-2">
            {archive.map((para) => (
              <p key={para} className="text-sm leading-relaxed text-galway-ink/60">
                {para}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
