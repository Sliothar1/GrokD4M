import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { list, put } from "@vercel/blob";
import {
  loadAssocFromJson,
  type Triple,
} from "@/lib/d4m/AssocArray";
import seed from "../../data/seed.json";
import type { EntitySummary } from "@/lib/data";

const execFileAsync = promisify(execFile);

export type ArticleUploadStatus = "pending" | "decomposed";
export type ArticleKind = "image" | "pdf" | "url";

/**
 * Ingest Lab cuttings contract:
 * - Public: thumbnail/path, short excerpt, YYYY · Paper cite, linked entities, "from cutting"
 * - Private: full OCR / pdftotext (never sent to client cards)
 * - Derived triples stay confidence=unverified until Tribes Archivist clears
 */
export interface ArticleUpload {
  id: string;
  kind: ArticleKind;
  filename?: string;
  /** Public asset path or Blob URL (image, PDF, or optional URL preview image) */
  path?: string;
  /** Blob CDN URL when stored on Vercel Blob (alias of path for media) */
  publicUrl?: string;
  /** Alias for public thumb / media URL (search + match clips) */
  imageUrl?: string;
  /** Original source URL when kind=url */
  sourceUrl?: string;
  uploadedAt: string;
  caption?: string;
  year?: string;
  tags: string[];
  clubTags: string[];
  /** Short public excerpt for search cards — never the full private text */
  excerpt?: string;
  /** Cite chip, e.g. "1960 · Paper" */
  citeChip?: string;
  /** @deprecated kept for old rows; prefer privateTextPath / privateText */
  ocrText?: string;
  /** Absolute-relative path under data/private/article-text/ (local only) */
  privateTextPath?: string;
  /**
   * Private OCR / PDF text kept in Blob metadata JSON when small
   * (stripped from public API responses).
   */
  privateText?: string;
  /** Optional private Blob URL/pathname for larger OCR text */
  privateTextUrl?: string;
  status: ArticleUploadStatus;
  derivedTriples?: Triple[];
  /** Page title fetched from URL when available */
  fetchedTitle?: string;
}

const META_PATH = path.join(process.cwd(), "data", "article-uploads.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "articles");
const PRIVATE_TEXT_DIR = path.join(
  process.cwd(),
  "data",
  "private",
  "article-text"
);
const PUBLIC_PREFIX = "/uploads/articles";
const BLOB_META_PREFIX = "cuttings/meta/";
const BLOB_MEDIA_PREFIX = "cuttings/media/";
const BLOB_PRIVATE_PREFIX = "cuttings/private/";
const PRIVATE_TEXT_INLINE_MAX = 180_000;

const IMAGE_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const PDF_MIME = "application/pdf";

const MISSING_BLOB_MSG =
  "Uploads need Vercel Blob — connect Blob store to this project.";

/** True when Vercel Blob credentials are present (token and/or connected store). */
export function isBlobStorageEnabled(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID
  );
}

function assertWritableStorage(): void {
  if (isBlobStorageEnabled()) return;
  if (process.env.VERCEL) {
    throw new Error(MISSING_BLOB_MSG);
  }
}

/** Public media URL for cards / match clips / article page. */
export function articleMediaUrl(a: ArticleUpload): string | undefined {
  return a.publicUrl || a.imageUrl || a.path;
}

export function ensureUploadDir(): void {
  if (isBlobStorageEnabled()) return;
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  if (!existsSync(PRIVATE_TEXT_DIR)) {
    mkdirSync(PRIVATE_TEXT_DIR, { recursive: true });
  }
}

function readArticleUploadsFromFs(): ArticleUpload[] {
  try {
    if (!existsSync(META_PATH)) return [];
    const raw = readFileSync(META_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ArticleUpload[]) : [];
  } catch {
    return [];
  }
}

function writeArticleUploadsToFs(list: ArticleUpload[]): void {
  writeFileSync(META_PATH, JSON.stringify(list, null, 2), "utf8");
}

