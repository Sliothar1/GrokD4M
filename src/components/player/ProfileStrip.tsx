import Link from "next/link";

export function ProfileStrip({
  name,
  clubName,
  countyName,
  photoUrl,
  photoUploadHref,
  verified,
  trustLabel,
}: {
  name: string;
  clubName?: string;
  countyName?: string;
  photoUrl: string | null;
  photoUploadHref: string;
  /** Named-in-cutting or equivalent (archivist / high confidence). */
  verified: boolean;
  trustLabel?: string;
}) {
  const subtitle = [clubName, countyName].filter(Boolean).join(" · ");
  const chip = verified ? "Verified" : trustLabel;

  return (
    <header className="flex items-start gap-4 sm:gap-5">
      <ProfilePhotoSlot
        name={name}
        photoUrl={photoUrl}
        uploadHref={photoUploadHref}
      />
      <div className="min-w-0 flex-1 space-y-2 pt-0.5">
        <p className="text-sm font-bold uppercase tracking-wide text-galway-maroon">
          Player
        </p>
        <h1 className="text-3xl font-black tracking-tight text-galway-ink sm:text-5xl">
          {name}
        </h1>
        {subtitle ? (
          <p className="text-lg font-semibold text-galway-ink/70">{subtitle}</p>
        ) : null}
        {chip ? (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span
              className={
                chip === "Verified"
                  ? "rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-bold text-green-800"
                  : chip === "Fan story"
                    ? "rounded-full bg-galway-gold/30 px-2.5 py-0.5 text-sm font-bold text-galway-ink"
                    : "rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-bold text-amber-900"
              }
            >
              {chip}
            </span>
          </div>
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
      <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-galway-maroon/20 bg-galway-cream shadow-sm sm:h-32 sm:w-32">
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
      className="flex h-28 w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-galway-maroon/35 bg-galway-cream/80 text-center shadow-inner transition hover:border-galway-maroon hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-gold sm:h-32 sm:w-32"
    >
      <span
        aria-hidden
        className="flex h-10 w-10 items-center justify-center rounded-full bg-galway-maroon text-lg font-black text-galway-gold"
      >
        +
      </span>
      <span className="px-2 text-xs font-bold text-galway-maroon">
        Add photo
      </span>
      <span className="px-2 text-[10px] font-semibold leading-tight text-galway-ink/50">
        Panel photo later
      </span>
    </Link>
  );
}
