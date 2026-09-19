import type { TripleVal } from "@/lib/d4m/AssocArray";
import { entityHref, isEntityRef } from "@/lib/data";

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
  "photo",
  "photo_url",
  "portrait",
  "image",
]);

export function isHiddenFactKey(k: string): boolean {
  if (HIDDEN_ATTRS.has(k)) return true;
  if (k.startsWith("cutting:")) return true;
  return false;
}

/** Compact career strip — identity facts only, not the sticky-note wall. */
export const PLAYER_FACT_KEYS = [
  "club",
  "county",
  "position",
  "born",
  "nickname",
  "all_ireland_medals",
  "all_stars",
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