let blobMetaCache: { at: number; list: ArticleUpload[] } | null = null;
const BLOB_CACHE_MS = 8_000;

export function invalidateBlobMetaCache(): void {
  blobMetaCache = null;
}

async function listArticleUploadsFromBlob(): Promise<ArticleUpload[]> {
  if (
    blobMetaCache &&
    Date.now() - blobMetaCache.at < BLOB_CACHE_MS
  ) {
    return blobMetaCache.list;
  }

  const articles: ArticleUpload[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({
      prefix: BLOB_META_PREFIX,
      cursor,
      limit: 1000,
    });
    for (const blob of page.blobs) {
      if (!blob.pathname.endsWith(".json")) continue;
      try {
        const res = await fetch(blob.url, {
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) continue;
        const parsed = (await res.json()) as ArticleUpload;
        if (parsed && typeof parsed.id === "string") {
          articles.push(normalizeStoredArticle(parsed));
        }
      } catch {
        /* skip bad meta blob */
      }
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  articles.sort((a, b) =>
    String(b.uploadedAt).localeCompare(String(a.uploadedAt))
  );
  blobMetaCache = { at: Date.now(), list: articles };
  return articles;
}

function normalizeStoredArticle(a: ArticleUpload): ArticleUpload {
  const media = a.publicUrl || a.imageUrl || a.path;
  if (media) {
    a.path = a.path || media;
    a.publicUrl = a.publicUrl || media;
    if (a.kind !== "pdf" && !media.toLowerCase().endsWith(".pdf")) {
      a.imageUrl = a.imageUrl || media;
    }
  }
  a.tags = Array.isArray(a.tags) ? a.tags : [];
  a.clubTags = Array.isArray(a.clubTags) ? a.clubTags : [];
  return a;
}

async function putArticleMetaBlob(article: ArticleUpload): Promise<void> {
  await put(
    `${BLOB_META_PREFIX}${article.id}.json`,
    JSON.stringify(article, null, 2),
    {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
      addRandomSuffix: false,
    }
  );
  invalidateBlobMetaCache();
}

async function putPublicMediaBlob(
  filename: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const result = await put(`${BLOB_MEDIA_PREFIX}${filename}`, body, {
    access: "public",
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return result.url;
}

/**
 * Prefer embedding small OCR in metadata JSON (no /var/task write).
 * Larger text goes to a separate public pathname under cuttings/private/
 * (store is typically public so thumbs work; path is not linked on cards).
 */
async function storePrivateTextBlob(
  id: string,
  text: string
): Promise<Pick<ArticleUpload, "privateText" | "privateTextUrl">> {
  const cleaned = text.replace(/\r/g, "").trim();
  if (!cleaned) return {};
  if (cleaned.length <= PRIVATE_TEXT_INLINE_MAX) {
    return { privateText: cleaned };
  }
  const result = await put(
    `${BLOB_PRIVATE_PREFIX}${id}.txt`,
    cleaned,
    {
      access: "public",
      contentType: "text/plain; charset=utf-8",
      addRandomSuffix: false,
      allowOverwrite: true,
    }
  );
  return { privateTextUrl: result.url };
}

export async function readArticleUploads(): Promise<ArticleUpload[]> {
  if (isBlobStorageEnabled()) {
    return listArticleUploadsFromBlob();
  }
  return readArticleUploadsFromFs();
}

export async function getArticleUpload(
  id: string
): Promise<ArticleUpload | null> {
  const list = await readArticleUploads();
  return list.find((a) => a.id === id) ?? null;
}

/** Public-safe view of an upload — strips private full text. */
export function toPublicArticle(a: ArticleUpload): Omit<
  ArticleUpload,
  "ocrText" | "privateTextPath" | "privateText" | "privateTextUrl"
> & { hasPrivateText: boolean } {
  const {
    ocrText: _o,
    privateTextPath: _p,
    privateText: _t,
    privateTextUrl: _u,
    ...rest
  } = a;
  return {
    ...rest,
    hasPrivateText: Boolean(_p || _o || _t || _u),
  };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function writePrivateTextLocal(id: string, text: string): string | undefined {
  const cleaned = text.replace(/\r/g, "").trim();
  if (!cleaned) return undefined;
  ensureUploadDir();
  const rel = `${id}.txt`;
  writeFileSync(path.join(PRIVATE_TEXT_DIR, rel), cleaned, "utf8");
  return rel;
}

/** Server-only: load private OCR / PDF text for search indexing. */
export async function readPrivateText(a: ArticleUpload): Promise<string> {
  if (a.privateText?.trim()) return a.privateText.trim();
  if (a.privateTextUrl) {
    try {
      const res = await fetch(a.privateTextUrl, {
        signal: AbortSignal.timeout(12000),
      });
      if (res.ok) return (await res.text()).trim();
    } catch {
      /* ignore */
    }
  }
  if (a.privateTextPath) {
    try {
      const abs = path.join(PRIVATE_TEXT_DIR, a.privateTextPath);
      if (existsSync(abs)) return readFileSync(abs, "utf8");
    } catch {
      /* ignore */
    }
  }
  return (a.ocrText ?? "").trim();
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

/** Best-effort pdftotext; empty if unavailable. */
export async function pdfToText(absPath: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync(
      "pdftotext",
      ["-layout", "-enc", "UTF-8", absPath, "-"],
      { timeout: 45000, maxBuffer: 4 * 1024 * 1024 }
    );
    return String(stdout ?? "")
      .replace(/\r/g, "")
      .trim();
  } catch {
    return "";
  }
}

/** OCR/PDF extract from buffer via /tmp (writable on Vercel); never /var/task. */
async function extractTextFromBuffer(
  buffer: Buffer,
  filename: string,
  isPdf: boolean
): Promise<string> {
  const tmp = path.join("/tmp", filename);
  try {
    writeFileSync(tmp, buffer);
    return isPdf ? await pdfToText(tmp) : await ocrImage(tmp);
  } catch {
    return "";
  } finally {
    try {
      if (existsSync(tmp)) unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  }
}

function makeExcerpt(parts: (string | undefined)[], max = 160): string | undefined {
  const joined = parts
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (!joined) return undefined;
  if (joined.length <= max) return joined;
  return `${joined.slice(0, max - 1).trim()}…`;
}

function makeCiteChip(year?: string): string {
  const y = (year ?? "").trim();
  if (y && /^(19\d{2}|20[0-2]\d)$/.test(y)) return `${y} · Paper`;
  return "Paper";
}

function inferYear(
  explicit: string | undefined,
  caption: string,
  privateText: string
): string | undefined {
  let year = (explicit ?? "").trim();
  if (!year) {
    const fromCaption = caption.match(/\b(19\d{2}|20[0-2]\d)\b/);
    if (fromCaption) year = fromCaption[1];
  }
  if (!year && privateText) {
    const years = [...privateText.matchAll(/\b(19\d{2}|20[0-2]\d)\b/g)].map(
      (m) => m[1]
    );
    const uniq = [...new Set(years)];
    if (uniq.length === 1) year = uniq[0];
  }
  if (year && /^(19\d{2}|20[0-2]\d)$/.test(year)) return year;
  return undefined;
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
 * All derived triples are unverified until Tribes Archivist clears them.
 */
export function decomposeConfidentFacts(
  upload: Pick<
    ArticleUpload,
    | "id"
    | "caption"
    | "year"
    | "tags"
    | "clubTags"
    | "ocrText"
    | "excerpt"
    | "sourceUrl"
    | "fetchedTitle"
    | "kind"
  > & { privateText?: string }
): Triple[] {
  const triples: Triple[] = [];
  const source = upload.sourceUrl
    ? `url:${upload.sourceUrl}`
    : `upload:${upload.id}`;
  const row = `article:${upload.id}`;
  const caption = (upload.caption ?? "").trim();
  const privateText = (
    upload.privateText ??
    upload.ocrText ??
    ""
  ).trim();
  const blob = `${caption} ${upload.tags.join(" ")} ${upload.clubTags.join(" ")}`.toLowerCase();

  triples.push({ row, col: "type", val: "article_upload" });
  triples.push({ row, col: "source", val: source });
  triples.push({ row, col: "confidence", val: "unverified" });
  triples.push({ row, col: "verification", val: "pending_archivist" });
  triples.push({ row, col: "kind", val: upload.kind });
  if (upload.fetchedTitle) {
    triples.push({
      row,
      col: "title",
      val: upload.fetchedTitle.slice(0, 120),
    });
  } else if (caption) {
    triples.push({ row, col: "title", val: caption.slice(0, 120) });
  }
  if (upload.excerpt) {
    triples.push({ row, col: "excerpt", val: upload.excerpt.slice(0, 200) });
  }
  if (upload.sourceUrl) {
    triples.push({ row, col: "url", val: upload.sourceUrl });
  }

  const year =
    (upload.year ?? "").trim() ||
    inferYear(undefined, caption, privateText) ||
    "";
  if (year && /^(19\d{2}|20[0-2]\d)$/.test(year)) {
    triples.push({ row, col: "year", val: year });
    triples.push({ row, col: "cite", val: `${year} · Paper` });
  } else {
    triples.push({ row, col: "cite", val: "Paper" });
  }

  const linkedClubs = new Set<string>();
  for (const tag of upload.clubTags) {
    const t = tag.trim();
    if (/^club:[a-z0-9-]+$/i.test(t)) linkedClubs.add(t.toLowerCase());
  }

  const clubs = knownClubs();
  const searchText = `${caption} ${privateText} ${upload.fetchedTitle ?? ""}`.toLowerCase();
  for (const club of clubs) {
    const nameLower = club.name.toLowerCase();
    if (nameLower.length < 4) continue;
    if (blob.includes(nameLower) || searchText.includes(nameLower)) {
      if (
        blob.includes(nameLower) ||
        nameLower.length >= 8 ||
        club.tokens.length >= 2
      ) {
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

  // Scores ONLY from human caption — never from OCR / PDF / URL body alone
  const scoreInCaption = caption.match(
    /\b(\d{1,2}-\d{1,2})\s*(?:to|–|-|beat|defeated)?\s*(\d{1,2}-\d{1,2})?\b/i
  );
  if (scoreInCaption && scoreInCaption[1]) {
    const score = scoreInCaption[2]
      ? `${scoreInCaption[1]} to ${scoreInCaption[2]}`
      : scoreInCaption[1];
    if (
      /to|beat|defeated|final|score/i.test(caption) ||
      scoreInCaption[2]
    ) {
      triples.push({ row, col: "score", val: score });
      triples.push({
        row,
        col: "score_note",
        val: "From caption (not OCR); unverified until Archivist",
      });
    }
  }

  return triples;
}

async function finalizeUpload(
  draft: ArticleUpload,
  privateText: string
): Promise<ArticleUpload> {
  assertWritableStorage();

  const year =
    draft.year ||
    inferYear(undefined, draft.caption ?? "", privateText);
  if (year) draft.year = year;
  draft.citeChip = makeCiteChip(draft.year);
  if (!draft.excerpt) {
    draft.excerpt = makeExcerpt([
      draft.caption,
      draft.fetchedTitle,
      privateText.slice(0, 200),
    ]);
  }

  // Never persist full OCR on the public API surface
  delete draft.ocrText;

  if (isBlobStorageEnabled()) {
    const stored = await storePrivateTextBlob(draft.id, privateText);
    if (stored.privateText) draft.privateText = stored.privateText;
    if (stored.privateTextUrl) draft.privateTextUrl = stored.privateTextUrl;
  } else {
    const privatePath = writePrivateTextLocal(draft.id, privateText);
    if (privatePath) draft.privateTextPath = privatePath;
  }

  const derived = decomposeConfidentFacts({
    ...draft,
    privateText,
  });
  const hasFacts = derived.some(
    (t) =>
      t.col === "year" ||
      t.col === "club" ||
      t.col === "score" ||
      t.col.startsWith("club_")
  );
  draft.derivedTriples = derived;
  draft.status = hasFacts || privateText ? "decomposed" : "pending";

  if (isBlobStorageEnabled()) {
    // Persist meta without huge privateText duplication in list cache payload size checks —
    // privateText stays on the meta blob for server search.
    await putArticleMetaBlob(draft);
  } else {
    const list = readArticleUploadsFromFs();
    list.unshift(draft);
    writeArticleUploadsToFs(list);
  }
  return draft;
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
  assertWritableStorage();

  const mime = input.mimeType.toLowerCase();
  const isPdf =
    mime === PDF_MIME || input.originalName.toLowerCase().endsWith(".pdf");
  const imageExt = IMAGE_MIME[mime];

  if (!isPdf && !imageExt) {
    throw new Error("Please upload a JPG, PNG, WebP, GIF, or PDF.");
  }
  if (input.buffer.length > 12 * 1024 * 1024) {
    throw new Error("File must be under 12 MB.");
  }

  const id = `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const base = slugify(path.parse(input.originalName).name) || "article";
  const ext = isPdf ? ".pdf" : imageExt!;
  const filename = `${id}-${base}${ext}`;
  const contentType = isPdf ? PDF_MIME : mime;

  let mediaUrl: string;
  let privateText = "";

  if (isBlobStorageEnabled()) {
    mediaUrl = await putPublicMediaBlob(filename, input.buffer, contentType);
    privateText = await extractTextFromBuffer(input.buffer, filename, isPdf);
  } else {
    ensureUploadDir();
    const abs = path.join(UPLOAD_DIR, filename);
    writeFileSync(abs, input.buffer);
    mediaUrl = `${PUBLIC_PREFIX}/${filename}`;
    privateText = isPdf ? await pdfToText(abs) : await ocrImage(abs);
  }

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

  const draft: ArticleUpload = {
    id,
    kind: isPdf ? "pdf" : "image",
    filename,
    path: mediaUrl,
    publicUrl: mediaUrl,
    imageUrl: isPdf ? undefined : mediaUrl,
    uploadedAt: new Date().toISOString(),
    caption,
    year,
    tags,
    clubTags,
    status: "pending",
  };

  return finalizeUpload(draft, privateText);
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16))
    );
}

function extractMeta(html: string, prop: string): string | undefined {
  const re1 = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
    "i"
  );
  const m = html.match(re1) || html.match(re2);
  return m?.[1] ? decodeHtmlEntities(m[1]).trim() : undefined;
}

function extractTitle(html: string): string | undefined {
  const og = extractMeta(html, "og:title");
  if (og) return og.slice(0, 200);
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1] ? decodeHtmlEntities(m[1]).trim().slice(0, 200) : undefined;
}

function extractDescription(html: string): string | undefined {
  return (
    extractMeta(html, "og:description") ||
    extractMeta(html, "description") ||
    undefined
  )?.slice(0, 400);
}

async function tryFetchPreviewImage(
  imageUrl: string,
  id: string
): Promise<string | undefined> {
  try {
    const absUrl = imageUrl.startsWith("//") ? `https:${imageUrl}` : imageUrl;
    if (!/^https?:\/\//i.test(absUrl)) return undefined;
    const res = await fetch(absUrl, {
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "HurlingWikiBot/1.0 (+local ingest)" },
      redirect: "follow",
    });
    if (!res.ok) return undefined;
    const ctype = (res.headers.get("content-type") || "").toLowerCase();
    let ext = IMAGE_MIME[ctype.split(";")[0].trim()];
    if (!ext) {
      if (ctype.includes("jpeg") || ctype.includes("jpg")) ext = ".jpg";
      else if (ctype.includes("png")) ext = ".png";
      else if (ctype.includes("webp")) ext = ".webp";
      else if (ctype.includes("gif")) ext = ".gif";
      else return undefined;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100 || buf.length > 8 * 1024 * 1024) return undefined;
    const filename = `${id}-preview${ext}`;
    if (isBlobStorageEnabled()) {
      return putPublicMediaBlob(filename, buf, ctype.split(";")[0].trim());
    }
    ensureUploadDir();
    writeFileSync(path.join(UPLOAD_DIR, filename), buf);
    return `${PUBLIC_PREFIX}/${filename}`;
  } catch {
    return undefined;
  }
}

export async function saveUrlUpload(input: {
  url: string;
  caption?: string;
  year?: string;
  tags?: string[];
  clubTags?: string[];
}): Promise<ArticleUpload> {
  assertWritableStorage();

  let raw = input.url.trim();
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("That does not look like a valid URL.");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http(s) URLs are allowed.");
  }

  const id = `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

  let fetchedTitle: string | undefined;
  let fetchedDesc: string | undefined;
  let previewPath: string | undefined;
  let privateBody = "";

  try {
    const res = await fetch(parsed.toString(), {
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent": "HurlingWikiBot/1.0 (+local cuttings ingest)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    const ctype = (res.headers.get("content-type") || "").toLowerCase();
    if (res.ok && ctype.includes("text/html")) {
      const html = (await res.text()).slice(0, 500_000);
      fetchedTitle = extractTitle(html);
      fetchedDesc = extractDescription(html);
      // Strip tags for a rough private body excerpt — never invent scores
      privateBody = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000);
      const ogImage = extractMeta(html, "og:image");
      if (ogImage) {
        const resolved = ogImage.startsWith("http")
          ? ogImage
          : new URL(ogImage, parsed).toString();
        previewPath = await tryFetchPreviewImage(resolved, id);
      }
    }
  } catch {
    // URL still stored as source even if fetch fails
  }

  const draft: ArticleUpload = {
    id,
    kind: "url",
    sourceUrl: parsed.toString(),
    path: previewPath,
    publicUrl: previewPath,
    imageUrl: previewPath,
    uploadedAt: new Date().toISOString(),
    caption,
    year,
    tags,
    clubTags,
    fetchedTitle,
    excerpt: makeExcerpt([caption, fetchedTitle, fetchedDesc]),
    status: "pending",
  };

  return finalizeUpload(
    draft,
    privateBody || [fetchedTitle, fetchedDesc].filter(Boolean).join("\n")
  );
}

export function articleToSummary(a: ArticleUpload): EntitySummary {
  const title =
    a.caption?.trim() ||
    a.fetchedTitle?.trim() ||
    (a.kind === "url"
      ? a.sourceUrl || "Linked article"
      : a.kind === "pdf"
        ? `PDF cutting (${a.year || "undated"})`
        : `Article photo (${a.year || "undated"})`);
  const cite = a.citeChip || makeCiteChip(a.year);
  const excerpt =
    a.excerpt ||
    makeExcerpt([a.caption, a.fetchedTitle]) ||
    "Newspaper / article cutting";
  const subtitle = [cite, a.clubTags[0]].filter(Boolean).join(" · ");
  const media = articleMediaUrl(a);
  return {
    id: `article:${a.id}`,
    kind: "article_upload",
    title,
    subtitle: subtitle || excerpt,
    href: `/article/${a.id}`,
    confidence: "unverified",
    trustLabel: "Needs check",
    badge: "From cutting",
    imagePath:
      media && !media.toLowerCase().endsWith(".pdf") ? media : undefined,
    citeChip: cite,
    excerpt,
  };
}

export async function searchArticleUploads(
  query: string
): Promise<EntitySummary[]> {
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
  for (const a of await readArticleUploads()) {
    const privateText = await readPrivateText(a);
    const blob = [
      a.caption,
      a.year,
      a.tags.join(" "),
      a.clubTags.join(" "),
      a.excerpt,
      a.fetchedTitle,
      a.sourceUrl,
      a.citeChip,
      a.filename,
      a.id,
      a.kind,
      // Private text used only server-side for matching — never returned on the card
      privateText,
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

export async function allDerivedUploadTriples(): Promise<Triple[]> {
  const out: Triple[] = [];
  for (const a of await readArticleUploads()) {
    if (a.derivedTriples?.length) out.push(...a.derivedTriples);
  }
  return out;
}

export interface MatchArticleClip {
  key: string;
  imageUrl: string;
  caption?: string;
  cite?: string;
  href?: string;
}

/**
 * Collect article snapshots for a historic match page from:
 * 1) optional cuttings JSON on the match (`[{imageUrl, caption?, cite?}]`)
 * 2) article-uploads tagged with this match id, or club+year tags
 */
export async function getMatchArticleClips(
  matchId: string,
  cuttingsJson?: string | null
): Promise<MatchArticleClip[]> {
  const clips: MatchArticleClip[] = [];
  const seen = new Set<string>();

  const push = (c: MatchArticleClip) => {
    if (!c.imageUrl || seen.has(c.imageUrl)) return;
    seen.add(c.imageUrl);
    clips.push(c);
  };

  if (cuttingsJson && String(cuttingsJson).trim()) {
    try {
      const parsed = JSON.parse(String(cuttingsJson));
      const list = Array.isArray(parsed) ? parsed : [parsed];
      for (let i = 0; i < list.length; i++) {
        const item = list[i] as Record<string, unknown>;
        if (!item || typeof item !== "object") continue;
        const imageUrl = String(
          item.imageUrl ?? item.url ?? item.image ?? ""
        ).trim();
        if (!imageUrl) continue;
        push({
          key: `cutting-${i}-${imageUrl}`,
          imageUrl,
          caption: item.caption != null ? String(item.caption) : undefined,
          cite:
            item.cite != null
              ? String(item.cite)
              : item.source != null
                ? String(item.source)
                : undefined,
        });
      }
    } catch {
      // ignore bad cuttings JSON
    }
  }

  const yearMatch = matchId.match(/\b(19\d{2}|20[0-2]\d)\b/);
  const year = yearMatch ? yearMatch[1] : "";
  const clubHint = matchId.includes("fohenagh")
    ? "club:fohenagh-historic"
    : matchId.includes("ahascragh")
      ? "club:ahascragh-historic"
      : "";

  for (const a of await readArticleUploads()) {
    const tags = [...a.tags, ...a.clubTags].map((t) => t.toLowerCase());
    const privateText = await readPrivateText(a);
    const blob = `${a.caption ?? ""} ${a.excerpt ?? ""} ${a.tags.join(" ")} ${a.clubTags.join(" ")} ${privateText}`.toLowerCase();
    const matchHit =
      tags.includes(matchId.toLowerCase()) ||
      tags.includes(`match:${matchId}`.toLowerCase()) ||
      blob.includes(matchId.toLowerCase());
    const yearClubHit =
      Boolean(year) &&
      (a.year === year || blob.includes(year)) &&
      Boolean(clubHint) &&
      (tags.includes(clubHint) ||
        blob.includes(clubHint.replace("club:", "")) ||
        (clubHint.includes("fohenagh") && blob.includes("fohenagh")) ||
        (clubHint.includes("ahascragh") && blob.includes("ahascragh")));
    if (!matchHit && !yearClubHit) continue;
    // Image thumbnails only on match pages
    const kind = (a as { kind?: string }).kind;
    const media = articleMediaUrl(a);
    if (!media || kind === "url" || kind === "pdf") continue;
    push({
      key: a.id,
      imageUrl: media,
      caption: a.caption || a.excerpt,
      cite:
        a.citeChip ||
        [a.year, a.tags.slice(0, 2).join(", ")].filter(Boolean).join(" · ") ||
        undefined,
      href: `/article/${a.id}`,
    });
  }

  return clips;
}
