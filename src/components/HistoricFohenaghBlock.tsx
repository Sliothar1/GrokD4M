"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Driving Committee kid UX for historic predecessors (never amalgam titles). */
export function HistoricPredecessorChip() {
  return (
    <section className="rounded-2xl border-2 border-galway-maroon/20 bg-galway-cream/40 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-galway-ink/50">
        Before the amalgamation
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Link
          href="/club/fohenagh-historic"
          className="rounded-full bg-galway-maroon px-3 py-1 text-sm font-bold text-white hover:bg-galway-maroon-dark"
        >
          Fohenagh
        </Link>
        <Link
          href="/club/ahascragh-historic"
          className="rounded-full bg-galway-maroon px-3 py-1 text-sm font-bold text-white hover:bg-galway-maroon-dark"
        >
          Ahascragh
        </Link>
        <span className="rounded-full border-2 border-galway-maroon/25 bg-white px-3 py-1 text-xs font-bold text-galway-ink/60">
          → Ahascragh-Fohenagh (2002)
        </span>
      </div>
      <p className="mt-3 text-sm text-galway-ink/70">
        Parish clubs Fohenagh and Ahascragh joined to form Ahascragh-Fohenagh
        (juvenile 1999, adult 2002).
      </p>
      <HistoricYearChips compact />
    </section>
  );
}

export function HistoricYearChips({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "mt-3 space-y-2" : "space-y-3"}>
      <p
        className={
          compact
            ? "text-sm font-semibold text-galway-ink/80"
            : "text-base font-semibold text-galway-ink"
        }
      >
        Fohenagh · Galway SHC · vs Castlegar
      </p>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border-2 border-galway-maroon/25 bg-white px-3 py-1 text-sm font-bold text-galway-maroon">
          1959
        </span>
        <span className="rounded-full border-2 border-galway-maroon/25 bg-white px-3 py-1 text-sm font-bold text-galway-maroon">
          1960
        </span>
      </div>
      <ul
        className={
          compact
            ? "space-y-1 text-sm text-galway-ink/75"
            : "space-y-2 text-base text-galway-ink/80"
        }
      >
        <li>
          <Link
            href="/match/fohenagh-historic-1959-galway-shc-final-replay"
            className="font-semibold text-galway-maroon underline"
          >
            1959
          </Link>
          : Fohenagh 3-9 · Castlegar 4-5 · after a replay
        </li>
        <li>
          <Link
            href="/match/fohenagh-historic-1960-galway-shc-final"
            className="font-semibold text-galway-maroon underline"
          >
            1960
          </Link>
          : 4-9 to 2-7 · Pearse Stadium
        </li>
      </ul>
    </div>
  );
}

const HISTORIC_STORY_CHIPS = [
  {
    label: "Fohenagh vs Castlegar, 1960",
    id: "club:fohenagh-historic",
    hint: "season 1960",
  },
  {
    label: "The 1959 replay at Kenny Park",
    id: "club:fohenagh-historic",
    hint: "season 1959",
  },
  {
    label: "When Fohenagh won the county before the amalgam",
    id: "club:fohenagh-historic",
    hint: "club edge only",
  },
  {
    label: "Ahascragh junior days before 2002",
    id: "club:ahascragh-historic",
    hint: "pre-amalgam Ahascragh",
  },
];

/** Story chips live ONLY on the historic block — not on amalgam Add-a-story. */
export function HistoricStoryChips() {
  const router = useRouter();
  const [picked, setPicked] = useState<string | null>(null);

  function go(chip: (typeof HISTORIC_STORY_CHIPS)[number]) {
    setPicked(chip.label);
    const q = new URLSearchParams({
      link: chip.id,
      prompt: chip.label,
    });
    router.push(`/stories?${q.toString()}`);
  }

  return (
    <section className="rounded-2xl border-2 border-dashed border-galway-gold bg-white p-5">
      <h2 className="text-xl font-bold text-galway-maroon">
        Got a story from before the amalgam?
      </h2>
      <p className="mt-1 text-sm text-galway-ink/70">
        Anecdotes welcome. Please do not invent scores.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {HISTORIC_STORY_CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => go(chip)}
            className="rounded-full border-2 border-galway-maroon/30 bg-galway-cream/50 px-3 py-1 text-sm font-semibold text-galway-maroon hover:border-galway-maroon"
            title={chip.hint}
          >
            {chip.label}
          </button>
        ))}
      </div>
      {picked && (
        <p className="mt-2 text-sm text-galway-ink/60" role="status">
          Opening story form for: {picked}
        </p>
      )}
    </section>
  );
}

export function HistoricClubPanel() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-galway-maroon px-3 py-1 text-sm font-bold text-white">
          Before Ahascragh-Fohenagh
        </span>
        <Link
          href="/club/ahascragh-historic"
          className="rounded-full border-2 border-galway-maroon/30 bg-white px-3 py-1 text-sm font-bold text-galway-maroon"
        >
          Ahascragh
        </Link>
        <Link
          href="/club/ahascragh-fohenagh"
          className="text-sm font-semibold text-galway-maroon underline"
        >
          See today&apos;s club
        </Link>
      </div>
      <HistoricYearChips />
      <HistoricStoryChips />
    </div>
  );
}
