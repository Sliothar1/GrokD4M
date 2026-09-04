import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleUpload } from "@/lib/articles";
import { displayNameForRef, isEntityRef } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const a = getArticleUpload(id);
  return { title: a?.caption?.slice(0, 60) || "Article photo" };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const a = getArticleUpload(id);
  if (!a) notFound();

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-bold uppercase tracking-wide text-galway-gold">
          From your upload
        </p>
        <h1 className="text-3xl font-black text-galway-ink sm:text-4xl">
          {a.caption || "Article photo"}
        </h1>
        <p className="text-base text-galway-ink/65">
          {[a.year, a.status === "pending" ? "Awaiting text check" : "Indexed for search"]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border-2 border-galway-maroon/15 bg-white shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={a.path}
          alt={a.caption || "Uploaded newspaper or article photo"}
          className="mx-auto max-h-[70vh] w-full object-contain bg-galway-cream"
        />
      </div>

      {(a.clubTags.length > 0 || a.tags.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {a.clubTags.map((c) => (
            <Link
              key={c}
              href={isEntityRef(c) ? `/${c.replace(":", "/")}` : `/search?q=${encodeURIComponent(c)}`}
              className="rounded-full bg-galway-maroon/10 px-3 py-1 text-sm font-semibold text-galway-maroon"
            >
              {isEntityRef(c) ? displayNameForRef(c) : c}
            </Link>
          ))}
          {a.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-galway-gold/20 px-3 py-1 text-sm font-semibold"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {a.ocrText ? (
        <section className="space-y-2 rounded-2xl border-2 border-dashed border-galway-maroon/25 bg-white p-4">
          <h2 className="text-xl font-bold text-galway-maroon">Text we could read</h2>
          <p className="whitespace-pre-wrap text-base text-galway-ink/80">{a.ocrText}</p>
          <p className="text-sm text-galway-ink/55">
            Automatic reading can misread blurry print — we only keep clear years and
            clubs, never made-up scores.
          </p>
        </section>
      ) : (
        <p className="rounded-2xl border-2 border-dashed border-galway-maroon/25 bg-galway-cream/50 p-4 text-base text-galway-ink/70">
          No automatic text yet — caption and tags still make this searchable.
        </p>
      )}

      <p>
        <Link href="/contribute" className="font-semibold text-galway-maroon underline">
          ← Upload another
        </Link>
        {" · "}
        <Link
          href={`/search?q=${encodeURIComponent(a.caption || a.year || "article")}`}
          className="font-semibold text-galway-maroon underline"
        >
          Search related
        </Link>
      </p>
    </article>
  );
}
