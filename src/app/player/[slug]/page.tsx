import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayerView } from "@/components/player/PlayerView";
import { SuggestCorrection } from "@/components/SuggestCorrection";
import { getEntity, listEntitiesByType, resolveId } from "@/lib/data";

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
  const suggestion = {
    page: `/player/${data.id.slice("player:".length)}`,
    pageLabel: data.summary.title,
    prompt: "Suggest a correction or add a story",
  };
  return (
    <>
      <SuggestCorrection {...suggestion} placement="corner" />
      <PlayerView data={data} />
      <SuggestCorrection {...suggestion} />
    </>
  );
}
