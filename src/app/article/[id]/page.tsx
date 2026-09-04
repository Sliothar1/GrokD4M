import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EntityView } from "@/components/EntityView";
import { articleMediaUrl, getArticleUpload } from "@/lib/articles";
import { displayNameForRef, getAssoc, getEntity, isEntityRef } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const a = await getArticleUpload(id);
  if (a) {
    return {
      title:
        a.caption?.slice(0, 60) ||
        a.fetchedTitle?.slice(0, 60) ||
        "Cutting",
    };
  }
  const seeded = await getEntity(`article:${id}`);
  return { title: seeded?.summary.title ?? "Cutting" };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const a = await getArticleUpload(id);
  if (!a) {
    const seeded = await getEntity(`article:${id}`);
    if (!seeded) notFound();
    return <EntityView data={seeded} />;
  }
  const A = await getAssoc();

  const title =
    a.caption ||
    a.fetchedTitle ||
    (a.kind === "url" ? "Linked article" : "Article cutting");
  const cite = a.citeChip || (a.year ? `${a.year} · Paper` : "Paper");
  const media = articleMediaUrl(a);
  const isPdf = a.kind === "pdf" || media?.toLowerCase().endsWith(".pdf");
  const showImage = Boolean(media && !isPdf);

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold uppercase tracking-wide text-galway-gold">
            From cutting
          </p>
          <span className="rounded-full bg-galway-maroon/10 px-3 py-0.5 text-sm font-bold text-galway-maroon">
            {cite}
          </span>
          <span className="rounded-full bg-galway-cream px-3 py-0.5 text-xs font-semibold uppercase text-galway-ink/70">
            Unverified
          </span>
        </div>
        <h1 className="text-3xl font-black text-galway-ink sm:text-4xl">
          {title}
        </h1>
        <p className="text-base text-galway-ink/65">
          {[
            a.kind === "url" ? "URL source" : a.kind === "pdf" ? "PDF" : "Image",
            a.status === "pending"
              ? "Awaiting Archivist"
              : "Indexed · triples unverified",
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>

      {showImage && (
        <div className="overflow-hidden rounded-2xl border-2 border-galway-maroon/15 bg-white shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media}
            alt={title}
            className="mx-auto max-h-[70vh] w-full object-contain bg-galway-cream"
          />
        </div>
      )}

      {isPdf && media && (
        <div className="rounded-2xl border-2 border-galway-maroon/15 bg-white p-5 shadow-sm">
          <p className="text-lg font-bold text-galway-maroon">PDF cutting</p>
          <a
            href={media}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block font-semibold text-galway-maroon underline"
          >
            Open PDF
          </a>
        </div>
      )}

      {a.kind === "url" && a.sourceUrl && (
        <div className="rounded-2xl border-2 border-galway-maroon/15 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase text-galway-gold">Source URL</p>
          <a
            href={a.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 break-all text-lg font-semibold text-galway-maroon underline"
          >
            {a.sourceUrl}
          </a>
        </div>
      )}

      {a.excerpt && (
        <section className="space-y-2 rounded-2xl border-2 border-galway-maroon/15 bg-white p-4">
          <h2 className="text-xl font-bold text-galway-maroon">Excerpt</h2>
          <p className="text-base text-galway-ink/85">{a.excerpt}</p>
          <p className="text-sm text-galway-ink/55">
            Full OCR / page text stays private. Public cards show only this
            excerpt, the cite chip, and linked clubs — never invented scores.
          </p>
        </section>
      )}

      {(a.clubTags.length > 0 ||
        (a.playerTags?.length ?? 0) > 0 ||
        a.tags.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {(a.playerTags ?? []).map((p) => (
            <Link
              key={p}
              href={
                isEntityRef(p)
                  ? `/${p.replace(":", "/")}`
                  : `/search?q=${encodeURIComponent(p)}`
              }
              className="rounded-full bg-galway-gold/30 px-3 py-1 text-sm font-semibold text-galway-ink"
            >
              {isEntityRef(p) ? displayNameForRef(p, A) : p}
            </Link>
          ))}
          {a.clubTags.map((c) => (
            <Link
              key={c}
              href={
                isEntityRef(c)
                  ? `/${c.replace(":", "/")}`
                  : `/search?q=${encodeURIComponent(c)}`
              }
              className="rounded-full bg-galway-maroon/10 px-3 py-1 text-sm font-semibold text-galway-maroon"
            >
              {isEntityRef(c) ? displayNameForRef(c, A) : c}
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

      <p>
        <Link
          href="/stories#upload"
          className="font-semibold text-galway-maroon underline"
        >
          ← Upload another on Stories
        </Link>
        {" · "}
        <Link
          href={`/search?q=${encodeURIComponent(a.caption || a.year || "paper")}`}
          className="font-semibold text-galway-maroon underline"
        >
          Search related
        </Link>
      </p>
    </article>
  );
}
