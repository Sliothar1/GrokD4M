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
import { hasPlayQualifier } from "@/lib/publicCopy";
import type { FactSourceStatus } from "@/lib/verification";

type EntityPayload = NonNullable<Awaited<ReturnType<typeof getEntity>>>;

export function PlayerCareer({
  attrs,
  related,
  assoc,
  source,
  kidChip,
  factCites,
  factBadges,
  factStatuses,
}: {
  attrs: EntityPayload["attrs"];
  related: EntityPayload["related"];
  assoc: AssocArray;
  source: string | null;
  kidChip: string | null;
  /** Optional cite markers keyed by fact column. Omitted keys stay unmarked. */
  factCites?: Record<string, React.ReactNode>;
  factBadges?: Record<string, React.ReactNode>;
  factStatuses?: Record<string, FactSourceStatus>;
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
          <ul className="flex list-none flex-wrap gap-2">
            {kidChip && !hasPlayQualifier(kidChip) ? (
              <FactPill unverified={factStatuses?.kid_chip === "unverified"}>
                <span
                  className={
                    factStatuses?.kid_chip === "unverified"
                      ? "text-sm font-semibold text-stone-800"
                      : "text-sm font-semibold text-galway-maroon"
                  }
                >
                  {kidChip}
                  {factCites?.kid_chip}
                </span>
                {factBadges?.kid_chip}
              </FactPill>
            ) : null}
            {facts.map((f) => {
              if (!isEntityRef(f.value) && hasPlayQualifier(String(f.value))) return null;
              const unverified = factStatuses?.[f.key] === "unverified";
              return (
                <FactPill key={f.key} unverified={unverified}>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-stone-700">
                    {f.label}{" "}
                  </span>
                  <span
                    className={
                      unverified
                        ? "text-sm font-bold text-stone-800"
                        : "text-sm font-bold text-galway-ink"
                    }
                  >
                    {isEntityRef(f.value) ? (
                      <Link
                        href={hrefForRef(String(f.value))}
                        className={
                          unverified
                            ? "text-stone-800 underline"
                            : "text-galway-maroon underline"
                        }
                      >
                        {displayNameForRef(String(f.value), assoc)}
                      </Link>
                    ) : (
                      String(f.value)
                    )}
                    {factCites?.[f.key]}
                  </span>
                  {factBadges?.[f.key]}
                </FactPill>
              );
            })}
            {appearances.map((a) => {
              const label = [a.kindLabel ?? a.badge, a.seasonChip ?? a.subtitle]
                .filter(Boolean)
                .join(" · ");
              if (!label || hasPlayQualifier(label)) return null;
              return (
              <li
                key={a.id}
                className="rounded-full bg-galway-maroon px-3 py-1.5 text-sm font-bold text-white"
              >
                {label}
              </li>
              );
            })}
          </ul>
          {source && source.startsWith("http") ? (
            <p className="mt-3 text-sm text-stone-700">
              Cite:{" "}
              <a
                href={source}
                className="font-semibold text-galway-maroon underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read the source
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

function FactPill({
  unverified,
  children,
}: {
  unverified: boolean;
  children: React.ReactNode;
}) {
  return (
    <li
      className={
        unverified
          ? "flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-1 rounded-2xl border border-stone-400 bg-stone-100 px-3 py-1.5"
          : "flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-1 rounded-2xl border border-galway-maroon/15 bg-white px-3 py-1.5"
      }
    >
      {children}
    </li>
  );
}
