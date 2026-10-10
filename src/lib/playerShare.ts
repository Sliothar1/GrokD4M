import { firstBannedPublicHit, firstPublicSentence } from "@/lib/publicText";
import { SITE_DESCRIPTION } from "@/lib/site";
import { publicProse } from "@/lib/structuredData";

/** Open Graph and Twitter descriptions stay inside a typical share card. */
export const SHARE_DESCRIPTION_LIMIT = 160;

/**
 * Plain share text. Citation markers are removed. Banned and internal sentences
 * are dropped by the same public-text gate as the profile page.
 */
function shareSentence(value: string | null | undefined): string {
  const prose = publicProse(String(value ?? "").replace(/\[\d+\]/g, " "));
  if (!prose || firstBannedPublicHit(prose)) return "";
  const sentence = firstPublicSentence(prose).replace(/\[\d+\]/g, "").replace(/\s+/g, " ").trim();
  if (!sentence || firstBannedPublicHit(sentence)) return "";
  return clipShareText(sentence);
}

/** Cut at the last whole word that still fits. */
export function clipShareText(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= SHARE_DESCRIPTION_LIMIT) return flat;
  const room = flat.slice(0, SHARE_DESCRIPTION_LIMIT + 1);
  const space = room.lastIndexOf(" ");
  const cut = (space > 0 ? room.slice(0, space) : flat.slice(0, SHARE_DESCRIPTION_LIMIT)).trim();
  return cut.replace(/[,:;–—-]+$/g, "").trim();
}

/**
 * Player share description: public tagline, else the first sentence of the
 * public lead, else the site description.
 */
export function playerShareDescription(input: {
  headline?: string | null;
  summary?: string | null;
}): string {
  const headline = shareSentence(input.headline);
  if (headline) return headline;
  const lead = shareSentence(input.summary);
  if (lead) return lead;
  return SITE_DESCRIPTION;
}
