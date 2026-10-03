import Link from "next/link";
import { ClubChip } from "@/components/chips";
import type { DualEraStripEntry } from "@/lib/playerClubs";

/**
 * Verified dual-era players only.
 * A primary AF jersey (`club` or `also_club`) keeps playing wording and the AF chip.
 * A numbered extra such as `club_1` gets a neutral line and no AF chip.
 * Empty lists render nothing.
 */
export function DualEraStrip({
  variant,
  entries,
}: {
  variant: "amalgam" | "historic";
  entries: DualEraStripEntry[];
}) {
  const playing = entries.filter((entry) => entry.afPrimary);
  const linked = entries.filter((entry) => !entry.afPrimary);
  if (playing.length === 0 && linked.length === 0) return null;

  return (
    <div className="space-y-6">
      {playing.length > 0 ? (
        <StripGroup
          heading={playingHeading(variant)}
          intro={playingIntro(variant)}
          entries={playing}
        />
      ) : null}
      {linked.length > 0 ? (
        <StripGroup
          heading="Also linked with Ahascragh-Fohenagh"
          entries={linked}
        />
      ) : null}
    </div>
  );
}

function StripGroup({
  heading,
  intro,
  entries,
}: {
  heading: string;
  intro?: string;
  entries: DualEraStripEntry[];
}) {
  return (
    <section className="space-y-3" aria-label={heading}>
      <div className="space-y-1">
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon">
          {heading}
        </h2>
        {intro ? <p className="text-sm text-galway-ink/70">{intro}</p> : null}
      </div>
      <ul className="flex flex-wrap gap-2">
        {entries.map((entry) => (
          <li
            key={entry.summary.id}
            className="inline-flex max-w-full flex-wrap items-center gap-1.5"
          >
            <Link
              href={entry.summary.href}
              className="inline-flex max-w-full rounded-full border border-galway-maroon/15 bg-white px-3 py-1 text-sm font-bold text-galway-ink transition hover:border-galway-maroon hover:text-galway-maroon focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-gold"
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

function playingHeading(variant: "amalgam" | "historic"): string {
  return variant === "amalgam"
    ? "Players with an older club"
    : "Played for Ahascragh-Fohenagh";
}

function playingIntro(variant: "amalgam" | "historic"): string {
  return variant === "amalgam"
    ? "Played for Fohenagh or Ahascragh before 2002, and also played for Ahascragh-Fohenagh."
    : "These players also played for Ahascragh-Fohenagh.";
}
