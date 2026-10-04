import {
  auditTextsFromAttrs,
  isPrivateCol,
  isPrivateSourceCol,
  isWithheldFromClient,
  sourceValueCarriesAudit,
} from "@/lib/privacy";

/**
 * Per-fact citations for any entity (player:*, club:*, …).
 *
 * Club Desk can call `resolveEntitySources` with that entity's attrs,
 * its linked cuttings, and the on-page fact order. Nothing here assumes
 * a player page.
 *
 * A marker is created only from real data:
 * - a linked cutting (the cutting page is the source)
 * - `source_<fact>` and `source_<fact>_<suffix>` when the value is an
 *   http(s) URL or an upload id (`art-…`). The suffix is matched against
 *   the entity's own fact columns and the longest column wins
 *   (`source_notes_club` attaches to `notes` unless a `notes_club`
 *   column exists; `source_county_titles_wiki` attaches to
 *   `county_titles`).
 *
 * A cell may hold several values, separated by commas or spaces. Each
 * http(s) URL is a web source. Each `art-…` id is resolved against the
 * upload catalog the caller loaded (the same article-uploads reader the
 * app uses). A known id is that cutting, including its thumbnail, and
 * it is the same panel row as the cutting already listed from
 * playerTags. An id that matches no upload is dropped, so it never
 * becomes a broken link. Any other non-URL text is ignored.
 *
 * The bare `source` attribute is not a fallback. A `source_*` column
 * with no matching fact column (for example `source_wiki`) is not a
 * cite. `source_audit_*`, and any source cell whose text is an
 * `audit_*` value, is not a cite. The same URL or cutting is listed once.
 * Facts with no source are still returned (`sources: []`) so
 * `annotateEntityVerification` can grade each fact on this same list.
 */

/**
 * Per-fact grade. Confidence and a bare `cutting_cite` string do not
 * set this. `resolveEntitySources` leaves it unset;
 * `annotateEntityVerification` in `src/lib/verification.ts` fills it.
 */
export type FactSourceStatus =
  | "verified"
  | "single-source"
  | "unverified"
  | "confirmed-by-family";

/** One deduped source, numbered to match on-page cite markers. */
export type ResolvedSource = {
  /** 1-based, stable for this resolve call. */
  number: number;
  /** Article id (`article:<id>`) or canonical URL. */
  key: string;
  title: string;
  publication?: string;
  date?: string;
  /** Outbound link: `/article/<id>`, a cutting PNG, or an external URL. */
  href: string;
  /** Cutting snip. Omitted for PDFs and for URL-only sources. */
  imagePath?: string;
  imageAlt?: string;
};

/**
 * One on-page fact and the sources that support it.
 * `status` is left unset here and filled by `annotateEntityVerification`.
 */
export type ResolvedFact = {
  factKey: string;
  sources: ResolvedSource[];
  status?: FactSourceStatus;
};

export type EntitySourceIndex = {
  entityId: string;
  /** Panel order. Each source appears once. */
  sources: ResolvedSource[];
  /** On-page facts in the requested order, including unsourced ones. */
  facts: ResolvedFact[];
  /** factKey → source numbers. Empty or absent means no cite marker. */
  markers: Record<string, number[]>;
};

export type LinkedCuttingSource = {
  /** Article id, with or without an `article:` prefix. */
  id: string;
  title: string;
  /** Cutting page, when already known. Otherwise `/article/<id>` is used. */
  href?: string;
  citeChip?: string;
  year?: string;
  /** Public snip path. PDFs are not shown as thumbnails. */
  imagePath?: string;
  /** Original URL, used only to dedupe against `source_<col>` values. */
  sourceUrl?: string;
};

export type SourceOrderSlot = { fact: string } | { cuttings: true };

