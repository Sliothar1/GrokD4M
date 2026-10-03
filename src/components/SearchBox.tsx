"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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
          Search Galway Wiki
        </label>
        <input
          id="hurling-search"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Galway Wiki"
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
    </div>
  );
}
