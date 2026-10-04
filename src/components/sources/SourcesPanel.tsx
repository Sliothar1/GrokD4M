import Link from "next/link";
import { isExternalHref, type ResolvedSource } from "@/lib/sources";

/**
 * Numbered source list. Markers elsewhere on the page point at `#source-N`.
 * Each entry links out to the cutting page, its PNG, or the external URL.
 */
export function SourcesPanel({
  sources,
  headingId = "sources-heading",
}: {
  sources: readonly ResolvedSource[];
  headingId?: string;
}) {
  if (sources.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="max-w-full">
      <h2
        id={headingId}
        className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon"
      >
        Sources
      </h2>
      <ol className="list-none space-y-2.5">
        {sources.map((source) => (
          <li
            key={source.key}
            id={`source-${source.number}`}
            className="flex min-w-0 scroll-mt-6 gap-3 rounded-2xl border border-galway-maroon/12 bg-white/80 p-3"
          >
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-galway-maroon text-sm font-bold text-white"
            >
              {source.number}
            </span>
            {source.imagePath ? (
              <a href={source.imagePath} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={source.imagePath}
                  alt={source.imageAlt ?? source.title}
                  className="h-20 w-14 rounded-md bg-galway-cream object-cover"
                />
              </a>
            ) : null}
            <div className="min-w-0 flex-1">
              <OutLink
                href={source.href}
                className="break-words text-base font-bold text-galway-maroon underline decoration-galway-maroon/40 underline-offset-2 [overflow-wrap:anywhere] hover:text-galway-maroon-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-galway-gold"
              >
                {source.title}
              </OutLink>
              {source.publication || source.date ? (
                <p className="mt-1 break-words text-sm font-semibold text-galway-ink">
                  {[source.publication, source.date].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function OutLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
