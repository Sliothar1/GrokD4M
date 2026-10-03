import Link from "next/link";
import { EntityCard } from "@/components/EntityCard";
import {
  displayNameForRef,
  friendlyAttrLabel,
  isEntityRef,
  type getEntity,
} from "@/lib/data";
import {
  hrefForRef,
  isDisplayableVal,
  PLAYER_FACT_KEYS,
} from "@/lib/entityDisplay";
import type { AssocArray, TripleVal } from "@/lib/d4m/AssocArray";

type EntityPayload = NonNullable<Awaited<ReturnType<typeof getEntity>>>;

export function PlayerCareer({
  attrs,
  related,
  assoc,
  source,
  kidChip,
}: {
  attrs: EntityPayload["attrs"];
  related: EntityPayload["related"];
  assoc: AssocArray;
  source: string | null;
  kidChip: string | null;
}) {
  const appearances = related.filter((r) => r.kind === "appearance");
  const relatedRail = related
    .filter((r) => r.kind !== "article_upload" && r.kind !== "appearance")
    .slice(0, 12);

  const facts = PLAYER_FACT_KEYS.filter((k) => isDisplayableVal(attrs[k])).map(
    (k) => ({
      key: k,
      label: friendlyAttrLabel(k),
      value: attrs[k] as TripleVal,
    })
  );

  const showCareer =
    facts.length > 0 || appearances.length > 0 || Boolean(kidChip);

  return (
    <>
      {showCareer ? (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon">
            Career
          </h2>
          <dl className="flex flex-wrap gap-2">
            {kidChip ? (
              <div className="rounded-full border border-galway-maroon/20 bg-white px-3 py-1.5 text-sm font-semibold text-galway-maroon">
                {kidChip}
              </div>
            ) : null}
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
                      href={hrefForRef(String(f.value))}
                      className="text-galway-maroon underline"
                    >
                      {displayNameForRef(String(f.value), assoc)}
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
      ) : null}

      {relatedRail.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon">
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
    </>
  );
}
