import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityView } from "@/components/EntityView";
import { JsonLd } from "@/components/JsonLd";
import { getEntity, listEntitiesByType, resolveId } from "@/lib/data";
import { withPageMeta } from "@/lib/site";
import { breadcrumbNode, jsonLdGraph, sportsTeamNode } from "@/lib/structuredData";

export async function generateStaticParams() {
  return (await listEntitiesByType("team:")).map((p) => ({
    slug: p.id.slice("team:".length),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getEntity(resolveId("team", slug));
  return withPageMeta({
    title: data?.summary.title ?? "Team",
    path: data?.summary.href ?? `/team/${slug}`,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getEntity(resolveId("team", slug));
  if (!data) notFound();
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          sportsTeamNode({
            name: data.summary.title,
            path: data.summary.href,
          }),
          breadcrumbNode([
            { name: "HurlingWiki", path: "/" },
            { name: data.summary.title, path: data.summary.href },
          ]),
        ])}
      />
      <EntityView data={data} />
    </>
  );
}
