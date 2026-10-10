/**
 * One public Fohenagh slug for a person who also has another id.
 * The other ids stay in the seed. Their pages redirect here.
 */
export const CANONICAL_PLAYER_SLUG: Record<string, string> = {
  "alan-moclair": "alan-moclair-ahascragh-fohenagh",
  "alan-mockler": "alan-moclair-ahascragh-fohenagh",
  "alan-moclair-fohenagh": "alan-moclair-ahascragh-fohenagh",
  "alan-mochlair-fohenagh": "alan-moclair-ahascragh-fohenagh",
  "martin-glynn-fohenagh": "marty-glynn-fohenagh",
  "fr-nicholas-murray": "nicholas-murray",
  "cathal-lohan": "cathal-lohan-fohenagh",
  "tim-sweeney": "tim-sweeney-fohenagh",
  "jimmy-devine": "jimmy-devine-fohenagh",
  "brendan-noone": "brendan-noone-fohenagh",
  "sarah-noone": "sarah-noone-fohenagh",
  // Carol Mitchell is Karl Mitchell, confirmed 7 Oct
  "carol-mitchell": "karl-mitchell-fohenagh",
  "carol-mitchell-fohenagh": "karl-mitchell-fohenagh",
};

export function canonicalPlayerSlug(slug: string): string | null {
  const target = CANONICAL_PLAYER_SLUG[slug.trim().toLowerCase()];
  return target && target !== slug ? target : null;
}

export function aliasPlayerIds(canonicalSlug: string): string[] {
  return Object.entries(CANONICAL_PLAYER_SLUG)
    .filter(([, target]) => target === canonicalSlug)
    .map(([alias]) => `player:${alias}`)
    .filter((id) => id !== `player:${canonicalSlug}`);
}

/**
 * Short player slugs redirect only when one longer id starts with that slug.
 * An exact id is left alone. Two longer ids is ambiguous and stays a 404.
 * A slug in CANONICAL_PLAYER_SLUG always goes to that one page.
 */
export function uniquePlayerRedirect(
  requested: string,
  playerIds: readonly string[]
): string | null {
  const slug = requested.trim().toLowerCase();
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return null;
  const mapped = canonicalPlayerSlug(slug);
  if (mapped) return mapped;
  if (playerIds.includes(`player:${slug}`)) return null;
  const hits = playerIds.filter((id) => id.startsWith(`player:${slug}-`));
  if (hits.length !== 1) return null;
  return hits[0].slice("player:".length);
}
