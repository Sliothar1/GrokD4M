/**
 * Old /player/<slug> addresses stay up.
 * A slug that still has its own page is 200. A same_as alias, a known merge,
 * or one unambiguous renamed player is a permanent redirect to the page that serves.
 * Known merges win when same_as points the other way (cathal-lohan → cathal-lohan-fohenagh).
 */
import { getAssoc } from "@/lib/data";
import { CANONICAL_PLAYER_SLUG, uniquePlayerRedirect } from "@/lib/playerSlug";
import catalogFile from "../../data/historical-player-slugs.json";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)+$/;
const MAX_NAME_DISTANCE = 2;

export type PlayerSlugResolution =
  | { status: 200; slug: string }
  | { status: 308; slug: string; target: string }
  | { status: 404; slug: string };

type HistoricalRecord = { slug: string; names: string[] };

type PlayerRedirectIndex = {
  players: Set<string>;
  playerIds: string[];
  names: Map<string, string>;
  sameAs: Map<string, string>;
  historical: Map<string, string[]>;
  clubSlugs: string[];
  namePages: { slug: string; norm: string }[] | null;
};

const catalog = catalogFile as {
  seedCommits: number;
  slugs: HistoricalRecord[];
};

let cachedIndex: PlayerRedirectIndex | null = null;

export function normPlayerName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function levenshtein(left: string, right: string): number {
  if (left === right) return 0;
  if (!left) return right.length;
  if (!right) return left.length;
  let prev = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 0; i < left.length; i += 1) {
    const cur = [i + 1];
    for (let j = 0; j < right.length; j += 1) {
      const cost = left[i] === right[j] ? 0 : 1;
      cur.push(Math.min(prev[j + 1] + 1, cur[j] + 1, prev[j] + cost));
    }
    prev = cur;
  }
  return prev[right.length];
}

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
  return rest.replace(/-/g, " ").trim();
}

/** Follow known merges, same_as, and a unique longer id to the page that should answer. */
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
    const prefix = uniquePlayerRedirect(cur, index.playerIds);
    if (prefix && prefix !== cur) {
      cur = prefix;
      continue;
    }
    return null;
  }
  return null;
}

function namePages(index: PlayerRedirectIndex): { slug: string; norm: string }[] {
  if (index.namePages) return index.namePages;
  const pages: { slug: string; norm: string }[] = [];
  for (const [slug, name] of index.names) {
    const page = structuralPlayerTarget(slug, index);
    if (!page || !index.players.has(page)) continue;
    const norm = normPlayerName(name);
    if (!norm) continue;
    pages.push({ slug: page, norm });
  }
  index.namePages = pages;
  return pages;
}

function closestByName(queries: readonly string[], index: PlayerRedirectIndex): string | null {
  const pages = namePages(index);
  let best = Infinity;
  const atBest = new Set<string>();
  for (const query of queries) {
    const norm = normPlayerName(query);
    if (!norm) continue;
    for (const page of pages) {
      const distance = levenshtein(norm, page.norm);
      if (distance < best) {
        best = distance;
        atBest.clear();
        atBest.add(page.slug);
      } else if (distance === best) {
        atBest.add(page.slug);
      }
    }
  }
  if (atBest.size !== 1 || best > MAX_NAME_DISTANCE) return null;
  return [...atBest][0];
}

export function resolvePlayerSlug(raw: string, index: PlayerRedirectIndex): PlayerSlugResolution {
  const slug = raw.trim().toLowerCase();
  if (!SLUG.test(slug)) return { status: 404, slug };
  const page = structuralPlayerTarget(slug, index);
  if (page && index.players.has(page)) {
    if (page === slug) return { status: 200, slug };
    return { status: 308, slug, target: page };
  }
  const recorded = index.historical.get(slug);
  if (!recorded) return { status: 404, slug };
  const queries = recorded.length > 0 ? recorded : [derivedName(slug, index.clubSlugs)];
  const closest = closestByName(queries, index);
  if (!closest || closest === slug) return { status: 404, slug };
  return { status: 308, slug, target: closest };
}

export async function getPlayerRedirectIndex(): Promise<PlayerRedirectIndex> {
  if (cachedIndex) return cachedIndex;
  const A = await getAssoc();
  const players = new Set<string>();
  const names = new Map<string, string>();
  const sameAs = new Map<string, string>();
  for (const id of A.entitiesOfType("player")) {
    if (!id.startsWith("player:")) continue;
    const slug = id.slice("player:".length);
    if (!SLUG.test(slug)) continue;
    players.add(slug);
    const attrs = A.entityAttrs(id);
    const name = String(attrs.name ?? "").trim();
    if (name) names.set(slug, name);
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
  cachedIndex = {
    players,
    playerIds: [...players].map((slug) => `player:${slug}`),
    names,
    sameAs,
    historical,
    clubSlugs,
    namePages: null,
  };
  return cachedIndex;
}

export function historicalSlugRecords(): HistoricalRecord[] {
  return catalog.slugs;
}

export function historicalSeedCommits(): number {
  return catalog.seedCommits;
}
