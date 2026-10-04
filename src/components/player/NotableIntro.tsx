import type { FactSourceStatus } from "@/lib/verification";

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
  notableCite,
  noteCite,
  notableBadge,
  noteBadge,
  notableStatus,
  noteStatus,
}: {
  notable: string | null;
  note: string | null;
  notableCite?: React.ReactNode;
  noteCite?: React.ReactNode;
  notableBadge?: React.ReactNode;
  noteBadge?: React.ReactNode;
  notableStatus?: FactSourceStatus;
  noteStatus?: FactSourceStatus;
}) {
  if (!notable && !note) return null;
  const archive = note ? noteParagraphs(note) : [];
  const notableUnverified = notableStatus === "unverified";
  const noteUnverified = noteStatus === "unverified";

  return (
    <section className="max-w-full space-y-4">
      {notable ? (
        notableUnverified ? (
          <div className="max-w-full">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-700">
              About
            </p>
            <p className="mt-1.5 max-w-3xl text-base font-medium leading-snug text-stone-800">
              {notable}
              {notableCite}
              {notableBadge ? (
                <span className="ml-2 inline-flex align-middle">{notableBadge}</span>
              ) : null}
            </p>
          </div>
        ) : (
          <div className="max-w-full border-l-[3px] border-galway-gold pl-4 sm:pl-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-galway-maroon">
              About
            </p>
            <p className="mt-1.5 max-w-3xl text-lg font-medium leading-snug text-galway-ink sm:text-xl">
              {notable}
              {notableCite}
              {notableBadge ? (
                <span className="ml-2 inline-flex align-middle">{notableBadge}</span>
              ) : null}
            </p>
          </div>
        )
      ) : null}
      {archive.length > 0 ? (
        <div className="max-w-full">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-700">
            Also noted
          </p>
          <div className="mt-2 space-y-2">
            {archive.map((para, index) => (
              <p
                key={para}
                className={
                  noteUnverified
                    ? "text-[15px] leading-relaxed text-stone-800"
                    : "text-[15px] leading-relaxed text-galway-ink"
                }
              >
                {para}
                {index === archive.length - 1 ? noteCite : null}
                {index === archive.length - 1 && noteBadge ? (
                  <span className="ml-2 inline-flex align-middle">{noteBadge}</span>
                ) : null}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
