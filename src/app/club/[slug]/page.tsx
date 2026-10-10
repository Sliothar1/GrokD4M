import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityView } from "@/components/EntityView";
import { CorrectionLink } from "@/components/CorrectionLink";
import { JsonLd } from "@/components/JsonLd";
import { getEntity, listEntitiesByType, resolveId } from "@/lib/data";
import { withPageMeta } from "@/lib/site";
import { breadcrumbNode, jsonLdGraph, sportsTeamNode } from "@/lib/structuredData";

export async function generateStaticParams() {
  return (await listEntitiesByType("club:")).map((p) => ({
    slug: p.id.slice("club:".length),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getEntity(resolveId("club", slug));
  return withPageMeta({
    title: data?.summary.title ?? "Club",
    path: data?.summary.href ?? `/club/${slug}`,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getEntity(resolveId("club", slug));
  if (!data) notFound();
  const county = typeof data.attrs.county === "string" ? data.attrs.county : "";
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          sportsTeamNode({
            name: data.summary.title,
            path: data.summary.href,
            county,
            sportHint: data.summary.title,
          }),
          breadcrumbNode([
            { name: "HurlingWiki", path: "/" },
            { name: "Clubs", path: "/clubs" },
            { name: data.summary.title, path: data.summary.href },
          ]),
        ])}
      />
      <EntityView data={data} />
      <CorrectionLink page={`/club/${data.id.slice("club:".length)}`} />
    </>
  );
}
