/**
 * Per-fact citations for any entity (player:*, club:*, …).
 *
 * Club Desk can call `resolveEntitySources` with that entity's attrs,
 * its linked cuttings, and the on-page fact order. Nothing here assumes
 * a player page.
 *
 * A marker is created only from real data:
 * - a linked cutting (the cutting page is the source)
 * - `attrs["source_<factKey>"]` when that value is an http(s) URL
 *
 * The bare `source` attribute is not a fallback. Non-URL values are
 * ignored. Facts with no source are still returned (`sources: []`) so
 * story S2 can add a per-fact status on the same list without a new shape.
 */

export type FactSourceStatus = "verified" | "unverified";

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
 * `status` is reserved for story S2 and is left unset here.
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

/**
 * Build the ordered, deduped source list and the fact → number map.
 * `order` is the on-page sequence. `{ cuttings: true }` inserts `cuttings`
 * at that position; each cutting's fact key is `cutting:<articleId>`.
 */
export function resolveEntitySources(input: {
  entityId: string;
  attrs: Record<string, unknown>;
  cuttings?: readonly LinkedCuttingSource[];
  order: readonly SourceOrderSlot[];
}): EntitySourceIndex {
  const acc = new SourceAccumulator();
  const facts: ResolvedFact[] = [];
  const markers: Record<string, number[]> = {};
  const cuttings = input.cuttings ?? [];

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

    const url = httpUrl(input.attrs[`source_${slot.fact}`]);
    const sources = url ? [acc.addUrl(url)] : [];
    pushFact(slot.fact, sources);
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
