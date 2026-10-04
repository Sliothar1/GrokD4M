/**
 * Per-fact verification for any entity. Club Desk can call this with the
 * index from `resolveEntitySources`. Nothing here assumes a player page.
 *
 * Status comes only from that index, plus an explicit family marker on
 * the entity. Confidence, `cutting_cite`, and `status: verified_from_cutting`
 * do not count. Missing `source_<col>` cells are not backfilled.
 *
 * Verified
 *   - two or more independent sources, or
 *   - one primary source
 * Single-source
 *   - exactly one secondary source
 * Needs a source (`unverified`)
 *   - no source
 * Confirmed by family
 *   - the fact is explicitly marked. This replaces Verified for that fact.
 *
 * Primary source
 *   - a cutting PNG whose date is a printed dateline (day, month, year), or
 *   - an http(s) URL on galwaygaa.ie or gaa.ie, including subdomains
 * A bare year is not a dateline. A PDF cutting has no PNG, so it is secondary.
 * Wikipedia and every other host are secondary.
 *
 * Independent
 *   - distinct resolved sources
 *   - Wikipedia revisions of the same article (same title, any oldid) count once
 *
 * Family marker
 *   - `confirmed_by_family`: a fact key, or several keys separated by commas
 *     or semicolons, or an array of fact keys.
 *     Example: `confirmed_by_family = "note"`.
 *   - Seed already marks two notes by writing the token `Garry-confirmed`
 *     in that fact's own value (Alan Moclair's note, Paddy Lohan's note).
 *     The token grades that fact only. It is not inferred from other columns.
 *   No other seed fact sets either marker.
 */

import type {
  EntitySourceIndex,
  FactSourceStatus,
  ResolvedFact,
  ResolvedSource,
} from "@/lib/sources";

export type { FactSourceStatus };

export const FAMILY_CONFIRMATION_ATTR = "confirmed_by_family";

/** Exact token already written in seed notes. Not a fuzzy name match. */
export const GARRY_CONFIRMED_TOKEN = "Garry-confirmed";

const PRINTED_DATELINE = /^\d{1,2}\s+[A-Za-z]+\s+(?:19|20)\d{2}$/;

export const VERIFICATION_LABEL: Record<FactSourceStatus, string> = {
  verified: "Verified",
  "single-source": "Single-source",
  unverified: "Needs a source",
  "confirmed-by-family": "Confirmed by family",
};

export const VERIFICATION_LEGEND: Record<FactSourceStatus, string> = {
  verified:
    "Two or more independent sources, or one primary source: a cutting image with a dateline, or a galwaygaa.ie / gaa.ie record.",
  "single-source": "Exactly one secondary source, such as a Wikipedia page.",
  unverified: "No source on file for this fact.",
  "confirmed-by-family":
    "Marked confirmed by the family. This is not a Verified source.",
};

export const VERIFICATION_STATUSES: readonly FactSourceStatus[] = [
  "verified",
  "single-source",
  "unverified",
  "confirmed-by-family",
];

const STATUS_RANK: Record<FactSourceStatus, number> = {
  unverified: 0,
  "single-source": 1,
  "confirmed-by-family": 2,
  verified: 3,
};

export function verificationLabel(status: FactSourceStatus): string {
  return VERIFICATION_LABEL[status];
}

/** galwaygaa.ie, gaa.ie, and their subdomains. `www.` is ignored. */
export function isOfficialRecordUrl(href: string): boolean {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  return (
    host === "gaa.ie" ||
    host.endsWith(".gaa.ie") ||
    host === "galwaygaa.ie" ||
    host.endsWith(".galwaygaa.ie")
  );
}

/** Day-month-year as stored on a resolved source. A bare year is not a dateline. */
export function hasPrintedDateline(date: string | undefined): boolean {
  if (!date) return false;
  return PRINTED_DATELINE.test(date.trim());
}

export function isCuttingPngWithDateline(source: ResolvedSource): boolean {
  const path = source.imagePath?.split("?")[0]?.trim().toLowerCase() ?? "";
  if (!path.endsWith(".png")) return false;
  return hasPrintedDateline(source.date);
}

export function isPrimarySource(source: ResolvedSource): boolean {
  return isOfficialRecordUrl(source.href) || isCuttingPngWithDateline(source);
}

/**
 * Same Wikipedia article is one source even when oldids differ.
 * Every other resolved source keeps its own key.
 */
export function independenceKey(source: ResolvedSource): string {
  const article = wikipediaArticleKey(source.href);
  if (article) return article;
  return source.key;
}

export function independentSourceCount(sources: readonly ResolvedSource[]): number {
  return new Set(sources.map(independenceKey)).size;
}

export function classifyFact(
  sources: readonly ResolvedSource[],
  confirmedByFamily = false
): FactSourceStatus {
  if (confirmedByFamily) return "confirmed-by-family";
  if (sources.some(isPrimarySource)) return "verified";
  const independent = independentSourceCount(sources);
  if (independent >= 2) return "verified";
  if (independent === 1) return "single-source";
  return "unverified";
}

/**
 * Fact keys explicitly confirmed by the family.
 * Prose in a different column does not confirm this one.
 */
export function familyConfirmedFactKeys(
  attrs: Record<string, unknown>
): Set<string> {
  const keys = new Set<string>();
  const marker = attrs[FAMILY_CONFIRMATION_ATTR];
  if (typeof marker === "string") {
    for (const part of marker.split(/[,;]/)) {
      const key = part.trim();
      if (key) keys.add(key);
    }
  } else if (Array.isArray(marker)) {
    for (const part of marker) {
      if (typeof part === "string" && part.trim()) keys.add(part.trim());
    }
  }

  for (const [key, value] of Object.entries(attrs)) {
    if (key === FAMILY_CONFIRMATION_ATTR) continue;
    if (typeof value === "string" && value.includes(GARRY_CONFIRMED_TOKEN)) {
      keys.add(key);
    }
  }
  return keys;
}

export function annotateEntityVerification<T extends EntitySourceIndex>(
  index: T,
  attrs: Record<string, unknown> = {}
): T {
  const family = familyConfirmedFactKeys(attrs);
  const facts: ResolvedFact[] = index.facts.map((fact) => ({
    ...fact,
    status: classifyFact(fact.sources, family.has(fact.factKey)),
  }));
  return { ...index, facts };
}

/**
 * Best status among identity facts. Verified only when one of those facts
 * is itself Verified. An unsourced career stat cannot verify the profile.
 * An empty identity list is unverified.
 */
export function headlineVerificationStatus(
  facts: readonly Pick<ResolvedFact, "factKey" | "status">[],
  isIdentityFact: (factKey: string) => boolean
): FactSourceStatus {
  let best: FactSourceStatus = "unverified";
  for (const fact of facts) {
    if (!isIdentityFact(fact.factKey) || !fact.status) continue;
    if (STATUS_RANK[fact.status] > STATUS_RANK[best]) best = fact.status;
  }
  return best;
}

function wikipediaArticleKey(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host !== "wikipedia.org" && !host.endsWith(".wikipedia.org")) return null;
  const fromQuery = url.searchParams.get("title");
  const fromPath = url.pathname.match(/^\/wiki\/(.+)/);
  const title = fromQuery ?? (fromPath ? fromPath[1] : null);
  if (!title) return `wiki:${host}${url.pathname.toLowerCase()}`;
  const normalised = safeDecode(title).replace(/_/g, " ").trim().toLowerCase();
  return `wiki:${host}:${normalised}`;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
