"use client";

import { useMemo, useState } from "react";
import seed from "../../../data/marine/marine-seed.json";
import { AssocMarine, type Triple } from "@/lib/marine/AssocMarine";

const EXAMPLES = [
  { label: "getrow station:gubbaros", mode: "row" as const, q: "station:gubbaros" },
  { label: "getrow 2018-W25@gubbaros", mode: "row" as const, q: "2018-W25@gubbaros" },
  { label: "getcol hab_cells", mode: "col" as const, q: "hab_cells" },
  { label: "search mace-head", mode: "search" as const, q: "mace-head" },
  { label: "search 2023-W25", mode: "search" as const, q: "2023-W25" },
];

export function MarineQueryPlayground() {
  const A = useMemo(() => new AssocMarine(seed as Triple[]), []);
  const [mode, setMode] = useState<(typeof EXAMPLES)[number]["mode"]>("row");
  const [q, setQ] = useState(EXAMPLES[0].q);

  const triples = useMemo(() => {
    if (mode === "row") return A.getrow(q);
    if (mode === "col") return A.getcol(q).slice(0, 12);
    return A.search(q).triples.slice(0, 12);
  }, [A, mode, q]);

  return (
    <section className="space-y-3 rounded-2xl border-2 border-marine-deep/15 bg-white p-5">
      <h2 className="text-xl font-bold text-marine-deep">D4M playground</h2>
      <p className="text-sm text-marine-deep/80">
        Same <code className="rounded bg-marine-foam px-1">AssocArray</code> as
        hurling: <code className="rounded bg-marine-foam px-1">getrow</code>,{" "}
        <code className="rounded bg-marine-foam px-1">getcol</code>,{" "}
        <code className="rounded bg-marine-foam px-1">search</code>. Rows look
        like <code className="rounded bg-marine-foam px-1">station:gubbaros</code>{" "}
        or <code className="rounded bg-marine-foam px-1">2018-W25@gubbaros</code>
        {" "}(pattern{" "}
        <code className="rounded bg-marine-foam px-1">
          station:{"{id}"} / {"{year}"}-W{"{week}"}@{"{location}"}
        </code>
        ). This board holds <strong>{A.nnz()}</strong> marine triples.
      </p>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => {
              setMode(ex.mode);
              setQ(ex.q);
            }}
            className="rounded-full bg-marine-foam px-3 py-1 text-sm font-semibold text-marine-deep hover:bg-marine-teal hover:text-white"
          >
            {ex.label}
          </button>
        ))}
      </div>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="sr-only" htmlFor="marine-query">
          Query
        </label>
        <select
          value={mode}
          onChange={(e) =>
            setMode(e.target.value as (typeof EXAMPLES)[number]["mode"])
          }
          className="rounded-lg border border-marine-deep/20 bg-white px-2 py-2 text-sm"
        >
          <option value="row">getrow</option>
          <option value="col">getcol</option>
          <option value="search">search</option>
        </select>
        <input
          id="marine-query"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-[12rem] flex-1 rounded-lg border border-marine-deep/20 px-3 py-2 font-mono text-sm"
        />
      </form>
      <div className="max-h-64 overflow-auto rounded-lg bg-marine-foam/60 p-3 font-mono text-xs">
        {triples.length === 0 ? (
          <p>No hits.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="pr-3">row</th>
                <th className="pr-3">col</th>
                <th>val</th>
              </tr>
            </thead>
            <tbody>
              {triples.map((t, i) => (
                <tr key={`${t.row}-${t.col}-${i}`}>
                  <td className="pr-3">{t.row}</td>
                  <td className="pr-3">{t.col}</td>
                  <td>{String(t.val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
