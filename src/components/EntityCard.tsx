import Link from "next/link";
import { friendlyTrustLabel, type EntitySummary } from "@/lib/data";

const kindLabel: Record<string, string> = {
  player: "Player",
  team: "Team",
  match: "Match",
  club: "Club",
  win: "County title",
  season: "Season",
  source: "Source",
  community_story: "Story",
  article_upload: "Article",
  appearance: "Panel",
  unknown: "Thing",
};

function winKindBadge(entity: EntitySummary): string {
  if (/all-?ireland/i.test(`${entity.title} ${entity.subtitle ?? ""}`)) {
    return "All-Ireland";
  }
  return "County title";
}

export function EntityCard({ entity }: { entity: EntitySummary }) {
  const trust = entity.trustLabel ?? friendlyTrustLabel(entity.confidence);
  const badge = entity.badge;
  const typeBadge =
    entity.kind === "win"
      ? winKindBadge(entity)
      : entity.kind === "appearance"
        ? (entity.kindLabel || entity.badge || "Panel")
        : (entity.kindLabel ?? kindLabel[entity.kind] ?? entity.kind);

  return (
    <Link
      href={entity.href}
      className="block overflow-hidden rounded-2xl border-2 border-galway-maroon/15 bg-white shadow-sm transition hover:border-galway-maroon hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-gold"
    >
      {entity.imagePath && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entity.imagePath}
          alt=""
          className="h-36 w-full object-cover bg-galway-cream"
        />
      )}
      <div className="p-4">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-galway-maroon/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-galway-maroon">
            {typeBadge}
          </span>
          {badge && entity.kind !== "appearance" && (
            <span className="rounded-full bg-galway-gold/25 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-galway-ink">
              {badge}
            </span>
          )}
          {entity.citeChip && (
            <span className="rounded-full border border-galway-maroon/25 px-2 py-0.5 text-xs font-bold text-galway-maroon">
              {entity.citeChip}
            </span>
          )}
          {entity.scoreDisputed && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-900">
              score disputed
            </span>
          )}
          {trust && !badge && (
            <span className="text-xs font-semibold text-galway-ink/55">
              {trust}
            </span>
          )}
          {entity.subtitle === "Before Ahascragh-Fohenagh" && (
            <span className="rounded-full bg-galway-maroon px-2 py-0.5 text-xs font-bold text-white">
              Before Ahascragh-Fohenagh
            </span>
          )}
        </div>
        <h3 className="text-xl font-bold text-galway-ink">{entity.title}</h3>
        {entity.excerpt &&
        (entity.kind === "article_upload" || entity.kind === "appearance") ? (
          <p className="mt-1 text-base text-galway-ink/70">{entity.excerpt}</p>
        ) : (
          entity.subtitle && (
            <p className="mt-1 text-base text-galway-ink/70">{entity.subtitle}</p>
          )
        )}
        {entity.kind === "article_upload" && (
          <p className="mt-2 text-sm font-semibold text-galway-maroon">
            View cutting →
          </p>
        )}
      </div>
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
        Tip: associative arrays store facts as tiny triples — row, column, value
        — like sticky notes on a giant board.
      </p>
    </div>
  );
}
