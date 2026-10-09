import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { EntityCard } from "@/components/EntityCard";
import {
  FohenaghGreats,
  Team1959,
} from "@/components/fohenagh/FohenaghBlocks";
import { getEntity } from "@/lib/data";
import { readArticleUploads, articleToSummary } from "@/lib/articles";
import {
  FOHENAGH_GREATS,
  HERO_CUTTING_ID,
  TEAM_1959,
  TITLE_PANEL_ID,
  citedCardLine,
  paperHeadline,
  team1959Hint,
} from "@/lib/fohenaghShowcase";
import { playerNotableText } from "@/lib/entityDisplay";

const CLUBS = [
  "club:fohenagh-historic",
  "club:ahascragh-historic",
  "club:ahascragh-fohenagh",
] as const;

const GAMES = [
  {
    href: "/match/fohenagh-historic-1959-galway-shc-final-replay",
    year: "1959",
    title: "First senior title",
    line: "Replay at Kenny Park. Fohenagh 3-9, Castlegar 4-5.",
    cite: "Connacht Tribune · 19 Sep 1959",
  },
  {
    href: "/match/fohenagh-historic-1960-galway-shc-final",
    year: "1960",
    title: "Back-to-back cup",
    line: "Fohenagh 4-9, Castlegar 2-7 · Pearse Stadium.",
    cite: "Connacht Tribune · 3 Sep 1960",
  },
  {
    href: "/match/fohenagh-historic-1958-galway-shc-final",
    year: "1958",
    title: "First county final",
    line: "Castlegar 5-9, Fohenagh 2-4 · Duggan Park.",
    cite: "Galway GAA finals table",
  },
] as const;

const JUVENILE = /minor|under-?\s*1[246]|u-?\s*1[246]|juvenile|u12|u14|u16|schools|colleges/i;

export default async function HomePage() {
  const [heroClub, clubs, greatEntities, teamEntities, uploads] = await Promise.all([
    getEntity("club:fohenagh-historic"),
    Promise.all(CLUBS.map((id) => getEntity(id))),
    Promise.all(FOHENAGH_GREATS.map((id) => getEntity(id))),
    Promise.all(TEAM_1959.map((id) => getEntity(id))),
    readArticleUploads(),
  ]);

  const heroUpload = uploads.find((upload) => upload.id === HERO_CUTTING_ID);
  const hero = heroUpload ? articleToSummary(heroUpload) : undefined;
  const headline = paperHeadline(heroUpload?.excerpt);
  const titlePanel = uploads.find((upload) => upload.id === TITLE_PANEL_ID);

  const greats = greatEntities.flatMap((player) => {
    if (!player) return [];
    const line = citedCardLine(
      playerNotableText(player.attrs),
      typeof player.attrs.note === "string" ? player.attrs.note : null
    );
    return [{ id: player.id, summary: player.summary, line }];
  });

  const team = teamEntities.flatMap((player) => {
    if (!player) return [];
    const hint = team1959Hint(player.id);
    return [{ id: player.id, name: player.summary.title, href: player.summary.href, line: hint }];
  });

  const cuttings = uploads
    .filter((upload) => (upload.clubTags ?? []).includes("club:fohenagh-historic"))
    .filter((upload) => !JUVENILE.test(`${upload.caption ?? ""} ${upload.excerpt ?? ""} ${upload.id}`))
    .slice()
    .sort((a, b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt)))
    .slice(0, 4)
    .map(articleToSummary);

  const [fohenagh, ...otherClubs] = clubs;

  return (
    <div className="space-y-14 sm:space-y-16">
      <section className="hw-hero">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d9c79a]">
          Fohenagh · 1959
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl sm:text-6xl">{headline.title}</h1>
        {headline.dek ? (
          <p className="hw-serif mt-3 max-w-2xl text-xl text-[#f7f3ea]/85 sm:text-2xl">
            {headline.dek}
          </p>
        ) : null}
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#f7f3ea]/75">
          This demo is Fohenagh up to 2002, the blue jersey. A fortnight after
          this draw, the same parish side were county senior champions for the
          first time.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {hero?.citeChip ? (
            <span className="rounded-full border border-white/30 px-3 py-1 text-sm font-semibold">
              {hero.citeChip}
            </span>
          ) : null}
          {hero ? (
            <Link href={hero.href} className="text-sm font-bold text-[#f7f3ea] underline">
              Open the cutting
            </Link>
          ) : null}
          {titlePanel ? (
            <Link
              href={`/article/${TITLE_PANEL_ID}`}
              className="text-sm font-semibold text-[#f7f3ea]/80 underline"
            >
              Title panel, 19 Sep 1959
            </Link>
          ) : null}
        </div>
        {hero?.imagePath ? (
          <Link href={hero.href} className="mt-6 block overflow-hidden rounded-2xl border border-white/20 bg-[#f7f1e8]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero.imagePath}
              alt={hero.title}
              className="max-h-80 w-full object-contain"
            />
          </Link>
        ) : null}
      </section>

      <Team1959 players={team} />
      <FohenaghGreats players={greats} />

      <section className="space-y-4" aria-labelledby="clubs-heading">
        <div>
          <p className="hw-kicker">Clubs</p>
          <h2 id="clubs-heading" className="mt-1 text-3xl text-galway-ink">
            Start with Fohenagh
          </h2>
        </div>
        {fohenagh ? <EntityCard entity={fohenagh.summary} /> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {otherClubs.map((club) =>
            club ? <EntityCard key={club.id} entity={club.summary} /> : null
          )}
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="games-heading">
        <div>
          <p className="hw-kicker">Key games</p>
          <h2 id="games-heading" className="mt-1 text-3xl text-galway-ink">
            County final days
          </h2>
        </div>
        <ul className="grid gap-3 sm:grid-cols-3">
          {GAMES.map((game) => (
            <li key={game.href}>
              <Link href={game.href} className="hw-card block h-full p-4 transition hover:-translate-y-0.5">
                <p className="text-sm font-bold text-galway-maroon">{game.year}</p>
                <h3 className="hw-serif mt-1 text-xl text-galway-ink">{game.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-galway-ink/75">{game.line}</p>
                <p className="mt-3 text-xs font-semibold text-galway-maroon">{game.cite}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {cuttings.length > 0 ? (
        <section className="space-y-4" aria-labelledby="cuttings-heading">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="hw-kicker">Archive</p>
              <h2 id="cuttings-heading" className="mt-1 text-3xl text-galway-ink">
                Latest cuttings
              </h2>
            </div>
            <Link href="/stories" className="text-sm font-bold text-galway-maroon underline">
              Stories
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {cuttings.map((cutting) => (
              <EntityCard key={cutting.id} entity={cutting} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3 border-t border-[var(--hw-line)] pt-8" aria-labelledby="search-heading">
        <h2 id="search-heading" className="text-3xl text-galway-ink">
          Search
        </h2>
        <p className="text-base text-galway-ink/70">
          Players, clubs and cuttings.
          {heroClub ? " Fohenagh is the place to begin." : null}
        </p>
        <SearchBox />
      </section>
    </div>
  );
}
