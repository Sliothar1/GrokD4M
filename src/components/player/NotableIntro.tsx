import type { FactSourceStatus } from "@/lib/verification";

/** Seed `notable` is the first text under the name. Archive `note`, then `notes`. */
function splitLead(text: string): { lead: string; rest: string } {
  const match = text.match(/^(.+?[.!?])(?:\s+|$)([\s\S]*)$/);
  if (!match) return { lead: text, rest: "" };
  return { lead: match[1].trim(), rest: match[2].trim() };
}

function noteParagraphs(note: string): string[] {
  return note
    .split(/(?<=[.!?])\s+(?=[A-Z“"])/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function NotableIntro({
  notable,
  note,
  notes,
  notableCite,
  noteCite,
  notesCite,
  notableBadge,
  noteBadge,
  notesBadge,
  notableStatus,
  noteStatus,
  notesStatus,
}: {
  notable: string | null;
  note: string | null;
  notes?: string | null;
  notableCite?: React.ReactNode;
  noteCite?: React.ReactNode;
  notesCite?: React.ReactNode;
  notableBadge?: React.ReactNode;
  noteBadge?: React.ReactNode;
  notesBadge?: React.ReactNode;
  notableStatus?: FactSourceStatus;
  noteStatus?: FactSourceStatus;
  notesStatus?: FactSourceStatus;
}) {
  if (!notable && !note && !notes) return null;
  const archive = note ? noteParagraphs(note) : [];
  const lead = notable ? splitLead(notable) : null;
  const notableUnverified = notableStatus === "unverified";
  const noteUnverified = noteStatus === "unverified";
  const notesUnverified = notesStatus === "unverified";

  return (
    <section className="max-w-full space-y-4">
      {notable ? (
        notableUnverified ? (
          <div className="max-w-full">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-700">
              About
            </p>
            <p className="mt-1.5 max-w-3xl text-base font-medium leading-snug text-stone-800">
              {lead?.lead}
              {!lead?.rest ? notableCite : null}
              {!lead?.rest && notableBadge ? (
                <span className="ml-2 inline-flex align-middle">{notableBadge}</span>
              ) : null}
            </p>
            {lead?.rest ? (
              <p className="mt-2 max-w-3xl text-base leading-relaxed text-stone-800">
                {lead.rest}
                {notableCite}
                {notableBadge ? (
                  <span className="ml-2 inline-flex align-middle">{notableBadge}</span>
                ) : null}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="max-w-full border-l-[3px] border-galway-gold pl-4 sm:pl-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-galway-maroon">
              About
            </p>
            <p className="hw-serif mt-1.5 max-w-3xl text-2xl leading-snug text-galway-ink sm:text-3xl">
              {lead?.lead}
              {!lead?.rest ? notableCite : null}
              {!lead?.rest && notableBadge ? (
                <span className="ml-2 inline-flex align-middle">{notableBadge}</span>
              ) : null}
            </p>
            {lead?.rest ? (
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-galway-ink">
                {lead.rest}
                {notableCite}
                {notableBadge ? (
                  <span className="ml-2 inline-flex align-middle">{notableBadge}</span>
                ) : null}
              </p>
            ) : null}
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
      {notes ? (
        <div className="max-w-full">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-700">
            Notes
          </p>
          <p
            className={
              notesUnverified
                ? "mt-2 break-words text-[15px] leading-relaxed text-stone-800"
                : "mt-2 break-words text-[15px] leading-relaxed text-galway-ink"
            }
          >
            {notes}
            {notesCite}
            {notesBadge ? (
              <span className="ml-2 inline-flex align-middle">{notesBadge}</span>
            ) : null}
          </p>
        </div>
      ) : null}
    </section>
  );
}
