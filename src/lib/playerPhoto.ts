import { existsSync } from "fs";
import path from "path";
import type { TripleVal } from "@/lib/d4m/AssocArray";
import { isDisplayableVal } from "@/lib/entityDisplay";

const PHOTO_EXTS = ["jpg", "jpeg", "png", "webp"] as const;

/**
 * Profile picture for the player strip.
 * Honors seed attrs (photo / photo_url / portrait) or a file later dropped at
 * /uploads/players/<slug>.(jpg|png|webp). No photo backend required.
 */
export function resolvePlayerPhoto(
  slug: string,
  attrs: Record<string, TripleVal>
): string | null {
  for (const key of ["photo", "photo_url", "portrait"] as const) {
    const raw = attrs[key];
    if (!isDisplayableVal(raw)) continue;
    const v = String(raw).trim();
    if (v.startsWith("/") || /^https?:\/\//i.test(v)) return v;
  }

  for (const ext of PHOTO_EXTS) {
    const rel = `/uploads/players/${slug}.${ext}`;
    const abs = path.join(process.cwd(), "public", rel);
    if (existsSync(abs)) return rel;
  }
  return null;
}

/** Public Stories upload — cuttings today; panel photos can land later. */
export function playerPhotoUploadHref(playerId: string): string {
  const slug = playerId.startsWith("player:")
    ? playerId.slice("player:".length)
    : playerId;
  return `/stories?link=${encodeURIComponent(`player:${slug}`)}#upload`;
}
