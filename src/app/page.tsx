import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { EntityCard } from "@/components/EntityCard";
import { getEntity } from "@/lib/data";
import { playerNotableText } from "@/lib/entityDisplay";

/** Player spotlights: Tim Sweeney and Jimmy Moclair only (Garry ask, 4 Oct 10:37). */
const SPOTLIGHT_PLAYER_IDS = [
  "player:tim-sweeney-fohenagh",
  "player:jim-moclair-fohenagh",
] as const;

type EntityPayload = NonNullable<Awaited<ReturnType<typeof getEntity>>>;

/** Compact spotlight card: name, club line, and the player's notable text when present. */
function SpotlightCard({ player }: { player: EntityPayload }) {
  const { summary, attrs } = player;
  const notable = playerNotableText(attrs);
  return (
    <Link
      href={summary.href}
      className="flex h-full flex-col rounded-2xl border-2 border-galway-maroon/15 bg-white p-4 shadow-sm transition hover:border-galway-maroon hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-gold"
    >
      <span className="mb-1 w-fit rounded-full bg-galway-maroon/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-galway-maroon">
        Player
      </span>
      <h3 className="text-xl font-bold text-galway-ink">{summary.title}</h3>
      {summary.subtitle && (
        <p className="text-sm font-semibold text-galway-ink/60">
          {summary.subtitle}
        </p>
      )}
      {notable && (
        <p className="mt-2 line-clamp-4 text-base text-galway-ink/75">
          {notable}
        </p>
      )}
    </Link>
  );
}

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
              <SpotlightCard key={player.summary.id} player={player} />
            ) : null
          )}
        </div>
      </section>
    </div>
  );
}
