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
        <div className="border-l-[3px] border-galway-gold pl-4 sm:pl-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-galway-maroon/70">
            About
          </p>
          <p className="mt-1.5 max-w-3xl text-lg font-medium leading-snug text-galway-ink sm:text-xl">
            {notable}
          </p>
        </div>
      ) : null}
      {archive.length > 0 ? (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-galway-ink/40">
            Also noted
          </p>
          <div className="mt-2 space-y-2">
            {archive.map((para) => (
              <p
                key={para}
                className="text-[15px] leading-relaxed text-galway-ink/58"
              >
                {para}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
