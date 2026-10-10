import Link from "next/link";
import type { getEntity } from "@/lib/data";
import { loadPlayerProfile, type PublicPlayerProfile } from "@/lib/playerProfile";

type EntityPayload = NonNullable<Awaited<ReturnType<typeof getEntity>>>;

/**
 * Every player page renders this allowlist. Pipeline notes, lane tags,
 * verification badges, and ids are not passed through.
 */
export async function PlayerView({ data }: { data: EntityPayload }) {
  const profile = await loadPlayerProfile(data.id, data.attrs);
  return <PlayerProfileView profile={profile} />;
}

export function PlayerProfileView({ profile }: { profile: PublicPlayerProfile }) {
  return (
    <article className="space-y-8">
      <header className="flex min-w-0 items-start gap-4 sm:gap-5">
        {profile.photoUrl ? (
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-galway-maroon/15 bg-galway-cream shadow-sm sm:h-28 sm:w-28">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.photoUrl}
              alt={profile.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          <h1 className="text-[1.85rem] font-black leading-[1.1] tracking-tight text-galway-ink sm:text-5xl">
            {profile.name}
          </h1>
          {profile.headline ? (
            <p className="text-lg font-semibold text-galway-maroon sm:text-xl">
              {profile.headline}
            </p>
          ) : null}
          {profile.eraLine ? (
            <p className="text-sm font-semibold text-stone-700">{profile.eraLine}</p>
          ) : null}
        </div>
      </header>

      {profile.summary ? (
        <p className="max-w-3xl text-base leading-relaxed text-galway-ink">{profile.summary}</p>
      ) : null}

      {profile.schoolsLine ? (
        <p className="max-w-3xl text-base leading-relaxed text-stone-700">
          {profile.schoolsLine}
        </p>
      ) : null}

      {profile.games.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon">
            Games
          </h2>
          <ul className="space-y-3">
            {profile.games.map((game) => (
              <li
                key={`${game.label}|${game.href ?? ""}`}
                className="rounded-2xl border border-galway-maroon/15 bg-white px-4 py-3"
              >
                <p className="font-semibold text-galway-ink">{game.label}</p>
                {game.href ? (
                  <p className="mt-1">
                    <Link
                      href={game.href}
                      className="font-semibold text-galway-maroon underline underline-offset-2"
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

      {profile.teammates.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon">
            Played alongside
          </h2>
          <p className="flex flex-wrap gap-x-1 gap-y-1 text-base text-galway-ink">
            {profile.teammates.map((mate, index) => (
              <span key={mate.href ?? mate.name}>
                {index > 0 ? <span className="text-stone-400">, </span> : null}
                {mate.href ? (
                  <Link
                    href={mate.href}
                    className="font-semibold text-galway-maroon underline underline-offset-2"
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

      <p className="border-t border-galway-maroon/15 pt-4 text-sm text-galway-ink/70">
        {profile.correctionHref ? (
          <>
            <Link
              href={profile.correctionHref}
              rel="nofollow"
              className="font-semibold text-galway-maroon underline underline-offset-2 hover:text-galway-maroon-dark"
            >
              {profile.correctionLabel}
            </Link>
            <span aria-hidden> · </span>
          </>
        ) : null}
        <Link
          href={profile.memoryHref}
          className="font-semibold text-galway-maroon underline underline-offset-2 hover:text-galway-maroon-dark"
        >
          {profile.memoryLabel}
        </Link>
      </p>

      {profile.credit ? (
        <p className="text-sm font-semibold text-galway-ink">
          {profile.creditHref ? (
            <a
              href={profile.creditHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-galway-maroon underline underline-offset-2"
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
