"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { publicSourceCredit } from "@/lib/publicText";

/** Newspaper page scan. Click opens a lightbox; Escape or Close dismisses it. */
export function ZoomableImage({
  src,
  alt,
  credit,
  creditUrl,
}: {
  src: string;
  alt: string;
  /** Shown again inside the lightbox so the enlarged scan stays credited. */
  credit?: string;
  creditUrl?: string;
}) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
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
  }, [open, close]);

  const creditText = publicSourceCredit(credit ?? "").trim();
  const creditHref = creditUrl?.trim();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full cursor-zoom-in overflow-hidden rounded-2xl border-2 border-galway-maroon/15 bg-white p-0 text-left shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-gold"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="mx-auto max-h-[70vh] w-full object-contain bg-galway-cream"
        />
        <span className="block px-4 py-2 text-sm font-semibold text-galway-maroon">
          Full page · click to enlarge
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-galway-ink/85 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={close}
        >
          <div
            className="relative max-h-[94vh] w-full max-w-5xl overflow-auto rounded-2xl bg-galway-cream shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="mx-auto max-h-[82vh] w-full object-contain"
            />
            <div className="flex items-start justify-between gap-3 px-4 py-3">
              <div id={titleId}>
                <p className="text-sm font-bold text-galway-maroon">Full page</p>
                {creditText ? (
                  <p className="mt-1 text-sm font-semibold text-galway-ink">
                    {creditHref ? (
                      <a
                        href={creditHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {creditText}
                      </a>
                    ) : (
                      creditText
                    )}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={close}
                className="shrink-0 rounded-full border border-galway-maroon/30 px-3 py-1.5 text-sm font-bold text-galway-maroon"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
