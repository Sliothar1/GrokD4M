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

/** Kid-facing line from seed `notable`, then archive `note`. Never a `bio` col. */
export function playerBioText(attrs: Record<string, TripleVal>): string | null {
  const raw = attrs.notable ?? attrs.note ?? attrs.body ?? attrs.summary ?? attrs.excerpt;
  if (!isDisplayableVal(raw)) return null;
  return String(raw);
}
