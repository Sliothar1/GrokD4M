import Link from "next/link";

/** Quiet companion to a Suggest a correction link. */
export function WhyWrongLink() {
  return (
    <Link
      href="/how-it-works"
      className="text-xs text-galway-ink/50 underline decoration-galway-ink/25 underline-offset-2 hover:text-galway-maroon"
    >
      Why might something be wrong?
    </Link>
  );
}
