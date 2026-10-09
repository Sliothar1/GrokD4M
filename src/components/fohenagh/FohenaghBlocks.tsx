import Link from "next/link";
import type { FohenaghGame } from "@/lib/fohenaghShowcase";

export function PhotoComingSoon({
  note,
}: {
  /** Quiet line under the placeholder, such as "Championship team photo". */
  note?: string;
}) {
  return (
    <figure className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-galway-maroon/25 bg-[var(--hw-paper,#f7f1e8)] px-6 py-8 text-center">
      <figcaption className="text-sm font-semibold text-galway-ink/55">Photo coming soon</figcaption>
      {note ? <p className="mt-1 text-xs text-galway-ink/45">{note}</p> : null}
    </figure>
  );
}

export function CrestPlaceholder() {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/10 font-serif text-2xl text-[#f7f3ea]"
      >
        F
      </span>
      <p className="max-w-[14rem] text-xs leading-snug text-[#f7f3ea]/75">
        Club crest coming soon
      </p>
    </div>
  );
}

export function NotableGames({ games }: { games: FohenaghGame[] }) {
  const decades: { label: string; games: FohenaghGame[] }[] = [];
  for (const game of games) {
    const label = game.year ? String(game.year) : "Year not on file";
    const last = decades[decades.length - 1];
    if (!last || last.label !== label) {
      decades.push({ label, games: [game] });
    } else {
      last.games.push(game);
    }
  }

  return (
    <section className="space-y-4" aria-labelledby="notable-games-heading">
      <div>
        <h2 id="notable-games-heading" className="text-3xl text-galway-ink">
          Key matches
        </h2>
        <p className="mt-2 max-w-2xl text-base text-galway-ink/70">
          {games.length === 1 ? "One game" : `${games.length} games`}, newest first. Open a match for the report and the players named that day.
        </p>
      </div>
      {decades.map((decade) => (
        <div key={decade.label} className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-galway-maroon">
            {decade.label}
          </h3>
          <ul className="space-y-2">
            {decade.games.map((game) => (
              <li key={game.id}>
                <Link
                  href={game.href}
                  className="hw-card block px-4 py-3 transition hover:-translate-y-0.5"
                >
                  <span className="text-sm font-bold text-galway-maroon">
                    {game.when ?? "Date to follow"}
                  </span>
                  <span className="hw-serif mt-1 block text-xl text-galway-ink">
                    {game.title}
                  </span>
                  <span className="mt-1 block text-sm text-galway-ink/70">
                    {[game.competition, game.opponent ? `vs ${game.opponent}` : null, game.score]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export function FurtherReading() {
  return (
    <section className="hw-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center" aria-labelledby="further-reading">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/reading/history-of-fohenagh.jpg"
        alt="Cover of A History of Fohenagh, by Tony O'Gorman"
        className="h-40 w-auto self-start rounded-xl border border-[var(--hw-line)] object-cover"
      />
      <div>
        <p className="hw-kicker" id="further-reading">Further reading</p>
        <p className="hw-serif mt-1 text-2xl text-galway-ink">
          A History of Fohenagh, by Tony O&apos;Gorman
        </p>
        <p className="mt-2 text-sm leading-relaxed text-galway-ink/70">
          Fohenagh amalgamated with Ahascragh in 2002.{" "}
          <Link href="/club/ahascragh-fohenagh" className="font-semibold text-galway-maroon underline">
            Ahascragh-Fohenagh has its own page.
          </Link>
        </p>
      </div>
    </section>
  );
}

export function RememberedNote({ text }: { text: string }) {
  return (
    <aside className="rounded-2xl border border-dashed border-galway-gold bg-[#fffaf2] px-4 py-3">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-galway-ink/55">
        <span aria-hidden className="text-base leading-none">✎</span>
        Remembered — a club memory, not from print
      </p>
      <p className="mt-1 text-base leading-relaxed text-galway-ink">{text}</p>
    </aside>
  );
}

export function ParishLinks({ show1959 }: { show1959: boolean }) {
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      <Link href="/club/fohenagh-historic#players" className="font-semibold text-galway-maroon underline">
        Teammates
      </Link>
      {show1959 ? (
        <Link
          href="/club/fohenagh-historic#champions-1959"
          className="font-semibold text-galway-maroon underline"
        >
          The 1959 side
        </Link>
      ) : null}
    </p>
  );
}

export function SweeneyMark() {
  return (
    <span
      className="sweeney-mark"
      title="Brave and strong, the Sweeney way"
      aria-label="Brave and strong, the Sweeney way"
    >
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3 5 6v6c0 4.2 2.8 7.2 7 8.5 4.2-1.3 7-4.3 7-8.5V6l-7-3Z" />
        <path d="M9 12.5 11 14.5 15.5 10" />
      </svg>
    </span>
  );
}
