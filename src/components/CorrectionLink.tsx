import Link from "next/link";
import { correctionsFormEnabled } from "@/lib/corrections/config";

/** Footer link on every player and club page (S3). Hidden until the form is enabled. */
export function CorrectionLink({ page }: { page: string }) {
  if (!correctionsFormEnabled()) return null;
  return (
    <p className="mt-10 border-t border-galway-maroon/15 pt-4 text-sm text-galway-ink/70">
      <Link
        href={`/corrections?page=${encodeURIComponent(page)}`}
        rel="nofollow"
        className="font-semibold text-galway-maroon underline underline-offset-2 hover:text-galway-maroon-dark"
      >
        Suggest a correction or request removal
      </Link>
    </p>
  );
}
