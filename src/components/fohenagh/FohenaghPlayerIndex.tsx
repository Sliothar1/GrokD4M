"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type IndexRow = {
  id: string;
  name: string;
  href: string;
  years: number[];
  also: string;
};

function letterOf(name: string): string {
  const base = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const ch = base.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : "#";
}

function decadeOf(year: number): string {
  return `${Math.floor(year / 10) * 10}s`;
}

export function FohenaghPlayerIndex({ rows }: { rows: IndexRow[] }) {
  const router = useRouter();
  const [decade, setDecade] = useState("all");
  const sorted = useMemo(
    () => [...rows].sort((a, b) => a.name.localeCompare(b.name, "en")),
    [rows]
  );
  const decades = useMemo(() => {
    const set = new Set<string>();
    for (const row of sorted) for (const year of row.years) set.add(decadeOf(year));
    return [...set].sort();
  }, [sorted]);
  const filtered = sorted.filter((row) =>
    decade === "all" ? true : row.years.some((year) => decadeOf(year) === decade)
  );
  const letters = [...new Set(filtered.map((row) => letterOf(row.name)))];

  return (
    <section className="space-y-6" aria-labelledby="fohenagh-players">
      <div className="max-w-2xl space-y-3">
        <p className="fohenagh-kicker">Who wore it</p>
        <h2 id="fohenagh-players" className="text-3xl font-black tracking-tight text-galway-ink">
          The players
        </h2>
        <p className="text-lg leading-relaxed text-galway-ink/80">
          Players who wore the jersey.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block min-w-0 flex-1 text-sm font-semibold text-galway-ink/70">
          Find a player
          <select
            className="mt-1 w-full rounded-xl border border-[var(--fohenagh-blue)]/30 bg-white px-3 py-2 text-base font-semibold text-galway-ink"
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) router.push(event.target.value);
            }}
          >
            <option value="">Choose a name</option>
            {sorted.map((row) => (
              <option key={row.id} value={row.href}>
                {row.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-galway-ink/70">
          Decade
          <select
            className="mt-1 w-full rounded-xl border border-[var(--fohenagh-blue)]/30 bg-white px-3 py-2 text-base font-semibold text-galway-ink sm:w-40"
            value={decade}
            onChange={(event) => setDecade(event.target.value)}
          >
            <option value="all">All years</option>
            {decades.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <nav className="flex flex-wrap gap-1" aria-label="Jump to a letter">
        {letters.map((letter) => (
          <a
            key={letter}
            href={`#roster-${letter}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-[var(--fohenagh-blue)] hover:bg-white"
          >
            {letter}
          </a>
        ))}
      </nav>

      <div className="space-y-8">
        {letters.map((letter) => (
          <div key={letter} id={`roster-${letter}`}>
            <h3 className="fohenagh-kicker mb-2">{letter}</h3>
            <ul className="fohenagh-names">
              {filtered
                .filter((row) => letterOf(row.name) === letter)
                .map((row) => (
                  <li key={row.id}>
                    <Link href={row.href}>
                      {row.name}
                      {row.also ? (
                        <span className="fohenagh-also"> Also played with {row.also}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="text-sm text-galway-ink/55">
        {filtered.length} {filtered.length === 1 ? "player" : "players"} linked. Every name opens a profile.
      </p>
    </section>
  );
}