const HTTP_URL = /^https?:\/\//i;
/** Upload ids in article-uploads.json. `article:` is accepted and stripped. */
const UPLOAD_ID = /^(?:article:)?art-[a-z0-9][a-z0-9-]*$/i;
const FULL_DATE = /^(\d{1,2}\s+[A-Za-z]+\s+(?:19|20)\d{2})\b/;
const YEAR_ONLY = /^((?:19|20)\d{2})\b/;
/** Page bits such as "p.30". A bare 4-digit year is not a page. */
const PAGE_BIT = /^(?:p\.?\s*)?\d{1,3}$/i;

export function cuttingFactKey(articleId: string): string {
  return `cutting:${bareArticleId(articleId)}`;
}

export function bareArticleId(articleId: string): string {
  const raw = articleId.trim();
  const bare = raw.includes(":") ? raw.slice(raw.indexOf(":") + 1) : raw;
  return bare.trim();
}

/** Accessible name for a cite marker, e.g. "Source 2: Connacht Tribune 12 Dec 2003". */
export function sourceMarkerLabel(
  source: Pick<ResolvedSource, "number" | "publication" | "date" | "title">
): string {
  if (source.publication && source.date) {
    return `Source ${source.number}: ${source.publication} ${source.date}`;
  }
  if (source.publication && source.title && source.title !== source.publication) {
    return `Source ${source.number}: ${source.publication} ${source.title}`;
  }
  const detail = [source.publication, source.date].filter(Boolean).join(" ");
  return `Source ${source.number}: ${detail || source.title}`;
}

export function isExternalHref(href: string): boolean {
  return HTTP_URL.test(href.trim());
}

/** Attribute keys that can be cited. `source` and `source_*` are not facts. */
export function factColumnsFromAttrs(attrs: Record<string, unknown>): string[] {
  return Object.keys(attrs).filter(
    (key) =>
      key !== "source" && !key.startsWith("source_") && !isPrivateCol(key)
  );
}

/**
 * Fact column a `source_*` attribute belongs to.
 * Exact column, or `column_<suffix>`, and the longest matching column wins.
 * Returns null for the bare `source` column and for suffixes that match
 * no fact column on this entity.
 */
export function factKeyForSourceColumn(
  sourceCol: string,
  factColumns: readonly string[]
): string | null {
  if (!sourceCol.startsWith("source_")) return null;
  if (isPrivateSourceCol(sourceCol)) return null;
  const rest = sourceCol.slice("source_".length);
  if (!rest) return null;
  let best: string | null = null;
  for (const col of factColumns) {
    if (!col) continue;
    if (rest === col || rest.startsWith(`${col}_`)) {
      if (best === null || col.length > best.length) best = col;
    }
  }
  return best;
}

/**
 * Build the ordered, deduped source list and the fact → number map.
 * `order` is the on-page sequence. `{ cuttings: true }` inserts `cuttings`
 * at that position; each cutting's fact key is `cutting:<articleId>`.
 */
export function resolveEntitySources(input: {
  entityId: string;
  attrs: Record<string, unknown>;
  cuttings?: readonly LinkedCuttingSource[];
  /**
   * Known cuttings from article-uploads.json. Used to resolve `art-…`
   * ids written in `source_*` cells. Omit it and those ids cite nothing.
   */
  uploads?: readonly LinkedCuttingSource[];
  order: readonly SourceOrderSlot[];
}): EntitySourceIndex {
  const acc = new SourceAccumulator();
  const facts: ResolvedFact[] = [];
  const markers: Record<string, number[]> = {};
  const cuttings = input.cuttings ?? [];
  const columns = factColumnsFromAttrs(input.attrs);
  const uploads = indexUploads(input.uploads ?? []);
  const auditTexts = auditTextsFromAttrs(input.attrs);

  const pushFact = (factKey: string, sources: ResolvedSource[]) => {
    facts.push({ factKey, sources });
    markers[factKey] = sources.map((s) => s.number);
  };

  for (const slot of input.order) {
    if ("cuttings" in slot) {
      for (const cutting of cuttings) {
        const source = acc.addCutting(cutting);
        if (!source) continue;
        pushFact(cuttingFactKey(cutting.id), [source]);
      }
      continue;
    }

    pushFact(
      slot.fact,
      sourcesForFact(input.attrs, slot.fact, columns, uploads, acc, auditTexts)
    );
  }

  return {
    entityId: input.entityId,
    sources: acc.sources,
    facts,
    markers,
  };
}

