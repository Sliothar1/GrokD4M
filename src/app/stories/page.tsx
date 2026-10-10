import type { Metadata } from "next";
import { EntityCard, EmptyTeach } from "@/components/EntityCard";
import { StoryForm } from "@/components/StoryForm";
import { ArticleUploadForm } from "@/components/ArticleUploadForm";
import Link from "next/link";
import { officialStories, readPendingStories } from "@/lib/data";
import { articleToSummary, isHeldForReview, readArticleUploads } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Stories",
};

export const dynamic = "force-dynamic";

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ link?: string; prompt?: string }>;
}) {
  const seeded = await officialStories();
  const pending = readPendingStories();
  const allUploads = await readArticleUploads();
  const uploads = allUploads.filter((upload) => !isHeldForReview(upload)).slice(0, 6);
  const held = allUploads.filter((upload) => isHeldForReview(upload));
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
    <div className="space-y-12">
      <header className="space-y-2">
        <p className="hw-kicker">Parish archive</p>
        <h1 className="text-4xl text-galway-ink sm:text-5xl">
          Stories &amp; cuttings
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-galway-ink/75">
          Share a memory, or send a newspaper cutting. An editor reads it before
          it is published. Nothing goes live on its own.
        </p>
      </header>

      <section className="hw-card space-y-3 p-4 sm:p-6" id="upload">
        <p className="hw-kicker">Add one</p>
        <h2 className="text-3xl text-galway-ink">
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
          <p className="hw-kicker">From the papers</p>
          <h2 className="text-3xl text-galway-ink">
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
        <p className="hw-kicker">On file</p>
        <h2 className="text-3xl text-galway-ink">Stories on file</h2>
        {seeded.length === 0 ? (
          <EmptyTeach
            title="No stories on file yet"
            hint="Published stories will show up here."
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
        <p className="hw-kicker">Waiting</p>
        <h2 className="text-3xl text-galway-ink">
          Waiting to be read
        </h2>
        {pending.length === 0 && held.length === 0 ? (
          <EmptyTeach
            title="Nothing waiting"
            hint="A story, correction or clipping waits here until an editor publishes it."
          />
        ) : (
          <ul className="space-y-3">
            {pending.map((p) => (
              <li
                key={p.id}
                className="rounded-2xl border-2 border-dashed border-galway-gold bg-white p-4"
              >
                <p className="text-xs font-bold uppercase text-galway-gold">
                  Waiting
                </p>
                <h3 className="text-xl font-bold">{p.title}</h3>
                <p className="text-sm text-galway-ink/60">
                  by {p.author}
                  {p.page ? ` · ${p.page}` : p.linkedEntity ? ` · ${quietLink(p.linkedEntity)}` : ""}
                </p>
                <p className="mt-2 text-base">{p.body}</p>
                {p.attachmentName ? (
                  <p className="mt-2 text-sm text-galway-ink/60">
                    File held for the editor: {p.attachmentName}
                  </p>
                ) : null}
              </li>
            ))}
            {held.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border-2 border-dashed border-galway-gold bg-white p-4"
              >
                <p className="text-xs font-bold uppercase text-galway-gold">
                  Waiting
                </p>
                <h3 className="text-xl font-bold">
                  {item.tags.find((tag) => tag.startsWith("/")) ?? "Suggestion"}
                </h3>
                <p className="text-sm text-galway-ink/60">
                  by {item.fetchedTitle || "Anonymous"}
                </p>
                <p className="mt-2 text-base">{item.caption}</p>
                {item.filename ? (
                  <p className="mt-2 text-sm text-galway-ink/60">
                    File held for the editor: {item.filename}
                  </p>
                ) : null}
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
                  label: "Near miss in 1958 — Castlegar final",
                  id: "match:fohenagh-historic-1958-galway-shc-final",
                },
                {
                  label: "1961 final vs Turloughmore",
                  id: "match:fohenagh-historic-1961-galway-shc-final",
                },
                {
                  label: "1963 county final day",
                  id: "match:fohenagh-historic-1963-galway-shc-final",
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

function quietLink(raw: string): string {
  if (raw.startsWith("/")) return raw;
  const splitAt = raw.indexOf(":");
  if (splitAt > 0) return `/${raw.slice(0, splitAt)}/${raw.slice(splitAt + 1)}`;
  return raw;
}
