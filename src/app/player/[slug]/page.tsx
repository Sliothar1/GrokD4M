import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PlayerView } from "@/components/player/PlayerView";
import { getAssoc, getEntity, listEntitiesByType, resolveId } from "@/lib/data";
import { canonicalPlayerSlug, uniquePlayerRedirect } from "@/lib/playerSlug";

async function loadPlayer(slug: string) {
  const mapped = canonicalPlayerSlug(slug);
  if (mapped) {
    const data = await getEntity(resolveId("player", mapped));
    return { data, redirectTo: mapped };
  }
  const direct = await getEntity(resolveId("player", slug));
  if (direct) return { data: direct, redirectTo: null as string | null };
  const target = uniquePlayerRedirect(slug, (await getAssoc()).entitiesOfType("player"));
  if (!target) return { data: null, redirectTo: null as string | null };
  const data = await getEntity(resolveId("player", target));
  return { data, redirectTo: target };
}

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
  const { data } = await loadPlayer(slug);
  return { title: data?.summary.title ?? "Player" };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data, redirectTo } = await loadPlayer(slug);
  if (redirectTo) redirect(`/player/${redirectTo}`);
  if (!data) notFound();
  return <PlayerView data={data} />;
}
