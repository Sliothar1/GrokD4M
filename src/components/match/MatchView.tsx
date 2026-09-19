import Link from "next/link";
import { ArticleClipSection } from "@/components/ArticleClip";
import { ClubChip, TrustChip } from "@/components/chips";
import { DeveloperTriples } from "@/components/DeveloperTriples";
import { EntityCard } from "@/components/EntityCard";
import { LoughreaFinalStoryChips } from "@/components/HistoricFohenaghBlock";
import {
  CuttingExcerpts,
  type CuttingCard,
} from "@/components/player/CuttingExcerpts";
import {
  displayNameForRef,
  friendlyAttrLabel,
  friendlyTrustLabel,
  getAssoc,
  isEntityRef,
  type getEntity,
} from "@/lib/data";
import {
  isDisplayableVal,
  MATCH_FACT_KEYS,
} from "@/lib/entityDisplay";
import {
  parseClubIds,
  toClubChip,
  type ClubChipData,
} from "@/lib/playerClubs";

type EntityPayload = NonNullable<Awaited<ReturnType<typeof getEntity>>>;

/**
 * Kid-facing match page: clean header, cuttings as press cards,
 * compact facts — not the EntityView sticky-note wall.
 * Historic Fohenagh article clips stay.
 */
export async function MatchView({ data }: { data: EntityPayload }) {
  const { attrs, summary, related, triples, id } = data;
  const A = await getAssoc();
  const source = attrs.source ? String(attrs.source) : null;
  const trust =
    summary.trustLabel ??
    friendlyTrustLabel(summary.confidence) ??
    (attrs.confidence ? friendlyTrustLabel(String(attrs.confidence)) : undefined);

  const isHistoricMatch =
    id.startsWith("match:fohenagh-historic-") ||
    id.startsWith("match:ahascragh-historic-") ||
    String(attrs.tag ?? "") === "historic-predecessor" ||
    String(attrs.tag ?? "") === "fohenagh-historic";
  const hideScore =
    attrs.hide_score === true || String(attrs.hide_score ?? "") === "true";

  const clubs = matchClubChips(attrs, related, A);
  const cuttings = related
    .filter((r) => r.kind === "article_upload")
    .map(
      (r): CuttingCard => ({
        id: r.id,
        title: r.title,
        excerpt: r.excerpt,
        citeChip: r.citeChip,
        imagePath: r.imagePath,
        href: r.href,
      })
    );

  const facts = MATCH_FACT_KEYS.filter((k) => {
    if (hideScore && k === "score") return false;
    return isDisplayableVal(attrs[k]);
  }).map((k) => ({
    key: k,
    label: friendlyAttrLabel(k),
    value: attrs[k],
  }));

  const lineup =
    attrs.lineup_home && isDisplayableVal(attrs.lineup_home)
      ? String(attrs.lineup_home)
      : null;

  const otherRelated = related.filter(
    (r) =>
      r.kind !== "article_upload" &&
      r.kind !== "appearance" &&
      r.kind !== "club"
  );

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-galway-maroon/80">
          Match
        </p>
        <h1 className="text-[1.75rem] font-black leading-[1.15] tracking-tight text-galway-ink sm:text-4xl">
          {summary.title}
        </h1>
        {summary.subtitle ? (
          <p className="text-lg font-semibold text-galway-ink/70">
            {summary.subtitle}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-1.5">
          <TrustChip label={trust} />
          {isHistoricMatch ? (
            <span className="rounded-full bg-galway-maroon px-2.5 py-0.5 text-sm font-bold text-white">
              Historic
            </span>
          ) : null}
          {summary.seasonChip ? (
            <span className="rounded-full bg-galway-maroon/10 px-2.5 py-0.5 text-sm font-bold text-galway-maroon">
              {summary.seasonChip}
            </span>
          ) : null}
          {(summary.citeChip || attrs.cutting_cite) && (
            <span className="rounded-full border border-galway-maroon/25 px-2.5 py-0.5 text-sm font-bold text-galway-maroon">
              {summary.citeChip || String(attrs.cutting_cite)}
            </span>
          )}
          {(summary.scoreDisputed ||
            attrs.score_disputed === true ||
            String(attrs.score_disputed ?? "") === "true") && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-bold uppercase text-amber-900">
              score disputed
            </span>
          )}
          {clubs.map((c) => (
            <ClubChip key={c.id} href={c.href} label={c.name} />
          ))}
        </div>
      </header>

      {attrs.notable || attrs.note || attrs.excerpt ? (
        <p className="border-l-[3px] border-galway-gold pl-4 text-lg font-medium leading-snug text-galway-ink">
          {String(attrs.notable ?? attrs.note ?? attrs.excerpt)}
        </p>
      ) : null}

      {(id === "match:galway-shc-2025-final" || id === "club:loughrea") && (
        <LoughreaFinalStoryChips />
      )}

      {isHistoricMatch && (
        <ArticleClipSection
          matchId={id}
          cuttingsJson={
            attrs.cuttings != null ? String(attrs.cuttings) : null
          }
        />
      )}

      {cuttings.length > 0 ? (
        <CuttingExcerpts
          cuttings={cuttings}
          heading="Newspaper cuttings"
        />
      ) : null}

      {facts.length > 0 || lineup ? (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon">
            Match facts
          </h2>
          <dl className="flex flex-wrap gap-2">
            {facts.map((f) => (
              <div
                key={f.key}
                className="rounded-full border border-galway-maroon/12 bg-white px-3 py-1.5"
              >
                <dt className="inline text-[11px] font-bold uppercase tracking-wide text-galway-ink/45">
                  {f.label}{" "}
                </dt>
                <dd className="inline text-sm font-bold text-galway-ink">
                  {isEntityRef(f.value) ? (
                    <Link
                      href={
                        String(f.value).startsWith("player:")
                          ? `/player/${String(f.value).slice(7)}`
                          : String(f.value).startsWith("club:")
                            ? `/club/${String(f.value).slice(5)}`
                            : `/search?q=${encodeURIComponent(String(f.value))}`
                      }
                      className="text-galway-maroon underline"
                    >
                      {displayNameForRef(String(f.value), A)}
                    </Link>
                  ) : (
                    String(f.value)
                  )}
                </dd>
              </div>
            ))}
          </dl>
          {lineup ? (
            <p className="mt-3 text-sm leading-relaxed text-galway-ink/65">
              <span className="font-bold text-galway-maroon">XV · </span>
              {lineup}
            </p>
          ) : null}
          {source && source.startsWith("http") ? (
            <p className="mt-3 text-sm text-galway-ink/50">
              Cite:{" "}
              <a
                href={source}
                className="font-semibold text-galway-maroon underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open source
              </a>
            </p>
          ) : null}
        </section>
      ) : null}

      {otherRelated.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon">
            Related
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {otherRelated.slice(0, 8).map((r) => (
              <EntityCard key={r.id} entity={r} />
            ))}
          </div>
        </section>
      ) : null}

      <DeveloperTriples triples={triples} hideScore={hideScore} />
    </article>
  );
}

function matchClubChips(
  attrs: EntityPayload["attrs"],
  related: EntityPayload["related"],
  A: Awaited<ReturnType<typeof getAssoc>>
): ClubChipData[] {
  const ids = new Set<string>();
  for (const key of ["club", "historic_club", "home", "away", "winner"] as const) {
    for (const id of parseClubIds(attrs[key])) ids.add(id);
  }
  for (const r of related) {
    if (r.kind === "club") ids.add(r.id);
  }
  return [...ids]
    .filter((id) => Object.keys(A.entityAttrs(id)).length > 0)
    .map((id) => toClubChip(id, A));
}
