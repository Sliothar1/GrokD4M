import Link from "next/link";
import { ClubChip } from "@/components/chips";
import type { DualEraStripEntry } from "@/lib/playerClubs";

/**
 * Verified dual-era players only. Empty lists render nothing so a club
 * with no verified dual-era names keeps the roster as the first list.
 */
export function DualEraStrip({
  variant,
  entries,
}: {
  variant: "amalgam" | "historic";
  entries: DualEraStripEntry[];
}) {
  if (entries.length === 0) return null;

  const heading =
    variant === "amalgam"
      ? "Dual-era players"
      : "Went on to Ahascragh-Fohenagh";
  const intro =
    variant === "amalgam"
      ? "These players wore an older club jersey before Ahascragh-Fohenagh."
      : "These players also wore the Ahascragh-Fohenagh jersey.";

  return (
    <section className="space-y-3" aria-label={heading}>
      <div className="space-y-1">
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon">
          {heading}
        </h2>
        <p className="text-sm text-galway-ink/70">{intro}</p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {entries.map((entry) => (
          <li
            key={entry.summary.id}
            className="inline-flex max-w-full flex-wrap items-center gap-1.5"
          >
            <Link
              href={entry.summary.href}
              className="inline-flex max-w-full flex-wrap items-baseline gap-x-1 rounded-full border border-galway-maroon/15 bg-white px-3 py-1 text-sm font-bold text-galway-ink transition hover:border-galway-maroon hover:text-galway-maroon focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-gold"
            >
              {entry.summary.title}
            </Link>
            {entry.chips.map((chip) => (
              <ClubChip
                key={chip.id}
                href={chip.href}
                label={chip.name}
                title={chip.title}
              />
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}
