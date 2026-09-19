import {
  displayNameForRef,
  getAssoc,
  isEntityRef,
} from "@/lib/data";
import { isDisplayableVal } from "@/lib/entityDisplay";
import type { Triple } from "@/lib/d4m/AssocArray";

export async function DeveloperTriples({
  triples,
  hideScore = false,
}: {
  triples: Triple[];
  hideScore?: boolean;
}) {
  const A = await getAssoc();
  const lines = triples.filter(
    (t) =>
      t.col !== "confidence" &&
      isDisplayableVal(t.val) &&
      !(hideScore && t.col === "score")
  );

  if (lines.length === 0) return null;

  return (
    <details className="rounded-2xl border border-galway-maroon/15 bg-white/70">
      <summary className="cursor-pointer list-outside px-4 py-3 text-sm font-bold uppercase tracking-wide text-galway-ink/50 marker:text-galway-gold hover:text-galway-maroon">
        For developers
      </summary>
      <div className="border-t border-galway-maroon/10 px-4 pb-4 pt-3">
        <p className="mb-3 text-sm text-galway-ink/60">
          D4M associative-array edges (
          <code className="font-mono">row → col = value</code>
          ). Kids can skip this.
        </p>
        <ul className="space-y-2 font-mono text-sm">
          {lines.map((t) => (
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
      </div>
    </details>
  );
}
