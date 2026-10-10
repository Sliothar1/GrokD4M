import { canonicalPlayerSlug } from "@/lib/playerSlug";
import { firstBannedPublicHit, sanitizePublicText } from "@/lib/publicText";
import { absUrl, SITE_DESCRIPTION, siteUrl } from "@/lib/site";

const MONTHS: Record<string, string> = {
  january: "01",
  jan: "01",
  february: "02",
  feb: "02",
  march: "03",
  mar: "03",
  april: "04",
  apr: "04",
  may: "05",
  june: "06",
  jun: "06",
  july: "07",
  jul: "07",
  august: "08",
  aug: "08",
  september: "09",
  sep: "09",
  sept: "09",
  october: "10",
  oct: "10",
  november: "11",
  nov: "11",
  december: "12",
  dec: "12",
};

function rawText(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return "";
  const text = value.replace(/\s+/g, " ").trim();
  if (!text || text.toLowerCase() === "null" || text.toLowerCase() === "undefined") return "";
  return text;
}

/** Extra gate for structured data. The page lint already drops most of these. */
const INTERNAL_SENTENCE =
  /\b(internal note|for the editor|pipeline|same_as|confidence|do not (?:publish|print))\b/i;

/** Public prose only. Banned and pipeline sentences are dropped. */
export function publicProse(value: unknown): string {
  const raw = rawText(value).replace(/\[\d+\]/g, "");
  if (!raw) return "";
  const clean = sanitizePublicText(raw).replace(/\s+/g, " ").trim();
  if (!clean || firstBannedPublicHit(clean)) return "";
  const kept = clean
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence && !INTERNAL_SENTENCE.test(sentence) && !firstBannedPublicHit(sentence));
  const text = kept.join(" ");
  if (!text || firstBannedPublicHit(text)) return "";
  return text;
}

export function publicName(value: unknown): string {
  const raw = rawText(value);
  if (!raw || raw.includes("@") || firstBannedPublicHit(raw)) return "";
  const clean = sanitizePublicText(raw).replace(/\s+/g, " ").trim();
  if (!clean || firstBannedPublicHit(clean)) return "";
  return clean;
}

/**
 * A real calendar day or a bare year.
 * "date unknown", "circa", and "c." are left off so the record is not given a false day.
 */
export function schemaDate(value: unknown): string | undefined {
  const raw = rawText(value);
  if (!raw || /unknown|circa|\bc\./i.test(raw)) return undefined;
  const iso = raw.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) {
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }
  const long = raw.match(/\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\b/);
  if (long) {
    const month = MONTHS[long[2].toLowerCase()];
    const day = Number(long[1]);
    if (!month || day < 1 || day > 31) return undefined;
    return `${long[3]}-${month}-${long[1].padStart(2, "0")}`;
  }
  if (/^\d{4}$/.test(raw)) return raw;
  return undefined;
}

export function publicPlayerPath(slug: string): string {
  return `/player/${canonicalPlayerSlug(slug) ?? slug}`;
}

function publicImage(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  if (src.startsWith("/")) return absUrl(src);
  if (/^https:\/\//i.test(src)) return src;
  return undefined;
}

export function organizationNode(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HurlingWiki",
    url: siteUrl(),
    description: SITE_DESCRIPTION,
    logo: absUrl("/favicon.ico"),
  };
}

export function breadcrumbNode(
  items: Array<{ name: string; path: string }>
): Record<string, unknown> | null {
  const list = items
    .map((item) => ({ name: publicName(item.name), path: item.path }))
    .filter((item) => item.name && item.path);
  if (list.length === 0) return null;
  return {
    "@type": "BreadcrumbList",
    itemListElement: list.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absUrl(item.path),
    })),
  };
}

export function sportsTeamNode(input: {
  name: string;
  path: string;
  county?: string;
  sportHint?: string;
}): Record<string, unknown> | null {
  const name = publicName(input.name);
  if (!name || !input.path) return null;
  const sport = /camogie/i.test(`${name} ${input.sportHint ?? ""}`) ? "Camogie" : "Hurling";
  const node: Record<string, unknown> = {
    "@type": "SportsTeam",
    name,
    url: absUrl(input.path),
    sport,
  };
  const county = publicName(input.county ?? "");
  if (county) node.location = { "@type": "Place", name: county };
  return node;
}

export function personNode(input: {
  name: string;
  path: string;
  description?: string;
  image?: string | null;
  teams?: Array<{ name: string; path: string }>;
}): Record<string, unknown> | null {
  const name = publicName(input.name);
  if (!name || !input.path) return null;
  const node: Record<string, unknown> = {
    "@type": "Person",
    name,
    url: absUrl(input.path),
  };
  const description = publicProse(input.description ?? "");
  if (description) node.description = description;
  const image = publicImage(input.image);
  if (image) node.image = image;
  const teams = (input.teams ?? [])
    .map((team) => sportsTeamNode({ name: team.name, path: team.path }))
    .filter((team): team is Record<string, unknown> => Boolean(team));
  if (teams.length > 0) node.memberOf = teams;
  return node;
}

export function sportsEventNode(input: {
  name: string;
  path: string;
  startDate?: string;
  venue?: string;
  competition?: string;
  description?: string;
  teams?: Array<{ name: string; path: string }>;
}): Record<string, unknown> | null {
  const name = publicName(input.name);
  if (!name || !input.path) return null;
  const competition = publicProse(input.competition ?? "");
  const node: Record<string, unknown> = {
    "@type": "SportsEvent",
    name,
    url: absUrl(input.path),
    sport: /camogie/i.test(`${name} ${competition}`) ? "Camogie" : "Hurling",
  };
  const startDate = schemaDate(input.startDate);
  if (startDate) node.startDate = startDate;
  const venue = publicName(input.venue ?? "");
  if (venue && !/unknown/i.test(venue)) {
    node.location = { "@type": "Place", name: venue };
  }
  const description = publicProse(input.description ?? "");
  if (description) node.description = description;
  const teams = (input.teams ?? [])
    .map((team) => sportsTeamNode({ name: team.name, path: team.path, sportHint: competition }))
    .filter((team): team is Record<string, unknown> => Boolean(team));
  if (teams.length > 0) node.competitor = teams;
  return node;
}

export function articleNode(input: {
  headline: string;
  path: string;
  description?: string;
  date?: string;
  citation?: string;
  author?: string;
}): Record<string, unknown> | null {
  const headline = publicName(input.headline);
  if (!headline || !input.path) return null;
  const node: Record<string, unknown> = {
    "@type": "Article",
    headline,
    url: absUrl(input.path),
    mainEntityOfPage: absUrl(input.path),
    publisher: {
      "@type": "Organization",
      name: "HurlingWiki",
      url: siteUrl(),
    },
  };
  const description = publicProse(input.description ?? "");
  if (description) node.description = description;
  const date = schemaDate(input.date);
  if (date) node.datePublished = date;
  const citation = publicProse(input.citation ?? "");
  if (citation) node.citation = citation;
  const author = publicName(input.author ?? "");
  if (author) node.author = { "@type": "Person", name: author };
  return node;
}

export function jsonLdGraph(
  nodes: Array<Record<string, unknown> | null | undefined | false>
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter((node): node is Record<string, unknown> => Boolean(node)),
  };
}
