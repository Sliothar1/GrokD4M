import { SearchBox } from "@/components/SearchBox";
import { EntityCard } from "@/components/EntityCard";
import { getEntity } from "@/lib/data";

export default async function HomePage() {
  const [featuredClub, featuredPlayer] = await Promise.all([
    getEntity("club:fohenagh-historic"),
    getEntity("player:jason-lohan"),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="sr-only">HurlingWiki</h1>
        <SearchBox large />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-galway-maroon">Featured</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {featuredClub && <EntityCard entity={featuredClub.summary} />}
          {featuredPlayer && <EntityCard entity={featuredPlayer.summary} />}
        </div>
      </section>
    </div>
  );
}
