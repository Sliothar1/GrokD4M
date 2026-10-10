import Link from "next/link";
import type { CiteRef } from "@/lib/citations";

/**
 * Renders a write-up whose [n] markers use the same numbers as the reference list.
 * A marker opens the clipping when the reference has an article or match link.
 */
export function CitedText({
  text,
  references,
  className,
}: {
  text: string;
  references: CiteRef[];
  className?: string;
}) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <p className={className}>
      {parts.map((part, index) => {
        const marker = part.match(/^\[(\d+)\]$/);
        if (!marker) return <span key={index}>{part}</span>;
        const n = Number(marker[1]);
        const ref = references[n - 1];
        const href = ref?.href || `#ref-${n}`;
        const external = /^https?:\/\//.test(href);
        const label = `Source ${n}${ref ? `: ${ref.title}` : ""}`;
        if (external) {
          return (
            <a key={index} href={href} className="cite-mark" aria-label={label}>
              [{n}]
            </a>
          );
        }
        return (
          <Link key={index} href={href} className="cite-mark" aria-label={label}>
            [{n}]
          </Link>
        );
      })}
    </p>
  );
}

export function ReferenceList({
  references,
  headingClassName,
}: {
  references: CiteRef[];
  headingClassName: string;
}) {
  if (references.length === 0) return null;
  return (
    <section>
      <h2 className={headingClassName}>References</h2>
      <ol className="max-w-2xl list-decimal space-y-1 pl-5 text-sm text-galway-ink">
        {references.map((ref, index) => {
          const n = index + 1;
          const external = /^https?:\/\//.test(ref.href);
          const self = ref.href.startsWith("#");
          return (
            <li key={`${n}-${ref.title}`} id={`ref-${n}`}>
              {self ? (
                ref.title
              ) : external ? (
                <a href={ref.href} className="font-semibold text-galway-maroon underline underline-offset-2">
                  {ref.title}
                </a>
              ) : (
                <Link href={ref.href} className="font-semibold text-galway-maroon underline underline-offset-2">
                  {ref.title}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
