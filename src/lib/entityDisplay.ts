import type { TripleVal } from "@/lib/d4m/AssocArray";
import { entityHref, isEntityRef } from "@/lib/data";
import type { SourceOrderSlot } from "@/lib/sources";

/** Never show null / empty / literal "null" on kid-facing facts. */
export function isDisplayableVal(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") {
      return false;
    }
  }
  return true;
}

export const HIDDEN_ATTRS = new Set([
  "type",
  "name",
  "title",
  "notable",
  "note",
  "body",
  "summary",
  "confidence",
  "kid_chip",
  "cuttings",
  "excerpt",
  "cite",
  "verification",
  "kind",
  "same_as",
  "season_chip",
  "pack_id",
  "hide_score",
  "score_disputed",
  "ingest_triage",
  "archivist_ruling",
  "badge",
  "status",
  "hold",
  "cutting_cite",
  "confirmed_by_family",
  "division_season",
  "photo",
  "photo_url",
  "portrait",
  "image",
  "clubs",
  "club_history",
  "parish_club",
  "also_club",
  "hero_cutting",
  "featured_cutting",
  // press_praise* and source_press_praise*. Further numbers are hidden
  // by isPressPraiseAttr via isHiddenFactKey.
  "press_praise",
  "press_praise_2",
  "source_press_praise",
  "source_press_praise_2",
  // Club memory. Never a cited fact, and never mixed into notable or note.
  "remembered",
  // Relationship edges stay off the public facts list. A printed
  // "brother" clause can remain inside a cited sentence.
  "brother",
  "brother_basis",
  "source_brother",
]);

/**
 * Newspaper praise lines and their article ids.
 * `press_praise`, `press_praise_2`, … and `source_press_praise`, `source_press_praise_2`, …
 */
const PRESS_PRAISE_ATTR = /^(?:source_)?press_praise(?:_\d+)?$/;

export function isPressPraiseAttr(k: string): boolean {
  return PRESS_PRAISE_ATTR.test(k);
}

export function isHiddenFactKey(k: string): boolean {
  if (HIDDEN_ATTRS.has(k)) return true;
  if (k.startsWith("cutting:")) return true;
  if (isPressPraiseAttr(k)) return true;
  return false;
}

/**
 * Facts that identify the person. A career stat such as `all_stars` is not
 * one of these. Linked cuttings are included because the player is named
 * on the cutting. `notable` is the intro highlight, not an identity fact.
 */
const PLAYER_IDENTITY_FACTS = new Set([
  "club",
  "note",
  "also_known_as",
  "father",
  "born",
  "nickname",
]);

export function isPlayerIdentityFact(factKey: string): boolean {
  return factKey.startsWith("cutting:") || PLAYER_IDENTITY_FACTS.has(factKey);
}

/**
 * Club division plus the season it was recorded for.
 * Seed stores the Galway SHC tier as `A` or `B` (Senior A / Senior B).
 * `Intermediate` is already the display name. No season means the division alone.
 */
export function formatDivision(division: unknown, season?: unknown): string | null {
  if (!isDisplayableVal(division)) return null;
  const raw = String(division).trim();
  const label = raw === "A" ? "Senior A" : raw === "B" ? "Senior B" : raw;
  const year = divisionSeasonYear(season);
  return year ? `${label} (${year})` : label;
}

function divisionSeasonYear(season: unknown): string | null {
  if (!isDisplayableVal(season)) return null;
  const text = String(season).trim();
  return /^(?:19|20)\d{2}$/.test(text) ? text : null;
}

/** Compact career strip — identity facts only (club chips live on the profile strip). */
export const PLAYER_FACT_KEYS = [
  "position",
  "born",
  "debut",
  "nickname",
  "father",
  "also_known_as",
  "all_ireland_medals",
  "all_stars",
] as const;

/** @deprecated Import `playerClubIds` from `@/lib/data` (club + also_club + club_1…). */
export { playerClubIds } from "@/lib/data";

/** Match header / compact facts — not the ingest sticky-note wall. */
export const MATCH_FACT_KEYS = [
  "score",
  "date",
  "venue",
  "competition",
  "round",
  "home",
  "away",
  "opponent",
  "winner",
  "result",
  "year",
  "season",
  "captain",
] as const;

export function hrefForRef(ref: string): string {
  if (isEntityRef(ref)) return entityHref(ref);
  return `/search?q=${encodeURIComponent(ref)}`;
}

/** Kid-facing glow copy — seed `notable` only. Do not invent a `bio` column. */
export function playerNotableText(
  attrs: Record<string, TripleVal>
): string | null {
  const raw = attrs.notable;
  if (!isDisplayableVal(raw)) return null;
  return String(raw);
}

