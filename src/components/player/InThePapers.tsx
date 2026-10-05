import Link from "next/link";
import type { PressPraiseLine } from "@/lib/entityDisplay";

/** Short newspaper lines. Only the bracketed phrase is a link. */
export function InThePapers({ lines }: { lines: readonly PressPraiseLine[] }) {
  if (lines.length === 0) return null;

  return (
    <section className="max-w-full" aria-labelledby="in-the-papers-heading">
      <h2
        id="in-the-papers-heading"
        className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-700"
      >
        In the papers
      </h2>
      <div className="mt-2 max-w-3xl space-y-2">
        {lines.map((line) => (
          <p key={line.key} className="text-[15px] leading-relaxed text-galway-ink">
            {line.before}
            <Link
              href={`/article/${line.articleId}`}
              className="text-blue-700 underline decoration-blue-700 underline-offset-2 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              {line.linkText}
            </Link>
            {line.after}
          </p>
        ))}
      </div>
    </section>
  );
}
