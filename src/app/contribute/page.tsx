import type { Metadata } from "next";
import Link from "next/link";
import { ArticleUploadForm } from "@/components/ArticleUploadForm";
import { EmptyTeach, EntityCard } from "@/components/EntityCard";
import { articleToSummary, readArticleUploads } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Contribute",
};

export const dynamic = "force-dynamic";

export default function ContributePage() {
  const uploads = readArticleUploads();

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-galway-ink">Contribute</h1>
        <p className="text-lg text-galway-ink/75">
          Secondary upload page. The main entry is{" "}
          <Link
            href="/stories#upload"
            className="font-semibold text-galway-maroon underline"
          >
            Stories → Upload a cutting
          </Link>{" "}
          (image, PDF, or URL). Optional caption, year, and club tags help
          search find it.
        </p>
      </header>

      <ArticleUploadForm />

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-galway-maroon">Your uploads</h2>
        {uploads.length === 0 ? (
          <EmptyTeach
            title="No cuttings yet"
            hint="Use Stories (or the form above). Images/PDFs land in public/uploads/articles/; private text in data/private/. Search cards show excerpt + YYYY · Paper + From cutting."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {uploads.map((u) => (
              <li key={u.id}>
                <EntityCard entity={articleToSummary(u)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
