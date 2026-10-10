import Link from "next/link";
import type { FohenaghGame, FohenaghGameIcon, FohenaghMoreGame } from "@/lib/fohenaghShowcase";

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
          Notable games
        </h2>
        <p className="mt-2 max-w-2xl text-base text-galway-ink/70">
          The six Galway senior county finals, and the 1942 junior final. Newest first.
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

function GameGlyph({ icon }: { icon: FohenaghGameIcon }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 22,
    height: 22,
    "aria-hidden": true as const,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (icon === "helmet") {
    return (
      <svg {...common}>
        <path d="M5.5 12.5a6.5 6.5 0 0 1 13 0" />
        <path d="M5.5 12.5h13v1.2c0 1.2-1.4 2.3-6.5 2.3s-6.5-1.1-6.5-2.3v-1.2Z" />
        <path d="M8.2 13.2v2.4M12 13.2v3.2M15.8 13.2v2.4" />
        <path d="M7 18.2h10" />
      </svg>
    );
  }
  if (icon === "shield") {
    return (
      <svg {...common}>
        <path d="M12 3.2 5.5 6.1v5.4c0 3.8 2.6 6.4 6.5 7.8 3.9-1.4 6.5-4 6.5-7.8V6.1L12 3.2Z" />
        <path d="M9.2 12.2 11.1 14l3.8-4" />
      </svg>
    );
  }
  if (icon === "rifle") {
    return (
      <svg {...common}>
        <path d="M4 15.5h9.5" />
        <path d="M7 15.5 9.2 8.5h2.2" />
        <path d="M13.5 15.5 18.5 13" />
        <path d="M6.5 15.5v2.2" />
      </svg>
    );
  }
  if (icon === "tank") {
    return (
      <svg {...common}>
        <path d="M3.5 14.2h11.2c.7 0 1.3.6 1.3 1.3v1.2H4.2v-1.2c0-.7.6-1.3 1.3-1.3Z" />
        <path d="M8 14.2V11h4.2l2.2 3.2" />
        <path d="M14.2 12.2H20" />
        <circle cx="6.2" cy="17.6" r="1.15" />
        <circle cx="10" cy="17.6" r="1.15" />
        <circle cx="13.8" cy="17.6" r="1.15" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M6.2 3.4 14.2 16.2c.7 1.3-.1 2.5-1.5 3" />
      <path d="M17.8 3.4 9.8 16.2c-.7 1.3.1 2.5 1.5 3" />
      <circle cx="16.6" cy="7.2" r="2.15" />
    </svg>
  );
}

export function MoreGreatGames({ games }: { games: FohenaghMoreGame[] }) {
  if (games.length === 0) return null;
  return (
    <section aria-labelledby="more-great-games">
      <details className="hw-card group overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
          <span>
            <span id="more-great-games" className="hw-serif block text-2xl text-galway-ink">
              More great games
            </span>
            <span className="mt-0.5 block text-sm text-galway-ink/65">
              Other days on the parish record.
            </span>
          </span>
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            aria-hidden
            className="shrink-0 text-galway-maroon transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M6 9.5 12 15.5 18 9.5" />
          </svg>
        </summary>
        <ul className="border-t border-[var(--hw-line)]">
          {games.map((game) => {
            const body = (
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-galway-maroon/10 text-galway-maroon">
                  <GameGlyph icon={game.icon} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-galway-maroon">
                    {game.awaiting ? "Coming soon" : game.when ?? "Date to follow"}
                  </span>
                  <span className="hw-serif block text-lg leading-snug text-galway-ink">
                    {game.nickname || game.title}
                  </span>
                  {game.awaiting ? null : (
                    <span className="mt-0.5 block text-sm text-galway-ink/65">
                      {[
                        game.nickname ? game.title : null,
                        game.competition,
                        game.opponent ? `vs ${game.opponent}` : null,
                        game.score,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </span>
              </>
            );
            return (
              <li key={game.id} className="border-b border-[var(--hw-line)] last:border-b-0">
                {game.href ? (
                  <Link
                    href={game.href}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-[#f7f1e8]"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </details>
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
