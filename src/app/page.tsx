import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { PaFamilyNav } from "@/components/PaFamilyNav";
import { EntityCard } from "@/components/EntityCard";
import { siteCredit } from "@/config/siteCredit";
import { getEntity } from "@/lib/data";
import { playerNotableText } from "@/lib/entityDisplay";
import { sanitizePublicText } from "@/lib/publicText";

/** Player spotlights: Tim Sweeney and Jimmy Moclair only (Garry ask, 4 Oct 10:37). */
const SPOTLIGHT_PLAYER_IDS = [
  "player:tim-sweeney-fohenagh",
  "player:jim-moclair-fohenagh",
] as const;

type EntityPayload = NonNullable<Awaited<ReturnType<typeof getEntity>>>;

/** Compact spotlight card: name, club line, and the player's notable text when present. */
function SpotlightCard({ player }: { player: EntityPayload }) {
  const { summary, attrs } = player;
  const notable = sanitizePublicText(playerNotableText(attrs) ?? "");
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
      <section className="space-y-4">
        <h1 className="sr-only">HurlingWiki</h1>
        <div className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-galway-maroon">
            What you can do here
          </p>
          <ul className="grid gap-2 sm:grid-cols-3">
            <li>
              <Link href="/search" className="block rounded-2xl border border-galway-maroon/15 bg-white px-4 py-3 font-semibold text-galway-ink hover:border-galway-maroon">
                Find a player, a game, or a clipping
              </Link>
            </li>
            <li>
              <Link href="/clubs" className="block rounded-2xl border border-galway-maroon/15 bg-white px-4 py-3 font-semibold text-galway-ink hover:border-galway-maroon">
                Find a club
              </Link>
            </li>
            <li>
              <Link href="/about" className="block rounded-2xl border border-galway-maroon/15 bg-white px-4 py-3 font-semibold text-galway-ink hover:border-galway-maroon">
                Read how the site is built
              </Link>
            </li>
            <li>
              <Link href="/ask" className="block rounded-2xl border border-galway-maroon/15 bg-white px-4 py-3 font-semibold text-galway-ink hover:border-galway-maroon">
                Ask a question
              </Link>
            </li>
            <li>
              <Link href="/stories#record" className="block rounded-2xl border border-galway-maroon/15 bg-white px-4 py-3 font-semibold text-galway-ink hover:border-galway-maroon">
                Read a story
              </Link>
            </li>
          </ul>
          <PaFamilyNav />
        </div>
        <SearchBox large />
        <p className="text-sm text-[color:var(--text-muted)]">
          {siteCredit.builtBy}
          {" · "}
          <a className="underline underline-offset-2" href={siteCredit.scholar.href}>
            {siteCredit.scholar.label}
          </a>
          {" · "}
          <a className="underline underline-offset-2" href={siteCredit.linkedin.href}>
            {siteCredit.linkedin.label}
          </a>
        </p>
      </section>

      <section className="space-y-4">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-galway-maroon">
          Featured club
        </p>
        <h2 className="text-2xl font-bold text-galway-maroon">Fohenagh</h2>
        <p className="max-w-2xl text-base leading-relaxed text-galway-ink/80">
          HurlingWiki is built for many clubs. The club page is the same for each one.
          Fohenagh is the club on the site today, with a few of its players underneath.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {featuredClub && <EntityCard entity={featuredClub.summary} />}
        </div>
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
