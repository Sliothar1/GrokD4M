/**
 * Public sentences must not qualify a player as a substitute, a bench
 * player, or “on the panel”. The printed word may remain inside a clipping
 * image. It does not remain in our headings, excerpts, or captions.
 */
const QUALIFIER =
  /\b(substitut(?:e|es|ed|ion)?|subs?|bench(?:es)?|panels?)\b/i;

export function hasPlayQualifier(text: string): boolean {
  return QUALIFIER.test(text);
}

/** Keep the sentences that do not use a sub, bench, or panel qualifier. */
export function scrubPublicCopy(
  text: string | null | undefined
): string | null {
  if (!text?.trim()) return null;
  const kept = text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !QUALIFIER.test(part));
  const out = kept.join(" ").replace(/\s{2,}/g, " ").trim();
  return out || null;
}

/** A paper cite with any “team panel” tail removed. */
export function publicCite(text: string | null | undefined): string | null {
  if (!text?.trim()) return null;
  const cleaned = text
    .replace(/\s*·\s*team\s+panels?\b/gi, "")
    .replace(QUALIFIER, "")
    .replace(/\s*·\s*·\s*/g, " · ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/^[\s·]+|[\s·]+$/g, "");
  if (!cleaned || hasPlayQualifier(cleaned)) return null;
  return cleaned;
}

/** A heading or caption. Falls back when the words themselves are the qualifier. */
export function publicHeading(
  text: string | null | undefined,
  fallback: string
): string {
  const clean = text?.trim();
  if (clean && !hasPlayQualifier(clean)) return clean;
  return publicCite(fallback) ?? "Newspaper cutting";
}