/** Publication + date from a cutting cite chip. Year fills the date when the chip has none. */
export function parseCuttingCite(
  citeChip?: string,
  year?: string
): { publication?: string; date?: string } {
  const parts = (citeChip ?? "")
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);

  let publication: string | undefined;
  let date: string | undefined;
  let yearBit: string | undefined;

  for (const part of parts) {
    if (PAGE_BIT.test(part) || /^ina$/i.test(part)) continue;
    const full = part.match(FULL_DATE);
    if (full) {
      date = full[1];
      continue;
    }
    const yearMatch = part.match(YEAR_ONLY);
    if (yearMatch) {
      yearBit ??= yearMatch[1];
      if (part === yearMatch[1]) continue;
      continue;
    }
    publication ??= part;
  }

  if (!date) date = yearBit ?? (year && /^(?:19|20)\d{2}$/.test(year) ? year : undefined);
  return { publication, date };
}

class SourceAccumulator {
  readonly sources: ResolvedSource[] = [];
  private readonly byKey = new Map<string, ResolvedSource>();

  addCutting(cutting: LinkedCuttingSource): ResolvedSource | null {
    const bare = bareArticleId(cutting.id);
    if (!bare) return null;
    const href = cuttingHref(cutting, bare);
    if (!href) return null;

    const { publication, date } = parseCuttingCite(cutting.citeChip, cutting.year);
    const title = cutting.title.trim() || publication || "Newspaper cutting";
    const imagePath = snipImagePath(cutting.imagePath);
    const next: Omit<ResolvedSource, "number" | "key"> = {
      title,
      publication,
      date,
      href,
      imagePath,
      imageAlt: imagePath ? cuttingImageAlt(publication, date, title) : undefined,
    };

    const aliases = [
      `article:${bare}`,
      href,
      cutting.sourceUrl,
      cutting.imagePath,
    ];
    return this.upsert(aliases, next);
  }

  addUrl(url: string): ResolvedSource {
    const href = canonicalUrl(url);
    const title = titleFromUrl(href);
    const publication = publicationFromUrl(href);
    return this.upsert([href], {
      title,
      publication,
      href,
    });
  }

  private upsert(
    aliases: Array<string | undefined>,
    next: Omit<ResolvedSource, "number" | "key">
  ): ResolvedSource {
    const keys = [
      ...new Set(
        aliases
          .map((alias) => normalizeKey(alias))
          .filter((alias): alias is string => Boolean(alias))
      ),
    ];
    const existing = keys
      .map((key) => this.byKey.get(key))
      .find((source): source is ResolvedSource => Boolean(source));

    if (existing) {
      enrich(existing, next);
      for (const key of keys) this.byKey.set(key, existing);
      return existing;
    }

    const source: ResolvedSource = {
      number: this.sources.length + 1,
      key: keys[0] ?? next.href,
      ...next,
    };
    this.sources.push(source);
    for (const key of keys) this.byKey.set(key, source);
    if (keys.length === 0) this.byKey.set(source.key, source);
    return source;
  }
}

function enrich(
  existing: ResolvedSource,
  next: Omit<ResolvedSource, "number" | "key">
): void {
  if (!existing.imagePath && next.imagePath) {
    existing.imagePath = next.imagePath;
    existing.imageAlt = next.imageAlt;
  }
  if (next.publication && !existing.publication) existing.publication = next.publication;
  if (next.date && !existing.date) existing.date = next.date;
  const nextIsArticle = next.href.startsWith("/article/");
  const existingIsExternal = isExternalHref(existing.href);
  if (nextIsArticle && existingIsExternal) {
    existing.href = next.href;
    existing.title = next.title;
  }
}

