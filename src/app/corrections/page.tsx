import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CorrectionForm } from "@/components/CorrectionForm";
import { correctionsFormEnabled } from "@/lib/corrections/config";
import { normalisePage } from "@/lib/corrections/validate";
import { getEntity } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Suggest a correction or request removal",
  robots: { index: false, follow: false },
};

export default async function CorrectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  if (!correctionsFormEnabled()) notFound();
  const { page: raw } = await searchParams;
  const page = normalisePage(raw);

  if (!page) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-black text-galway-ink">Suggest a correction or request removal</h1>
        <p className="text-lg text-galway-ink/75">
          Please open the player or club page you want to correct and use the{" "}
          <em>Suggest a correction or request removal</em> link at the bottom of it.
        </p>
        <Link href="/" className="font-semibold text-galway-maroon underline">
          Back to search
        </Link>
      </div>
    );
  }

  const [, kind, slug] = page.split("/");
  const entity = await getEntity(`${kind}:${slug}`);
  const label = entity?.summary.title ?? slug;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-black text-galway-ink">Suggest a correction or request removal</h1>
        <p className="text-lg text-galway-ink/75">
          Spotted a mistake on{" "}
          <Link href={page} className="font-semibold text-galway-maroon underline">
            {label}
          </Link>
          , or want something taken down? Tell us here. An editor checks every request.
        </p>
      </header>
      <CorrectionForm page={page} pageLabel={label} />
    </div>
  );
}
