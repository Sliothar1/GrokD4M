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

export function CuttingExcerpts({
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

  if (cuttings.length === 0) {
    return <CompactCuttingsEmpty />;
  }

  const ordered = [...cuttings].sort(compareCuttings);

  return (
    <section className="space-y-3" aria-labelledby={titleId}>
      <div className="flex items-end justify-between gap-3">
        <h2 id={titleId} className="text-2xl font-bold text-galway-maroon">
          Excerpts for games
        </h2>
        <p className="text-sm font-semibold text-galway-ink/50">
          {ordered.length === 1
            ? "1 newspaper snip"
            : `${ordered.length} newspaper snips`}
        </p>
      </div>

      <ul className="space-y-3">
        {ordered.map((c) => (
          <li key={c.id}>
            <ExcerptRow
              cutting={c}
              playerName={playerName}
              onOpen={() => (c.imagePath ? setLightbox(c) : undefined)}
            />
          </li>
        ))}
      </ul>

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

function ExcerptRow({
  cutting,
  playerName,
  onOpen,
}: {
  cutting: CuttingCard;
  playerName: string;
  onOpen: () => void;
}) {
  const canOpenImage = Boolean(cutting.imagePath);
  const body = (
    <>
      {cutting.imagePath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cutting.imagePath}
          alt=""
          className="h-24 w-20 shrink-0 rounded-xl bg-galway-cream object-cover sm:h-28 sm:w-24"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-24 w-20 shrink-0 items-center justify-center rounded-xl bg-galway-maroon/8 sm:h-28 sm:w-24"
        >
          <span className="px-1 text-center text-[10px] font-bold uppercase tracking-wide text-galway-maroon">
            Paper
          </span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        {cutting.citeChip ? (
          <p className="text-[11px] font-bold uppercase tracking-wide text-galway-maroon">
            {cutting.citeChip}
          </p>
        ) : (
          <p className="text-[11px] font-bold uppercase tracking-wide text-galway-gold">
            From cutting
          </p>
        )}
        <h3 className="mt-0.5 text-base font-black text-galway-ink sm:text-lg">
          {cutting.title}
        </h3>
        {cutting.excerpt ? (
          <p className="mt-1 text-sm leading-relaxed text-galway-ink/70">
            {cutting.excerpt}
          </p>
        ) : null}
        <p className="mt-2 text-sm font-bold text-galway-maroon">
          {canOpenImage ? "Open snip →" : "View cutting →"}
        </p>
      </div>
    </>
  );

  if (canOpenImage) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-3 rounded-2xl border border-galway-maroon/15 bg-white p-3 text-left shadow-sm transition hover:border-galway-maroon hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-gold"
        aria-label={`Open cutting: ${cutting.title} — ${playerName}`}
      >
        {body}
      </button>
    );
  }

  return (
    <Link
      href={cutting.href}
      className="flex items-start gap-3 rounded-2xl border border-galway-maroon/15 bg-white p-3 shadow-sm transition hover:border-galway-maroon"
    >
      {body}
    </Link>
  );
}

function CompactCuttingsEmpty() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-galway-maroon/12 bg-white/80 px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-bold text-galway-ink">No game excerpts yet</p>
        <p className="text-xs text-galway-ink/55">
          A short snip will list here when a cutting names this player.{" "}
          <Link
            href="/stories#upload"
            className="font-semibold text-galway-maroon underline"
          >
            Upload on Stories
          </Link>
        </p>
      </div>
    </div>
  );
}

function compareCuttings(a: CuttingCard, b: CuttingCard): number {
  const ya = cuttingYear(a);
  const yb = cuttingYear(b);
  if (ya !== yb) return ya - yb;
  return a.title.localeCompare(b.title);
}

function cuttingYear(c: CuttingCard): number {
  const m = `${c.citeChip ?? ""} ${c.title}`.match(/\b(19\d{2}|20[0-2]\d)\b/);
  return m ? Number(m[1]) : 0;
}
