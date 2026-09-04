import Link from "next/link";
import { EntityCard } from "@/components/EntityCard";
import {
  HistoricClubPanel,
  HistoricPredecessorChip,
} from "@/components/HistoricFohenaghBlock";
import {
  displayNameForRef,
  friendlyAttrLabel,
  friendlyTrustLabel,
  getAssoc,
  isEntityRef,
  type getEntity,
} from "@/lib/data";

type EntityPayload = NonNullable<ReturnType<typeof getEntity>>;

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
]);

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

export function EntityView({ data }: { data: EntityPayload }) {
  const { attrs, summary, related, triples, id } = data;
  const A = getAssoc();
  const source = attrs.source ? String(attrs.source) : null;
  const trust =
    summary.trustLabel ??
    friendlyTrustLabel(summary.confidence) ??
    (attrs.confidence ? friendlyTrustLabel(String(attrs.confidence)) : undefined);

  const isAmalgam = id === "club:ahascragh-fohenagh";
  const isHistoric = id === "club:fohenagh-historic";
  const isHistoric1959 = id === "match:fohenagh-historic-1959-galway-shc-final";

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
        {trust && (
          <p className="text-sm text-galway-ink/60">
            <span
              className={
                trust === "Verified"
                  ? "rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-800"
                  : trust === "Fan story"
                    ? "rounded-full bg-galway-gold/30 px-2 py-0.5 font-semibold text-galway-ink"
                    : "rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-900"
              }
            >
              {trust}
            </span>
          </p>
        )}
        {isHistoric && (
          <div className="pt-1">
            <span className="rounded-full bg-galway-maroon px-3 py-1 text-sm font-bold text-white">
              Before Ahascragh-Fohenagh
            </span>
          </div>
        )}
      </header>

      {attrs.notable || attrs.note || attrs.body || attrs.summary ? (
        <p className="text-lg leading-relaxed text-galway-ink">
          {String(attrs.notable ?? attrs.note ?? attrs.body ?? attrs.summary)}
        </p>
      ) : null}

      {isHistoric && <HistoricClubPanel />}

      {isAmalgam && <HistoricPredecessorChip />}

      {isHistoric1959 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Fohenagh scored <strong>3-9</strong> after a replay at Kenny Park. Castlegar&apos;s
          total is not shown here — sources disagree (2-5 vs 4-5), so we leave it off the
          board until archives settle it.
        </p>
      )}

      <section>
        <h2 className="mb-3 text-2xl font-bold text-galway-maroon">Facts</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {Object.entries(attrs)
            .filter(([k, v]) => !HIDDEN_ATTRS.has(k) && isDisplayableVal(v))
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

      {related.length > 0 && (
        <section>
          <h2 className="mb-3 text-2xl font-bold text-galway-maroon">Related</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <EntityCard key={r.id} entity={r} />
            ))}
          </div>
        </section>
      )}

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
            .filter((t) => t.col !== "confidence" && isDisplayableVal(t.val))
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
