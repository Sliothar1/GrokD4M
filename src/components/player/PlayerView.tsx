import Link from "next/link";
import { DeveloperTriples } from "@/components/DeveloperTriples";
import { EntityCard } from "@/components/EntityCard";
import {
  CuttingsGallery,
  type CuttingCard,
} from "@/components/player/CuttingsGallery";
import {
  displayNameForRef,
  friendlyAttrLabel,
  getAssoc,
  isEntityRef,
  isVerifiedFromCutting,
  playerTrustLabel,
  type getEntity,
} from "@/lib/data";
import {
  hrefForRef,
  isDisplayableVal,
  playerBioText,
  PLAYER_FACT_KEYS,
} from "@/lib/entityDisplay";

type EntityPayload = NonNullable<Awaited<ReturnType<typeof getEntity>>>;

export async function PlayerView({ data }: { data: EntityPayload }) {
  const { attrs, summary, related, triples } = data;
  const A = await getAssoc();

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

  const otherRelated = related.filter((r) => r.kind !== "article_upload");
  const appearances = otherRelated.filter((r) => r.kind === "appearance");
  const relatedRail = otherRelated
    .filter((r) => r.kind !== "appearance")
    .slice(0, 12);

  const trust = playerTrustLabel(attrs, summary.confidence);
  const namedOnCutting =
    isVerifiedFromCutting(attrs) || cuttings.length > 0;
  const clubName = attrs.club
    ? displayNameForRef(String(attrs.club), A)
    : undefined;
  const countyName = attrs.county
    ? displayNameForRef(String(attrs.county), A)
    : undefined;
  const bio = playerBioText(attrs);
  const kidChip =
    attrs.kid_chip && isDisplayableVal(attrs.kid_chip)
      ? String(attrs.kid_chip)
      : null;
  const cuttingCite =
    attrs.cutting_cite && isDisplayableVal(attrs.cutting_cite)
      ? String(attrs.cutting_cite)
      : summary.citeChip;
  const source = attrs.source ? String(attrs.source) : null;

  const facts = PLAYER_FACT_KEYS.filter(
    (k) => isDisplayableVal(attrs[k])
  ).map((k) => ({
    key: k,
    label: friendlyAttrLabel(k),
    value: attrs[k],
  }));

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-bold uppercase tracking-wide text-galway-maroon">
          Player
        </p>
        <h1 className="text-4xl font-black tracking-tight text-galway-ink sm:text-5xl">
          {summary.title}
        </h1>
        {(clubName || countyName) && (
          <p className="text-xl font-semibold text-galway-ink/70">
            {[clubName, countyName].filter(Boolean).join(" · ")}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {trust ? (
            <span
              className={
                trust === "Verified"
                  ? "rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-bold text-green-800"
                  : trust === "Fan story"
                    ? "rounded-full bg-galway-gold/30 px-2.5 py-0.5 text-sm font-bold text-galway-ink"
                    : "rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-bold text-amber-900"
              }
            >
              {trust}
            </span>
          ) : null}
          {namedOnCutting ? (
            <span className="rounded-full bg-galway-gold/35 px-2.5 py-0.5 text-sm font-bold text-galway-ink">
              Named on a cutting
            </span>
          ) : null}
          {kidChip ? (
            <span className="rounded-full border border-galway-maroon/20 bg-white px-2.5 py-0.5 text-sm font-semibold text-galway-maroon">
              {kidChip}
            </span>
          ) : null}
          {cuttingCite ? (
            <span className="rounded-full border border-galway-maroon/25 px-2.5 py-0.5 text-sm font-bold text-galway-maroon">
              {cuttingCite}
            </span>
          ) : null}
        </div>
      </header>

      {cuttings.length > 0 ? (
        <CuttingsGallery cuttings={cuttings} playerName={summary.title} />
      ) : (
        <CompactCuttingsEmpty />
      )}

      {bio ? (
        <section className="relative overflow-hidden rounded-3xl border-2 border-galway-gold/45 bg-gradient-to-br from-white via-galway-cream to-galway-gold/20 px-6 py-7 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-galway-maroon/70">
            Notable
          </p>
          <p className="mt-2 text-xl font-medium leading-relaxed text-galway-ink sm:text-2xl">
            {bio}
          </p>
        </section>
      ) : null}

      {(facts.length > 0 || appearances.length > 0) && (
        <section>
          <h2 className="mb-3 text-2xl font-bold text-galway-maroon">
            Career
          </h2>
          <dl className="flex flex-wrap gap-2">
            {facts.map((f) => (
              <div
                key={f.key}
                className="rounded-full border border-galway-maroon/15 bg-white px-3 py-1.5"
              >
                <dt className="inline text-[11px] font-bold uppercase tracking-wide text-galway-ink/45">
                  {f.label}{" "}
                </dt>
                <dd className="inline text-sm font-bold text-galway-ink">
                  {isEntityRef(f.value) ? (
                    <Link
                      href={hrefForRef(f.value)}
                      className="text-galway-maroon underline"
                    >
                      {displayNameForRef(f.value, A)}
                    </Link>
                  ) : (
                    String(f.value)
                  )}
                </dd>
              </div>
            ))}
            {appearances.map((a) => (
              <div
                key={a.id}
                className="rounded-full bg-galway-maroon px-3 py-1.5 text-sm font-bold text-white"
              >
                {[a.kindLabel ?? a.badge, a.seasonChip ?? a.subtitle]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            ))}
          </dl>
          {source && source.startsWith("http") ? (
            <p className="mt-3 text-sm text-galway-ink/55">
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
      )}

      {relatedRail.length > 0 ? (
        <section>
          <h2 className="mb-3 text-2xl font-bold text-galway-maroon">
            Related
          </h2>
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
            {relatedRail.map((r) => (
              <div
                key={r.id}
                className="w-[min(78vw,18rem)] shrink-0 snap-start"
              >
                <EntityCard entity={r} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <DeveloperTriples triples={triples} />
    </article>
  );
}

function CompactCuttingsEmpty() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-galway-maroon/12 bg-white/80 px-3 py-2.5">
      <div
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-galway-maroon text-sm font-black text-galway-gold"
      >
        H
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-galway-ink">No cuttings yet</p>
        <p className="text-xs text-galway-ink/55">
          A newspaper snip will sit here when one names this player.{" "}
          <Link href="/stories#upload" className="font-semibold text-galway-maroon underline">
            Upload on Stories
          </Link>
        </p>
      </div>
    </div>
  );
}
