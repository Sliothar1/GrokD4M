import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityView } from "@/components/EntityView";
import { Fohenagh1942Story } from "@/components/fohenagh/Fohenagh1942Story";
import { getEntity, listEntitiesByType, resolveId } from "@/lib/data";

export async function generateStaticParams() {
  return (await listEntitiesByType("story")).map((p) => ({
    slug: p.id.slice("story:".length),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getEntity(resolveId("story", slug));
  return { title: data?.summary.title ?? "Story" };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getEntity(resolveId("story", slug));
  if (!data) notFound();
  if (slug === "1942-north-board-blackguardism") {
    return <Fohenagh1942Story />;
  }
  return <EntityView data={data} />;
}
