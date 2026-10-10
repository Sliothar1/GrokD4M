import Link from "next/link";
import type { PressPraiseLine } from "@/lib/entityDisplay";

/** Short newspaper lines. Only the bracketed phrase is a link. */
export function InThePapers({
  lines,
  thumbs,
}: {
  lines: readonly PressPraiseLine[];
  /** Cutting thumbnails keyed by article id. Cited lines only. */
  thumbs?: Record<string, { src: string; href: string; alt: string }>;
}) {
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
        {lines.map((line) => {
          const thumb = thumbs?.[line.articleId];
          return (
            <div key={line.key} className="flex gap-3">
              {thumb ? (
                <Link
                  href={thumb.href}
                  className="mt-0.5 shrink-0 overflow-hidden rounded-lg border border-[var(--hw-line)] bg-galway-cream"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumb.src}
                    alt={thumb.alt}
                    className="h-16 w-14 object-cover"
                  />
                </Link>
              ) : null}
              <p className="text-[15px] leading-relaxed text-galway-ink">
                {line.before}
                <Link
                  href={`/article/${line.articleId}`}
                  className="text-blue-700 underline decoration-blue-700 underline-offset-2 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                >
                  {line.linkText}
                </Link>
                {line.after}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
