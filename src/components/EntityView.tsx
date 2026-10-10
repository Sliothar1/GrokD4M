import Link from "next/link";
import { EntityCard } from "@/components/EntityCard";
import { ArticleClipSection } from "@/components/ArticleClip";
import {
  AhascraghStoryChips,
  AhascraghTitleChips,
  HistoricPredecessorChip,
  HistoricStoryChips,
  LoughreaFinalStoryChips,
} from "@/components/HistoricFohenaghBlock";
import { ClubRoster } from "@/components/club/ClubRoster";
import { DualEraStrip } from "@/components/club/DualEraStrip";
import {
  CrestPlaceholder,
  FurtherReading,
  MoreGreatGames,
  NotableGames,
  PhotoComingSoon,
} from "@/components/fohenagh/FohenaghBlocks";
import {
  displayNameForRef,
  friendlyAttrLabel,
  friendlyTrustLabel,
  getAssoc,
  isEntityRef,
  type getEntity,
} from "@/lib/data";
import type { AssocArray } from "@/lib/d4m/AssocArray";
import { articleToSummary, getArticleUpload, loadCitationUploads } from "@/lib/articles";
import { isNameHighlightSnip, resolveEntityHero } from "@/lib/heroCutting";
import { CiteMarkers } from "@/components/sources/CiteMarker";
import { SourcesPanel } from "@/components/sources/SourcesPanel";
import {
  formatDivision,
  isDisplayableVal,
  isHiddenFactKey,
} from "@/lib/entityDisplay";
import {
  factColumnsFromAttrs,
  factKeyForSourceColumn,
  resolveEntitySources,
  type LinkedCuttingSource,
} from "@/lib/sources";
import { listClubRoster, verifiedDualEraStrip } from "@/lib/playerClubs";
import { fohenaghRosterYears } from "@/lib/fohenaghRecord";
import { hasPlayQualifier, publicCite, publicHeading, scrubPublicCopy } from "@/lib/publicCopy";
import {
  listFohenaghMoreGames,
  listFohenaghNotableGames,
  OWNER_VERIFIED_PLAYERS,
  REPLAY_PICTURE_ID,
} from "@/lib/fohenaghShowcase";

type EntityPayload = NonNullable<Awaited<ReturnType<typeof getEntity>>>;

