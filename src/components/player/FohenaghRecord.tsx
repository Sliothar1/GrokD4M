import Link from "next/link";
import type { FohenaghGameLink, FohenaghTeammate } from "@/lib/fohenaghRecord";

/** One summary, one original link per game, minor lines kept quiet. */
export function FohenaghRecordView({
  about,
  games,
  teammates,
}: {
  about: string | null;
  games: FohenaghGameLink[];
  teammates: FohenaghTeammate[];
}) {
  const featured = games.filter((game) => game.group === "featured");
  const other = games.filter((game) => game.group === "other");

  return (
    <div className="max-w-3xl space-y-8">
      {about ? (
        <p className="text-lg leading-relaxed text-galway-ink">{about}</p>
      ) : null}
      {featured.length > 0 ? <GameList heading="Games" games={featured} /> : null}
      {other.length > 0 ? <GameList heading="Other games" games={other} quiet /> : null}
      {teammates.length > 0 ? (
        <section className="space-y-2" aria-labelledby="played-alongside">
          <h2
            id="played-alongside"
            className="text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon"
          >
            Played alongside
          </h2>
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {teammates.map((teammate) => (
              <li key={teammate.id}>
                <Link
                  href={teammate.href}
                  className="text-sm font-semibold text-galway-maroon underline underline-offset-2"
                >
                  {teammate.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function GameList({
  heading,
  games,
  quiet = false,
}: {
  heading: string;
  games: FohenaghGameLink[];
  quiet?: boolean;
}) {
  return (
    <section className="space-y-2" aria-labelledby={heading.replace(/\s+/g, "-").toLowerCase()}>
      <h2
        id={heading.replace(/\s+/g, "-").toLowerCase()}
        className="text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon"
      >
        {heading}
      </h2>
      <ul className={quiet ? "space-y-1.5" : "space-y-2"}>
        {games.map((game) => (
          <li key={game.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className={quiet ? "text-sm text-galway-ink/80" : "text-base text-galway-ink"}>
              {game.label}
            </span>
            <Link
              href={game.href}
              className="text-sm font-semibold text-galway-maroon underline underline-offset-2"
            >
              Read the original
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
