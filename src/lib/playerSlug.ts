/**
 * Short player slugs redirect only when one longer id starts with that slug.
 * An exact id is left alone. Two longer ids is ambiguous and stays a 404.
 */
export function uniquePlayerRedirect(
  requested: string,
  playerIds: readonly string[]
): string | null {
  const slug = requested.trim().toLowerCase();
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return null;
  if (playerIds.includes(`player:${slug}`)) return null;
  const hits = playerIds.filter((id) => id.startsWith(`player:${slug}-`));
  if (hits.length !== 1) return null;
  return hits[0].slice("player:".length);
}
