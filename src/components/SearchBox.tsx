"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const CHIPS = ["Joe Canning", "Fohenagh", "Cathal Mannion", "2017", "Portumna", "David Burke"];

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
          placeholder="Try Joe Canning, 2017, Portumna…"
          className={`w-full rounded-2xl border-4 border-galway-maroon bg-white px-4 text-galway-ink shadow-sm placeholder:text-galway-ink/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-gold ${
            large ? "py-5 text-xl sm:text-2xl" : "py-3 text-lg"
          }`}
        />
        <button
          type="submit"
          className={`rounded-2xl bg-galway-maroon px-6 font-bold text-white hover:bg-galway-maroon-dark focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-gold ${
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
