import { ClubChip } from "@/components/chips";
import { VerificationBadge } from "@/components/sources/VerificationBadge";
import type { ClubChipData } from "@/lib/playerClubs";
import type { FactSourceStatus } from "@/lib/verification";

export function ProfileStrip({
  name,
  clubs,
  countyName,
  photoUrl,
  verification,
  clubStatus,
  clubCite,
  clubBadge,
  nameMark,
  era,
  beingVerified = false,
}: {
  name: string;
  clubs: ClubChipData[];
  countyName?: string;
  photoUrl: string | null;
  /** Small mark beside the name, such as the Sweeney shield. */
  nameMark?: React.ReactNode;
  /** Club and era, kept separate from the cited lead. */
  era?: string | null;
  /** Club memory still being checked. Replaces the source badge. */
  beingVerified?: boolean;
  /**
   * Identity grade. Verified only when an identity fact has a Verified
   * source. Confidence and a cutting cite string do not set this.
   */
  verification: FactSourceStatus;
  /** Grade of the club fact. Unverified clubs are greyed. */
  clubStatus?: FactSourceStatus;
  /** Cite for the club fact. Rendered beside the chips, not inside them. */
  clubCite?: React.ReactNode;
  clubBadge?: React.ReactNode;
}) {
  const clubUnverified = clubStatus === "unverified";

  return (
    <header className="flex min-w-0 items-start gap-4 sm:gap-5">
      <ProfilePhotoSlot name={name} photoUrl={photoUrl} />
      <div className="min-w-0 flex-1 space-y-2.5 pt-0.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-galway-maroon">
          Player
        </p>
        <h1 className="text-[1.85rem] leading-[1.1] tracking-tight text-galway-ink sm:text-5xl">
          {name}
          {nameMark}
        </h1>
        {era ? (
          <p className="text-sm font-semibold text-galway-ink/70">{era}</p>
        ) : null}
        <div
          className="flex max-w-full flex-wrap items-center gap-1.5"
          aria-label="Trust and club jerseys"
        >
          {beingVerified ? (
            <span className="inline-flex max-w-full items-center rounded-full bg-amber-100 px-2 py-0.5 text-sm font-bold leading-5 text-amber-950">
              Being verified
            </span>
          ) : (
            <VerificationBadge status={verification} fact="profile" />
          )}
          {clubs.map((c) => (
            <ClubChip
              key={c.id}
              href={c.href}
              label={c.name}
              title={c.title}
              muted={clubUnverified}
            />
          ))}
          {clubCite}
          {clubBadge}
        </div>
        {countyName ? (
          <p className="text-sm font-semibold text-stone-700">
            {countyName}
          </p>
        ) : null}
      </div>
    </header>
  );
}

function ProfilePhotoSlot({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl: string | null;
}) {
  if (photoUrl) {
    return (
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-galway-maroon/15 bg-galway-cream shadow-sm sm:h-28 sm:w-28">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={`${name} profile photo`}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <figure className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-galway-maroon/25 bg-[var(--hw-paper,#f7f1e8)] px-2 text-center sm:h-28 sm:w-28">
      <figcaption className="text-[11px] font-semibold leading-snug text-galway-ink/55">
        Photo coming soon
      </figcaption>
    </figure>
  );
}
