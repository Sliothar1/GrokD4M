type PlayerHeroProps = {
  name: string;
  clubName?: string;
  countyName?: string;
  trust?: string;
  namedOnCutting?: boolean;
  kidChip?: string | null;
  citeChip?: string | null;
};

export function PlayerHero({
  name,
  clubName,
  countyName,
  trust,
  namedOnCutting,
  kidChip,
  citeChip,
}: PlayerHeroProps) {
  return (
    <header className="relative overflow-hidden rounded-3xl bg-galway-ink px-5 py-7 text-white sm:px-8 sm:py-9">
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-galway-maroon/80 to-transparent"
      />
      <p className="relative text-[11px] font-bold uppercase tracking-[0.22em] text-galway-gold">
        Player
      </p>
      <h1 className="relative mt-2 text-4xl font-black tracking-tight sm:text-6xl">
        {name}
      </h1>
      {(clubName || countyName) && (
        <p className="relative mt-3 text-lg font-semibold text-white/75 sm:text-xl">
          {[clubName, countyName].filter(Boolean).join(" · ")}
        </p>
      )}
      <div className="relative mt-4 h-1 w-16 rounded-full bg-galway-gold" />
      <div className="relative mt-5 flex flex-wrap items-center gap-2">
        {trust ? (
          <span
            className={
              trust === "Verified"
                ? "rounded-full bg-green-200 px-2.5 py-0.5 text-sm font-bold text-green-900"
                : trust === "Fan story"
                  ? "rounded-full bg-galway-gold/40 px-2.5 py-0.5 text-sm font-bold text-white"
                  : "rounded-full bg-amber-200 px-2.5 py-0.5 text-sm font-bold text-amber-950"
            }
          >
            {trust}
          </span>
        ) : null}
        {namedOnCutting ? (
          <span className="rounded-full bg-galway-gold px-2.5 py-0.5 text-sm font-bold text-galway-ink">
            Named on a cutting
          </span>
        ) : null}
        {kidChip ? (
          <span className="rounded-full border border-white/25 px-2.5 py-0.5 text-sm font-semibold text-white">
            {kidChip}
          </span>
        ) : null}
        {citeChip ? (
          <span className="rounded-full border border-galway-gold/50 px-2.5 py-0.5 text-sm font-bold text-galway-gold">
            {citeChip}
          </span>
        ) : null}
      </div>
    </header>
  );
}
