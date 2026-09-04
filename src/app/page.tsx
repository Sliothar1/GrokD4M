import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { EntityCard } from "@/components/EntityCard";
import { demoStats, getEntity, listEntitiesByType } from "@/lib/data";

export default function HomePage() {
  const stats = demoStats();
  const wins = listEntitiesByType("win");
  const players = listEntitiesByType("player").slice(0, 4);
  const fohenagh = getEntity("club:ahascragh-fohenagh");

  return (
    <div className="space-y-12">
      <section className="space-y-6 text-center sm:text-left">
        <p className="inline-block rounded-full bg-galway-maroon px-3 py-1 text-sm font-bold uppercase tracking-wide text-white">
          Phase 1 · Galway senior hurling
        </p>
        <h1 className="text-4xl font-black leading-tight text-galway-ink sm:text-6xl">
          Look up Galway hurling like a giant sticky-note board
        </h1>
        <p className="max-w-2xl text-xl text-galway-ink/80">
          HurlingWiki stores facts as D4M-style associative arrays — sparse{" "}
          <strong>row / col / val</strong> triples. Search a player, a year, or an
          All-Ireland. Plain English (en-IE). Built for curious kids and GAA fans.
        </p>
        <SearchBox large />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Stored triples" value={String(stats.nnz)} />
        <Stat label="Players in seed" value={String(stats.players)} />
        <Stat label="All-Ireland wins" value={String(stats.wins)} />
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-3xl font-bold text-galway-maroon">All-Ireland wins</h2>
          <Link href="/search?q=All-Ireland" className="font-semibold text-galway-maroon underline">
            See all
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {wins.map((w) => (
            <EntityCard key={w.id} entity={w} />
          ))}
        </div>
      </section>


      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-3xl font-bold text-galway-maroon">Featured club · Fohenagh</h2>
          <Link href="/club/ahascragh-fohenagh" className="font-semibold text-galway-maroon underline">
            Open club
          </Link>
        </div>
        <p className="text-lg text-galway-ink/75">
          Ahascragh-Fohenagh (also Fohenagh / Ahascragh) — Mannion brothers&apos; club, 2016 Intermediate champions,
          All-Ireland Intermediate Club runners-up 2016-17.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {fohenagh && <EntityCard entity={fohenagh.summary} />}
          <Link
            href="/search?q=Fohenagh"
            className="rounded-2xl border-2 border-galway-maroon/20 bg-white p-5 hover:border-galway-maroon"
          >
            <p className="text-sm font-bold uppercase tracking-wide text-galway-maroon">Explore</p>
            <p className="mt-1 text-xl font-bold text-galway-ink">Search Fohenagh matches &amp; titles</p>
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl font-bold text-galway-maroon">Sample players</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {players.map((p) => (
            <EntityCard key={p.id} entity={p} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-galway-maroon p-6 text-white sm:p-8">
        <h2 className="text-2xl font-bold">Why D4M?</h2>
        <p className="mt-2 text-lg text-galway-cream/95">
          MIT Lincoln Lab&apos;s D4M (Dynamic Distributed Dimensional Data Model) makes
          sparse multi-dimensional data easy to query. We borrowed the associative-array
          idea so Galway facts stay linked and searchable.
        </p>
        <Link
          href="/about"
          className="mt-4 inline-block rounded-full bg-galway-gold px-4 py-2 font-bold text-galway-ink"
        >
          Read the about page
        </Link>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-galway-maroon/15 bg-white p-5 text-center">
      <p className="text-4xl font-black text-galway-maroon">{value}</p>
      <p className="mt-1 text-base font-semibold text-galway-ink/70">{label}</p>
    </div>
  );
}
