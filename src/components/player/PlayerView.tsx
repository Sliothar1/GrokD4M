import Link from "next/link";
import { FohenaghPlayerBand } from "@/components/fohenagh/FohenaghArt";
import { TerraceNotes } from "@/components/player/TerraceNotes";
import type { getEntity } from "@/lib/data";
import { getAssoc } from "@/lib/data";
import { playerClubChips } from "@/lib/playerClubs";
import { loadPlayerProfile, type PublicPlayerProfile } from "@/lib/playerProfile";

type EntityPayload = NonNullable<Awaited<ReturnType<typeof getEntity>>>;

const FOHENAGH_HISTORIC = "club:fohenagh-historic";

/**
 * Every player page renders this allowlist. Pipeline notes, lane tags,
 * verification badges, and ids are not passed through.
 * Players who wore historic Fohenagh get the poster skin around the same template.
 */
export async function PlayerView({ data }: { data: EntityPayload }) {
  const profile = await loadPlayerProfile(data.id, data.attrs);
  const A = await getAssoc();
  const woreFohenagh = playerClubChips(data.id, data.attrs, data.related, A).some(
    (club) => club.id === FOHENAGH_HISTORIC
  );
  const sheet = <PlayerProfileView profile={profile} poster={woreFohenagh} />;
  if (!woreFohenagh) return sheet;
  return (
    <div className="fohenagh-poster fohenagh-poster-player">
      <FohenaghPlayerBand />
      {sheet}
    </div>
  );
}

export function PlayerProfileView({
  profile,
  poster = false,
}: {
  profile: PublicPlayerProfile;
  poster?: boolean;
}) {
  return (
    <article className={poster ? "fohenagh-sheet space-y-10" : "space-y-8"}>
      <header className="flex min-w-0 items-start gap-5 sm:gap-6">
        <div className="shrink-0">
          <div
            className={
              poster
                ? "h-28 w-24 overflow-hidden border-[3px] border-[var(--fohenagh-blue)] bg-white shadow-sm sm:h-32 sm:w-28"
                : "h-24 w-24 overflow-hidden rounded-2xl border border-galway-maroon/15 bg-galway-cream shadow-sm sm:h-28 sm:w-28"
            }
          >
            {profile.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photoUrl}
                alt={profile.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="sr-only">No photograph yet</span>
            )}
          </div>
          {profile.photoAddHref ? (
            <p className="mt-1 max-w-28 text-center">
              <Link
                href={profile.photoAddHref}
                className="text-[10px] text-galway-ink/40 underline decoration-galway-ink/15 underline-offset-2"
              >
                {profile.photoAddLabel}
              </Link>
            </p>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-3 pt-0.5">
          {profile.eraLine ? (
            <p className={poster ? "fohenagh-kicker" : "text-sm font-semibold text-stone-700"}>
              {profile.eraLine}
            </p>
          ) : null}
          <h1 className={poster ? "fohenagh-name" : "text-[1.85rem] font-black leading-[1.1] tracking-tight text-galway-ink sm:text-5xl"}>
            {profile.name}
          </h1>
          {profile.headline ? (
            <p
              className={
                poster
                  ? "fohenagh-deck"
                  : "text-lg font-semibold text-galway-maroon sm:text-xl"
              }
            >
              {profile.headline}
            </p>
          ) : null}
          {profile.framing ? (
            <p className="text-sm leading-relaxed text-galway-ink/70">{profile.framing}</p>
          ) : null}
        </div>
      </header>

      {profile.summary ? (
        <p className="max-w-2xl text-[1.05rem] leading-relaxed text-galway-ink">{profile.summary}</p>
      ) : null}

      {profile.schoolsLine ? (
        <p className="max-w-2xl text-base leading-relaxed text-stone-700">{profile.schoolsLine}</p>
      ) : null}

      {profile.games.length > 0 ? (
        <section>
          <h2 className={poster ? "fohenagh-kicker mb-3" : "mb-3 text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon"}>
            {profile.documentsHeading}
          </h2>
          <ul className={poster ? "fohenagh-programme" : "space-y-3"}>
            {profile.games.map((game) => (
              <li
                key={`${game.label}|${game.href ?? ""}`}
                className={
                  poster
                    ? undefined
                    : "rounded-2xl border border-galway-maroon/15 bg-white px-4 py-3"
                }
              >
                <p className="font-semibold text-galway-ink">{game.label}</p>
                {game.href ? (
                  <p className="mt-1">
                    <Link
                      href={game.href}
                      className="font-semibold text-galway-maroon underline decoration-galway-maroon/30 underline-offset-4"
                    >
                      Read the original
                    </Link>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {profile.alsoPlayed.length > 0 ? (
        <p className="text-sm text-galway-ink/55">
          Also played with{" "}
          {profile.alsoPlayed.map((club, index) => (
            <span key={club.href}>
              {index > 0 ? ", " : null}
              <Link href={club.href} className="underline decoration-galway-ink/20 underline-offset-2">
                {club.name}
              </Link>
            </span>
          ))}
          .
        </p>
      ) : null}

      {profile.teammates.length > 0 ? (
        <section>
          <h2 className={poster ? "fohenagh-kicker mb-3" : "mb-3 text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon"}>
            Played alongside
          </h2>
          <p className={poster ? "fohenagh-alongside" : "flex flex-wrap gap-x-1 gap-y-1 text-base text-galway-ink"}>
            {profile.teammates.map((mate, index) => (
              <span key={mate.href ?? mate.name}>
                {index > 0 ? <span className="text-stone-400">, </span> : null}
                {mate.href ? (
                  <Link
                    href={mate.href}
                    className={
                      poster
                        ? undefined
                        : "font-semibold text-galway-maroon underline underline-offset-2"
                    }
                  >
                    {mate.name}
                  </Link>
                ) : (
                  mate.name
                )}
              </span>
            ))}
          </p>
        </section>
      ) : null}

      <TerraceNotes page={`/player/${profile.slug}`} />

      <p className="border-t border-galway-maroon/20 pt-5 text-sm leading-relaxed text-galway-ink/65">
        {profile.correctionHref ? (
          <>
            <Link
              href={profile.correctionHref}
              rel="nofollow"
              className="underline decoration-galway-ink/25 underline-offset-4 hover:text-galway-ink"
            >
              {profile.correctionLabel}
            </Link>
            {profile.memoryHref ? <span aria-hidden> · </span> : null}
          </>
        ) : null}
        {profile.memoryHref ? (
          <Link
            href={profile.memoryHref}
            className="underline decoration-galway-ink/25 underline-offset-4 hover:text-galway-ink"
          >
            {profile.memoryLabel}
          </Link>
        ) : null}
      </p>

      {profile.credit ? (
        <p className="text-sm font-semibold tracking-wide text-galway-ink">
          {profile.creditHref ? (
            <a
              href={profile.creditHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-galway-maroon underline decoration-galway-maroon/30 underline-offset-4"
            >
              {profile.credit}
            </a>
          ) : (
            profile.credit
          )}
        </p>
      ) : null}
    </article>
  );
}
