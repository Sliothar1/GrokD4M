import Link from "next/link";
import { correctionsFormEnabled } from "@/lib/corrections/config";

/** Discreet link on every player page. Hidden until the shared queue is enabled. */
export function MemoryLink({ page }: { page: string }) {
  if (!correctionsFormEnabled()) return null;
  return (
    <p className="mt-8 text-sm text-galway-ink/55">
      <Link
        href={`/memories?page=${encodeURIComponent(page)}`}
        rel="nofollow"
        className="underline decoration-galway-ink/25 underline-offset-4 hover:text-galway-ink hover:decoration-galway-ink/50"
      >
        Share a memory or a match you remember
      </Link>
    </p>
  );
}
