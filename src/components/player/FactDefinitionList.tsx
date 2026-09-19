import Link from "next/link";
import { displayNameForRef, isEntityRef } from "@/lib/data";
import { hrefForRef } from "@/lib/entityDisplay";
import type { AssocArray, TripleVal } from "@/lib/d4m/AssocArray";

export type FactRow = {
  key: string;
  label: string;
  value: TripleVal;
};

export type AppearanceChip = {
  id: string;
  label: string;
};

export function FactDefinitionList({
  facts,
  appearances,
  source,
  A,
}: {
  facts: FactRow[];
  appearances: AppearanceChip[];
  source?: string | null;
  A: AssocArray;
}) {
  if (facts.length === 0 && appearances.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-2xl font-bold text-galway-maroon">Career</h2>
      <dl className="grid gap-2 sm:grid-cols-2">
        {facts.map((f) => (
          <div
            key={f.key}
            className="flex items-baseline justify-between gap-3 rounded-xl border border-galway-maroon/10 bg-white px-3 py-2"
          >
            <dt className="text-[11px] font-bold uppercase tracking-wide text-galway-ink/45">
              {f.label}
            </dt>
            <dd className="text-right text-sm font-bold text-galway-ink">
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
      </dl>
      {appearances.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {appearances.map((a) => (
            <li
              key={a.id}
              className="rounded-full bg-galway-maroon px-3 py-1.5 text-sm font-bold text-white"
            >
              {a.label}
            </li>
          ))}
        </ul>
      ) : null}
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
  );
}
