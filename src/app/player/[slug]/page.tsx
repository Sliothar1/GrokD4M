import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayerView } from "@/components/player/PlayerView";
import { getEntity, listEntitiesByType, resolveId } from "@/lib/data";

/** Players only. Club / match / team / win / story / article keep EntityView. */

export async function generateStaticParams() {
  return (await listEntitiesByType("player:")).map((p) => ({
    slug: p.id.slice("player:".length),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getEntity(resolveId("player", slug));
  return { title: data?.summary.title ?? "Player" };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getEntity(resolveId("player", slug));
  if (!data) notFound();
  return <PlayerView data={data} />;
}
