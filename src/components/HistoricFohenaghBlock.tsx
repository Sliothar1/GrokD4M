"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const AHASCRAGH_TITLE_CHIPS = [
  {
    label: "Junior 1981",
    href: "/win/ahascragh-historic-1981-junior",
    hint: "Verified · Galway GAA + Examiner",
  },
  {
    label: "Junior A 1989",
    href: "/win/ahascragh-historic-1989-junior-a",
    hint: "Verified · Galway GAA roll of honour",
  },
  {
    label: "Minor C 1989",
    href: "/win/ahascragh-historic-1989-minor-c",
    hint: "Verified · Galway GAA roll of honour",
  },
];

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
        (juvenile 1999, adult 2002). Predecessor titles stay on the historic
        clubs — not on the amalgam.
      </p>
      <HistoricYearChips compact />
      <AhascraghTitleChips compact />
      <AhascraghStoryChips />
    </section>
  );
}

export function AhascraghTitleChips({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "mt-4 space-y-2" : "space-y-3"}>
      <p
        className={
          compact
            ? "text-sm font-semibold text-galway-ink/80"
            : "text-base font-semibold text-galway-ink"
        }
      >
        Ahascragh · verified titles
      </p>
      <div className="flex flex-wrap gap-2">
        {AHASCRAGH_TITLE_CHIPS.map((chip) => (
          <Link
            key={chip.label}
            href={chip.href}
            title={chip.hint}
            className="rounded-full border-2 border-galway-maroon/25 bg-white px-3 py-1 text-sm font-bold text-galway-maroon hover:border-galway-maroon"
          >
            {chip.label}
          </Link>
        ))}
      </div>
      <p className="text-xs text-galway-ink/55">
        Hang only on historic Ahascragh — not amalgam main titles. Colours
        withheld.
      </p>
    </div>
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
];

const AHASCRAGH_STORY_CHIPS = [
  {
    label: "Junior days, 1981",
    id: "club:ahascragh-historic",
    hint: "optional · Junior title 1981",
  },
  {
    label: "Ahascragh in '89",
    id: "club:ahascragh-historic",
    hint: "optional · Junior A / Minor C 1989",
  },
  {
    label: "Ahascragh junior days before 2002",
    id: "club:ahascragh-historic",
    hint: "pre-amalgam Ahascragh",
  },
];

/** Loughrea 2025 final chips (Story Desk) — optional prompts, not invented scores. */
export const LOUGHREA_FINAL_STORY_CHIPS = [
  {
    label: "Loughrea retain the Tom Callinan Cup, 2025",
    id: "match:galway-shc-2025-final",
    hint: "2025 Galway SHC final",
  },
  {
    label: "Pearse Stadium final night, 2025",
    id: "match:galway-shc-2025-final",
    hint: "venue memory",
  },
  {
    label: "When Loughrea edged St Thomas' by a point",
    id: "match:galway-shc-2025-final",
    hint: "1-15 to 1-14",
  },
];

function StoryChipButtons({
  chips,
  heading,
  sub,
}: {
  chips: { label: string; id: string; hint: string }[];
  heading: string;
  sub: string;
}) {
  const router = useRouter();
  const [picked, setPicked] = useState<string | null>(null);

  function go(chip: { label: string; id: string }) {
    setPicked(chip.label);
    const q = new URLSearchParams({
      link: chip.id,
      prompt: chip.label,
    });
    router.push(`/stories?${q.toString()}`);
  }

  return (
    <section className="rounded-2xl border-2 border-dashed border-galway-gold bg-white p-5">
      <h2 className="text-xl font-bold text-galway-maroon">{heading}</h2>
      <p className="mt-1 text-sm text-galway-ink/70">{sub}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((chip) => (
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

/** Story chips live ONLY on the historic block — not on amalgam Add-a-story. */
export function HistoricStoryChips() {
  return (
    <StoryChipButtons
      chips={HISTORIC_STORY_CHIPS}
      heading="Got a story from before the amalgam?"
      sub="Anecdotes welcome. Please do not invent scores."
    />
  );
}

export function AhascraghStoryChips() {
  return (
    <div className="mt-4">
      <StoryChipButtons
        chips={AHASCRAGH_STORY_CHIPS}
        heading="Got an Ahascragh tale?"
        sub="Optional prompts for pre-2002 Ahascragh. Please do not invent scores."
      />
    </div>
  );
}

export function LoughreaFinalStoryChips() {
  return (
    <StoryChipButtons
      chips={LOUGHREA_FINAL_STORY_CHIPS}
      heading="Got a Loughrea final tale?"
      sub="2025 Galway SHC final chips from Story Desk. Anecdotes welcome — do not invent scores."
    />
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
      <AhascraghTitleChips />
      <HistoricStoryChips />
      <AhascraghStoryChips />
    </div>
  );
}
