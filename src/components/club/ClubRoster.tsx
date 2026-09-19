import Link from "next/link";
import type { ClubRosterRow } from "@/lib/playerClubs";

/** Compact jersey list — names wrap; dual-era players keep their other clubs. */
export function ClubRoster({
  rows,
  clubName,
}: {
  rows: ClubRosterRow[];
  clubName: string;
}) {
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
      )}
    </section>
  );
}
