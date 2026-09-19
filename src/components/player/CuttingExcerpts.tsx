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
  heading = "Excerpts for games",
}: {
  cuttings: CuttingCard[];
  playerName?: string;
  heading?: string;
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
        <h2
          id={titleId}
          className="text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon"
        >
          {heading}
        </h2>
        <p className="text-sm font-semibold text-galway-ink/45">
          {ordered.length === 1
            ? "1 newspaper snip"
            : `${ordered.length} newspaper snips`}
        </p>
      </div>

      <ul className="grid gap-3">
        {ordered.map((c) => (
          <li key={c.id}>
            <PressCard
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

function PressCard({
  cutting,
  playerName,
  onOpen,
}: {
  cutting: CuttingCard;
  playerName?: string;
  onOpen: () => void;
}) {
  const canOpenImage = Boolean(cutting.imagePath);
  const body = (
    <>
      <div className="h-1 bg-galway-gold" />
      <div className="flex items-start gap-3.5 p-3.5 sm:gap-4 sm:p-4">
        {cutting.imagePath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cutting.imagePath}
            alt=""
            className="h-28 w-[4.5rem] shrink-0 rounded-md bg-white object-cover shadow-inner sm:h-32 sm:w-24"
          />
        ) : (
          <div
            aria-hidden
            className="flex h-28 w-[4.5rem] shrink-0 items-center justify-center rounded-md bg-white sm:h-32 sm:w-24"
          >
            <span className="px-1 text-center text-[10px] font-bold uppercase tracking-wide text-galway-maroon">
              Paper
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-galway-maroon">
            {cutting.citeChip ?? "From cutting"}
          </p>
          <h3 className="mt-1 text-base font-black leading-snug text-galway-ink sm:text-lg">
            {cutting.title}
          </h3>
          {cutting.excerpt ? (
            <p className="mt-2 text-[15px] leading-relaxed text-galway-ink/70">
              {cutting.excerpt}
            </p>
          ) : null}
          <p className="mt-2.5 text-sm font-bold text-galway-maroon">
            {canOpenImage ? "Open snip →" : "View cutting →"}
          </p>
        </div>
      </div>
    </>
  );

  const cardClass =
    "block w-full overflow-hidden rounded-2xl border border-galway-maroon/12 bg-galway-cream text-left shadow-[0_1px_0_rgba(122,12,46,0.06)] transition hover:border-galway-maroon/40 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-gold";

  if (canOpenImage) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={cardClass}
        aria-label={`Open cutting: ${cutting.title}${playerName ? ` — ${playerName}` : ""}`}
      >
        {body}
      </button>
    );
  }

  return (
    <Link href={cutting.href} className={cardClass}>
      {body}
    </Link>
  );
}

function CompactCuttingsEmpty() {
  return (
    <div className="rounded-xl border border-galway-maroon/10 bg-white/70 px-3 py-2">
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
