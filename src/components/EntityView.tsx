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
import {
  displayNameForRef,
  friendlyAttrLabel,
  friendlyTrustLabel,
  getAssoc,
  isEntityRef,
  type getEntity,
} from "@/lib/data";

type EntityPayload = NonNullable<Awaited<ReturnType<typeof getEntity>>>;

const HIDDEN_ATTRS = new Set([
  "type",
  "name",
  "title",
  "notable",
  "note",
  "body",
  "summary",
  "confidence", // shown as friendly trust badge in header
  "kid_chip", // rendered as dedicated kid UI chip
  "cuttings", // rendered as ArticleClipSection
  "excerpt",
  "cite",
  "verification",
  "kind",
  "same_as",
  "season_chip",
  "pack_id",
  "hide_score",
  "score_disputed",
  "ingest_triage",
  "archivist_ruling",
  "badge",
]);

function isHiddenFactKey(k: string): boolean {
  if (HIDDEN_ATTRS.has(k)) return true;
  // player→cutting reverse edges (shown in Cuttings & stories)
  if (k.startsWith("cutting:")) return true;
  return false;
}

/** Never show null / empty / literal "null" on kid Facts cards. */
function isDisplayableVal(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") {
      return false;
    }
  }
  return true;
}

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
          {summary.citeChip && (
            <span className="rounded-full border border-galway-maroon/25 px-2 py-0.5 text-sm font-bold text-galway-maroon">
              {summary.citeChip}
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

      {isHistoricMatch && (
        <ArticleClipSection
          matchId={id}
          cuttingsJson={
            attrs.cuttings != null ? String(attrs.cuttings) : null
          }
        />
      )}

      <section>
        <h2 className="mb-3 text-2xl font-bold text-galway-maroon">Facts</h2>
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

      {(() => {
        const cuttings = related.filter((r) => r.kind === "article_upload");
        const otherRelated = related.filter((r) => r.kind !== "article_upload");
        const showCuttings =
          cuttings.length > 0 ||
          summary.kind === "player" ||
          summary.kind === "club";
        return (
          <>
            {showCuttings && (
              <section>
                <h2 className="mb-3 text-2xl font-bold text-galway-maroon">
                  Cuttings &amp; stories
                </h2>
                {cuttings.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-galway-maroon/25 bg-galway-cream/50 px-4 py-6 text-center">
                    <p className="text-base font-semibold text-galway-ink/70">
                      No newspaper cuttings linked yet
                    </p>
                    <p className="mt-1 text-sm text-galway-ink/55">
                      Tag a cutting with this{" "}
                      {summary.kind === "player" ? "player" : "club"} on Stories
                      to show thumb, excerpt, and cite here.
                    </p>
                    <Link
                      href="/stories#upload"
                      className="mt-2 inline-block text-sm font-semibold text-galway-maroon underline"
                    >
                      Upload on Stories
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {cuttings.map((r) => (
                      <EntityCard key={r.id} entity={r} />
                    ))}
                  </div>
                )}
              </section>
            )}
            {otherRelated.length > 0 && (
              <section>
                <h2 className="mb-3 text-2xl font-bold text-galway-maroon">
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
        <h2 className="mb-3 text-2xl font-bold text-galway-maroon">
          How the sticky-note board stores this
        </h2>
        <p className="mb-3 text-base text-galway-ink/70">
          Grown-ups: each line is one associative-array edge (
          <code className="font-mono">row → col = value</code>). Kids can skip this —
          the Facts above are the friendly view.
        </p>
        <ul className="space-y-2 font-mono text-sm">
          {triples
            .filter((t) => t.col !== "confidence" && isDisplayableVal(t.val) && !(hideScore && t.col === "score"))
            .map((t) => (
              <li
                key={`${t.row}-${t.col}`}
                className="rounded-lg bg-galway-ink px-3 py-2 text-galway-cream"
              >
                <span className="text-galway-gold">{t.row}</span>
                {" · "}
                <span className="text-white">{t.col}</span>
                {" = "}
                <span className="text-galway-cream">
                  {isEntityRef(t.val)
                    ? `${displayNameForRef(String(t.val), A)} (${t.val})`
                    : String(t.val)}
                </span>
              </li>
            ))}
        </ul>
      </section>
    </article>
  );
}
