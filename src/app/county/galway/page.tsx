import Link from "next/link";
import { EntityCard } from "@/components/EntityCard";
import { listAllIrelandWins, listEntitiesByType, searchEntities } from "@/lib/data";

export const metadata = { title: "Galway" };

export default async function GalwayCountyPage() {
  const [wins, clubs, countySearch] = await Promise.all([
    listAllIrelandWins(),
    listEntitiesByType("club"),
    searchEntities("Galway"),
  ]);
  const players = countySearch.filter((item) => item.kind === "player").slice(0, 6);
  const featuredClubs = clubs.filter((club) =>
    ["club:ahascragh-fohenagh", "club:portumna", "club:loughrea", "club:st-thomas"].includes(club.id),
  );

  return (
    <div className="space-y-12">
      <header className="rounded-3xl bg-galway-maroon px-6 py-10 text-white sm:px-10">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-galway-gold">County</p>
        <h1 className="mt-3 text-5xl font-black tracking-[-0.05em] sm:text-6xl">Galway</h1>
        <p className="mt-4 max-w-2xl text-xl leading-relaxed text-white/75">Explore the county through its players, clubs, matches and honours. Follow any connection in either direction.</p>
      </header>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4"><div><p className="section-kicker">Clubs</p><h2 className="section-title">Start with a club</h2></div><Link href="/search?q=Galway+club" className="font-black text-galway-maroon underline">Browse all</Link></div>
        <div className="grid gap-4 sm:grid-cols-2">{featuredClubs.map((club) => <EntityCard key={club.id} entity={club} />)}</div>
      </section>

      <section className="space-y-4">
        <div><p className="section-kicker">County players</p><h2 className="section-title">People in the story</h2></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{players.map((player) => <EntityCard key={player.id} entity={player} />)}</div>
      </section>

      <section className="space-y-4">
        <div><p className="section-kicker">Honours</p><h2 className="section-title">All-Ireland wins</h2></div>
        <div className="grid gap-4 sm:grid-cols-2">{wins.map((win) => <EntityCard key={win.id} entity={win} />)}</div>
      </section>
    </div>
  );
}
