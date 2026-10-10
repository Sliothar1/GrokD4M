import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MemoryForm } from "@/components/MemoryForm";
import { correctionsFormEnabled } from "@/lib/corrections/config";
import { normalisePage } from "@/lib/corrections/validate";
import { getEntity } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Share a memory or a match you remember",
  robots: { index: false, follow: false },
};

export default async function MemoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  if (!correctionsFormEnabled()) notFound();
  const { page: raw } = await searchParams;
  const page = normalisePage(raw);

  if (!page || !page.startsWith("/player/")) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-black text-galway-ink">Share a memory or a match you remember</h1>
        <p className="text-lg text-galway-ink/75">
          Open a player page and use the link at the bottom of it.
        </p>
        <Link href="/" className="font-semibold text-galway-maroon underline">
          Back to search
        </Link>
      </div>
    );
  }

  const slug = page.slice("/player/".length);
  const entity = await getEntity(`player:${slug}`);
  const label = entity?.summary.title ?? slug;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-black text-galway-ink">Share a memory or a match you remember</h1>
        <p className="text-base text-galway-ink/70">
          About{" "}
          <Link href={page} className="font-semibold text-galway-maroon underline">
            {label}
          </Link>
          . An editor reads it before anything can appear.
        </p>
      </header>
      <MemoryForm page={page} pageLabel={label} />
    </div>
  );
}
