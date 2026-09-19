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
};

export function CuttingsGallery({
  cuttings,
  playerName,
}: {
  cuttings: CuttingCard[];
  playerName: string;
}) {
  const titleId = useId();
  const [lightbox, setLightbox] = useState<CuttingCard | null>(null);
  const close = useCallback(() => setLightbox(null), []);

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

  if (cuttings.length === 0) return null;

  const hero = cuttings.find((c) => c.imagePath) ?? cuttings[0];
  const rail = cuttings.filter((c) => c.id !== hero.id);

  return (
    <section className="space-y-4" aria-labelledby={titleId}>
      <div className="flex items-end justify-between gap-3">
        <h2 id={titleId} className="text-2xl font-bold text-galway-maroon">
          Cuttings
        </h2>
        <p className="text-sm font-semibold text-galway-ink/50">
          {cuttings.length === 1
            ? "1 newspaper snip"
            : `${cuttings.length} newspaper snips`}
        </p>
      </div>

      <HeroCutting
        cutting={hero}
        playerName={playerName}
        onOpen={() => hero.imagePath && setLightbox(hero)}
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
                <CuttingRailCard
                  cutting={c}
                  onOpen={() => c.imagePath && setLightbox(c)}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {lightbox?.imagePath ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-galway-ink/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title}
          onClick={close}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-4xl overflow-auto rounded-2xl bg-galway-cream shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.imagePath}
              alt={lightbox.title}
              className="mx-auto max-h-[78vh] w-full object-contain"
            />
            <div className="flex items-start justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-galway-maroon">
                  {lightbox.citeChip ?? "From cutting"}
                </p>
                <p className="text-base font-semibold text-galway-ink">
                  {lightbox.title}
                </p>
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

function HeroCutting({
  cutting,
  playerName,
  onOpen,
}: {
  cutting: CuttingCard;
  playerName: string;
  onOpen: () => void;
}) {
  const caption = cutting.citeChip ?? "From cutting";

  if (cutting.imagePath) {
    return (
      <figure className="overflow-hidden rounded-3xl border-2 border-galway-gold/50 bg-galway-ink shadow-lg">
        <button
          type="button"
          onClick={onOpen}
          className="block w-full focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-gold"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cutting.imagePath}
            alt={`${playerName} — ${cutting.title}`}
            className="mx-auto max-h-[28rem] w-full bg-[#24151a] object-contain"
          />
        </button>
        <figcaption className="bg-galway-maroon px-5 py-3 text-white">
          <p className="text-xs font-bold uppercase tracking-wide text-galway-gold">
            From cutting
          </p>
          <p className="mt-0.5 text-sm font-semibold">{caption}</p>
          <p className="mt-1 text-base font-bold">{cutting.title}</p>
        </figcaption>
      </figure>
    );
  }

  return (
    <article className="rounded-3xl border-2 border-galway-gold/40 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-galway-gold">
        From cutting
      </p>
      {cutting.citeChip ? (
        <p className="mt-1 text-sm font-bold text-galway-maroon">
          {cutting.citeChip}
        </p>
      ) : null}
      <h3 className="mt-2 text-xl font-black text-galway-ink">
        {cutting.title}
      </h3>
      {cutting.excerpt ? (
        <p className="mt-2 text-base leading-relaxed text-galway-ink/75">
          {cutting.excerpt}
        </p>
      ) : null}
      <Link
        href={cutting.href}
        className="mt-3 inline-block text-sm font-bold text-galway-maroon underline"
      >
        View cutting →
      </Link>
    </article>
  );
}

function CuttingRailCard({
  cutting,
  onOpen,
}: {
  cutting: CuttingCard;
  onOpen: () => void;
}) {
  const inner = (
    <>
      {cutting.imagePath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cutting.imagePath}
          alt=""
          className="h-40 w-full bg-galway-cream object-cover"
        />
      ) : (
        <div className="flex h-28 items-center justify-center bg-galway-maroon/5 px-3 text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-galway-maroon">
            Paper cutting
          </p>
        </div>
      )}
      <div className="p-3">
        {cutting.citeChip ? (
          <p className="text-[11px] font-bold uppercase tracking-wide text-galway-maroon">
            {cutting.citeChip}
          </p>
        ) : null}
        <p className="mt-1 line-clamp-2 text-sm font-bold text-galway-ink">
          {cutting.title}
        </p>
      </div>
    </>
  );

  if (cutting.imagePath) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="block w-full overflow-hidden rounded-2xl border-2 border-galway-maroon/15 bg-white text-left shadow-sm transition hover:border-galway-maroon focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-gold"
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      href={cutting.href}
      className="block overflow-hidden rounded-2xl border-2 border-galway-maroon/15 bg-white shadow-sm transition hover:border-galway-maroon"
    >
      {inner}
    </Link>
  );
}