export async function EntityView({ data }: { data: EntityPayload }) {
  const { attrs, summary, related, id } = data;
  const A = await getAssoc();
  const source = attrs.source ? String(attrs.source) : null;
  const trust =
    summary.trustLabel ??
    friendlyTrustLabel(summary.confidence) ??
    (attrs.confidence ? friendlyTrustLabel(String(attrs.confidence)) : undefined);

  const isAmalgam = id === "club:ahascragh-fohenagh";
  const isHistoricFohenagh = id === "club:fohenagh-historic";
  const isHistoricAhascragh = id === "club:ahascragh-historic";
  const isHistoricMatch =
    id.startsWith("match:") &&
    (id.startsWith("match:fohenagh-historic-") ||
      id.startsWith("match:ahascragh-historic-") ||
      String(attrs.tag ?? "") === "historic-predecessor" ||
      String(attrs.tag ?? "") === "fohenagh-historic");
  const hideScore =
    attrs.hide_score === true || String(attrs.hide_score ?? "") === "true";
  const cuttingCards = related.filter((r) => r.kind === "article_upload");
  const heroCutting = await resolveEntityHero({
    entityId: id,
    kind: summary.kind,
    attrs,
    cuttings: cuttingCards,
  });
  const clubRoster =
    summary.kind === "club" ? await listClubRoster(id, A) : [];
  const rosterYears = isHistoricFohenagh
    ? await fohenaghRosterYears(
        clubRoster.map((row) => row.summary.id),
        A
      )
    : null;
  const fohenaghRoster = rosterYears
    ? clubRoster.map((row) => ({
        ...row,
        years: rosterYears.get(row.summary.id) ?? [],
      }))
    : clubRoster;
  const replayPicture = isHistoricFohenagh
    ? await getArticleUpload(REPLAY_PICTURE_ID)
    : null;
  const replayCard = replayPicture ? articleToSummary(replayPicture) : null;
  const fohenaghImage = replayCard?.imagePath ? replayCard : heroCutting;
  const fohenaghGames = isHistoricFohenagh ? listFohenaghNotableGames(A) : [];
  const fohenaghMoreGames = isHistoricFohenagh ? listFohenaghMoreGames(A) : [];

  return (
    <article className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-bold uppercase tracking-wide text-galway-maroon">
          {summary.kind.replace("_", " ")}
        </p>
        {isHistoricFohenagh ? (
          <div id="champions-1959" className="hw-hero scroll-mt-6">
            <CrestPlaceholder />
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#d9c79a]">
              Fohenagh · 1959
            </p>
            <h1 className="mt-2 max-w-3xl text-4xl sm:text-5xl">Fohenagh</h1>
            <p className="hw-serif mt-2 max-w-2xl text-xl text-[#f7f3ea]/85">
              The 1959 county final replay, from the Connacht Tribune.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {publicCite(fohenaghImage?.citeChip) ? (
                <span className="rounded-full border border-white/30 px-3 py-1 text-sm font-semibold">
                  {publicCite(fohenaghImage?.citeChip)}
                </span>
              ) : null}
              {fohenaghImage ? (
                <Link href={fohenaghImage.href} className="text-sm font-bold text-[#f7f3ea] underline">
                  Read the original clipping
                </Link>
              ) : null}
            </div>
            {fohenaghImage?.imagePath ? (
              <Link href={fohenaghImage.href} className="mt-5 block overflow-hidden rounded-2xl border border-white/20 bg-[#f7f1e8]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fohenaghImage.imagePath}
                  alt="Connacht Tribune team picture after Fohenagh's 1959 replay"
                  className="max-h-80 w-full object-contain"
                />
              </Link>
            ) : null}
          </div>
        ) : (
        <h1 className="text-4xl text-galway-ink sm:text-5xl">
          {summary.title}
        </h1>
        )}
        {summary.subtitle && (
          <p className="text-xl text-galway-ink/70">{summary.subtitle}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {trust && (
            <span
              className={
                trust === "Verified"
                  ? "rounded-full bg-green-100 px-2 py-0.5 text-sm font-semibold text-green-800"
                  : trust === "Fan story"
                    ? "rounded-full bg-galway-gold/30 px-2 py-0.5 text-sm font-semibold text-galway-ink"
                    : "rounded-full bg-amber-100 px-2 py-0.5 text-sm font-semibold text-amber-900"
              }
            >
              {trust}
            </span>
          )}
          {(summary.citeChip || attrs.cutting_cite) && (
            <span className="rounded-full border border-galway-maroon/25 px-2 py-0.5 text-sm font-bold text-galway-maroon">
              {publicCite(summary.citeChip || String(attrs.cutting_cite))}
            </span>
          )}
          {(summary.scoreDisputed ||
            attrs.score_disputed === true ||
            String(attrs.score_disputed ?? "") === "true") && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-sm font-bold uppercase text-amber-900">
              score disputed
            </span>
          )}
          {summary.seasonChip && (
            <span className="rounded-full bg-galway-maroon px-2 py-0.5 text-sm font-bold text-white">
              {summary.seasonChip}
            </span>
          )}
        </div>
        {isHistoricAhascragh && (
          <div className="pt-1">
            <span className="rounded-full bg-galway-maroon px-3 py-1 text-sm font-bold text-white">
              Before Ahascragh-Fohenagh
            </span>
          </div>
        )}

        {(summary.kind === "player" || summary.kind === "club") &&
        !isHistoricFohenagh &&
        !isAmalgam &&
        heroCutting?.imagePath &&
        !isNameHighlightSnip(heroCutting) ? (
          <div className="pt-3">
            <a href={heroCutting.href} className="block overflow-hidden rounded-2xl border-2 border-galway-maroon/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroCutting.imagePath}
                alt={heroCutting.title}
                className="max-h-80 w-full object-contain bg-galway-cream"
              />
            </a>
            <p className="mt-2 text-sm font-semibold text-galway-maroon">
              From cutting{publicCite(heroCutting.citeChip) ? ` · ${publicCite(heroCutting.citeChip)}` : ""}
            </p>
          </div>
        ) : null}
        {summary.kind === "club" &&
        !isHistoricFohenagh &&
        (isAmalgam ||
          (!heroCutting?.imagePath &&
            cuttingCards.some((cutting) => cutting.imagePath && isNameHighlightSnip(cutting)))) ? (
          <div className="pt-3">
            <PhotoComingSoon />
          </div>
        ) : null}
      </header>

      {!isHistoricFohenagh && (attrs.notable || attrs.note || attrs.body || attrs.summary || attrs.excerpt) ? (
        <PublicBlurb
          text={String(attrs.notable ?? attrs.note ?? attrs.body ?? attrs.summary ?? attrs.excerpt)}
        />
      ) : null}

      {isHistoricFohenagh && summary.kind === "club" ? (
        <ClubRoster
          id="players"
          alphabetical
          compact
          verifiedIds={OWNER_VERIFIED_PLAYERS}
          heading="Players who wore the jersey"
          decades
          rows={fohenaghRoster}
          clubName={summary.title}
        />
      ) : null}

      {isHistoricFohenagh ? <MoreGreatGames games={fohenaghMoreGames} /> : null}

      {isHistoricFohenagh ? <NotableGames games={fohenaghGames} /> : null}

      {isHistoricFohenagh && (attrs.notable || attrs.note || attrs.body || attrs.summary || attrs.excerpt) ? (
        <PublicBlurb
          text={String(attrs.notable ?? attrs.note ?? attrs.body ?? attrs.summary ?? attrs.excerpt)}
        />
      ) : null}

      {isHistoricFohenagh ? <PhotoComingSoon note="Championship team photo" /> : null}

      {isHistoricFohenagh ? <FurtherReading /> : null}

      {isHistoricFohenagh && <HistoricStoryChips />}

      {isHistoricAhascragh && (
        <section className="space-y-4">
          <div className="rounded-2xl border-2 border-galway-maroon/20 bg-galway-cream/40 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-galway-maroon px-3 py-1 text-sm font-bold text-white">
                Before Ahascragh-Fohenagh
              </span>
              <Link
                href="/club/fohenagh-historic"
                className="rounded-full border-2 border-galway-maroon/30 bg-white px-3 py-1 text-sm font-bold text-galway-maroon"
              >
                Fohenagh
              </Link>
              <Link
                href="/club/ahascragh-fohenagh"
                className="text-sm font-semibold text-galway-maroon underline"
              >
                See today&apos;s club
              </Link>
            </div>
            <p className="mt-3 text-sm text-galway-ink/70">
              Junior parish club that amalgamated with Fohenagh (juvenile 1999,
              adult 2002). Titles below are historic Ahascragh wins — not amalgam
              titles. Colours withheld.
            </p>
            <AhascraghTitleChips />
          </div>
          <AhascraghStoryChips />
        </section>
      )}

      {(id === "match:galway-shc-2025-final" || id === "club:loughrea") && (
        <LoughreaFinalStoryChips />
      )}


      {isAmalgam && <HistoricPredecessorChip />}

      {(id === "club:ahascragh-fohenagh" ||
        id === "club:ahascragh-historic") && (
        <DualEraStrip
          variant={id === "club:ahascragh-fohenagh" ? "amalgam" : "historic"}
          entries={verifiedDualEraStrip(id, clubRoster, A)}
        />
      )}

      {summary.kind === "club" && !isHistoricFohenagh ? (
        <ClubRoster rows={clubRoster} clubName={summary.title} />
      ) : null}

      {isHistoricMatch && (
        <ArticleClipSection
          matchId={id}
          cuttingsJson={
            attrs.cuttings != null ? String(attrs.cuttings) : null
          }
        />
      )}

{(() => {
        const cuttings = related.filter((r) => r.kind === "article_upload");
        const otherRelated = related.filter((r) => {
          if (r.kind === "article_upload") return false;
          if (summary.kind === "club" && (r.kind === "player" || r.kind === "appearance")) {
            return false;
          }
          if (isHistoricFohenagh && r.id === "club:ahascragh-fohenagh") return false;
          return true;
        });
        const showCuttings =
          !isHistoricFohenagh &&
          (cuttings.length > 0 ||
            summary.kind === "player" ||
            summary.kind === "club");
        return (
          <>
            {showCuttings && (
              <section>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon">
                  Cuttings &amp; stories
                </h2>
                {cuttings.length === 0 ? (
                  <p className="text-sm text-galway-ink/55">
                    No newspaper cuttings linked yet — a snip will show here
                    when one names this{" "}
                    {summary.kind === "player" ? "player" : "club"}.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {cuttings.map((r) => (
                      <Link
                        key={r.id}
                        href={r.href}
                        className="overflow-hidden rounded-2xl border-2 border-galway-maroon/15 bg-white shadow-sm transition hover:border-galway-maroon"
                      >
                        {r.imagePath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.imagePath}
                            alt="Newspaper cutting"
                            className="max-h-72 w-full object-contain bg-galway-cream"
                          />
                        ) : null}
                        <div className="p-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-galway-maroon">
                            Cutting
                          </p>
                          <h3 className="mt-1 text-lg font-bold text-galway-ink">
                            {publicHeading(r.title, r.citeChip || "Newspaper cutting")}
                          </h3>
                          {r.citeChip && (
                            <p className="mt-1 text-sm font-semibold text-galway-maroon">
                              {publicCite(r.citeChip)}
                            </p>
                          )}
                          {r.excerpt && !hasPlayQualifier(r.excerpt) && (
                            <p className="mt-2 text-sm text-galway-ink/70">{r.excerpt}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}
            {!isHistoricFohenagh && otherRelated.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon">
                  Related
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {otherRelated.map((r) => (
                    <EntityCard key={r.id} entity={r} />
                  ))}
                </div>
              </section>
            )}
          </>
        );
      })()}

      {!isHistoricFohenagh ? (
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon">
          Facts
        </h2>
        <EntityFacts
          attrs={attrs}
          entityId={id}
          hideScore={hideScore}
          assoc={A}
          uploads={await loadCitationUploads()}
        />
        {source && source.startsWith("http") && (
          <p className="mt-4 text-sm text-galway-ink/70">
            Source:{" "}
            <a
              href={source}
              className="font-semibold text-galway-maroon underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the source
            </a>
          </p>
        )}
      </section>
      ) : null}

    </article>
  );
}

function EntityFacts({
  attrs,
  entityId,
  hideScore,
  assoc,
  uploads,
}: {
  attrs: Record<string, unknown>;
  entityId: string;
  hideScore: boolean;
  assoc: AssocArray;
  uploads: readonly LinkedCuttingSource[];
}) {
  const columns = factColumnsFromAttrs(attrs);
  const rows = Object.entries(attrs).filter(([key, value]) => {
    if (isHiddenFactKey(key) || !isDisplayableVal(value)) return false;
    if (hideScore && key === "score") return false;
    if (entityId === "club:fohenagh-historic" && key === "successor") return false;
    if (factKeyForSourceColumn(key, columns)) return false;
    return true;
  });
  const citations = resolveEntitySources({
    entityId,
    attrs,
    uploads,
    order: rows
      .map(([key]) => key)
      .filter((key) => key !== "source" && !key.startsWith("source_"))
      .map((fact) => ({ fact })),
  });

  return (
    <>
      <dl className="grid gap-3 sm:grid-cols-2">
        {rows.map(([key, value]) => (
          <div
            key={key}
            className="rounded-xl border border-galway-maroon/10 bg-white px-4 py-3"
          >
            <dt className="text-xs font-bold uppercase tracking-wide text-stone-700">
              {friendlyAttrLabel(key)}
            </dt>
            <dd className="mt-1 break-words text-lg font-semibold text-galway-ink">
              {entityFactValue(key, value, attrs, assoc)}
              <CiteMarkers
                numbers={citations.markers[key] ?? []}
                sources={citations.sources}
              />
            </dd>
          </div>
        ))}
      </dl>
      {citations.sources.length > 0 ? (
        <div className="mt-6">
          <SourcesPanel
            sources={citations.sources}
            headingId={`sources-${entityId.replace(/:/g, "-")}`}
          />
        </div>
      ) : null}
    </>
  );
}

function entityFactValue(
  key: string,
  value: unknown,
  attrs: Record<string, unknown>,
  assoc: AssocArray
): React.ReactNode {
  if (key === "division") {
    return formatDivision(value, attrs.division_season) ?? String(value);
  }
  if (isEntityRef(value)) {
    const ref = String(value);
    return (
      <Link href={entityRefHref(ref)} className="text-galway-maroon underline">
        {displayNameForRef(ref, assoc)}
      </Link>
    );
  }
  if (typeof value === "string" && value.startsWith("http")) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-galway-maroon underline"
      >
        Read the source
      </a>
    );
  }
  return String(value);
}

function PublicBlurb({ text }: { text: string }) {
  const clean = scrubPublicCopy(text);
  if (!clean) return null;
  return <p className="text-lg leading-relaxed text-galway-ink">{clean}</p>;
}

function entityRefHref(ref: string): string {
  if (ref.startsWith("player:")) return `/player/${ref.slice(7)}`;
  if (ref.startsWith("team:")) return `/team/${ref.slice(5)}`;
  if (ref.startsWith("club:")) return `/club/${ref.slice(5)}`;
  if (ref.startsWith("match:")) return `/match/${ref.slice(6)}`;
  if (ref.startsWith("win:")) return `/win/${ref.slice(4)}`;
  if (ref.startsWith("story:")) return `/story/${ref.slice(6)}`;
  return `/search?q=${encodeURIComponent(ref)}`;
}
