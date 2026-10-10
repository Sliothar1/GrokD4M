import type { MetadataRoute } from "next";
import { readArticleUploads } from "@/lib/articles";
import { listBrowsePlayers } from "@/lib/browsePlayers";
import { getAssoc } from "@/lib/data";
import { PARISH_STORIES } from "@/lib/parishStories";
import { absUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

function abs(path: string): string {
  return absUrl(path);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const A = await getAssoc();
  const now = new Date();
  const paths = new Set<string>([
    "/",
    "/about",
    "/clubs",
    "/ask",
    "/search",
    "/stories",
    "/browse/players",
    "/browse/games",
    "/browse/decades",
    "/browse/stories",
  ]);
  for (const player of await listBrowsePlayers()) paths.add(player.href);
  for (const prefix of ["club", "team", "match", "win", "story"] as const) {
    for (const id of A.entitiesOfType(prefix)) {
      if (A.entityAttrs(id).same_as) continue;
      paths.add(`/${prefix}/${id.slice(prefix.length + 1)}`);
    }
  }
  for (const story of PARISH_STORIES) paths.add(`/story/${story.slug}`);
  for (const upload of await readArticleUploads()) {
    paths.add(`/article/${upload.id}`);
  }
  for (const id of A.entitiesOfType("article")) {
    if (A.entityAttrs(id).same_as) continue;
    const slug = id.slice("article:".length);
    paths.add(`/article/${slug.startsWith("art-") ? slug : `art-${slug}`}`);
  }
  return [...paths].sort().map((path) => ({
    url: abs(path),
    lastModified: now,
  }));
}