/**
 * Extra prose in `notes` (plural). Shown after the archive `note`.
 * Skipped when it repeats notable or the archive note. Not an identity fact.
 */
export function playerNotesText(
  attrs: Record<string, TripleVal>
): string | null {
  const raw = attrs.notes;
  if (!isDisplayableVal(raw)) return null;
  const notes = String(raw).trim();
  const notable = playerNotableText(attrs);
  if (notable && notes === notable.trim()) return null;
  const archive = attrs.note;
  if (isDisplayableVal(archive) && notes === String(archive).trim()) return null;
  return notes;
}

/** Longer archive prose — secondary to notable, never the glow intro. */
export function playerArchiveNote(
  attrs: Record<string, TripleVal>
): string | null {
  const raw = attrs.note;
  if (!isDisplayableVal(raw)) return null;
  const note = String(raw).trim();
  const notable = playerNotableText(attrs);
  if (notable && note === notable.trim()) return null;
  return note;
}

/** @deprecated Use playerNotableText — never fall back to `note` as the glow. */
export function playerBioText(attrs: Record<string, TripleVal>): string | null {
  return playerNotableText(attrs);
}

export type PressPraiseLine = {
  key: string;
  before: string;
  linkText: string;
  after: string;
  articleId: string;
};

const PRESS_PRAISE_FACT = /^press_praise(?:_(\d+))?$/;
/** One `[bracketed phrase]` and no other brackets. */
const ONE_BRACKET = /^([^[\]]*)\[([^[\]]+)\]([^[\]]*)$/;
const ARTICLE_ID = /^(?:article:)?(art-[a-z0-9][a-z0-9-]*)$/i;

/**
 * Praise lines for the profile block.
 * A line is kept only when it has one bracketed phrase and a paired article id.
 * Numbered columns sort in numeric order after the unnumbered column.
 */
export function pressPraiseLines(
  attrs: Record<string, TripleVal>
): PressPraiseLine[] {
  const keys = Object.keys(attrs)
    .map((key) => {
      const match = key.match(PRESS_PRAISE_FACT);
      if (!match) return null;
      const index = match[1] ? Number(match[1]) : 0;
      if (!Number.isInteger(index) || index < 0) return null;
      return { key, index };
    })
    .filter((item): item is { key: string; index: number } => item !== null)
    .sort((a, b) => a.index - b.index || a.key.localeCompare(b.key));

  const lines: PressPraiseLine[] = [];
  for (const { key } of keys) {
    const raw = attrs[key];
    if (!isDisplayableVal(raw)) continue;
    const parsed = parsePressPraiseSentence(String(raw).trim());
    if (!parsed) continue;
    const articleId = pressPraiseArticleId(attrs[`source_${key}`]);
    if (!articleId) continue;
    lines.push({ key, ...parsed, articleId });
  }
  return lines;
}

function parsePressPraiseSentence(
  sentence: string
): { before: string; linkText: string; after: string } | null {
  const match = sentence.match(ONE_BRACKET);
  if (!match) return null;
  const linkText = match[2].trim();
  if (!linkText) return null;
  return { before: match[1], linkText, after: match[3] };
}

function pressPraiseArticleId(raw: unknown): string | null {
  if (!isDisplayableVal(raw)) return null;
  const match = String(raw).trim().match(ARTICLE_ID);
  return match ? match[1] : null;
}

/** Fact keys actually rendered on the player page, in section order. */
export function playerOnPageFactKeys(
  attrs: Record<string, TripleVal>,
  hasClubs: boolean
): string[] {
  const keys: string[] = [];
  if (hasClubs) keys.push("club");
  if (playerNotableText(attrs)) keys.push("notable");
  if (playerArchiveNote(attrs)) keys.push("note");
  if (playerNotesText(attrs)) keys.push("notes");
  if (attrs.kid_chip && isDisplayableVal(attrs.kid_chip)) keys.push("kid_chip");
  for (const key of PLAYER_FACT_KEYS) {
    if (isDisplayableVal(attrs[key])) keys.push(key);
  }
  return keys;
}

/** Locked cite order: club, notable, note, notes, cuttings, kid chip, career facts. */
export function playerSourceOrder(shown: readonly string[]): SourceOrderSlot[] {
  const shownSet = new Set(shown);
  const slots: SourceOrderSlot[] = [
    { fact: "club" },
    { fact: "notable" },
    { fact: "note" },
    { fact: "notes" },
    { cuttings: true },
    { fact: "kid_chip" },
    ...PLAYER_FACT_KEYS.map((fact): SourceOrderSlot => ({ fact })),
  ];
  return slots.filter((slot) =>
    "cuttings" in slot ? true : shownSet.has(slot.fact)
  );
}
