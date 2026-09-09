"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const CHIPS = ["Cathal Mannion", "Pádraic Mannion", "Ahascragh-Fohenagh", "Fohenagh 1960"];

export function SearchBox({
  large = false,
  initialQuery = "",
}: {
  large?: boolean;
  initialQuery?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  function go(query: string) {
    const trimmed = query.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    go(q);
  }

  return (
    <div className="w-full">
      <form onSubmit={onSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="hurling-search">
          Search Galway hurling
        </label>
        <input
          id="hurling-search"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a player, club, match or year"
          className={`w-full rounded-xl border-2 border-galway-maroon/30 bg-white px-5 text-galway-ink shadow-[0_12px_30px_rgba(67,8,30,0.10)] placeholder:text-galway-ink/40 focus:outline-none focus-visible:border-galway-maroon focus-visible:ring-4 focus-visible:ring-galway-gold/40 ${
            large ? "py-5 text-xl sm:text-2xl" : "py-3 text-lg"
          }`}
        />
        <button
          type="submit"
          className={`rounded-xl bg-galway-gold px-7 font-black text-galway-ink hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-gold ${
            large ? "py-5 text-xl" : "py-3 text-lg"
          }`}
        >
          Search
        </button>
      </form>
      {large && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="self-center text-sm font-semibold text-galway-ink/70">
            Try:
          </span>
          {CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setQ(chip);
                go(chip);
              }}
              className="rounded-full border-2 border-galway-maroon/30 bg-white px-3 py-1.5 text-sm font-semibold text-galway-maroon hover:border-galway-maroon hover:bg-galway-cream"
            >
              {chip}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
