import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { PlayerView } from "@/components/player/PlayerView";
import { getEntity, resolveId } from "@/lib/data";
import { CANONICAL_PLAYER_SLUG } from "@/lib/playerSlug";
import {
  getPlayerRedirectIndex,
  historicalSlugRecords,
  resolvePlayerSlug,
} from "@/lib/playerRedirects";

export async function generateStaticParams() {
  const index = await getPlayerRedirectIndex();
  const slugs = new Set<string>(index.players);
  for (const record of historicalSlugRecords()) slugs.add(record.slug);
  for (const slug of Object.keys(CANONICAL_PLAYER_SLUG)) slugs.add(slug);
  const params: { slug: string }[] = [];
  for (const slug of slugs) {
    const decision = resolvePlayerSlug(slug, index);
    if (decision.status === 404) continue;
    params.push({ slug });
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const index = await getPlayerRedirectIndex();
  const decision = resolvePlayerSlug(slug, index);
  const served = decision.status === 308 ? decision.target : decision.status === 200 ? decision.slug : "";
  const data = served ? await getEntity(resolveId("player", served)) : null;
  return { title: data?.summary.title ?? "Player" };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const index = await getPlayerRedirectIndex();
  const decision = resolvePlayerSlug(slug, index);
  if (decision.status === 308) permanentRedirect(`/player/${decision.target}`);
  if (decision.status !== 200) notFound();
  const data = await getEntity(resolveId("player", decision.slug));
  if (!data) notFound();
  return <PlayerView data={data} />;
}
