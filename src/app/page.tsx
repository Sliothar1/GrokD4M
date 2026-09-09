import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { EntityCard } from "@/components/EntityCard";
import { demoStats, getEntity, searchEntities } from "@/lib/data";

export default async function HomePage() {
  const stats = await demoStats();
  const club = await getEntity("club:ahascragh-fohenagh");
  const discoveries = (await searchEntities("Fohenagh"))
    .filter((item) => item.kind === "article_upload" || item.kind === "match" || item.kind === "player")
    .slice(0, 3);

  return (
    <div className="space-y-12">
      <section className="relative -mx-4 overflow-hidden bg-galway-maroon px-4 py-12 text-white sm:rounded-[2rem] sm:px-10 sm:py-16">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 border-l border-white/10 bg-[linear-gradient(135deg,transparent_20%,rgba(255,255,255,.06)_20%,rgba(255,255,255,.06)_40%,transparent_40%)] sm:block" />
        <div className="relative max-w-3xl space-y-7">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-galway-gold">Galway hurling, connected</p>
          <h1 className="text-4xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl">
            Find the player.<br />Follow the story.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-white/78 sm:text-xl">
            Players, clubs, matches, honours and the records behind them—linked so every fact can lead you back to its source.
          </p>
          <SearchBox large />
        </div>
      </section>

      <section aria-labelledby="start-heading" className="grid gap-4 md:grid-cols-[1.25fr_.75fr]">
        <Link href="/club/ahascragh-fohenagh" className="group rounded-3xl border border-galway-maroon/15 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-gold">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-galway-maroon">Pilot club</p>
          <h2 id="start-heading" className="mt-3 text-3xl font-black tracking-tight text-galway-ink">Ahascragh–Fohenagh</h2>
          <p className="mt-3 max-w-xl text-lg leading-relaxed text-galway-ink/70">
            Meet the players, trace the Ahascragh and Fohenagh predecessor clubs, and explore the 2016–17 intermediate campaign.
          </p>
          <span className="mt-6 inline-flex font-black text-galway-maroon group-hover:underline">Explore the club →</span>
        </Link>
        <Link href="/county/galway" className="rounded-3xl bg-galway-gold p-7 text-galway-ink transition hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-maroon">
          <p className="text-sm font-black uppercase tracking-[0.16em]">Browse</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">Galway</h2>
          <p className="mt-3 text-lg leading-relaxed text-galway-ink/75">Clubs, county players, competitions and All-Ireland honours.</p>
          <span className="mt-6 inline-flex font-black">Open the county →</span>
        </Link>
      </section>

      {club && (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div><p className="section-kicker">Begin here</p><h2 className="section-title">One club, many connections</h2></div>
            <p className="hidden text-sm font-bold text-galway-ink/55 sm:block">Every connection is reversible</p>
          </div>
          <EntityCard entity={club.summary} />
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div><p className="section-kicker">From the archive</p><h2 className="section-title">Fohenagh connections</h2></div>
          <Link href="/search?q=Fohenagh" className="font-black text-galway-maroon underline underline-offset-4">See all</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {discoveries.map((item) => <EntityCard key={item.id} entity={item} />)}
        </div>
      </section>

      <section className="grid gap-6 border-y border-galway-maroon/15 py-8 sm:grid-cols-3">
        <Stat value={stats.players} label="players indexed" />
        <Stat value={stats.nnz} label="linked records" />
        <Stat value={stats.wins} label="honours recorded" />
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-3xl font-black tracking-tight text-galway-maroon">{value.toLocaleString("en-IE")}</p>
      <p className="text-base font-semibold text-galway-ink/60">{label}</p>
    </div>
  );
}
