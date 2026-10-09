import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { EntityCard } from "@/components/EntityCard";
import { PhotoComingSoon } from "@/components/fohenagh/FohenaghBlocks";
import { getEntity } from "@/lib/data";
import { playerNotableText } from "@/lib/entityDisplay";

/** Two sample players, the same pair the live homepage used. */
const SPOTLIGHT_PLAYER_IDS = [
  "player:tim-sweeney-fohenagh",
  "player:jim-moclair-fohenagh",
] as const;

type EntityPayload = NonNullable<Awaited<ReturnType<typeof getEntity>>>;

function SpotlightCard({ player }: { player: EntityPayload }) {
  const { summary, attrs } = player;
  const notable = playerNotableText(attrs);
  return (
    <Link
      href={summary.href}
      className="hw-card flex h-full flex-col p-4 transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-gold"
    >
      <span className="mb-1 w-fit rounded-full bg-galway-maroon/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-galway-maroon">
        Player
      </span>
      <h3 className="text-xl font-bold text-galway-ink">{summary.title}</h3>
      {summary.subtitle ? (
        <p className="text-sm font-semibold text-galway-ink/60">{summary.subtitle}</p>
      ) : null}
      {notable ? (
        <p className="mt-2 line-clamp-4 text-base text-galway-ink/75">{notable}</p>
      ) : null}
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
      <section className="space-y-3">
        <p className="hw-kicker">HurlingWiki</p>
        <h1 className="text-4xl text-galway-ink sm:text-5xl">Find your club</h1>
        <p className="max-w-2xl text-lg text-galway-ink/75">
          A wiki for every hurling club. Start with a parish name.
        </p>
        <SearchBox large placeholder="Search a club or player — try Fohenagh" />
        <p className="max-w-2xl text-base leading-relaxed text-galway-ink/70">
          For example, type a player&apos;s name, a club, or a word like captain.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl text-galway-maroon">Try a sample club</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {featuredClub ? (
            <EntityCard entity={featuredClub.summary} crestLabel="Club crest coming soon" />
          ) : null}
          <PhotoComingSoon note="Championship team photo" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl leading-snug text-galway-maroon">
          Or start with a player, for example Tim Sweeney or Jimmy Moclair.
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {spotlights.map((player) =>
            player ? <SpotlightCard key={player.id} player={player} /> : null
          )}
        </div>
      </section>

      <p className="max-w-2xl text-base leading-relaxed text-galway-ink/75">
        Clubs and families can send a cutting or a short memory. An editor
        reads it before it is published. A newspaper line stays cited. A club
        memory is labelled Remembered, and it is not mixed into the papers.{" "}
        <Link href="/stories#upload" className="font-semibold text-galway-maroon underline">
          Add a cutting
        </Link>
        .
      </p>
    </div>
  );
}
