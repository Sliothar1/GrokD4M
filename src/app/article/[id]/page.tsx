import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArticleCredit } from "@/components/ArticleCredit";
import { JsonLd } from "@/components/JsonLd";
import { ZoomableImage } from "@/components/ZoomableImage";
import {
  articleKindLabel,
  articleMediaUrl,
  articlePageImageUrl,
  articleSameAsId,
  getArticleUpload,
} from "@/lib/articles";
import { displayNameForRef, getAssoc, getEntity, isEntityRef } from "@/lib/data";
import { publicCuttingLabel, sanitizePublicText } from "@/lib/publicText";
import { withPageMeta } from "@/lib/site";
import { articleNode, breadcrumbNode, jsonLdGraph } from "@/lib/structuredData";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const a = await getArticleUpload(id);
  const aliasOf = articleSameAsId(a);
  if (aliasOf) {
    const canonical = await getArticleUpload(aliasOf);
    if (canonical) {
      return withPageMeta({
        title: cuttingMetaTitle(canonical.caption, canonical.fetchedTitle),
        path: `/article/${aliasOf}`,
      });
    }
  }
  if (a) {
    return withPageMeta({
      title: cuttingMetaTitle(a.caption, a.fetchedTitle),
      path: `/article/${id}`,
    });
  }
  const seeded = await seededArticle(id);
  return withPageMeta({
    title: seeded?.summary.title ?? "Cutting",
    path: seeded?.summary.href ?? `/article/${id}`,
  });
}

function cuttingMetaTitle(caption?: string | null, fetchedTitle?: string | null): string {
  const label = publicCuttingLabel(caption || fetchedTitle || "Cutting");
  return label.slice(0, 60) || "Cutting";
}

function cuttingJsonLd(input: { title: string; path: string; citation?: string; description?: string }) {
  return jsonLdGraph([
    articleNode({
      headline: input.title,
      path: input.path,
      citation: input.citation,
      description: input.description,
    }),
    breadcrumbNode([
      { name: "HurlingWiki", path: "/" },
      { name: "Stories", path: "/stories" },
      { name: input.title, path: input.path },
    ]),
  ]);
}

async function seededArticle(id: string) {
  const direct = await getEntity(`article:${id}`);
  if (direct) return direct;
  if (id.startsWith("art-")) return getEntity(`article:${id.slice(4)}`);
  return null;
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const a = await getArticleUpload(id);
  const aliasOf = articleSameAsId(a);
  if (aliasOf && (await getArticleUpload(aliasOf))) redirect(`/article/${aliasOf}`);
  if (!a) {
    const seeded = await seededArticle(id);
    if (!seeded) notFound();
    const title = sanitizePublicText(String(seeded.attrs.title ?? seeded.attrs.name ?? seeded.summary.title));
    const cite = sanitizePublicText(String(seeded.attrs.cite ?? seeded.summary.citeChip ?? ""));
    const paper = sanitizePublicText(String(seeded.attrs.paper ?? ""));
    return (
      <article className="space-y-4">
        <JsonLd
          data={cuttingJsonLd({
            title: title || "Cutting",
            path: `/article/${id}`,
            citation: cite || paper,
            description: cite,
          })}
        />
        <p className="text-sm font-bold uppercase tracking-wide text-galway-maroon">From the record</p>
        <h1 className="text-3xl font-black text-galway-ink sm:text-4xl">{title || "Cutting"}</h1>
        {cite ? <p className="text-lg text-galway-ink">{cite}</p> : null}
        {paper && paper !== cite ? <p className="text-base text-galway-ink/80">{paper}</p> : null}
      </article>
    );
  }
  const A = await getAssoc();

  const title = publicCuttingLabel(
    a.caption ||
      a.fetchedTitle ||
      (a.kind === "url" ? "Linked article" : "Article cutting")
  );
  const cite = publicCuttingLabel(a.citeChip || (a.year ? `${a.year} · Paper` : "Paper"));
  const media = articleMediaUrl(a);
  const pageImage = articlePageImageUrl(a);
  const isPdf = a.kind === "pdf" || media?.toLowerCase().endsWith(".pdf");
  const showImage = Boolean(media && !isPdf && media !== pageImage);
  const kindLabel = articleKindLabel(a);

  const excerpt = a.excerpt ? sanitizePublicText(publicCuttingLabel(a.excerpt)) : "";
  return (
    <article className="space-y-6">
      <JsonLd
        data={cuttingJsonLd({
          title,
          path: `/article/${id}`,
          citation: cite,
          description: excerpt,
        })}
      />
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold uppercase tracking-wide text-galway-gold-ink">
            From cutting
          </p>
          <span className="rounded-full bg-galway-maroon/10 px-3 py-0.5 text-sm font-bold text-galway-maroon">
            {cite}
          </span>
        </div>
        <h1 className="text-3xl font-black text-galway-ink sm:text-4xl">
          {title}
        </h1>
        {kindLabel ? (
          <p className="text-base text-galway-ink/65">{kindLabel}</p>
        ) : null}
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

      {pageImage && (
        <ZoomableImage
          src={pageImage}
          alt={`Newspaper page: ${title}`}
          credit={a.credit}
          creditUrl={a.creditUrl}
        />
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

      <ArticleCredit
        credit={a.credit}
        creditUrl={a.creditUrl}
        sourceUrl={a.sourceUrl}
      />

      {excerpt ? (
        <section className="space-y-2 rounded-2xl border-2 border-galway-maroon/15 bg-white p-4">
          <h2 className="text-xl font-bold text-galway-maroon">Excerpt</h2>
          <p className="text-base text-galway-ink/85">
            {excerpt}
          </p>
          <p className="text-sm text-galway-ink/55">
            Full OCR / page text stays private. Public cards show only this
            excerpt, the cite chip, and linked clubs — never invented scores.
          </p>
        </section>
      ) : null}

      {(a.clubTags.length > 0 || (a.playerTags?.length ?? 0) > 0) && (
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
