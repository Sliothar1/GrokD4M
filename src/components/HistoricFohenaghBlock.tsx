"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SHOW_BOOK_MEDIA } from "@/lib/book-media";

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

const FOHENAGH_FINAL_CHIPS = [
  {
    year: "1958",
    href: "/match/fohenagh-historic-1958-galway-shc-final",
  },
  {
    year: "1959",
    href: "/match/fohenagh-historic-1959-galway-shc-final-replay",
  },
  {
    year: "1960",
    href: "/match/fohenagh-historic-1960-galway-shc-final",
  },
  {
    year: "1961",
    href: "/match/fohenagh-historic-1961-galway-shc-final",
  },
  {
    year: "1963",
    href: "/match/fohenagh-historic-1963-galway-shc-final",
  },
];

type NotableGame = {
  id: string;
  year: string;
  title: string;
  result: string;
  href: string;
  kidLine: string;
  score: string;
  venue: string | null;
  cites: readonly string[];
  image?: string;
  imageAlt?: string;
};

/**
 * Importance order: 1950s county finals, then the cup and the 1960 call-up,
 * then the later finals, then 1940s and the 1890 game.
 * Where sources disagree, both figures are written out.
 */
const FOHENAGH_NOTABLE_GAMES: NotableGame[] = [
  {
    id: "1959-replay",
    year: "1959",
    title: "First senior title",
    result: "Winners",
    href: "/match/fohenagh-historic-1959-galway-shc-final-replay",
    kidLine:
      "Replay day at Kenny Park. Fohenagh became county champions.",
    score: "Fohenagh 3-9, Castlegar 4-5",
    venue: "Kenny Park",
    cites: [
      "3-9 to 4-5 · Tuam Herald and Connacht Tribune, 19 Sep 1959; Connacht Tribune, 29 Jan 2021",
      "3-9 to 2-5 · Galway GAA finals table",
    ],
    image: "/uploads/book/fohenagh-history/p149-1959-senior-champions.png",
    imageAlt: "1959 Fohenagh senior champions, from A History of Fohenagh",
  },
  {
    id: "1960",
    year: "1960",
    title: "Back-to-back cup",
    result: "Winners",
    href: "/match/fohenagh-historic-1960-galway-shc-final",
    kidLine: "Fohenagh kept the cup. Two county titles in a row.",
    score: "Fohenagh 4-9, Castlegar 2-7",
    venue: "Pearse Stadium",
    cites: [
      "4-9 to 2-7 · Galway GAA; Connacht Tribune and Tuam Herald, 3 Sep 1960",
      "5-13 to 2-4 · Connacht Tribune, 29 Jan 2021",
    ],
    image: "/uploads/book/fohenagh-history/p150-1960-senior-champions.png",
    imageAlt: "1960 Fohenagh senior champions, from A History of Fohenagh",
  },
  {
    id: "1959-draw",
    year: "1959",
    title: "Level — they come back",
    result: "Draw",
    href: "/match/fohenagh-historic-1959-galway-shc-final-draw",
    kidLine: "Nobody could split them. The papers said they had to try again.",
    score: "Fohenagh 2-8, Castlegar 1-11",
    venue: "Pearse Stadium",
    cites: ["1959-09-05 · Connacht Tribune", "1959-09-05 · Tuam Herald"],
  },
  {
    id: "1958",
    year: "1958",
    title: "First county final",
    result: "Runners-up",
    href: "/match/fohenagh-historic-1958-galway-shc-final",
    kidLine: "Fohenagh reached the Galway senior final. Castlegar won that day.",
    score: "Castlegar 5-9, Fohenagh 2-4",
    venue: "Duggan Park",
    cites: ["Galway GAA finals table"],
  },
  {
    id: "six-for-galway",
    year: "1960",
    title: "Six Fohenagh men picked for Galway",
    result: "County call-up",
    href: "/club/fohenagh-historic",
    kidLine: "Six men from one small parish picked for Galway against Tipperary.",
    score: "National League v Tipperary, 30 Oct 1960",
    venue: "",
    cites: ["1960-10-15 · Connacht Tribune"],
  },
  {
    id: "1961",
    year: "1961",
    title: "Two points short",
    result: "Runners-up",
    href: "/match/fohenagh-historic-1961-galway-shc-final",
    kidLine:
      "Defending champions, beaten by two points. We do not name the pitch — papers disagree.",
    score: "Turloughmore 3-6, Fohenagh 3-4",
    venue: null,
    cites: ["Galway GAA finals table", "1961-09-16 · Connacht Tribune"],
  },
  {
    id: "1963",
    year: "1963",
    title: "County final day again",
    result: "Runners-up",
    href: "/match/fohenagh-historic-1963-galway-shc-final",
    kidLine: "Another senior final. Turloughmore won this one.",
    score: "Turloughmore 5-13, Fohenagh 2-4",
    venue: "Pearse Stadium",
    cites: ["1963-08-17 · Connacht Tribune"],
  },
];

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
        Fohenagh · six Galway SHC final appearances
      </p>
      <div className="flex flex-wrap gap-2">
        {FOHENAGH_FINAL_CHIPS.map((chip) => (
          <Link
            key={chip.year + chip.href}
            href={chip.href}
            className="rounded-full border-2 border-galway-maroon/25 bg-white px-3 py-1 text-sm font-bold text-galway-maroon hover:border-galway-maroon"
          >
            {chip.year}
          </Link>
        ))}
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
            href="/match/fohenagh-historic-1958-galway-shc-final"
            className="font-semibold text-galway-maroon underline"
          >
            1958
          </Link>
          : runners-up · Castlegar 5-9, Fohenagh 2-4 · Duggan Park
        </li>
        <li>
          <Link
            href="/match/fohenagh-historic-1959-galway-shc-final-draw"
            className="font-semibold text-galway-maroon underline"
          >
            1959 draw
          </Link>
          : Fohenagh 2-8, Castlegar 1-11 · Pearse Stadium
        </li>
        <li>
          <Link
            href="/match/fohenagh-historic-1959-galway-shc-final-replay"
            className="font-semibold text-galway-maroon underline"
          >
            1959 replay
          </Link>
          : winners · Fohenagh 3-9, Castlegar 4-5 · Kenny Park
        </li>
        <li>
          <Link
            href="/match/fohenagh-historic-1960-galway-shc-final"
            className="font-semibold text-galway-maroon underline"
          >
            1960
          </Link>
          : winners · 4-9 to 2-7 · Pearse Stadium
        </li>
        <li>
          <Link
            href="/match/fohenagh-historic-1961-galway-shc-final"
            className="font-semibold text-galway-maroon underline"
          >
            1961
          </Link>
          : runners-up · Turloughmore 3-6, Fohenagh 3-4
        </li>
        <li>
          <Link
            href="/match/fohenagh-historic-1963-galway-shc-final"
            className="font-semibold text-galway-maroon underline"
          >
            1963
          </Link>
          : runners-up · Turloughmore 5-13, Fohenagh 2-4 · Pearse Stadium
        </li>
      </ul>
      <p className="text-xs text-galway-ink/55">
        Six final games across five seasons (1958–61, 1963). Tag:
        fohenagh-historic. Not amalgam titles.
      </p>
    </div>
  );
}

