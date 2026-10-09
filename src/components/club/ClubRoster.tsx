import Link from "next/link";
import { TrustChip } from "@/components/chips";
import type { ClubRosterRow } from "@/lib/playerClubs";

/** Compact jersey list — names wrap; dual-era players keep their other clubs. */
export function ClubRoster({
  rows,
  clubName,
  unverifiedLabel = "Still checking",
  omitAlsoClubIds = [],
  separateUnverifiedLinks = false,
  id,
  alphabetical = false,
  verifiedIds,
  heading = "Players who wore this jersey",
}: {
  rows: ClubRosterRow[];
  clubName: string;
  /** Label for players still waiting on verification. */
  unverifiedLabel?: string;
  /** Club ids left off the "· also …" suffix. The player link stays. */
  omitAlsoClubIds?: string[];
  /** Unsourced numbered extras sit with the unverified group. */
  separateUnverifiedLinks?: boolean;
  id?: string;
  /** One A–Z list. Letters collapse so a long parish roll stays tidy. */
  alphabetical?: boolean;
  /** These ids show a Verified mark even when the seed confidence is still open. */
  verifiedIds?: ReadonlySet<string>;
  heading?: string;
}) {
  const omit = new Set(omitAlsoClubIds);
  const displayRows = rows.map((row) => ({
    ...row,
    alsoClubs: row.alsoClubs.filter((club) => !omit.has(club.id)),
    trust: verifiedIds?.has(row.summary.id) ? "Verified" : row.trust,
  }));
  if (alphabetical) {
    return (
      <AlphaRoster id={id} heading={heading} clubName={clubName} rows={displayRows} />
    );
  }
  const verified = displayRows.filter(
    (row) =>
      row.trust === "Verified" && !(separateUnverifiedLinks && row.linkPending)
  );
  const needsCheck = displayRows.filter(
    (row) =>
      row.trust !== "Verified" || (separateUnverifiedLinks && row.linkPending)
  );
  verified.sort((a, b) => a.summary.title.localeCompare(b.summary.title));
  needsCheck.sort((a, b) => a.summary.title.localeCompare(b.summary.title));

  return (
    <section id={id} className="scroll-mt-6 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon">
          {heading}
        </h2>
        <p className="text-sm font-semibold text-galway-ink/45">
          {rows.length === 0
            ? "None linked yet"
            : rows.length === 1
              ? "1 name"
              : `${rows.length} names`}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-galway-ink/55">
          No players are linked to {clubName} yet. A name shows here once a
          cutting or a match names them.
        </p>
      ) : (
        <div className="space-y-4">
          <RosterGroup label="Verified" rows={verified} />
          <RosterGroup label={unverifiedLabel} rows={needsCheck} />
        </div>
      )}
    </section>
  );
}

function letterOf(name: string): string {
  const plain = name
    .trim()
    .charAt(0)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  return /[A-Z]/.test(plain) ? plain : "#";
}

function AlphaRoster({
  id,
  heading,
  clubName,
  rows,
}: {
  id?: string;
  heading: string;
  clubName: string;
  rows: ClubRosterRow[];
}) {
  const sorted = [...rows].sort((a, b) =>
    a.summary.title.localeCompare(b.summary.title, "en", { sensitivity: "base" })
  );
  const groups = new Map<string, ClubRosterRow[]>();
  for (const row of sorted) {
    const letter = letterOf(row.summary.title);
    const list = groups.get(letter) ?? [];
    list.push(row);
    groups.set(letter, list);
  }
  const letters = [...groups.keys()];

  return (
    <section id={id} className="scroll-mt-6 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon">
          {heading}
        </h2>
        <p className="text-sm font-semibold text-galway-ink/45">
          {rows.length === 1 ? "1 player" : `${rows.length} players`}
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-galway-ink/55">
          No players are linked to {clubName} yet.
        </p>
      ) : (
        <>
          <nav aria-label="Jump to a letter" className="flex flex-wrap gap-1">
            {letters.map((letter) => (
              <a
                key={letter}
                href={`#players-${letter}`}
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-galway-maroon/20 bg-white px-2 text-sm font-bold text-galway-maroon hover:border-galway-maroon"
              >
                {letter}
              </a>
            ))}
          </nav>
          <div className="space-y-2">
            {letters.map((letter) => (
              <details key={letter} id={`players-${letter}`} className="hw-card scroll-mt-6">
                <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-galway-ink">
                  {letter}
                  <span className="ml-2 font-semibold text-galway-ink/45">
                    {groups.get(letter)?.length}
                  </span>
                </summary>
                <ul className="space-y-1 border-t border-[var(--hw-line)] px-2 py-2">
                  {(groups.get(letter) ?? []).map((row) => (
                    <li
                      key={row.summary.id}
                      className="flex flex-wrap items-baseline gap-x-2 rounded-xl px-2 py-1.5 text-sm"
                    >
                      <Link
                        href={row.summary.href}
                        className="font-bold text-galway-ink underline decoration-transparent hover:decoration-galway-maroon"
                      >
                        {row.summary.title}
                      </Link>
                      {row.trust === "Verified" ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-green-900">
                          Verified
                        </span>
                      ) : null}
                      {row.alsoClubs.length > 0 ? (
                        <span className="font-semibold text-galway-ink/45">
                          also{" "}
                          {row.alsoClubs.map((club, index) => (
                            <Link
                              key={club.id}
                              href={club.href}
                              className="underline decoration-galway-ink/25"
                            >
                              {club.name}
                              {index < row.alsoClubs.length - 1 ? ", " : ""}
                            </Link>
                          ))}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function RosterGroup({
  label,
  rows,
}: {
  label: string;
  rows: ClubRosterRow[];
}) {
  if (rows.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3>
        <TrustChip label={label} />
      </h3>
      <ul className="flex flex-wrap gap-2">
        {rows.map((row) => (
          <li key={row.summary.id}>
            <Link
              href={row.summary.href}
              className="inline-flex max-w-full flex-wrap items-baseline gap-x-1 rounded-full border border-galway-maroon/15 bg-white px-3 py-1 text-sm font-bold text-galway-ink transition hover:border-galway-maroon hover:text-galway-maroon focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-gold"
            >
              <span>{row.summary.title}</span>
              {row.alsoClubs.length > 0 ? (
                <span className="font-semibold text-galway-ink/45">
                  · also {row.alsoClubs.map((c) => c.name).join(", ")}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
