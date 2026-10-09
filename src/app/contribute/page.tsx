import type { Metadata } from "next";
import Link from "next/link";
import { ArticleUploadForm } from "@/components/ArticleUploadForm";
import { EmptyTeach, EntityCard } from "@/components/EntityCard";
import { articleToSummary, isHeldForReview, readArticleUploads } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Contribute",
};

export const dynamic = "force-dynamic";

export default async function ContributePage() {
  const uploads = (await readArticleUploads()).filter((upload) => !isHeldForReview(upload));

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-galway-ink">Contribute</h1>
        <p className="text-lg text-galway-ink/75">
          The main place to send a cutting is{" "}
          <Link
            href="/stories#upload"
            className="font-semibold text-galway-maroon underline"
          >
            Stories
          </Link>
          . A picture, a PDF, or a link to the paper is enough. A caption and a
          year help people find it.
        </p>
      </header>

      <ArticleUploadForm />

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-galway-maroon">Your uploads</h2>
        {uploads.length === 0 ? (
          <EmptyTeach
            title="No cuttings yet"
            hint="Send a cutting from Stories, or use the form above. An editor reads it before it is published."
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
