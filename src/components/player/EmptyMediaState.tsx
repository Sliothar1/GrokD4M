import Link from "next/link";

export function EmptyMediaState() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-galway-maroon/12 bg-white/80 px-3 py-2.5">
      <div
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-galway-maroon text-sm font-black text-galway-gold"
      >
        H
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-galway-ink">No cuttings yet</p>
        <p className="text-xs text-galway-ink/55">
          A newspaper snip will sit here when one names this player.{" "}
          <Link
            href="/stories#upload"
            className="font-semibold text-galway-maroon underline"
          >
            Upload on Stories
          </Link>
        </p>
      </div>
    </div>
  );
}
