import { getAssoc } from "@/lib/data";
import { createPlayerProfileContext, decadesSpanned, playingYearsFor } from "@/lib/playerProfile";

export type BrowsePlayer = {
  id: string;
  href: string;
  title: string;
  /** Display label: one decade, a span, or Undated. */
  decade: string;
  /** Every decade from the first own mention to the last. */
  decades: string[];
};

/** Every public player, including people who are not on the Fohenagh roll. */
export async function listBrowsePlayers(): Promise<BrowsePlayer[]> {
  const A = await getAssoc();
  const ctx = await createPlayerProfileContext();
  const rows: BrowsePlayer[] = [];
  for (const id of A.entitiesOfType("player")) {
    const attrs = A.entityAttrs(id);
    if (attrs.same_as) continue;
    const name = String(attrs.name ?? "").trim();
    if (!name) continue;
    const decades = decadesSpanned(playingYearsFor(ctx, id, attrs));
    rows.push({
      id,
      href: `/player/${id.slice("player:".length)}`,
      title: name,
      decade: decades.length === 0 ? "Undated" : decades.length === 1 ? decades[0] : `${decades[0]}–${decades[decades.length - 1]}`,
      decades,
    });
  }
  rows.sort((a, b) => a.title.localeCompare(b.title, "en"));
  return rows;
}
