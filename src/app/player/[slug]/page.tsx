import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { PlayerView } from "@/components/player/PlayerView";
import { getEntity, resolveId } from "@/lib/data";
import { loadPlayerProfile } from "@/lib/playerProfile";
import { playerShareDescription } from "@/lib/playerShare";
import { withPageMeta } from "@/lib/site";
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
  return [...slugs].map((slug) => ({ slug }));
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
  const path =
    decision.status === 308
      ? `/player/${decision.target}`
      : decision.status === 307
        ? decision.target
        : `/player/${decision.status === 200 ? decision.slug : slug}`;
  const profile = data ? await loadPlayerProfile(data.id, data.attrs) : null;
  return withPageMeta({
    title: data?.summary.title ?? "Search",
    path,
    description: profile ? playerShareDescription(profile) : undefined,
  });
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
  if (decision.status === 307) redirect(decision.target);
  const data = await getEntity(resolveId("player", decision.slug));
  if (!data) notFound();
  return <PlayerView data={data} />;
}
