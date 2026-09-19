import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { EntityCard } from "@/components/EntityCard";
import { demoStats, getEntity, listAllIrelandWins } from "@/lib/data";

const GOLDEN_YEARS = [
  { label: "Fohenagh", href: "/search?q=Fohenagh", blurb: "Parish club · golden years + amalgam", kind: "Club" },
  { label: "1959 county final", href: "/search?q=1959", blurb: "Draw + replay vs Castlegar", kind: "Year" },
  { label: "1958 runners-up", href: "/search?q=1958", blurb: "First SHC final appearance", kind: "Year" },
  { label: "1960 champions", href: "/search?q=1960", blurb: "Back-to-back Galway SHC", kind: "Year" },
  { label: "Tim Sweeney", href: "/player/tim-sweeney-fohenagh", blurb: "Fohenagh · Galway senior", kind: "Player" },
  { label: "Martin Glynn", href: "/player/martin-glynn-fohenagh", blurb: "1952 Intermediate final free", kind: "Player" },
];

export default async function HomePage() {
  const stats = await demoStats();
  const wins = await listAllIrelandWins();
  const fohenaghHistoric = await getEntity("club:fohenagh-historic");
  const fohenagh = await getEntity("club:ahascragh-fohenagh");
  const tim = await getEntity("player:tim-sweeney-fohenagh");
  const martin = await getEntity("player:martin-glynn-fohenagh");
  const joe = await getEntity("player:joe-rushe-fohenagh");
  const niall = await getEntity("player:niall-leonard");

  const samplePlayers = [tim, martin, joe, niall].filter(Boolean).map((e) => e!.summary);

  return (
    <div className="space-y-12">
      <section className="space-y-6 text-center sm:text-left">
        <h1 className="text-4xl font-black leading-tight text-galway-ink sm:text-6xl">
          Look up Fohenagh &amp; Galway Hurling
        </h1>
        <p className="max-w-2xl text-xl text-galway-ink/80">
          Search Fohenagh&apos;s golden years — 1958–1963 county finals,
          Tim Sweeney, and cuttings from the Tuam Herald. Facts live as D4M-style{" "}
          <strong>row / col / val</strong> triples.
        </p>
        <SearchBox large />
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl font-bold text-galway-maroon">Explore · Fohenagh golden years</h2>
        <p className="text-lg text-galway-ink/75">
          Parish finals and players from the golden years.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GOLDEN_YEARS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="rounded-2xl border-2 border-galway-maroon/20 bg-white p-5 hover:border-galway-maroon"
            >
              <p className="text-sm font-bold uppercase tracking-wide text-galway-maroon">{t.kind}</p>
              <p className="mt-1 text-xl font-bold text-galway-ink">{t.label}</p>
              <p className="mt-1 text-base text-galway-ink/70">{t.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Stored triples" value={String(stats.nnz)} />
        <Stat label="Players in seed" value={String(stats.players)} />
        <Stat label="All-Ireland wins" value={String(stats.wins)} />
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-3xl font-bold text-galway-maroon">Featured · Fohenagh historic</h2>
          <Link href="/club/fohenagh-historic" className="font-semibold text-galway-maroon underline">
            Open club
          </Link>
        </div>
        <p className="text-lg text-galway-ink/75">
          Six Galway SHC finals 1958–1963 — county champions 1959 (replay) and 1960.
          Predecessor of today&apos;s Ahascragh-Fohenagh.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {fohenaghHistoric && <EntityCard entity={fohenaghHistoric.summary} />}
          {fohenagh && <EntityCard entity={fohenagh.summary} />}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl font-bold text-galway-maroon">Fohenagh players</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {samplePlayers.map((p) => (
            <EntityCard key={p.id} entity={p} />
          ))}
        </div>
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
