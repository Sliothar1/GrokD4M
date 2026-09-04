import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityView } from "@/components/EntityView";
import { getEntity, listEntitiesByType, resolveId } from "@/lib/data";

export function generateStaticParams() {
  return listEntitiesByType("match:").map((p) => ({
    slug: p.id.slice("match:".length),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getEntity(resolveId("match", slug));
  return { title: data?.summary.title ?? "Match" };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getEntity(resolveId("match", slug));
  if (!data) notFound();
  return <EntityView data={data} />;
}