function resultBadgeClass(result: string) {
  if (result === "Winners") {
    return "bg-green-100 text-green-800";
  }
  if (result === "Draw") {
    return "bg-galway-gold/35 text-galway-ink";
  }
  return "bg-amber-100 text-amber-900";
}

/** Historic Fohenagh club page — one game at a time, county finals first. */
export function FohenaghNotableGamesShelf() {
  const [picked, setPicked] = useState(FOHENAGH_NOTABLE_GAMES[0].id);
  const game =
    FOHENAGH_NOTABLE_GAMES.find((item) => item.id === picked) ??
    FOHENAGH_NOTABLE_GAMES[0];

  return (
    <section aria-labelledby="fohenagh-notable-games" className="space-y-4">
      <div className="max-w-2xl space-y-2">
        <p className="fohenagh-kicker">1950s first</p>
        <h2 id="fohenagh-notable-games" className="text-3xl font-black tracking-tight text-galway-ink">
          Notable games
        </h2>
      </div>
      <label className="block max-w-xl text-sm font-semibold text-galway-ink/70">
        Choose a game
        <select
          className="mt-1 w-full rounded-xl border border-[var(--fohenagh-blue)]/30 bg-white px-3 py-2 text-base font-semibold text-galway-ink"
          value={game.id}
          onChange={(event) => setPicked(event.target.value)}
        >
          {FOHENAGH_NOTABLE_GAMES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.year} · {item.title}
            </option>
          ))}
        </select>
      </label>
      <article className="max-w-3xl space-y-3 rounded-2xl border border-[var(--fohenagh-blue)]/20 bg-white/80 p-5">
        {game.id === "six-for-galway" ? (
          <p className="text-base leading-relaxed text-galway-ink">
            <Link className="font-semibold text-galway-maroon underline" href="/player/tony-ogorman">Tony O&apos;Gorman</Link>
            {", "}
            <Link className="font-semibold text-galway-maroon underline" href="/player/pj-lally-fohenagh">P.J. Lally</Link>
            {", "}
            <Link className="font-semibold text-galway-maroon underline" href="/player/tim-sweeney-fohenagh">Tim Sweeney</Link>
            {", "}
            <Link className="font-semibold text-galway-maroon underline" href="/player/frank-glynn-fohenagh">Frank Glynn</Link>
            {", "}
            <Link className="font-semibold text-galway-maroon underline" href="/player/jim-moclair-fohenagh">Jimmy Moclair</Link>
            . J. Sweeney is named in the same list. Two players fit that initial, so this page does not guess.
          </p>
        ) : null}
        {game.image && SHOW_BOOK_MEDIA ? (
          <figure className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={game.image} alt={game.imageAlt ?? game.title} className="w-full rounded-lg" />
            <figcaption className="text-xs text-galway-ink/55">
              From A History of Fohenagh by Tony O&apos;Gorman
            </figcaption>
          </figure>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-black text-galway-maroon">{game.year}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${resultBadgeClass(game.result)}`}>
            {game.result}
          </span>
        </div>
        <h3 className="text-2xl font-black text-galway-ink">{game.title}</h3>
        <p className="text-base leading-relaxed text-galway-ink/80">{game.kidLine}</p>
        <p className="text-sm font-semibold text-galway-ink">
          {game.score}
          {game.venue ? ` · ${game.venue}` : ""}
        </p>
        <ul className="space-y-1 text-sm text-galway-ink/70">
          {game.cites.map((cite) => (
            <li key={cite}>{cite}</li>
          ))}
        </ul>
        <Link href={game.href} className="inline-block font-semibold text-galway-maroon underline underline-offset-4">
          Open this game
        </Link>
      </article>
    </section>
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
    label: "When Fohenagh won the county",
    id: "club:fohenagh-historic",
    hint: "club edge only",
  },
  {
    label: "Near miss in 1958 — Castlegar final",
    id: "match:fohenagh-historic-1958-galway-shc-final",
    hint: "runners-up 1958",
  },
  {
    label: "1961 final vs Turloughmore",
    id: "match:fohenagh-historic-1961-galway-shc-final",
    hint: "runners-up 1961",
  },
  {
    label: "1963 county final day",
    id: "match:fohenagh-historic-1963-galway-shc-final",
    hint: "runners-up 1963",
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
      heading="Got a Fohenagh story?"
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

export function HistoricClubPanel({
  showStories = true,
}: {
  /** Story prompts sit after the roster on the Fohenagh club page. */
  showStories?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/club/ahascragh-historic"
          className="rounded-full border-2 border-galway-maroon/30 bg-white px-3 py-1 text-sm font-bold text-galway-maroon"
        >
          Ahascragh
        </Link>
      </div>
      <FohenaghNotableGamesShelf />
      {showStories ? <HistoricStoryChips /> : null}
    </div>
  );
}
