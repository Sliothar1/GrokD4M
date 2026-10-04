/**
 * Display order for cutting cards. Shared so cite numbers follow the
 * same sequence the excerpts render.
 */

export const JASON_HERO_CUTTING_IDS = [
  "art-galwaygaa-2002-galway-aihc-champions-jason-lohan",
  "art-ina-ct-2003-12-12-jason-lohan-u21",
  "art-ina-ct-2002-11-15-jason-lohan-u21",
  "art-ina-ct-2005-07-22-jason-lohan",
] as const;

export type CuttingOrderInput = {
  id: string;
  title: string;
  citeChip?: string;
  imagePath?: string;
};

export function orderCuttingCards<T extends CuttingOrderInput>(
  cuttings: readonly T[]
): T[] {
  return cuttings.map(preferKnownCuttingImage).sort(compareCuttings);
}

function cuttingBareId(c: CuttingOrderInput): string {
  const raw = c.id.includes(":") ? c.id.slice(c.id.indexOf(":") + 1) : c.id;
  return raw.toLowerCase();
}

function heroRank(c: CuttingOrderInput): number {
  const bare = cuttingBareId(c);
  const fromId = JASON_HERO_CUTTING_IDS.indexOf(
    bare as (typeof JASON_HERO_CUTTING_IDS)[number]
  );
  if (fromId !== -1) return fromId;
  const path = (c.imagePath ?? "").toLowerCase();
  const fromPath = JASON_HERO_CUTTING_IDS.findIndex((id) => path.includes(id));
  return fromPath === -1 ? 100 : fromPath;
}

function preferKnownCuttingImage<T extends CuttingOrderInput>(c: T): T {
  const bare = cuttingBareId(c);
  const hero = JASON_HERO_CUTTING_IDS.find(
    (id) => bare === id || (c.imagePath ?? "").toLowerCase().includes(id)
  );
  if (!hero) return c;
  if (c.imagePath) return c;
  return { ...c, imagePath: `/uploads/articles/${hero}.png` };
}

function compareCuttings(a: CuttingOrderInput, b: CuttingOrderInput): number {
  const ha = heroRank(a);
  const hb = heroRank(b);
  if (ha !== hb) return ha - hb;
  const ya = cuttingYear(a);
  const yb = cuttingYear(b);
  if (ya !== yb) return ya - yb;
  return a.title.localeCompare(b.title);
}

function cuttingYear(c: CuttingOrderInput): number {
  const m = `${c.citeChip ?? ""} ${c.title}`.match(/\b(19\d{2}|20[0-2]\d)\b/);
  return m ? Number(m[1]) : 0;
}
