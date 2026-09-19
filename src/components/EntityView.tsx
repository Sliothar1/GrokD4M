import Link from "next/link";
import { EntityCard } from "@/components/EntityCard";
import { ArticleClipSection } from "@/components/ArticleClip";
import {
  AhascraghStoryChips,
  AhascraghTitleChips,
  HistoricClubPanel,
  HistoricPredecessorChip,
  LoughreaFinalStoryChips,
} from "@/components/HistoricFohenaghBlock";
import { ClubRoster } from "@/components/club/ClubRoster";
import { DeveloperTriples } from "@/components/DeveloperTriples";
import {
  displayNameForRef,
  friendlyAttrLabel,
  friendlyTrustLabel,
  getAssoc,
  isEntityRef,
  type getEntity,
} from "@/lib/data";
import { isDisplayableVal, isHiddenFactKey } from "@/lib/entityDisplay";
import { listClubRoster } from "@/lib/playerClubs";

type EntityPayload = NonNullable<Awaited<ReturnType<typeof getEntity>>>;

export async function EntityView({ data }: { data: EntityPayload }) {
  const { attrs, summary, related, triples, id } = data;
  const A = await getAssoc();
  const source = attrs.source ? String(attrs.source) : null;
  const trust =
    summary.trustLabel ??
    friendlyTrustLabel(summary.confidence) ??
    (attrs.confidence ? friendlyTrustLabel(String(attrs.confidence)) : undefined);

  const isAmalgam = id === "club:ahascragh-fohenagh";
  const isHistoric =
    id === "club:fohenagh-historic" || id === "club:ahascragh-historic";
  const isHistoricFohenagh = id === "club:fohenagh-historic";
  const isHistoricAhascragh = id === "club:ahascragh-historic";
  const isHistoricMatch =
    id.startsWith("match:fohenagh-historic-") ||
    id.startsWith("match:ahascragh-historic-") ||
    String(attrs.tag ?? "") === "historic-predecessor" ||
    String(attrs.tag ?? "") === "fohenagh-historic";
  const hideScore =
    attrs.hide_score === true || String(attrs.hide_score ?? "") === "true";
  const cuttingCards = related.filter((r) => r.kind === "article_upload");
  const heroCutting = cuttingCards.find((c) => c.imagePath) ?? cuttingCards[0];
  const clubRoster =
    summary.kind === "club" ? listClubRoster(id, A) : [];

  return (
    <article className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-bold uppercase tracking-wide text-galway-maroon">
          {summary.kind.replace("_", " ")}
        </p>
        <h1 className="text-4xl font-black text-galway-ink sm:text-5xl">
          {summary.title}
        </h1>
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
              {summary.citeChip || String(attrs.cutting_cite)}
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
        {isHistoric && (
          <div className="pt-1">
            <span className="rounded-full bg-galway-maroon px-3 py-1 text-sm font-bold text-white">
              Before Ahascragh-Fohenagh
            </span>
          </div>
        )}

        {(summary.kind === "player" || summary.kind === "club") && heroCutting?.imagePath && (
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
              From cutting{heroCutting.citeChip ? ` · ${heroCutting.citeChip}` : ""}
            </p>
          </div>
        )}
      </header>

      {attrs.notable || attrs.note || attrs.body || attrs.summary || attrs.excerpt ? (
        <p className="text-lg leading-relaxed text-galway-ink">
          {String(attrs.notable ?? attrs.note ?? attrs.body ?? attrs.summary ?? attrs.excerpt)}
        </p>
      ) : null}

      {isHistoricFohenagh && <HistoricClubPanel />}

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

      {summary.kind === "club" ? (
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
          return true;
        });
        const showCuttings =
          cuttings.length > 0 ||
          summary.kind === "player" ||
          summary.kind === "club";
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
                            alt={r.title}
                            className="max-h-72 w-full object-contain bg-galway-cream"
                          />
                        ) : null}
                        <div className="p-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-galway-maroon">
                            Cutting
                          </p>
                          <h3 className="mt-1 text-lg font-bold text-galway-ink">
                            {r.title}
                          </h3>
                          {r.citeChip && (
                            <p className="mt-1 text-sm font-semibold text-galway-maroon">
                              {r.citeChip}
                            </p>
                          )}
                          {r.excerpt && (
                            <p className="mt-2 text-sm text-galway-ink/70">{r.excerpt}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}
            {otherRelated.length > 0 && (
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

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon">
          Facts
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {Object.entries(attrs)
            .filter(([k, v]) => !isHiddenFactKey(k) && isDisplayableVal(v) && !(hideScore && k === "score"))
            .map(([k, v]) => (
              <div
                key={k}
                className="rounded-xl border border-galway-maroon/10 bg-white px-4 py-3"
              >
                <dt className="text-xs font-bold uppercase tracking-wide text-galway-ink/50">
                  {friendlyAttrLabel(k)}
                </dt>
                <dd className="mt-1 text-lg font-semibold text-galway-ink break-words">
                  {isEntityRef(v) ? (
                    <Link
                      href={
                        v.startsWith("player:")
                          ? `/player/${v.slice(7)}`
                          : v.startsWith("team:")
                            ? `/team/${v.slice(5)}`
                            : v.startsWith("club:")
                              ? `/club/${v.slice(5)}`
                              : v.startsWith("match:")
                                ? `/match/${v.slice(6)}`
                                : v.startsWith("win:")
                                  ? `/win/${v.slice(4)}`
                                  : v.startsWith("story:")
                                    ? `/story/${v.slice(6)}`
                                    : `/search?q=${encodeURIComponent(v)}`
                      }
                      className="text-galway-maroon underline"
                    >
                      {displayNameForRef(v, A)}
                    </Link>
                  ) : typeof v === "string" && v.startsWith("http") ? (
                    <a
                      href={v}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-galway-maroon underline"
                    >
                      Open source
                    </a>
                  ) : (
                    String(v)
                  )}
                </dd>
              </div>
            ))}
        </dl>
        {source && source.startsWith("http") && (
          <p className="mt-4 text-sm text-galway-ink/70">
            Source:{" "}
            <a
              href={source}
              className="font-semibold text-galway-maroon underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open source
            </a>
          </p>
        )}
      </section>

      

      <DeveloperTriples triples={triples} hideScore={hideScore} />
    </article>
  );
}
