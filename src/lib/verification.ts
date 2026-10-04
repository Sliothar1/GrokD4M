/**
 * Per-fact verification for any entity. Club Desk can call this with the
 * index from `resolveEntitySources`. Nothing here assumes a player page.
 *
 * Status comes only from that index, plus an explicit family marker on
 * the entity. Confidence, `cutting_cite`, and `status: verified_from_cutting`
 * do not count. Missing `source_<col>` cells are not backfilled.
 *
 * Verified
 *   - two or more publishers, or
 *   - one primary source
 * Single-source
 *   - exactly one secondary publisher
 * Needs a source (`unverified`)
 *   - no source
 * Family-confirmed facts
 *   - an explicit marker (below) counts as Verified. There is no separate
 *     public badge or label for it (Garry, 4 Oct 2026: no name, no
 *     "Confirmed by family" chip on public pages).
 *
 * Primary source
 *   - a cutting upload (PNG or PDF) whose date is a printed dateline
 *     (day, month, year), or
 *   - an http(s) URL on galwaygaa.ie or gaa.ie, including subdomains
 * A bare year is not a dateline. An undated cutting is secondary.
 * Wikipedia and every other host are secondary.
 *
 * Publishers
 *   - a URL counts as its registrable domain (`en.wikipedia.org` and
 *     `wikipedia.org` are one publisher; two oldids are still one)
 *   - a cutting counts as its publication name, so two cuttings from
 *     the same paper are one publisher
 *
 * Family marker
 *   - `confirmed_by_family`: a fact key, or several keys separated by commas
 *     or semicolons, or an array of fact keys.
 *     Example: `confirmed_by_family = "note"`.
 *   Never write a person's name or a confirmation date into a public value;
 *   use this hidden marker instead.
 */

import type {
  EntitySourceIndex,
  FactSourceStatus,
  ResolvedFact,
  ResolvedSource,
} from "@/lib/sources";

export type { FactSourceStatus };

export const FAMILY_CONFIRMATION_ATTR = "confirmed_by_family";

const PRINTED_DATELINE = /^\d{1,2}\s+[A-Za-z]+\s+(?:19|20)\d{2}$/;

export const VERIFICATION_LABEL: Record<FactSourceStatus, string> = {
  verified: "Verified",
  "single-source": "Single-source",
  unverified: "Needs a source",
  // Legacy status value only; family-confirmed facts are classified Verified.
  "confirmed-by-family": "Verified",
};

export const VERIFICATION_LEGEND: Record<FactSourceStatus, string> = {
  verified:
    "Two or more publishers, or one primary source: a dated cutting (image or PDF), or a galwaygaa.ie / gaa.ie record.",
  "single-source":
    "One secondary publisher, such as Wikipedia or an undated cutting.",
  unverified: "No source on file for this fact.",
  "confirmed-by-family":
    "Two or more publishers, or one primary source: a dated cutting (image or PDF), or a galwaygaa.ie / gaa.ie record.",
};

/** Statuses shown in the public badge legend. */
export const VERIFICATION_STATUSES: readonly FactSourceStatus[] = [
  "verified",
  "single-source",
  "unverified",
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

/** Cutting page, or a PNG/PDF upload path. URL-only web pages are not cuttings. */
export function isCuttingUpload(source: ResolvedSource): boolean {
  if (source.href.startsWith("/article/")) return true;
  if (source.key.startsWith("article:")) return true;
  const path = (source.imagePath ?? "").split("?")[0].trim().toLowerCase();
  return path.endsWith(".png") || path.endsWith(".pdf");
}

export function isCuttingPngWithDateline(source: ResolvedSource): boolean {
  const path = source.imagePath?.split("?")[0]?.trim().toLowerCase() ?? "";
  if (!path.endsWith(".png")) return false;
  return hasPrintedDateline(source.date);
}

/** Dated cutting upload (PNG or PDF), or an official GAA record URL. */
export function isPrimarySource(source: ResolvedSource): boolean {
  if (isOfficialRecordUrl(source.href)) return true;
  return isCuttingUpload(source) && hasPrintedDateline(source.date);
}

const COMPOUND_SUFFIXES = new Set([
  "co.uk",
  "org.uk",
  "ac.uk",
  "gov.uk",
  "me.uk",
  "net.uk",
  "com.au",
  "net.au",
  "org.au",
  "edu.au",
  "gov.au",
  "co.nz",
  "org.nz",
  "net.nz",
  "co.za",
  "org.za",
  "com.br",
  "co.jp",
  "com.sg",
  "com.hk",
  "co.in",
]);

/**
 * Registrable host. `www.` is dropped. `en.wikipedia.org` and
 * `wikipedia.org` are the same publisher. A compound suffix such as
 * `co.uk` keeps the label in front of it.
 */
export function registrableDomain(hostname: string): string {
  let host = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (host.startsWith("www.")) host = host.slice(4);
  if (host === "wikipedia.org" || host.endsWith(".wikipedia.org")) {
    return "wikipedia.org";
  }
  const labels = host.split(".").filter(Boolean);
  if (labels.length <= 2) return labels.join(".");
  const lastTwo = labels.slice(-2).join(".");
  if (COMPOUND_SUFFIXES.has(lastTwo)) return labels.slice(-3).join(".");
  return lastTwo;
}

/**
 * Publisher used for the 2+ Verified rule.
 * Cuttings use the publication name. Web URLs use the registrable domain.
 */
export function publisherKey(source: ResolvedSource): string {
  if (isCuttingUpload(source)) {
    const publication = source.publication?.trim().toLowerCase();
    if (publication) return `publication:${publication}`;
  }
  const domain = hostnameOf(source.href);
  if (domain) return `domain:${registrableDomain(domain)}`;
  const publication = source.publication?.trim().toLowerCase();
  if (publication) return `publication:${publication}`;
  return `source:${source.key}`;
}

export function independentSourceCount(sources: readonly ResolvedSource[]): number {
  return new Set(sources.map(publisherKey)).size;
}

export function classifyFact(
  sources: readonly ResolvedSource[],
  confirmedByFamily = false
): FactSourceStatus {
  if (confirmedByFamily) return "verified";
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

function hostnameOf(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  return url.hostname;
}
