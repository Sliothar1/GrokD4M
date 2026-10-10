import Link from "next/link";
import { friendlyTrustLabel, type EntitySummary } from "@/lib/data";
import { hasPlayQualifier, publicCite } from "@/lib/publicCopy";

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
  appearance: "Appearance",
  unknown: "Thing",
};

function publicMark(label: string): string {
  return hasPlayQualifier(label) ? "Appearance" : label;
}

function winKindBadge(entity: EntitySummary): string {
  if (/all-?ireland/i.test(`${entity.title} ${entity.subtitle ?? ""}`)) {
    return "All-Ireland";
  }
  return "County title";
}

export function EntityCard({
  entity,
  crestLabel,
}: {
  entity: EntitySummary;
  /** Shown in place of a cutting image. */
  crestLabel?: string;
}) {
  const trust = entity.trustLabel ?? friendlyTrustLabel(entity.confidence);
  const badge = entity.badge && !hasPlayQualifier(entity.badge) ? entity.badge : undefined;
  const title = hasPlayQualifier(entity.title)
    ? entity.citeChip || "Newspaper cutting"
    : entity.title;
  const typeBadge =
    entity.kind === "win"
      ? winKindBadge(entity)
      : entity.kind === "appearance"
        ? publicMark(entity.kindLabel || entity.badge || "Appearance")
        : (entity.kindLabel ?? kindLabel[entity.kind] ?? entity.kind);

  return (
    <Link
      href={entity.href}
      className="block overflow-hidden rounded-2xl border-2 border-galway-maroon/15 bg-white shadow-sm transition hover:border-galway-maroon hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-gold"
    >
      {crestLabel ? (
        <div className="flex items-center gap-3 bg-galway-cream px-4 py-4">
          <span
            aria-hidden
            className="flex h-12 w-12 items-center justify-center rounded-full border border-galway-maroon/30 font-serif text-xl text-galway-maroon"
          >
            F
          </span>
          <p className="text-sm leading-snug text-galway-ink/70">{crestLabel}</p>
        </div>
      ) : entity.imagePath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entity.imagePath}
          alt=""
          className="h-36 w-full object-cover bg-galway-cream"
        />
      ) : null}
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
          {publicCite(entity.citeChip) && (
            <span className="rounded-full border border-galway-maroon/25 px-2 py-0.5 text-xs font-bold text-galway-maroon">
              {publicCite(entity.citeChip)}
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
        <h3 className="text-xl font-bold text-galway-ink">{title}</h3>
        {entity.excerpt &&
        !hasPlayQualifier(entity.excerpt) &&
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
    </div>
  );
}
