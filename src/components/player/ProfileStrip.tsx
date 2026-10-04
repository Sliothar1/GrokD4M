import Link from "next/link";
import { ClubChip } from "@/components/chips";
import { VerificationBadge } from "@/components/sources/VerificationBadge";
import type { ClubChipData } from "@/lib/playerClubs";
import type { FactSourceStatus } from "@/lib/verification";

export function ProfileStrip({
  name,
  clubs,
  countyName,
  photoUrl,
  photoUploadHref,
  verification,
  clubStatus,
  clubCite,
  clubBadge,
}: {
  name: string;
  clubs: ClubChipData[];
  countyName?: string;
  photoUrl: string | null;
  photoUploadHref: string;
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
      <ProfilePhotoSlot
        name={name}
        photoUrl={photoUrl}
        uploadHref={photoUploadHref}
      />
      <div className="min-w-0 flex-1 space-y-2.5 pt-0.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-galway-maroon">
          Player
        </p>
        <h1 className="text-[1.85rem] font-black leading-[1.1] tracking-tight text-galway-ink sm:text-5xl">
          {name}
        </h1>
        <div
          className="flex max-w-full flex-wrap items-center gap-1.5"
          aria-label="Trust and club jerseys"
        >
          <VerificationBadge status={verification} fact="profile" />
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
  uploadHref,
}: {
  name: string;
  photoUrl: string | null;
  uploadHref: string;
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
    <Link
      href={uploadHref}
      className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-dashed border-galway-maroon/30 bg-white/70 text-center transition hover:border-galway-maroon hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-gold sm:h-28 sm:w-28"
    >
      <span
        aria-hidden
        className="flex h-8 w-8 items-center justify-center rounded-full bg-galway-maroon text-base font-black text-galway-gold"
      >
        +
      </span>
      <span className="px-2 text-[11px] font-bold text-galway-maroon">
        Add photo
      </span>
    </Link>
  );
}
