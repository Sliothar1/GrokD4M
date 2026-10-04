import { SearchBox } from "@/components/SearchBox";
import { EntityCard } from "@/components/EntityCard";
import { getEntity } from "@/lib/data";

/** Four player spotlights across the eras: 1950s golden years to today's Ahascragh-Fohenagh. */
const SPOTLIGHT_PLAYER_IDS = [
  "player:tim-sweeney-fohenagh",
  "player:jim-moclair-fohenagh",
  "player:padraic-leonard",
  "player:alan-moclair-ahascragh-fohenagh",
] as const;

export default async function HomePage() {
  const [featuredClub, ...spotlights] = await Promise.all([
    getEntity("club:fohenagh-historic"),
    ...SPOTLIGHT_PLAYER_IDS.map((id) => getEntity(id)),
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
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-galway-maroon">
          Player spotlights
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {spotlights.map((player) =>
            player ? (
              <EntityCard key={player.summary.id} entity={player.summary} />
            ) : null
          )}
        </div>
      </section>
    </div>
  );
}
