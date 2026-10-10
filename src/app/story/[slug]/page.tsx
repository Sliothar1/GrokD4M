import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityView } from "@/components/EntityView";
import { ParishStoryView } from "@/components/ParishStoryView";
import { getEntity, listEntitiesByType, resolveId } from "@/lib/data";
import { PARISH_STORIES, parishStory } from "@/lib/parishStories";

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
  if (printed) return { title: printed.title };
  const data = await getEntity(resolveId("story", slug));
  return { title: data?.summary.title ?? "Story" };
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
  return <EntityView data={data} />;
}
