import Link from "next/link";
import { FohenaghKeyPlayers } from "@/components/fohenagh/FohenaghKeyPlayers";
import { SHOW_BOOK_MEDIA } from "@/lib/book-media";

const TIMELINE = [
  {
    year: "1888",
    text: "22 July, Lowville tournament, up to 3,000 people in the rain. 8 September, the first GAA social at Kilconnell.",
  },
  {
    year: "1890",
    text: "15 July, Fohenagh v Gurteen. Fifty minutes, no score. Tim Glynn was captain.",
  },
  {
    year: "1907",
    text: "21 January, Fohenagh re-affiliated. Fr. Harney, the parish priest, wrote that the players were respectable men.",
  },
  {
    year: "1942",
    text: "The 1941 junior semi-final against Claregalway, played at Athenry and later called the Battle of Athenry. The book dates it 23 May. The Connacht Tribune fixture of 23 May 1942, page 10, gives Sunday 24 May.",
  },
  {
    year: "1947",
    text: "County senior camogie at the first attempt. Fohenagh 3-1, Erin's Hopes 3-0.",
  },
  {
    year: "1959",
    text: "County senior hurling. The replay at Kenny Park, after a draw with Castlegar.",
  },
  {
    year: "1960",
    text: "The cup retained. Six Fohenagh men picked for Galway against Tipperary on 30 October.",
  },
  {
    year: "1961",
    text: "County final. The book says the margin was one point. Galway GAA prints two points, Turloughmore 3-6, Fohenagh 3-4.",
  },
  {
    year: "1999",
    text: "Underage teams joined with Ahascragh.",
  },
  {
    year: "2002",
    text: "21 January, both clubs disbanded and Ahascragh/Fohenagh began.",
  },
];

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
        <h3 className="text-xl font-black text-galway-ink">Fothannán</h3>
        <p className="text-base leading-relaxed text-galway-ink/85">
          Fohenagh is Fothannán, the village of the thistles. The name is also written feochadán.
          From A History of Fohenagh by Tony O&apos;Gorman, pages 17 and 158.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-black text-galway-ink">Timeline</h3>
        <ol className="space-y-3">
          {TIMELINE.map((item) => (
            <li key={item.year} className="grid grid-cols-[4.5rem_1fr] gap-3 text-base leading-relaxed">
              <span className="font-black text-galway-maroon">{item.year}</span>
              <span className="text-galway-ink/85">{item.text}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-galway-ink/55">From A History of Fohenagh by Tony O&apos;Gorman.</p>
      </div>

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
          Fohenagh met Claregalway in the 1941 county junior semi-final at Athenry in May 1942. The
          book dates the day 23 May (page 144). The Connacht Tribune fixture printed on 23 May 1942,
          page 10, gives Sunday 24 May. Spectators came onto the pitch, the referee called the match
          off, and both clubs were suspended for a year. Eyrecourt were handed the junior title.
        </p>
        <p>
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
