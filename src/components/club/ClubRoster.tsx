import Link from "next/link";
import { TrustChip } from "@/components/chips";
import type { ClubRosterRow } from "@/lib/playerClubs";

/** Compact jersey list — names wrap; dual-era players keep their other clubs. */
export function ClubRoster({
  rows,
  clubName,
  unverifiedLabel = "Needs check",
  omitAlsoClubIds = [],
  separateUnverifiedLinks = false,
  presentation = "chips",
}: {
  rows: ClubRosterRow[];
  clubName: string;
  /** Label for players still waiting on verification. */
  unverifiedLabel?: string;
  /** Club ids left off the "Also played with" note. The player link stays. */
  omitAlsoClubIds?: string[];
  /** Unsourced numbered extras sit with the unverified group. */
  separateUnverifiedLinks?: boolean;
  /** Poster list is the Fohenagh jersey page. Other clubs stay on chips. */
  presentation?: "chips" | "poster";
}) {
  const omit = new Set(omitAlsoClubIds);
  const displayRows = rows.map((row) => ({
    ...row,
    alsoClubs: row.alsoClubs.filter((club) => !omit.has(club.id)),
  }));
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

  if (presentation === "poster") {
    return (
      <FohenaghPosterRoster
        clubName={clubName}
        verified={verified}
        needsCheck={needsCheck}
        unverifiedLabel={unverifiedLabel}
        total={rows.length}
      />
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon">
          Players who wore this jersey
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
          No players are linked to {clubName} yet. A name shows here when seed
          or an appearance points at this club.
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

function FohenaghPosterRoster({
  clubName,
  verified,
  needsCheck,
  unverifiedLabel,
  total,
}: {
  clubName: string;
  verified: Array<ClubRosterRow & { alsoClubs: ClubRosterRow["alsoClubs"] }>;
  needsCheck: Array<ClubRosterRow & { alsoClubs: ClubRosterRow["alsoClubs"] }>;
  unverifiedLabel: string;
  total: number;
}) {
  return (
    <section className="fohenagh-roster space-y-8" aria-labelledby="fohenagh-jersey-roster">
      <div className="max-w-2xl space-y-3">
        <h2 id="fohenagh-jersey-roster" className="fohenagh-display">
          The players
        </h2>
        <p className="fohenagh-deck">
          {total === 0
            ? `No players are linked to ${clubName} yet.`
            : total === 1
              ? "One player linked to this jersey."
              : `${total} players linked to this jersey.`}
        </p>
      </div>
      {total === 0 ? null : (
        <div className="space-y-10">
          <PosterNameGroup label="Verified" rows={verified} />
          <PosterNameGroup label={unverifiedLabel} rows={needsCheck} quiet />
        </div>
      )}
    </section>
  );
}

function PosterNameGroup({
  label,
  rows,
  quiet = false,
}: {
  label: string;
  rows: Array<ClubRosterRow & { alsoClubs: ClubRosterRow["alsoClubs"] }>;
  quiet?: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="space-y-4">
      <h3>
        <TrustChip label={label} />
      </h3>
      <ul className={quiet ? "fohenagh-names fohenagh-names-quiet" : "fohenagh-names"}>
        {rows.map((row) => (
          <li key={row.summary.id}>
            <Link href={row.summary.href}>
              {row.summary.title}
              {row.alsoClubs.length > 0 ? (
                <span className="fohenagh-also">
                  {" "}
                  Also played with {row.alsoClubs.map((c) => c.name.replace(/\s*·\s*historic\s*$/i, "")).join(", ")}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
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
                  Also played with {row.alsoClubs.map((c) => c.name.replace(/\s*·\s*historic\s*$/i, "")).join(", ")}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
