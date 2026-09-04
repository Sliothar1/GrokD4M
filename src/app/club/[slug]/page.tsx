import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityView } from "@/components/EntityView";
import { getEntity, listEntitiesByType, resolveId } from "@/lib/data";

export function generateStaticParams() {
  return listEntitiesByType("club:").map((p) => ({
    slug: p.id.slice("club:".length),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getEntity(resolveId("club", slug));
  return { title: data?.summary.title ?? "Club" };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getEntity(resolveId("club", slug));
  if (!data) notFound();
  return <EntityView data={data} />;
}
