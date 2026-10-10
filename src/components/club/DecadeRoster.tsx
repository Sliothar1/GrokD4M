"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ClubRosterRow } from "@/lib/playerClubs";

const DECADES = [1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000] as const;

function letterOf(name: string): string {
  const plain = name
    .trim()
    .charAt(0)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  return /[A-Z]/.test(plain) ? plain : "#";
}

function inDecade(years: number[] | undefined, decade: number): boolean {
  return (years ?? []).some((year) => {
    if (year < 1930 || year > 2002) return false;
    if (decade === 2000) return year >= 2000 && year <= 2002;
    return Math.floor(year / 10) * 10 === decade;
  });
}

/** A–Z roll with a 1930s–2000s filter. The 2000s chip runs through 2002. */
export function DecadeRoster({
  id,
  heading,
  clubName,
  rows,
}: {
  id?: string;
  heading: string;
  clubName: string;
  rows: ClubRosterRow[];
}) {
  const [decade, setDecade] = useState<number | "all">("all");
  const visible = useMemo(
    () =>
      decade === "all" ? rows : rows.filter((row) => inDecade(row.years, decade)),
    [decade, rows]
  );
  const sorted = [...visible].sort((a, b) =>
    a.summary.title.localeCompare(b.summary.title, "en", { sensitivity: "base" })
  );
  const groups = new Map<string, ClubRosterRow[]>();
  for (const row of sorted) {
    const letter = letterOf(row.summary.title);
    const list = groups.get(letter) ?? [];
    list.push(row);
    groups.set(letter, list);
  }
  const label = decade === "all" ? "All" : `${decade}s`;

  return (
    <section id={id} className="scroll-mt-6 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon">
          {heading}
        </h2>
        <p className="text-sm font-semibold text-galway-ink/45">
          {visible.length === 1 ? "1 player" : `${visible.length} players`}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by decade">
        <DecadeChip current={decade} value="all" onSelect={setDecade}>
          All
        </DecadeChip>
        {DECADES.map((value) => (
          <DecadeChip key={value} current={decade} value={value} onSelect={setDecade}>
            {`${value}s`}
          </DecadeChip>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-galway-ink/55">No players are linked to {clubName} yet.</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-galway-ink/55">
          No cited games in the {label === "All" ? "list" : label}.
        </p>
      ) : (
        <div className="space-y-2">
          {[...groups.entries()].map(([letter, group]) => (
            <div key={letter} id={`players-${letter}`} className="flex gap-x-3 scroll-mt-6">
              <span className="w-5 shrink-0 pt-0.5 text-sm font-bold text-galway-maroon">{letter}</span>
              <ul className="flex flex-wrap gap-x-3 gap-y-1">
                {group.map((row) => (
                  <li key={row.summary.id} className="inline-flex items-baseline gap-1 text-sm">
                    <Link
                      href={row.summary.href}
                      className="font-semibold text-galway-ink underline decoration-galway-ink/20 underline-offset-2 hover:text-galway-maroon"
                    >
                      {row.summary.title}
                    </Link>
                    {row.trust === "Verified" ? (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-green-800">
                        Verified
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DecadeChip({
  current,
  value,
  onSelect,
  children,
}: {
  current: number | "all";
  value: number | "all";
  onSelect: (value: number | "all") => void;
  children: string;
}) {
  const selected = current === value;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(value)}
      className={
        selected
          ? "rounded-full bg-galway-maroon px-3 py-1 text-sm font-bold text-white"
          : "rounded-full border border-galway-maroon/25 bg-white px-3 py-1 text-sm font-semibold text-galway-maroon hover:border-galway-maroon"
      }
    >
      {children}
    </button>
  );
}
