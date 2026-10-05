import {
  articleToSummary,
  normalizeClubTags,
  readArticleUploads,
} from "@/lib/articles";
import type { EntitySummary } from "@/lib/data";

/** Used when club:fohenagh-historic has no usable pinned image. */
const FOHENAGH_HERO_FALLBACKS = [
  "art-ct-1959-09-05-fohenagh-castlegar-portrait",
  "art-ina-ct-1999-09-10-fohenagh-1959-60-champs-honoured",
  "art-ct-1959-09-19-fohenagh-team-caption",
] as const;

export function articleIdFromRef(raw: string): string {
  let id = raw.trim();
  if (/^article:/i.test(id)) id = id.slice("article:".length);
  return id;
}

/** hero_cutting / featured_cutting, with or without an article: prefix. */
export function pinnedCuttingId(
  attrs: Record<string, unknown>
): string | null {
  const raw = attrs.hero_cutting ?? attrs.featured_cutting;
  if (typeof raw !== "string" || !raw.trim()) return null;
  const id = articleIdFromRef(raw);
  return id || null;
}

function bareId(id: string): string {
  return articleIdFromRef(id).toLowerCase();
}

/** INA search snips that highlight a name on a parish note, not a title headline. */
export function isYellowSearchHighlightNote(c: {
  id: string;
  title?: string;
  excerpt?: string;
  citeChip?: string;
}): boolean {
  const blob = `${c.id} ${c.title ?? ""} ${c.excerpt ?? ""} ${c.citeChip ?? ""}`.toLowerCase();
  const ina = blob.includes("art-ina-") || /\bina\b/.test(blob);
  const minorNote = /club notes|minor hurling|among the subs/.test(blob);
  return ina && minorNote;
}

/** Championship-era headline cuttings (1958–1963 Fohenagh window and the same shape). */
export function isTitleEraCutting(c: {
  id: string;
  title?: string;
  excerpt?: string;
  citeChip?: string;
}): boolean {
  const id = c.id.toLowerCase();
  if (/art-ct-19(5[89]|6[0-3])-/.test(id)) return true;
  const blob = `${id} ${c.title ?? ""} ${c.excerpt ?? ""} ${c.citeChip ?? ""}`.toLowerCase();
  const year = blob.match(/\b(19(?:5[89]|6[0-3]))\b/);
  return (
    Boolean(year) &&
    /final|champ|title|thriller|portrait|replay|team panel|team caption/.test(blob)
  );
}

type HeroCard = EntitySummary & { clubTags?: string[] };

function heroScore(c: HeroCard, clubId: string): number {
  const exact = (c.clubTags ?? []).some((tag) => tag.toLowerCase() === clubId)
    ? 100
    : 0;
  const era = isTitleEraCutting(c) ? 40 : 0;
  const yellow = isYellowSearchHighlightNote(c) ? -80 : 0;
  return exact + era + yellow;
}

/**
 * Club and player heroes: pinned cutting, then Fohenagh fallbacks,
 * then an exact club-tag image that is not a yellow minor note
 * when a title-era cutting is available.
 */
export async function resolveEntityHero(input: {
  entityId: string;
  kind: string;
  attrs: Record<string, unknown>;
  cuttings: EntitySummary[];
}): Promise<EntitySummary | undefined> {
  const { entityId, kind, attrs, cuttings } = input;
  if (kind !== "club" && kind !== "player") {
    return cuttings.find((c) => c.imagePath) ?? cuttings[0];
  }

  const uploads = await readArticleUploads();
  const byId = new Map(uploads.map((upload) => [upload.id.toLowerCase(), upload]));

  const enrich = (cutting: EntitySummary): HeroCard => {
    const upload = byId.get(bareId(cutting.id));
    const fromUpload = upload ? articleToSummary(upload) : undefined;
    return {
      ...cutting,
      imagePath: cutting.imagePath ?? fromUpload?.imagePath,
      href: cutting.href || fromUpload?.href || cutting.href,
      clubTags: upload ? normalizeClubTags(upload.clubTags) : undefined,
    };
  };

  const fromId = (id: string): HeroCard | undefined => {
    const listed = cuttings.find((cutting) => bareId(cutting.id) === id.toLowerCase());
    if (listed) {
      const card = enrich(listed);
      return card.imagePath ? card : undefined;
    }
    const upload = byId.get(id.toLowerCase());
    if (!upload) return undefined;
    const summary = articleToSummary(upload);
    if (!summary.imagePath) return undefined;
    return { ...summary, clubTags: normalizeClubTags(upload.clubTags) };
  };

  const pinned = pinnedCuttingId(attrs);
  if (pinned) {
    const hit = fromId(pinned);
    if (hit?.imagePath) return hit;
  }

  if (entityId === "club:fohenagh-historic") {
    for (const id of FOHENAGH_HERO_FALLBACKS) {
      if (pinned && id === pinned.toLowerCase()) continue;
      const hit = fromId(id);
      if (hit?.imagePath) return hit;
    }
  }

  const pool = cuttings.map(enrich).filter((cutting) => cutting.imagePath);
  if (pool.length === 0) return cuttings[0];

  const clubId = entityId.toLowerCase();
  const ranked = [...pool].sort((a, b) => heroScore(b, clubId) - heroScore(a, clubId));
  if (isYellowSearchHighlightNote(ranked[0])) {
    const better = ranked.find(
      (cutting) => isTitleEraCutting(cutting) && !isYellowSearchHighlightNote(cutting)
    );
    if (better) return better;
  }
  return ranked[0];
}
