import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityView } from "@/components/EntityView";
import { getEntity, listEntitiesByType, resolveId } from "@/lib/data";
import { withPageMeta } from "@/lib/site";

export async function generateStaticParams() {
  return (await listEntitiesByType("win:")).map((p) => ({
    slug: p.id.slice("win:".length),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getEntity(resolveId("win", slug));
  return withPageMeta({
    title: data?.summary.title ?? "Title",
    path: data?.summary.href ?? `/win/${slug}`,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getEntity(resolveId("win", slug));
  if (!data) notFound();
  return <EntityView data={data} />;
}
