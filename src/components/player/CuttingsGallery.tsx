"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";

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
};

const FEATURED_IDS = ["art-ina-ct-2003-12-12-jason-lohan-u21"];

export function sortPressCards(cuttings: CuttingCard[]): CuttingCard[] {
  return [...cuttings].sort((a, b) => {
    const aFeat = FEATURED_IDS.some((id) => a.id.includes(id)) ? 0 : 1;
    const bFeat = FEATURED_IDS.some((id) => b.id.includes(id)) ? 0 : 1;
    if (aFeat !== bFeat) return aFeat - bFeat;
    const aImg = a.imagePath ? 0 : 1;
    const bImg = b.imagePath ? 0 : 1;
    return aImg - bImg;
  });
}

export { CuttingsGallery as CuttingGallery };

export function CuttingsGallery({
  cuttings,
  playerName,
}: {
  cuttings: CuttingCard[];
  playerName: string;
}) {
  const titleId = useId();
  const [lightbox, setLightbox] = useState<CuttingCard | null>(null);
  const [filter, setFilter] = useState("all");
  const close = useCallback(() => setLightbox(null), []);
  const ordered = sortPressCards(cuttings);
  const papers = [...new Set(ordered.map((c) => c.paper).filter(Boolean))] as string[];
  const years = [
    ...new Set(
      ordered
        .map((c) => c.date?.match(/\b(19\d{2}|20[0-2]\d)\b/)?.[1])
        .filter(Boolean)
    ),
  ] as string[];
  const filters = [
    { id: "all", label: "All" },
    ...papers.map((p) => ({ id: `paper:${p}`, label: p })),
    ...years.map((y) => ({ id: `year:${y}`, label: y })),
  ];
  const visible =
    filter === "all"
      ? ordered
      : ordered.filter((c) => {
          if (filter.startsWith("paper:")) return c.paper === filter.slice(6);
          if (filter.startsWith("year:")) {
            return c.date?.includes(filter.slice(5));
          }
          return true;
        });

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox, close]);

  if (ordered.length === 0) return null;

  const hero = visible[0] ?? ordered[0];
  const rail = visible.filter((c) => c.id !== hero.id);

  return (
    <section className="space-y-4" aria-labelledby={titleId}>
      <div className="flex items-end justify-between gap-3">
        <h2 id={titleId} className="text-2xl font-bold text-galway-maroon">
          Cuttings
        </h2>
        <p className="text-sm font-semibold text-galway-ink/50">
          {visible.length === 1
            ? "1 press card"
            : `${visible.length} press cards`}
        </p>
      </div>

      {filters.length > 2 ? (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter cuttings">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={
                filter === f.id
                  ? "rounded-full bg-galway-maroon px-3 py-1 text-xs font-bold text-white"
                  : "rounded-full border border-galway-maroon/20 bg-white px-3 py-1 text-xs font-bold text-galway-maroon"
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      ) : null}

      <PressCuttingCard
        cutting={hero}
        playerName={playerName}
        featured
        onOpen={() => setLightbox(hero)}
      />

      {rail.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-galway-ink/45">
            More snips · swipe
          </p>
          <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
            {rail.map((c) => (
              <li
                key={c.id}
                className="w-[min(78vw,18rem)] shrink-0 snap-start"
              >
                <PressCuttingCard
                  cutting={c}
                  playerName={playerName}
                  onOpen={() => setLightbox(c)}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-galway-ink/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.headline || lightbox.title}
          onClick={close}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-4xl overflow-auto rounded-2xl bg-galway-cream shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <PressImage
              cutting={lightbox}
              className="mx-auto max-h-[70vh] w-full object-contain"
            />
            <div className="flex items-start justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-galway-maroon">
                  {[lightbox.paper, lightbox.date, lightbox.page ? `p.${lightbox.page}` : null]
                    .filter(Boolean)
                    .join(" · ") || lightbox.citeChip || "From cutting"}
                </p>
                <p className="text-base font-semibold text-galway-ink">
                  {lightbox.headline || lightbox.title}
                </p>
                {lightbox.excerpt ? (
                  <p className="mt-1 text-sm text-galway-ink/70">{lightbox.excerpt}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  href={lightbox.href}
                  className="rounded-full bg-galway-maroon px-3 py-1.5 text-sm font-bold text-white"
                >
                  Open
                </Link>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-full border border-galway-maroon/30 px-3 py-1.5 text-sm font-bold text-galway-maroon"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

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

function PressImage({
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
