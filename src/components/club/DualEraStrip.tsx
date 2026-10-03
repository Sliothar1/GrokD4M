import Link from "next/link";
import { ClubChip } from "@/components/chips";
import type { DualEraStripEntry } from "@/lib/playerClubs";

/**
 * Verified dual-era players only. A playing AF link keeps a jersey chip.
 * A caption or other non-playing AF link shows a role label instead.
 * Empty lists render nothing.
 */
export function DualEraStrip({
  variant,
  entries,
}: {
  variant: "amalgam" | "historic";
  entries: DualEraStripEntry[];
}) {
  if (entries.length === 0) return null;

  const { heading, intro } = stripCopy(variant, entries);

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
              <span>{entry.summary.title}</span>
              {entry.roleLabel ? (
                <span className="font-semibold text-galway-ink/45">
                  · {entry.roleLabel}
                </span>
              ) : null}
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

function stripCopy(
  variant: "amalgam" | "historic",
  entries: DualEraStripEntry[]
): { heading: string; intro: string } {
  const playing = entries.some((entry) => entry.afPlaying);
  const namedLater = entries.some((entry) => !entry.afPlaying);

  if (variant === "amalgam") {
    if (playing && namedLater) {
      return {
        heading: "Players with an older club",
        intro:
          "Played for Fohenagh or Ahascragh before 2002. Some also played for Ahascragh-Fohenagh. Others are only named with the club later.",
      };
    }
    if (namedLater) {
      return {
        heading: "Players with an older club",
        intro:
          "They played for an older club. With Ahascragh-Fohenagh they are named on a caption, not in a match lineup.",
      };
    }
    return {
      heading: "Players with an older club",
      intro:
        "These players played for Fohenagh or Ahascragh before Ahascragh-Fohenagh.",
    };
  }

  if (playing && namedLater) {
    return {
      heading: "Later with Ahascragh-Fohenagh",
      intro:
        "Some played for Ahascragh-Fohenagh. Others are only named with the club later.",
    };
  }
  if (namedLater) {
    return {
      heading: "Named with Ahascragh-Fohenagh",
      intro:
        "These players are named with Ahascragh-Fohenagh later, not in a match lineup.",
    };
  }
  return {
    heading: "Played for Ahascragh-Fohenagh",
    intro: "These players also played for Ahascragh-Fohenagh.",
  };
}
