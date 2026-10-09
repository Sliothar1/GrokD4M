import Link from "next/link";
import type { EntitySummary } from "@/lib/data";

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
        Crest to follow. This monogram is a placeholder, not the club badge.
      </p>
    </div>
  );
}

export function Team1959({
  players,
}: {
  players: { id: string; name: string; href: string; line?: string }[];
}) {
  return (
    <section id="champions-1959" className="scroll-mt-6 space-y-4" aria-labelledby="champions-1959-heading">
      <div>
        <p className="hw-kicker">19 September 1959</p>
        <h2 id="champions-1959-heading" className="mt-1 text-3xl text-galway-ink sm:text-4xl">
          1959 county champions
        </h2>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-galway-ink/75">
          The Fohenagh fifteen named on the Connacht Tribune replay lineup.
          Tony O&apos;Gorman is on that side. Each name is its own profile.
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {players.map((player) => (
          <li key={player.id}>
            <Link
              href={player.href}
              className="hw-card hw-card-bar flex min-h-14 items-baseline justify-between gap-3 px-4 py-3 transition hover:-translate-y-0.5"
            >
              <span className="hw-serif text-lg text-galway-ink">{player.name}</span>
              {player.line ? (
                <span className="hidden text-right text-xs font-semibold text-galway-ink/55 sm:block">
                  {player.line}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
      <div className="hw-card border-dashed px-4 py-4">
        <p className="hw-kicker">Galway representatives</p>
        <p className="mt-2 text-sm leading-relaxed text-galway-ink/70">
          A clipping of 1959 Fohenagh players lining out for Galway will sit
          here when it is added. No names are listed until that cutting is in.
        </p>
      </div>
    </section>
  );
}

export function FohenaghGreats({
  players,
}: {
  players: { id: string; summary: EntitySummary; line: string }[];
}) {
  return (
    <section className="space-y-4" aria-labelledby="fohenagh-greats-heading">
      <div>
        <p className="hw-kicker">From the papers</p>
        <h2 id="fohenagh-greats-heading" className="mt-1 text-3xl text-galway-ink sm:text-4xl">
          Fohenagh greats
        </h2>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-galway-ink/75">
          A short line from a cited cutting. Open a name for the clipping.
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {players.map((player) => (
          <li key={player.id}>
            <Link
              href={player.summary.href}
              className="hw-card hw-card-bar block h-full px-4 py-4 transition hover:-translate-y-0.5"
            >
              <h3 className="hw-serif text-2xl text-galway-ink">{player.summary.title}</h3>
              {player.line ? (
                <p className="mt-2 text-sm leading-relaxed text-galway-ink/75">{player.line}</p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
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
