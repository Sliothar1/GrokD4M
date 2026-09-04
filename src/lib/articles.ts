import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import {
  loadAssocFromJson,
  type Triple,
} from "@/lib/d4m/AssocArray";
import seed from "../../data/seed.json";
import type { EntitySummary } from "@/lib/data";

const execFileAsync = promisify(execFile);

export type ArticleUploadStatus = "pending" | "decomposed";

export interface ArticleUpload {
  id: string;
  filename: string;
  path: string;
  uploadedAt: string;
  caption?: string;
  year?: string;
  tags: string[];
  clubTags: string[];
  ocrText?: string;
  status: ArticleUploadStatus;
  derivedTriples?: Triple[];
}

const META_PATH = path.join(process.cwd(), "data", "article-uploads.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "articles");
const PUBLIC_PREFIX = "/uploads/articles";

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export function ensureUploadDir(): void {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export function readArticleUploads(): ArticleUpload[] {
  try {
    if (!existsSync(META_PATH)) return [];
    const raw = readFileSync(META_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ArticleUpload[]) : [];
  } catch {
    return [];
  }
}

function writeArticleUploads(list: ArticleUpload[]): void {
  writeFileSync(META_PATH, JSON.stringify(list, null, 2), "utf8");
}

export function getArticleUpload(id: string): ArticleUpload | null {
  return readArticleUploads().find((a) => a.id === id) ?? null;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/** Best-effort OCR via system tesseract; empty string if unavailable. */
export async function ocrImage(absPath: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync(
      "tesseract",
      [absPath, "stdout", "-l", "eng", "--psm", "6"],
      { timeout: 45000, maxBuffer: 2 * 1024 * 1024 }
    );
    return String(stdout ?? "")
      .replace(/\r/g, "")
      .trim();
  } catch {
    return "";
  }
}

/** Known club display names → entity ids from seed (no data.ts cycle). */
function knownClubs(): { id: string; name: string; tokens: string[] }[] {
  const A = loadAssocFromJson(seed);
  return A.entitiesOfType("club").map((id) => {
    const name = String(A.entityAttrs(id).name ?? id.slice(5));
    const tokens = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2);
    return { id, name, tokens };
  });
}

/**
 * Cautious fact extraction — only clear years, tagged/known clubs, and
 * scores that appear in the human caption (never invent from blurry OCR).
 */
export function decomposeConfidentFacts(
  upload: Pick<ArticleUpload, "id" | "caption" | "year" | "tags" | "clubTags" | "ocrText">
): Triple[] {
  const triples: Triple[] = [];
  const source = `upload:${upload.id}`;
  const row = `article:${upload.id}`;
  const caption = (upload.caption ?? "").trim();
  const ocr = (upload.ocrText ?? "").trim();
  const blob = `${caption} ${upload.tags.join(" ")} ${upload.clubTags.join(" ")}`.toLowerCase();

  triples.push({ row, col: "type", val: "article_upload" });
  triples.push({ row, col: "source", val: source });
  triples.push({ row, col: "confidence", val: "community" });
  if (caption) triples.push({ row, col: "title", val: caption.slice(0, 120) });

  // Year: prefer explicit field, else caption, else OCR only if unambiguous single year
  let year = (upload.year ?? "").trim();
  if (!year) {
    const fromCaption = caption.match(/\b(19\d{2}|20[0-2]\d)\b/);
    if (fromCaption) year = fromCaption[1];
  }
  if (!year && ocr) {
    const years = [...ocr.matchAll(/\b(19\d{2}|20[0-2]\d)\b/g)].map((m) => m[1]);
    const uniq = [...new Set(years)];
    if (uniq.length === 1) year = uniq[0];
  }
  if (year && /^(19\d{2}|20[0-2]\d)$/.test(year)) {
    triples.push({ row, col: "year", val: year });
  }

  // Clubs from tags first
  const linkedClubs = new Set<string>();
  for (const tag of upload.clubTags) {
    const t = tag.trim();
    if (/^club:[a-z0-9-]+$/i.test(t)) linkedClubs.add(t.toLowerCase());
  }

  // Match known club names in caption (high confidence) or OCR (name must be multi-token or distinctive)
  const clubs = knownClubs();
  const searchText = `${caption} ${ocr}`.toLowerCase();
  for (const club of clubs) {
    const nameLower = club.name.toLowerCase();
    if (nameLower.length < 4) continue;
    if (blob.includes(nameLower) || searchText.includes(nameLower)) {
      // Require caption hit OR distinctive name (≥2 tokens / length≥8) for OCR-only
      if (blob.includes(nameLower) || nameLower.length >= 8 || club.tokens.length >= 2) {
        linkedClubs.add(club.id);
      }
    }
  }

  let clubIdx = 0;
  for (const clubId of linkedClubs) {
    const col = clubIdx === 0 ? "club" : `club_${clubIdx}`;
    triples.push({ row, col, val: clubId });
    clubIdx += 1;
  }

  // Scores ONLY from human caption — never from OCR alone
  const scoreInCaption = caption.match(
    /\b(\d{1,2}-\d{1,2})\s*(?:to|–|-|beat|defeated)?\s*(\d{1,2}-\d{1,2})?\b/i
  );
  if (scoreInCaption && scoreInCaption[1]) {
    const score = scoreInCaption[2]
      ? `${scoreInCaption[1]} to ${scoreInCaption[2]}`
      : scoreInCaption[1];
    // Only store if caption clearly frames it (has digits-dash pattern twice or "to")
    if (/to|beat|defeated|final|score/i.test(caption) || scoreInCaption[2]) {
      triples.push({ row, col: "score", val: score });
      triples.push({ row, col: "score_note", val: "From caption (not OCR)" });
    }
  }

  return triples;
}

export async function saveArticleUpload(input: {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  caption?: string;
  year?: string;
  tags?: string[];
  clubTags?: string[];
}): Promise<ArticleUpload> {
  const ext = ALLOWED_MIME[input.mimeType.toLowerCase()];
  if (!ext) {
    throw new Error("Please upload a JPG, PNG, WebP, or GIF image.");
  }
  if (input.buffer.length > 8 * 1024 * 1024) {
    throw new Error("Image must be under 8 MB.");
  }

  ensureUploadDir();
  const id = `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const base =
    slugify(path.parse(input.originalName).name) || "article";
  const filename = `${id}-${base}${ext}`;
  const abs = path.join(UPLOAD_DIR, filename);
  writeFileSync(abs, input.buffer);

  const caption = (input.caption ?? "").trim().slice(0, 500) || undefined;
  const year = (input.year ?? "").trim().slice(0, 4) || undefined;
  const tags = (input.tags ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
  const clubTags = (input.clubTags ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8);

  const ocrText = await ocrImage(abs);
  const draft: ArticleUpload = {
    id,
    filename,
    path: `${PUBLIC_PREFIX}/${filename}`,
    uploadedAt: new Date().toISOString(),
    caption,
    year,
    tags,
    clubTags,
    ocrText: ocrText || undefined,
    status: "pending",
  };

  const derived = decomposeConfidentFacts(draft);
  const hasFacts = derived.some(
    (t) => t.col === "year" || t.col === "club" || t.col === "score" || t.col.startsWith("club_")
  );
  draft.derivedTriples = derived;
  draft.status = hasFacts || ocrText ? "decomposed" : "pending";

  const list = readArticleUploads();
  list.unshift(draft);
  writeArticleUploads(list);
  return draft;
}

export function articleToSummary(a: ArticleUpload): EntitySummary {
  const title = a.caption?.trim() || `Article photo (${a.year || "undated"})`;
  const bits = [
    a.year,
    a.clubTags[0],
    a.tags.slice(0, 2).join(", "),
  ].filter(Boolean);
  const snippet = (a.ocrText || a.caption || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
  return {
    id: `article:${a.id}`,
    kind: "article_upload",
    title,
    subtitle: bits.length ? bits.join(" · ") : snippet || "Newspaper / article scan",
    href: `/article/${a.id}`,
    confidence: "community",
    trustLabel: "From your upload",
    badge: "From your upload",
    imagePath: a.path,
  };
}

export function searchArticleUploads(query: string): EntitySummary[] {
  const normalized = query
    .trim()
    .toLowerCase()
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ");
  const tokens = normalized
    .split(" ")
    .filter(Boolean)
    .map((tok) => (tok.length > 3 && tok.endsWith("s") ? tok.slice(0, -1) : tok));
  if (tokens.length === 0) return [];

  const out: EntitySummary[] = [];
  for (const a of readArticleUploads()) {
    const blob = [
      a.caption,
      a.year,
      a.tags.join(" "),
      a.clubTags.join(" "),
      a.ocrText,
      a.filename,
      a.id,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (tokens.every((tok) => blob.includes(tok))) {
      out.push(articleToSummary(a));
    }
  }
  return out;
}

export function allDerivedUploadTriples(): Triple[] {
  const out: Triple[] = [];
  for (const a of readArticleUploads()) {
    if (a.derivedTriples?.length) out.push(...a.derivedTriples);
  }
  return out;
}
