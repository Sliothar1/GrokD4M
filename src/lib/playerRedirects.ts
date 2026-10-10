/**
 * Old /player/<slug> addresses stay up.
 * 200 serves the profile. 308 is only an explicit alias: same_as, a known merge,
 * a short-name map, or a plural/spelling variant of that same id
 * (cathal-lohans → cathal-lohan-fohenagh).
 * Any other old slug goes to search with the name filled in. That is not an identity claim.
 * Known merges win when same_as points the other way (cathal-lohan → cathal-lohan-fohenagh).
 */
import { getAssoc } from "@/lib/data";
import { CANONICAL_PLAYER_SLUG } from "@/lib/playerSlug";
import catalogFile from "../../data/historical-player-slugs.json";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)+$/;

export type PlayerSlugResolution =
  | { status: 200; slug: string }
  | { status: 308; slug: string; target: string }
  | { status: 307; slug: string; target: string };

type HistoricalRecord = { slug: string; names: string[] };

type PlayerRedirectIndex = {
  players: Set<string>;
  sameAs: Map<string, string>;
  historical: Map<string, string[]>;
  clubSlugs: string[];
};

const catalog = catalogFile as {
  seedCommits: number;
  slugs: HistoricalRecord[];
};

let cachedIndex: PlayerRedirectIndex | null = null;

function derivedName(slug: string, clubSlugs: readonly string[]): string {
  let rest = slug;
  const clubs = [...clubSlugs].sort((a, b) => b.length - a.length);
  for (const club of clubs) {
    const suffix = `-${club}`;
    if (rest.endsWith(suffix) && rest.length > suffix.length) {
      rest = rest.slice(0, -suffix.length);
      break;
    }
  }
  rest = rest.replace(/-camogie$/, "");
  return rest
    .replace(/-/g, " ")
    .trim()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

/** Drop one trailing s when that leaves the same player id (cathal-lohans → cathal-lohan). */
function sameIdPlural(slug: string, index: PlayerRedirectIndex): string | null {
  if (!slug.endsWith("s")) return null;
  const stem = slug.slice(0, -1);
  if (!SLUG.test(stem) || stem === slug) return null;
  if (index.players.has(stem) || CANONICAL_PLAYER_SLUG[stem] || index.sameAs.has(stem)) return stem;
  return null;
}

/** Follow explicit aliases and same-id spelling to the page that should answer. */
export function structuralPlayerTarget(slug: string, index: PlayerRedirectIndex): string | null {
  const seen = new Set<string>();
  let cur = slug;
  while (!seen.has(cur)) {
    seen.add(cur);
    const known = CANONICAL_PLAYER_SLUG[cur];
    if (known && known !== cur) {
      cur = known;
      continue;
    }
    const same = index.sameAs.get(cur);
    if (same && same !== cur && (index.players.has(same) || CANONICAL_PLAYER_SLUG[same])) {
      const knownSame = CANONICAL_PLAYER_SLUG[same];
      if (knownSame === cur) return cur;
      cur = same;
      continue;
    }
    if (index.players.has(cur)) return cur;
    const plural = sameIdPlural(cur, index);
    if (plural && !seen.has(plural)) {
      cur = plural;
      continue;
    }
    return null;
  }
  return null;
}

function searchTarget(slug: string, index: PlayerRedirectIndex): string {
  const recorded = index.historical.get(slug)?.find((name) => name.trim()) ?? "";
  const query = recorded || derivedName(slug, index.clubSlugs) || slug.replace(/-/g, " ");
  return `/search?q=${encodeURIComponent(query)}`;
}

export function resolvePlayerSlug(raw: string, index: PlayerRedirectIndex): PlayerSlugResolution {
  const slug = raw.trim().toLowerCase();
  if (!SLUG.test(slug)) return { status: 307, slug, target: "/search" };
  const page = structuralPlayerTarget(slug, index);
  if (page && index.players.has(page)) {
    if (page === slug) return { status: 200, slug };
    return { status: 308, slug, target: page };
  }
  return { status: 307, slug, target: searchTarget(slug, index) };
}

export async function getPlayerRedirectIndex(): Promise<PlayerRedirectIndex> {
  if (cachedIndex) return cachedIndex;
  const A = await getAssoc();
  const players = new Set<string>();
  const sameAs = new Map<string, string>();
  for (const id of A.entitiesOfType("player")) {
    if (!id.startsWith("player:")) continue;
    const slug = id.slice("player:".length);
    if (!SLUG.test(slug)) continue;
    players.add(slug);
    const attrs = A.entityAttrs(id);
    const same = String(attrs.same_as ?? "");
    if (same.startsWith("player:")) {
      const target = same.slice("player:".length);
      if (SLUG.test(target) && target !== slug) sameAs.set(slug, target);
    }
  }
  const historical = new Map<string, string[]>();
  for (const record of catalog.slugs) {
    historical.set(record.slug, record.names);
  }
  const clubSlugs = A.entitiesOfType("club")
    .map((id) => id.slice("club:".length))
    .filter((slug) => SLUG.test(slug));
  cachedIndex = { players, sameAs, historical, clubSlugs };
  return cachedIndex;
}

export function historicalSlugRecords(): HistoricalRecord[] {
  return catalog.slugs;
}

export function historicalSeedCommits(): number {
  return catalog.seedCommits;
}
