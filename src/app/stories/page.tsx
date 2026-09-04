import type { Metadata } from "next";
import { EntityCard, EmptyTeach } from "@/components/EntityCard";
import { StoryForm } from "@/components/StoryForm";
import { ArticleUploadForm } from "@/components/ArticleUploadForm";
import Link from "next/link";
import { officialStories, readPendingStories } from "@/lib/data";
import { articleToSummary, readArticleUploads } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Stories",
};

export const dynamic = "force-dynamic";

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ link?: string; prompt?: string }>;
}) {
  const seeded = officialStories();
  const pending = readPendingStories();
  const uploads = readArticleUploads().slice(0, 6);
  const sp = await searchParams;
  const initialLink = typeof sp.link === "string" ? sp.link : "";
  const initialPrompt = typeof sp.prompt === "string" ? sp.prompt : "";
  const isHistoric =
    initialLink === "club:fohenagh-historic" ||
    initialLink === "club:ahascragh-historic" ||
    /fohenagh vs castlegar|1959 replay|old fohenagh|before the amalgam|ahascragh/i.test(
      initialPrompt
    );

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-galway-ink">
          Stories &amp; cuttings
        </h1>
        <p className="text-lg text-galway-ink/75">
          Share a memory, or upload a newspaper cutting (image, PDF, or URL).
          Cuttings go into the Ingest Lab queue — excerpt +{" "}
          <strong>YYYY · Paper</strong> cite on the public card; full text stays
          private; triples stay unverified until the Archivist.
        </p>
      </header>

      <section className="space-y-3" id="upload">
        <h2 className="text-2xl font-bold text-galway-maroon">
          Upload a cutting
        </h2>
        <p className="text-base text-galway-ink/70">
          Main entry for article photos, PDFs, and paper links. Written anecdotes
          are below.
        </p>
        <ArticleUploadForm />
      </section>

      {uploads.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-galway-maroon">
            Recent cuttings
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {uploads.map((u) => {
              const s = articleToSummary(u);
              return (
                <li key={u.id}>
                  <EntityCard entity={s} />
                </li>
              );
            })}
          </ul>
          <p className="text-sm text-galway-ink/60">
            Browse older uploads on{" "}
            <Link
              href="/contribute"
              className="font-semibold text-galway-maroon underline"
            >
              Contribute
            </Link>
            .
          </p>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-galway-maroon">In the seed</h2>
        {seeded.length === 0 ? (
          <EmptyTeach
            title="No seeded stories yet"
            hint="When stories appear in seed.json with type community_story, they show up here."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {seeded.map((s) => (
              <EntityCard key={s.id} entity={s} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-galway-maroon">
          Pending (local queue)
        </h2>
        {pending.length === 0 ? (
          <EmptyTeach
            title="Queue is empty"
            hint="Submit a story below. It will be saved to data/pending-stories.json on this machine."
          />
        ) : (
          <ul className="space-y-3">
            {pending.map((p) => (
              <li
                key={p.id}
                className="rounded-2xl border-2 border-dashed border-galway-gold bg-white p-4"
              >
                <p className="text-xs font-bold uppercase text-galway-gold">
                  Pending
                </p>
                <h3 className="text-xl font-bold">{p.title}</h3>
                <p className="text-sm text-galway-ink/60">
                  by {p.author}
                  {p.linkedEntity ? ` · linked ${p.linkedEntity}` : ""}
                </p>
                <p className="mt-2 text-base">{p.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <StoryForm
        initialLink={initialLink}
        initialPrompt={initialPrompt}
        emptyCta={
          isHistoric
            ? "Got a story from Fohenagh or Ahascragh days? Anecdotes only — do not invent Castlegar’s 1959 score."
            : undefined
        }
        chips={
          isHistoric
            ? [
                {
                  label: "Fohenagh vs Castlegar, 1960",
                  id: "club:fohenagh-historic",
                },
                {
                  label: "The 1959 replay at Kenny Park",
                  id: "club:fohenagh-historic",
                },
                {
                  label: "When Fohenagh won the county before the amalgam",
                  id: "club:fohenagh-historic",
                },
                {
                  label: "Ahascragh before the amalgam",
                  id: "club:ahascragh-historic",
                },
              ]
            : undefined
        }
      />
    </div>
  );
}
