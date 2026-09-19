import Link from "next/link";

export function TrustChip({ label }: { label?: string | null }) {
  if (!label) return null;
  const cls =
    label === "Verified"
      ? "bg-green-100 text-green-800"
      : label === "Fan story"
        ? "bg-galway-gold/30 text-galway-ink"
        : "bg-amber-100 text-amber-900";
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${cls}`}
    >
      {label}
    </span>
  );
}

export function ClubChip({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-full border-2 border-galway-maroon/30 bg-white px-2.5 py-0.5 text-sm font-bold text-galway-maroon transition hover:border-galway-maroon hover:bg-galway-maroon hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-galway-gold"
    >
      {label}
    </Link>
  );
}
