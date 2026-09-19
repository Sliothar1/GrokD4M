"use client";

import { useState } from "react";

export type CuttingCard = {
  id: string;
  title: string;
  excerpt?: string;
  citeChip?: string;
  imagePath?: string;
  href: string;
  paper?: string;
  date?: string;
  page?: string;
  headline?: string;
  sourceUrl?: string;
};

export function PressCuttingCard({
  cutting,
  playerName,
  featured = false,
  onOpen,
}: {
  cutting: CuttingCard;
  playerName: string;
  featured?: boolean;
  onOpen: () => void;
}) {
  const masthead = cutting.paper || "Paper";
  const dateline = [cutting.date, cutting.page ? `p.${cutting.page}` : null]
    .filter(Boolean)
    .join(" · ");
  const headline = cutting.headline || cutting.title;

  return (
    <article
      className={
        featured
          ? "overflow-hidden rounded-3xl border-2 border-galway-gold/50 bg-white shadow-lg"
          : "overflow-hidden rounded-2xl border-2 border-galway-maroon/15 bg-white shadow-sm"
      }
    >
      <header className="bg-galway-maroon px-4 py-2.5 text-white">
        <p
          className={
            featured
              ? "font-serif text-lg font-black tracking-wide text-galway-gold sm:text-xl"
              : "font-serif text-sm font-black tracking-wide text-galway-gold"
          }
        >
          {masthead}
        </p>
        {dateline ? (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/75">
            {dateline}
          </p>
        ) : cutting.citeChip ? (
          <p className="text-[11px] font-semibold text-white/75">{cutting.citeChip}</p>
        ) : null}
      </header>
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-gold"
      >
        <PressImage
          cutting={cutting}
          alt={`${playerName} — ${headline}`}
          className={
            featured
              ? "max-h-[28rem] w-full bg-[#24151a] object-contain"
              : "h-40 w-full bg-galway-cream object-cover"
          }
        />
        <div className={featured ? "px-5 py-4" : "p-3"}>
          <h3
            className={
              featured
                ? "font-serif text-xl font-black leading-snug text-galway-ink sm:text-2xl"
                : "line-clamp-3 font-serif text-sm font-bold leading-snug text-galway-ink"
            }
          >
            {headline}
          </h3>
          {featured && cutting.excerpt ? (
            <p className="mt-2 text-base leading-relaxed text-galway-ink/75">
              {cutting.excerpt}
            </p>
          ) : null}
        </div>
      </button>
    </article>
  );
}

export function PressImage({
  cutting,
  alt,
  className,
}: {
  cutting: CuttingCard;
  alt?: string;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const src = cutting.imagePath;

  if (!src || broken) {
    return (
      <div
        className={`flex items-center justify-center bg-galway-cream px-4 py-10 text-center ${className ?? ""}`}
        role="img"
        aria-label={alt || "Press cutting"}
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-galway-maroon">
            Press cutting
          </p>
          <p className="mt-1 text-sm font-semibold text-galway-ink/60">
            {cutting.paper || "Newspaper snip"}
          </p>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt || ""}
      className={className}
      onError={() => setBroken(true)}
    />
  );
}
