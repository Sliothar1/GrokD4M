import Link from "next/link";
import { FohenaghClubHistory } from "@/components/fohenagh/FohenaghClubHistory";
import { FohenaghKeyPlayers } from "@/components/fohenagh/FohenaghKeyPlayers";
import { SHOW_BOOK_MEDIA } from "@/lib/book-media";

export function FohenaghParishStory() {
  return (
    <section id="fohenagh-story" aria-labelledby="fohenagh-story-title" className="max-w-3xl space-y-10">
      <div className="space-y-2">
        <p className="fohenagh-kicker">1888–2002</p>
        <h2 id="fohenagh-story-title" className="text-3xl font-black tracking-tight text-galway-ink">
          The parish
        </h2>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-black text-galway-ink">Fohenagh</h3>
      </div>

      <FohenaghClubHistory />

      <div className="space-y-3">
        <h3 className="text-xl font-black text-galway-ink">1959 and 1960</h3>
        <p className="text-base leading-relaxed text-galway-ink/85">
          Castlegar led the 1959 replay by ten points at half-time. Fohenagh won 3-9 to 4-5, and
          another printing gives 3-9 to 2-5. Both scores stay. In 1960 the cup was retained: 4-9 to
          2-7 in the Galway GAA table and the September papers, and 5-13 to 2-4 in the 2021
          Connacht Tribune look-back.
        </p>
        {SHOW_BOOK_MEDIA ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <figure className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/uploads/book/fohenagh-history/p149-1959-senior-champions.png"
              alt="1959 Fohenagh senior champions"
              className="w-full rounded-lg"
            />
            <figcaption className="text-xs text-galway-ink/55">
              1959. From A History of Fohenagh by Tony O&apos;Gorman.{" "}
              <Link className="underline" href="/match/fohenagh-historic-1959-galway-shc-final-replay">
                The replay
              </Link>
            </figcaption>
          </figure>
          <figure className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/uploads/book/fohenagh-history/p150-1960-senior-champions.png"
              alt="1960 Fohenagh senior champions"
              className="w-full rounded-lg"
            />
            <figcaption className="text-xs text-galway-ink/55">
              1960. From A History of Fohenagh by Tony O&apos;Gorman.{" "}
              <Link className="underline" href="/match/fohenagh-historic-1960-galway-shc-final">
                The final
              </Link>
            </figcaption>
          </figure>
        </div>
        ) : null}
        <p className="text-base leading-relaxed text-galway-ink/85">
          Six Fohenagh men were picked for Galway against Tipperary on 30 October 1960:{" "}
          <Link className="font-semibold underline" href="/player/tony-ogorman">Tony O&apos;Gorman</Link>,{" "}
          <Link className="font-semibold underline" href="/player/pj-lally-fohenagh">P.J. Lally</Link>,{" "}
          <Link className="font-semibold underline" href="/player/tim-sweeney-fohenagh">Tim Sweeney</Link>,{" "}
          <Link className="font-semibold underline" href="/player/frank-glynn-fohenagh">Frank Glynn</Link>
          {" and "}
          <Link className="font-semibold underline" href="/player/jim-moclair-fohenagh">Jimmy Moclair</Link>
          . J. Sweeney is the sixth name on the list. Two players fit that initial, so this page does not guess.
        </p>
        <p>
          <Link className="font-semibold text-galway-maroon underline" href="/article/art-book-fohenagh-story-1959-comeback">
            Read the 1959 account
          </Link>
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-black text-galway-ink">1947 camogie</h3>
        <p className="text-base leading-relaxed text-galway-ink/85">
          Fohenagh won the county senior camogie title at the first attempt, 3-1 to 3-0 against
          Erin&apos;s Hopes. The book remembers the turf lorry that took the crowd home, and the stop
          under the Athenry Arch.
        </p>
        <p className="space-x-3">
          <Link className="font-semibold text-galway-maroon underline" href="/match/fohenagh-erins-hope-camogie-final-1947">
            The final
          </Link>
          <Link className="font-semibold text-galway-maroon underline" href="/article/art-book-fohenagh-story-turf-lorry-1947">
            The turf lorry
          </Link>
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-black text-galway-ink">1890, Gurteen</h3>
        <p className="text-base leading-relaxed text-galway-ink/85">
          On 15 July 1890 Fohenagh, captained by Tim Glynn, played Gurteen in a field lent by the
          Cormican family. After fifty minutes the teams were called off. The score was nothing all.
        </p>
        <p className="space-x-3">
          <Link className="font-semibold text-galway-maroon underline" href="/match/fohenagh-gurteen-tournament-1890">
            The game
          </Link>
          <Link className="font-semibold text-galway-maroon underline" href="/article/art-book-fohenagh-story-1890-gurteen">
            Read the account
          </Link>
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-black text-galway-ink">The Battle of Athenry</h3>
        <p className="text-base leading-relaxed text-galway-ink/85">
          Fohenagh met Claregalway in the 1941 county junior semi-final at Athenry. The game was
          played on Sunday 24 May 1942 and was abandoned. The County Board met on Saturday 6 June
          1942. The Connacht Tribune of Saturday 13 June 1942 headed its report “Blackguardism at
          Athenry causes heat at County Board meeting”. Both clubs were suspended for twelve months,
          and Eyrecourt were declared 1941 champions.
        </p>
        <p className="space-x-3">
          <Link className="font-semibold text-galway-maroon underline" href="/story/1942-north-board-blackguardism">
            1942: From the North Board to Blackguardism at Athenry
          </Link>
          <Link className="font-semibold text-galway-maroon underline" href="/article/art-book-fohenagh-story-battle-of-athenry">
            Read the account
          </Link>
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-black text-galway-ink">Key players</h3>
        <FohenaghKeyPlayers />
      </div>
    </section>
  );
}
