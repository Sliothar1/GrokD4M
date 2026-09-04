import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityView } from "@/components/EntityView";
import { getEntity, listEntitiesByType, resolveId } from "@/lib/data";

export function generateStaticParams() {
  return listEntitiesByType("win:").map((p) => ({
    slug: p.id.slice("win:".length),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getEntity(resolveId("win", slug));
  return { title: data?.summary.title ?? "All-Ireland win" };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getEntity(resolveId("win", slug));
  if (!data) notFound();
  return <EntityView data={data} />;
}