function cuttingHref(cutting: LinkedCuttingSource, bare: string): string | null {
  const href = cutting.href?.trim();
  if (href && (href.startsWith("/") || HTTP_URL.test(href))) return href;
  if (!bare) return null;
  return `/article/${bare}`;
}

function snipImagePath(path?: string): string | undefined {
  const value = path?.trim();
  if (!value) return undefined;
  if (value.split("?")[0].toLowerCase().endsWith(".pdf")) return undefined;
  return value;
}

function cuttingImageAlt(
  publication: string | undefined,
  date: string | undefined,
  title: string
): string {
  if (publication && date) return `${publication} cutting, ${date}`;
  if (publication) return `${publication} cutting`;
  return title || "Newspaper cutting";
}

export function looksLikeUploadId(value: string): boolean {
  return UPLOAD_ID.test(value.trim());
}

function indexUploads(
  uploads: readonly LinkedCuttingSource[]
): Map<string, LinkedCuttingSource> {
  const index = new Map<string, LinkedCuttingSource>();
  for (const upload of uploads) {
    const bare = bareArticleId(upload.id).toLowerCase();
    if (!bare) continue;
    index.set(bare, upload);
  }
  return index;
}

/** Comma- or whitespace-separated URLs and upload ids in one source cell. */
export function sourceCellTokens(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => sourceCellTokens(item));
  if (typeof value !== "string") return [];
  return value
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function sourcesForFact(
  attrs: Record<string, unknown>,
  fact: string,
  columns: readonly string[],
  uploads: ReadonlyMap<string, LinkedCuttingSource>,
  acc: SourceAccumulator,
  auditTexts: readonly string[]
): ResolvedSource[] {
  const sources: ResolvedSource[] = [];
  const seen = new Set<number>();
  const push = (source: ResolvedSource | null) => {
    if (!source || seen.has(source.number)) return;
    seen.add(source.number);
    sources.push(source);
  };

  for (const [key, value] of Object.entries(attrs)) {
    if (isWithheldFromClient(key) || sourceValueCarriesAudit(key, value, auditTexts)) {
      continue;
    }
    if (factKeyForSourceColumn(key, columns) !== fact) continue;
    for (const token of sourceCellTokens(value)) {
      const url = httpUrl(token);
      if (url) {
        push(acc.addUrl(url));
        continue;
      }
      if (!looksLikeUploadId(token)) continue;
      const upload = uploads.get(bareArticleId(token).toLowerCase());
      if (!upload) continue;
      push(acc.addCutting(upload));
    }
  }
  return sources;
}

function httpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!HTTP_URL.test(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function canonicalUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hash = "";
  parsed.hostname = parsed.hostname.toLowerCase();
  if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }
  return parsed.toString();
}

function normalizeKey(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (HTTP_URL.test(trimmed)) {
    try {
      return canonicalUrl(trimmed);
    } catch {
      return null;
    }
  }
  return trimmed;
}

function titleFromUrl(url: string): string {
  const parsed = new URL(url);
  const fromQuery = parsed.searchParams.get("title");
  if (fromQuery) return decodeURIComponent(fromQuery).replace(/_/g, " ");
  const wiki = parsed.pathname.match(/^\/wiki\/(.+)/);
  if (wiki) return decodeURIComponent(wiki[1]).replace(/_/g, " ");
  const segment = parsed.pathname.split("/").filter(Boolean).pop();
  if (segment && !/^\d+$/.test(segment)) {
    return decodeURIComponent(segment).replace(/[-_]+/g, " ");
  }
  return parsed.hostname.replace(/^www\./, "");
}

function publicationFromUrl(url: string): string {
  const host = new URL(url).hostname.replace(/^www\./, "");
  if (host === "wikipedia.org" || host.endsWith(".wikipedia.org")) return "Wikipedia";
  return host;
}
