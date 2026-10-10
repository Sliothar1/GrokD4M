"use client";

import Link from "next/link";
import { useState } from "react";

const KEY_PLAYERS = [
  {
    name: "Tim Sweeney",
    href: "/player/tim-sweeney-fohenagh",
    line: "Selected for Galway against Tipperary, National League, 30 October 1960. On the 1959 county title team.",
  },
  {
    name: "Tony O'Gorman",
    href: "/player/tony-ogorman",
    line: "Selected for the same Galway team, printed as T. O'Gorman.",
  },
  {
    name: "P.J. Lally",
    href: "/player/pj-lally-fohenagh",
    line: "Selected for Galway, printed as P.J. Lally.",
  },
  {
    name: "Frank Glynn",
    href: "/player/frank-glynn-fohenagh",
    line: "Selected for Galway, printed as F. Glynn.",
  },
  {
    name: "Jimmy Moclair",
    href: "/player/jim-moclair-fohenagh",
    line: "Selected for Galway, printed as J. Moclair. On the 1959 replay team.",
  },
  {
    name: "Maureen Madden",
    href: "/player/maureen-madden-fohenagh-camogie",
    line: "Camogie. Named with the 1947 county final team.",
  },
  {
    name: "J. Glynn",
    href: "/player/j-glynn-fohenagh-camogie",
    line: "Named as J. Glynn for Fohenagh camogie in 1947.",
  },
] as const;

export function FohenaghKeyPlayers() {
  const [index, setIndex] = useState(0);
  const player = KEY_PLAYERS[index];

  return (
    <div className="max-w-xl space-y-3 rounded-2xl border border-[var(--fohenagh-blue)]/20 bg-white/80 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-galway-ink/50">
        {index + 1} of {KEY_PLAYERS.length}
      </p>
      <h3 className="text-2xl font-black text-galway-ink">
        <Link href={player.href} className="underline decoration-galway-maroon/30 underline-offset-4">
          {player.name}
        </Link>
      </h3>
      <p className="text-base leading-relaxed text-galway-ink/80">{player.line}</p>
      <div className="flex gap-3 text-sm font-semibold">
        <button
          type="button"
          className="underline decoration-galway-ink/30 underline-offset-4"
          onClick={() => setIndex((index + KEY_PLAYERS.length - 1) % KEY_PLAYERS.length)}
        >
          Previous
        </button>
        <button
          type="button"
          className="underline decoration-galway-ink/30 underline-offset-4"
          onClick={() => setIndex((index + 1) % KEY_PLAYERS.length)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
