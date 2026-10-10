import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityView } from "@/components/EntityView";
import { ParishStoryView } from "@/components/ParishStoryView";
import { Fohenagh1942Story } from "@/components/fohenagh/Fohenagh1942Story";
import { JsonLd } from "@/components/JsonLd";
import { getEntity, listEntitiesByType, resolveId } from "@/lib/data";
import { PARISH_STORIES, parishStory } from "@/lib/parishStories";
import { withPageMeta } from "@/lib/site";
import { articleNode, breadcrumbNode, jsonLdGraph, publicProse } from "@/lib/structuredData";

export async function generateStaticParams() {
  const seeded = (await listEntitiesByType("story")).map((p) => ({
    slug: p.id.slice("story:".length),
  }));
  const printed = PARISH_STORIES.map((story) => ({ slug: story.slug }));
  return [...printed, ...seeded];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const printed = parishStory(slug);
  if (printed) return withPageMeta({ title: printed.title, path: `/story/${slug}` });
  const data = await getEntity(resolveId("story", slug));
  return withPageMeta({
    title: data?.summary.title ?? "Story",
    path: data?.summary.href ?? `/story/${slug}`,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const printed = parishStory(slug);
  if (printed) return <ParishStoryView story={printed} />;
  const data = await getEntity(resolveId("story", slug));
  if (!data) notFound();
  if (slug === "1942-north-board-blackguardism") {
    return <Fohenagh1942Story />;
  }
  const author = typeof data.attrs.author === "string" ? data.attrs.author : "";
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          articleNode({
            headline: data.summary.title,
            path: data.summary.href,
            description: publicProse(data.attrs.notable ?? ""),
            author,
            citation: typeof data.attrs.cite === "string" ? data.attrs.cite : "",
          }),
          breadcrumbNode([
            { name: "HurlingWiki", path: "/" },
            { name: "Stories", path: "/stories" },
            { name: data.summary.title, path: data.summary.href },
          ]),
        ])}
      />
      <EntityView data={data} />
    </>
  );
}
