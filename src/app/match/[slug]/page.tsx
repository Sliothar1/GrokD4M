import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MatchView } from "@/components/match/MatchView";
import { getEntity, listEntitiesByType, resolveId } from "@/lib/data";
import { withPageMeta } from "@/lib/site";

export async function generateStaticParams() {
  return (await listEntitiesByType("match:")).map((p) => ({
    slug: p.id.slice("match:".length),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getEntity(resolveId("match", slug));
  return withPageMeta({
    title: data?.summary.title ?? "Match",
    path: data?.summary.href ?? `/match/${slug}`,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getEntity(resolveId("match", slug));
  if (!data) notFound();
  return <MatchView data={data} />;
}
