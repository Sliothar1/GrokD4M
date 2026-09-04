import Link from "next/link";
import type { EntitySummary } from "@/lib/data";

const kindLabel: Record<string, string> = {
  player: "Player",
  team: "Team",
  match: "Match",
  club: "Club",
  win: "All-Ireland",
  season: "Season",
  source: "Source",
  community_story: "Story",
  unknown: "Thing",
};

export function EntityCard({ entity }: { entity: EntitySummary }) {
  return (
    <Link
      href={entity.href}
      className="block rounded-2xl border-2 border-galway-maroon/15 bg-white p-4 shadow-sm transition hover:border-galway-maroon hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-gold"
    >
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-galway-maroon/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-galway-maroon">
          {kindLabel[entity.kind] ?? entity.kind}
        </span>
        {entity.confidence && (
          <span className="text-xs text-galway-ink/50">
            confidence: {entity.confidence}
          </span>
        )}
      </div>
      <h3 className="text-xl font-bold text-galway-ink">{entity.title}</h3>
      {entity.subtitle && (
        <p className="mt-1 text-base text-galway-ink/70">{entity.subtitle}</p>
      )}
    </Link>
  );
}

export function EmptyTeach({
  title,
  hint,
}: {
  title: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-galway-maroon/30 bg-galway-cream/50 p-8 text-center">
      <p className="text-2xl font-bold text-galway-maroon">{title}</p>
      <p className="mt-3 text-lg text-galway-ink/80">{hint}</p>
      <p className="mt-4 text-base text-galway-ink/60">
        Tip: associative arrays store facts as tiny triples — row, column, value — like
        sticky notes on a giant board.
      </p>
    </div>
  );
}
