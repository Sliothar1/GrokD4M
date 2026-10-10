import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import {
  AssocArray,
  loadAssocFromJson,
  type Triple,
  type TripleVal,
} from "@/lib/d4m/AssocArray";
import seed from "../../data/seed.json";
import panzerMatches from "../../data/panzer-matches.json";
import {
  allDerivedUploadTriples,
  articleSameAsId,
  articleToSummary,
  getArticleUpload,
  getLinkedArticleSummaries,
  readArticleUploads,
  invalidateBlobMetaCache,
  searchArticleUploads,
} from "@/lib/articles";
import { firstBannedPublicHit, publicSourceCredit } from "@/lib/publicText";
import {
  isClubAttrColumn,
  isNumberedClubCol,
  isSeasonClubCol,
  numberedClubColIndex,
  clubColumnLabel,
} from "@/lib/clubColumns";
import {
  buildSearchRankContext,
  collapseToUniquePlayers,
  compareSearchHits,
  findStrongPrimaryEntities,
  searchTokens,
} from "@/lib/searchRank";

export type EntityKind =
  | "player"
  | "team"
  | "match"
  | "club"
  | "win"
  | "season"
  | "source"
  | "community_story"
  | "article_upload"
  | "appearance"
  | "fixture"
  | "unknown";

export interface EntitySummary {
  id: string;
  kind: EntityKind;
  title: string;
  subtitle?: string;
  href: string;
  confidence?: string;
  /** Kid-friendly label derived from confidence, e.g. Verified / Needs check */
  trustLabel?: string;
  /** Override chip on cards (e.g. Title vs All-Ireland for win entities) */
  kindLabel?: string;
  /** Optional badge, e.g. "From cutting" */
  badge?: string;
  /** Public path to an uploaded image when kind is article_upload */
  imagePath?: string;
  /** Cite chip for cuttings / secondary newspaper cites, e.g. "1959-09-05 · Connacht Tribune" */
  citeChip?: string;
  /** Short public excerpt for cuttings search cards */
  excerpt?: string;
  /** Group 1959 draw+replay (and similar) under one season chip in search */
  seasonChip?: string;
  /** HOLD disputed-score cuttings: show chip, hide tallies */
  scoreDisputed?: boolean;
  /** Search grouping key (e.g. player id for appearances) */
  groupKey?: string;
}

export interface PendingStory {
  id: string;
  title: string;
  author: string;
  body: string;
  linkedEntity?: string;
  submittedAt: string;
}

const PENDING_PATH = path.join(process.cwd(), "data", "pending-stories.json");

let cached: AssocArray | null = null;

export function invalidateAssocCache(): void {
  cached = null;
  invalidateBlobMetaCache();
}

export async function getAssoc(): Promise<AssocArray> {
  if (!cached) {
    const seedList = Array.isArray(seed) ? seed : [];
    const panzerList = Array.isArray(panzerMatches) ? panzerMatches : [];
    const derived = await allDerivedUploadTriples();
    cached = loadAssocFromJson([...seedList, ...panzerList, ...derived]);
  }
  return cached;
}

export function entityKind(id: string, attrs?: Record<string, TripleVal>): EntityKind {
  const typeVal = attrs?.type ?? id.split(":")[0];
  const t = String(typeVal);
  if (t === "all_ireland_win") return "win";
  if (
    t === "player" ||
    t === "team" ||
    t === "match" ||
    t === "club" ||
    t === "win" ||
    t === "season" ||
    t === "source" ||
    t === "community_story" ||
    t === "article_upload" ||
    t === "appearance" ||
    t === "fixture"
  ) {
    return t;
  }
  return "unknown";
}

export function entityHref(id: string, kind?: EntityKind): string {
  const k = kind ?? entityKind(id);
  const slug = id.includes(":") ? id.slice(id.indexOf(":") + 1) : id;
  switch (k) {
    case "player":
      return `/player/${slug}`;
    case "team":
      return `/team/${slug}`;
    case "match":
      return `/match/${slug}`;
    case "club":
      return `/club/${slug}`;
    case "win":
      return `/win/${slug}`;
    case "community_story":
      return `/story/${slug}`;
    case "article_upload":
      return `/article/${slug}`;
    default:
      return `/search?q=${encodeURIComponent(id)}`;
  }
}

/** Friendly trust badge for kids/adults — never show raw "confidence: medium". */
export function friendlyTrustLabel(confidence?: string | null): string | undefined {
  if (!confidence) return undefined;
  const c = confidence.toLowerCase();
  if (c === "high" || c === "verified") return "Verified";
  if (c === "medium") return "Needs check";
  if (c === "low") return "Needs check";
  if (c === "community") return "Fan story";
  if (c === "unverified") return "Needs check";
  if (c === "hold") return "Needs check";
  return "Needs check";
}

/** True when a player is named on a newspaper cutting (archivist / ingest stamps). */
export function isVerifiedFromCutting(
  attrs: Record<string, TripleVal>
): boolean {
  const status = String(attrs.status ?? "").toLowerCase();
  const verification = String(attrs.verification ?? "").toLowerCase();
  return (
    status === "verified_from_cutting" ||
    verification.includes("verified_from_cutting") ||
    verification.includes("named in newspaper") ||
    verification.includes("from cutting")
  );
}

/** Player header trust: cutting/archivist stamps beat raw confidence. */
export function playerTrustLabel(
  attrs: Record<string, TripleVal>,
  confidence?: string | null
): string | undefined {
  if (isVerifiedFromCutting(attrs)) return "Verified";
  const status = String(attrs.status ?? "").toLowerCase();
  if (status === "archivist_approved") return "Verified";
  return friendlyTrustLabel(
    confidence ?? (attrs.confidence != null ? String(attrs.confidence) : undefined)
  );
}

/** Cuttings already stamped on the player row by article ingest (`cutting:<id>`). */
export function linkedCuttingCount(attrs: Record<string, TripleVal>): number {
  return Object.keys(attrs).filter((k) => k.startsWith("cutting:")).length;
}

/**
 * Club-roster chip only. The player profile strip does not call this.
 *
 * The old strip rule (confidence `high`, any `cutting_cite`, or any linked
 * cutting ⇒ Verified) is retired on player pages. The strip uses
 * `headlineVerificationStatus` (`src/lib/verification.ts`): Verified only
 * when an identity fact has a Verified source. This helper stays so club
 * roster groups keep their current cutting/confidence chip until Club Desk
 * switches to that module.
 */
export function playerProfileChip(
  attrs: Record<string, TripleVal>,
  confidence?: string | null,
  linkedCuttings = 0
): string | undefined {
  const trust = playerTrustLabel(attrs, confidence);
  if (isVerifiedFromCutting(attrs) || linkedCuttings > 0 || trust === "Verified") {
    return "Verified";
  }
  return trust;
}

/** True for All-Ireland SHC / Club titles — not county Junior/Minor grades. */
export function isAllIrelandWinAttrs(attrs: Record<string, TripleVal>): boolean {
  if (String(attrs.type ?? "") === "all_ireland_win") return true;
  const blob = `${attrs.name ?? ""} ${attrs.title ?? ""}`;
  return /all-?ireland/i.test(blob);
}

/** Human label for an attribute key shown in Facts. */
export function friendlyAttrLabel(key: string): string {
  const labels: Record<string, string> = {
    all_ireland_medals: "All-Ireland medals",
    all_stars: "All Stars",
    linked_entity: "About",
    win_ref: "All-Ireland link",
    county: "County team",
    club: "Club",
    clubs: "Clubs",
    club_history: "Club history",
    parish_club: "Parish club",
    also_club: "Also club",
    also_known_as: "Also known as",
    father: "Father",
    club_1: "Also played for",
    club_2: "Also played for",
    team: "Team",
    position: "Position",
    born: "Born",
    debut: "Debut",
    notable: "Notable",
    opponent: "Opponent",
    score: "Score",
    venue: "Venue",
    year: "Year",
    competition: "Competition",
    manager: "Manager",
    captain: "Captain",
    outcome: "Outcome",
    nickname: "Nickname",
    colours: "Colours",
    province: "Province",
    ground: "Home ground",
    author: "Author",
    body: "Story",
    summary: "Summary",
    note: "Note",
    date: "Date",
    home: "Side",
    away: "Opposition",
    winner: "Winner",
    season: "Season",
    division: "Division",
    source: "Source",
    confidence: "Trust",
    type: "Type",
    name: "Name",
    title: "Title",
    url: "Link",
    kind: "Kind",
    alias: "Also known as",
    amalgamated_juvenile: "Juvenile amalgamation",
    amalgamated_adult: "Adult amalgamation",
    historic_predecessor: "Historic predecessor club",
    historic_predecessor_ahascragh: "Historic predecessor (Ahascragh)",
    historic_note: "Historic note",
    cuttings: "Article cuttings",
    source_club_history: "Club history source",
    source_wiki: "Wikipedia source",
    source_grounds: "Grounds source",
    successor: "Later became",
    status: "Status",
    score_note: "Score note",
    venue_confidence: "Venue trust",
    tag: "Tag",
    result: "Result",
    kid_chip: "Kid chip",
    round: "Round",
    player: "Player",
    excerpt: "Excerpt",
    cite: "Cite",
    verification: "Verification",
    secondary_cite: "Secondary cite",
    secondary_cite_paper: "Cite paper",
    secondary_cite_date: "Cite date",
    secondary_cite_url: "Cite link",
    paper: "Paper",
    pack_id: "Pack id",
    ingest_triage: "Ingest triage",
    same_as: "Same as",
    season_chip: "Season",
    hide_score: "Hide score",
    score_disputed: "Score disputed",
    archivist_ruling: "Archivist",
    cite_chip: "Cite",
    cutting_cite: "Cutting cite",
    grade: "Grade",
    hold: "Hold",
  };
  if (labels[key]) return labels[key];
  // Numbered extras: club_1, club_2, … (same pattern as article cuttings)
  if (/^club_\d+$/.test(key)) return "Also played for";
  // Player × Season → Club cols look like "season:2016"
  if (/^season:\d{4}$/.test(key)) return `Club in ${key.slice(7)}`;
  return clubColumnLabel(key);
}

/**
 * Locked three-club model (Club Desk / D4M). Do not invent new club ids.
 * Historic parish clubs pre-2002; adult amalgam from 2002.
 */
export const LOCKED_CLUB_ERA = [
  "club:fohenagh-historic",
  "club:ahascragh-historic",
  "club:ahascragh-fohenagh",
] as const;

export function isClubId(val: unknown): val is `club:${string}` {
  return typeof val === "string" && /^club:[a-z0-9][a-z0-9-]*$/i.test(val);
}

function sortClubsByEra(ids: string[]): string[] {
  const rank = new Map<string, number>(
    LOCKED_CLUB_ERA.map((id, i) => [id, i])
  );
  return [...ids].sort((a, b) => {
    const ra = rank.get(a) ?? 100;
    const rb = rank.get(b) ?? 100;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
}

/**
 * Every jersey a player wore.
 *
 * Dual-era pattern (AssocArray is one val per col):
 * - `club` = primary / current jersey
 * - `also_club` = second jersey (main / Pitchside)
 * - `also_played` = another jersey (Fr Nicholas Murray → Fohenagh historic)
 * - `club_1`, `club_2`, … = numbered extras (same as article cuttings)
 * - `season:YYYY` → club id (existing player × season edges)
 * Column set is `isClubAttrColumn` in `@/lib/clubColumns` (shared with rosters).
 * Optional `extra` for appearance.club refs collected by the caller.
 */
export function playerClubIds(
  attrs: Record<string, TripleVal>,
  extra: Iterable<string> = []
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (raw: unknown) => {
    if (typeof raw !== "string") return;
    const ids = isClubId(raw)
      ? [raw.toLowerCase()]
      : (raw.match(/club:[a-z0-9][a-z0-9-]*/gi) ?? []).map((id) =>
          id.toLowerCase()
        );
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  };

  const named = Object.keys(attrs)
    .filter((k) => isClubAttrColumn(k) && !isNumberedClubCol(k) && !isSeasonClubCol(k))
    .sort((a, b) => a.localeCompare(b));
  // Primary jersey first, then the rest of the shared named columns.
  if (attrs.club != null) add(attrs.club);
  for (const k of named) {
    if (k === "club") continue;
    add(attrs[k]);
  }

  const numbered = Object.keys(attrs)
    .filter((k) => isNumberedClubCol(k))
    .sort((a, b) => numberedClubColIndex(a) - numberedClubColIndex(b));
  for (const k of numbered) add(attrs[k]);

  const seasons = Object.keys(attrs)
    .filter((k) => isSeasonClubCol(k))
    .sort();
  for (const k of seasons) add(attrs[k]);

  for (const id of extra) add(id);

  return sortClubsByEra(out);
}

/**
 * Resolve an entity ref like "club:portumna" or "team:galway" to a display name
 * via AssocArray name/title/year attrs. Falls back to a cleaned slug.
 */
export function displayNameForRef(ref: string, A: AssocArray): string {
  if (!ref.includes(":")) return ref;
  const attrs = A.entityAttrs(ref);
  if (attrs.name) return String(attrs.name);
  if (attrs.title) return String(attrs.title);
  if (attrs.year != null) return String(attrs.year);
  const slug = ref.slice(ref.indexOf(":") + 1);
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** True if value looks like an entity id (player:, club:, …). */
export function isEntityRef(val: unknown): val is `${string}:${string}` {
  return (
    typeof val === "string" &&
    /^[a-z_]+:[a-z0-9][a-z0-9_-]*$/i.test(val) &&
    !val.startsWith("http")
  );
}

export function summarizeEntity(id: string, A: AssocArray): EntitySummary | null {
  const attrs = A.entityAttrs(id);
  if (Object.keys(attrs).length === 0) return null;
  const kind = entityKind(id, attrs);
  const title =
    String(attrs.name ?? attrs.title ?? attrs.year ?? displayNameForRef(id, A));
  let subtitle: string | undefined;
  if (kind === "player") {
    const clubNames = playerClubIds(attrs)
      .map((clubId) => displayNameForRef(clubId, A))
      .filter(Boolean);
    subtitle = [attrs.position, ...clubNames]
      .filter(Boolean)
      .map(String)
      .join(" · ");
  } else if (kind === "win") {
    const isAI = isAllIrelandWinAttrs(attrs);
    if (isAI) {
      subtitle = `All-Ireland ${attrs.year}${attrs.opponent ? ` vs ${attrs.opponent}` : ""}`;
    } else {
      subtitle = [attrs.title, attrs.year].filter((v) => v != null && String(v)).map(String).join(" · ");
    }
  } else if (kind === "match") {
    const hideScore =
      attrs.hide_score === true || String(attrs.hide_score ?? "") === "true";
    const scoreBits = hideScore ? [] : [attrs.score];
    const bits = [...scoreBits, attrs.result, attrs.date, attrs.venue]
      .filter((v) => v != null && String(v).trim() && String(v).toLowerCase() !== "null")
      .map(String);
    subtitle = bits.slice(0, 2).join(" · ");
  } else if (kind === "club") {
    // Fohenagh is a club that later amalgamated — the profile is just Fohenagh.
    if (id === "club:fohenagh-historic") {
      subtitle = String(attrs.county ?? "Galway");
    } else if (
      String(attrs.kid_chip ?? "") === "Before Ahascragh-Fohenagh" ||
      id === "club:ahascragh-historic"
    ) {
      subtitle = "Before Ahascragh-Fohenagh";
    } else {
      subtitle = String(attrs.county ?? "Galway club");
    }
  } else if (kind === "team") {
    subtitle = String(attrs.nickname ?? attrs.colours ?? "");
  } else if (kind === "community_story") {
    subtitle = attrs.author ? `by ${attrs.author}` : "Community story";
  } else if (kind === "season") {
    subtitle = String(attrs.outcome ?? attrs.year ?? "");
  } else if (kind === "article_upload") {
    subtitle = [attrs.cite, attrs.year].filter(Boolean).map(String).join(" · ");
  } else if (kind === "appearance") {
    const hold =
      attrs.hold === true ||
      String(attrs.hold ?? "") === "true" ||
      String(attrs.status ?? "") === "hold";
    const bits: Array<string | number | boolean> = [attrs.competition, attrs.year];
    // Club chip only when not HOLD (Archivist: Healy = name+years+cite only)
    if (!hold && attrs.club) {
      bits.push(displayNameForRef(String(attrs.club), A));
    }
    subtitle = bits
      .filter((v) => v != null && String(v).trim())
      .map(String)
      .join(" · ");
  }
  const confidence = attrs.confidence ? String(attrs.confidence) : undefined;
  let kindLabel: string | undefined;
  if (kind === "win") {
    kindLabel = isAllIrelandWinAttrs(attrs) ? "All-Ireland" : "County title";
  } else if (kind === "appearance") {
    kindLabel = attrs.grade ? String(attrs.grade) : "Panel";
  } else if (kind === "fixture") {
    kindLabel = "Fixture";
  }
  const summary: EntitySummary = {
    id,
    kind,
    title,
    subtitle: subtitle || undefined,
    href:
      kind === "appearance"
        ? attrs.player
          ? entityHref(String(attrs.player), "player")
          : `/search?q=${encodeURIComponent(title)}`
        : entityHref(id, kind),
    confidence,
    trustLabel:
      kind === "player"
        ? playerTrustLabel(attrs, confidence)
        : friendlyTrustLabel(confidence),
    kindLabel,
  };
  if (kind === "player") {
    if (attrs.cutting_cite) summary.citeChip = shownCite(attrs.cutting_cite);
  }
  if (kind === "article_upload") {
    summary.badge = String(attrs.badge ?? "From cutting");
    if (attrs.excerpt) summary.excerpt = String(attrs.excerpt);
    if (attrs.cite) summary.citeChip = shownCite(attrs.cite);
    if (attrs.score_disputed === true || String(attrs.score_disputed ?? "") === "true") {
      summary.scoreDisputed = true;
    }
  }
  if (kind === "appearance") {
    summary.badge = attrs.grade ? String(attrs.grade) : "Panel";
    if (attrs.cite_chip) summary.citeChip = shownCite(attrs.cite_chip);
    else if (attrs.cite) summary.citeChip = shownCite(attrs.cite);
    if (attrs.excerpt) summary.excerpt = String(attrs.excerpt);
    if (attrs.year != null) summary.seasonChip = String(attrs.year);
    if (attrs.player) summary.groupKey = String(attrs.player);
    else summary.groupKey = `appearance-name:${title.toLowerCase()}`;
  }
  if (kind === "match") {
    if (attrs.secondary_cite) summary.citeChip = shownCite(attrs.secondary_cite);
    else if (attrs.cite) summary.citeChip = shownCite(attrs.cite);
    if (attrs.season_chip) summary.seasonChip = String(attrs.season_chip);
  }
  return summary;
}

function shownCite(value: unknown): string | undefined {
  const text = publicSourceCredit(String(value ?? "")).trim();
  return text || undefined;
}

export async function listEntitiesByType(typePrefix: string): Promise<EntitySummary[]> {
  const A = await getAssoc();
  return A.entitiesOfType(typePrefix)
    .filter((id) => !A.entityAttrs(id).same_as)
    .map((id) => summarizeEntity(id, A))
    .filter((e): e is EntitySummary => e !== null);
}

/** Homepage / stats: county All-Ireland + All-Ireland Club only (excludes county grades). */
export async function listAllIrelandWins(): Promise<EntitySummary[]> {
  const A = await getAssoc();
  return A.entitiesOfType("win")
    .filter((id) => {
      const attrs = A.entityAttrs(id);
      return !attrs.same_as && isAllIrelandWinAttrs(attrs);
    })
    .map((id) => summarizeEntity(id, A))
    .filter((e): e is EntitySummary => e !== null)
    .sort((a, b) => {
      const ya = Number(A.entityAttrs(a.id).year ?? 0);
      const yb = Number(A.entityAttrs(b.id).year ?? 0);
      return yb - ya;
    });
}

export interface SearchGroup {
  key: string;
  seasonChip?: string;
  items: EntitySummary[];
}

/** Group appearances by player; also 1959 draw+replay (shared seasonChip). */
export function groupSearchResults(results: EntitySummary[]): SearchGroup[] {
  const groups: SearchGroup[] = [];
  const groupIndex = new Map<string, number>();
  for (const item of results) {
    if (item.groupKey) {
      const existing = groupIndex.get(item.groupKey);
      if (existing != null) {
        groups[existing].items.push(item);
        continue;
      }
      groupIndex.set(item.groupKey, groups.length);
      const label =
        item.kind === "appearance"
          ? item.title
          : item.seasonChip;
      groups.push({
        key: item.groupKey,
        seasonChip: label,
        items: [item],
      });
      continue;
    }
    const chip = item.seasonChip;
    if (chip) {
      const sk = `season:${chip}`;
      const existing = groupIndex.get(sk);
      if (existing != null) {
        groups[existing].items.push(item);
        continue;
      }
      groupIndex.set(sk, groups.length);
      groups.push({ key: sk, seasonChip: chip, items: [item] });
      continue;
    }
    groups.push({ key: item.id, items: [item] });
  }
  return groups;
}

export async function searchEntities(query: string): Promise<EntitySummary[]> {
  const A = await getAssoc();
  const tokens = searchTokens(query);
  const rankCtx = buildSearchRankContext(query, A);

  const { rows } = A.search(query);
  const seen = new Set<string>();
  const out: EntitySummary[] = [];

  const consider = (id: string) => {
    if (seen.has(id) || !id.includes(":")) return;
    const attrs = A.entityAttrs(id);
    // Alias rows (Lab pack ids) collapse onto the canonical seed match.
    if (attrs.same_as) return;
    const summary = summarizeEntity(id, A);
    if (!summary) return;
    seen.add(id);
    out.push(summary);
  };

  for (const id of rows) consider(id);

  // Entity-level match: all tokens appear across the entity attrs (not just one triple)
  if (tokens.length > 0) {
    for (const id of A.rows()) {
      if (seen.has(id) || !id.includes(":")) continue;
      const attrs = A.entityAttrs(id);
      if (attrs.same_as) continue;
      if (!attrs.type && !id.includes(":")) continue;
      const summary = summarizeEntity(id, A);
      if (!summary) continue;
      const blob = `${summary.title} ${summary.subtitle ?? ""} ${summary.id} ${Object.values(attrs).join(" ")}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (tokens.every((tok) => blob.includes(tok))) {
        seen.add(id);
        out.push(summary);
      }
    }
  }

  for (const hit of await searchArticleUploads(query)) {
    if (!seen.has(hit.id)) {
      seen.add(hit.id);
      out.push(hit);
    }
  }

  out.sort((a, b) => compareSearchHits(a, b, rankCtx, (id) => A.entityAttrs(id)));

  return out;
}

/**
 * Name search: player / club / team hits only.
 * Cuttings, matches, and panel rows stay on entity pages — not the result list.
 * Each player id appears once (no Cathal Mannion × N appearance rows).
 */
export async function searchPrimaryEntities(query: string): Promise<EntitySummary[]> {
  const A = await getAssoc();
  const hits = findStrongPrimaryEntities(query, A);
  const seen = new Set<string>();
  const out: EntitySummary[] = [];
  for (const hit of hits) {
    if (seen.has(hit.id)) continue;
    const summary = summarizeEntity(hit.id, A);
    if (!summary) continue;
    if (summary.kind !== "player" && summary.kind !== "club" && summary.kind !== "team") {
      continue;
    }
    seen.add(hit.id);
    out.push(summary);
  }
  return collapseToUniquePlayers(out);
}

/**
 * Wiki search: people, the games those people played, and clippings that name them.
 * Fada folding stays in the name match underneath.
 */
export async function searchWiki(query: string): Promise<EntitySummary[]> {
  const people = await searchPrimaryEntities(query);
  const out: EntitySummary[] = [...people];
  const seen = new Set(out.map((item) => item.id));
  const A = await getAssoc();
  const playerIds = people
    .filter((item) => item.kind === "player")
    .slice(0, 6)
    .map((item) => item.id);
  const want = new Set(playerIds);
  if (want.size > 0) {
    const matchIds: string[] = [];
    for (const triple of A.getcol("player")) {
      if (!String(triple.row).startsWith("appearance:")) continue;
      if (!want.has(String(triple.val))) continue;
      const matchId = String(A.entityAttrs(triple.row).match ?? "");
      if (!matchId.startsWith("match:") || seen.has(matchId) || matchIds.includes(matchId)) continue;
      matchIds.push(matchId);
    }
    for (const matchId of matchIds.slice(0, 24)) {
      const summary = summarizeEntity(matchId, A);
      if (!summary || seen.has(summary.id)) continue;
      seen.add(summary.id);
      out.push(summary);
    }
    const tagged = (await readArticleUploads())
      .filter((upload) => !articleSameAsId(upload) && upload.playerTags?.some((tag) => want.has(tag)))
      .sort((a, b) => {
        const ay = Number(String(a.year ?? "").slice(0, 4)) || 0;
        const by = Number(String(b.year ?? "").slice(0, 4)) || 0;
        if (ay !== by) return ay - by;
        return a.id.localeCompare(b.id);
      });
    let clips = 0;
    for (const upload of tagged) {
      if (clips >= 24) break;
      const summary = articleToSummary(upload);
      if (seen.has(summary.id)) continue;
      if (firstBannedPublicHit(summary.title)) continue;
      seen.add(summary.id);
      out.push(summary);
      clips += 1;
    }
  }
  if (people.length === 0) {
    let extra = 0;
    for (const hit of await searchEntities(query)) {
      if (extra >= 16) break;
      if (seen.has(hit.id)) continue;
      if (hit.kind !== "match" && hit.kind !== "article_upload") continue;
      seen.add(hit.id);
      out.push(hit);
      extra += 1;
    }
  }
  return out;
}

const CITE_OVERLAY_COLS = [
  "secondary_cite",
  "secondary_cite_paper",
  "secondary_cite_date",
  "secondary_cite_url",
  "season_chip",
  "pack_id",
] as const;

export async function getEntity(id: string): Promise<{
  id: string;
  attrs: Record<string, TripleVal>;
  triples: Triple[];
  summary: EntitySummary;
  related: EntitySummary[];
} | null> {
  const A = await getAssoc();
  let attrs = A.entityAttrs(id);
  if (Object.keys(attrs).length === 0) return null;
  let canonicalId = id;
  const sameAs = attrs.same_as ? String(attrs.same_as) : "";
  if (sameAs) {
    const canonical = A.entityAttrs(sameAs);
    if (Object.keys(canonical).length > 0) {
      const overlay: Record<string, TripleVal> = { ...canonical };
      for (const col of CITE_OVERLAY_COLS) {
        if (overlay[col] == null && attrs[col] != null) overlay[col] = attrs[col];
      }
      // Alias must never supply a score onto the canonical match.
      attrs = overlay;
      canonicalId = sameAs;
    }
  }
  const summary = summarizeEntity(canonicalId, A);
  if (!summary) return null;
  if (attrs.secondary_cite) summary.citeChip = shownCite(attrs.secondary_cite);
  if (attrs.season_chip) summary.seasonChip = String(attrs.season_chip);
  id = canonicalId;
  const relatedIds = new Set<string>();
  for (const [col, val] of Object.entries(attrs)) {
    if (col === "type" || col === "source") continue;
    if (typeof val === "string" && val.includes(":")) relatedIds.add(val);
  }
  // Inverse links: anyone pointing at this id
  for (const t of A.getcol("linked_entity")) {
    if (t.val === id) relatedIds.add(t.row);
  }
  for (const t of A.toTriples()) {
    if (t.val === id && t.row !== id) relatedIds.add(t.row);
  }
  const related: EntitySummary[] = [];
  const relatedSeen = new Set<string>();
  for (const rid of relatedIds) {
    if (rid === id || relatedSeen.has(rid)) continue;
    if (rid.startsWith("article:")) {
      const artId = rid.slice("article:".length);
      const upload = await getArticleUpload(artId);
      if (upload) {
        relatedSeen.add(rid);
        related.push(articleToSummary(upload));
        continue;
      }
    }
    if (A.entityAttrs(rid).same_as) continue;
    const s = summarizeEntity(rid, A);
    if (!s) continue;
    relatedSeen.add(rid);
    related.push(s);
  }

  // Explicit playerTags / clubTags cuttings (may not yet be in inverse triples)
  if (id.startsWith("player:") || id.startsWith("club:")) {
    for (const cutting of await getLinkedArticleSummaries(id)) {
      if (relatedSeen.has(cutting.id)) continue;
      relatedSeen.add(cutting.id);
      related.push(cutting);
    }
  }

  return {
    id,
    attrs,
    triples: A.getrow(id),
    summary,
    related,
  };
}

export function resolveId(kind: string, slug: string): string {
  return `${kind}:${slug}`;
}

export function readPendingStories(): PendingStory[] {
  try {
    if (!existsSync(PENDING_PATH)) return [];
    const raw = readFileSync(PENDING_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PendingStory[]) : [];
  } catch {
    return [];
  }
}

export function appendPendingStory(
  input: Omit<PendingStory, "id" | "submittedAt">
): PendingStory {
  const stories = readPendingStories();
  const story: PendingStory = {
    ...input,
    id: `pending:${Date.now()}`,
    submittedAt: new Date().toISOString(),
  };
  stories.push(story);
  writeFileSync(PENDING_PATH, JSON.stringify(stories, null, 2), "utf8");
  return story;
}

export async function officialStories(): Promise<EntitySummary[]> {
  return listEntitiesByType("story");
}

export async function demoStats() {
  const A = await getAssoc();
  const allIrelandWins = A.entitiesOfType("win").filter((id) => {
    const attrs = A.entityAttrs(id);
    return !attrs.same_as && isAllIrelandWinAttrs(attrs);
  });
  return {
    nnz: A.nnz(),
    rows: A.rows().length,
    cols: A.cols().length,
    players: A.entitiesOfType("player").length,
    wins: allIrelandWins.length,
    clubs: A.entitiesOfType("club").length,
    stories: A.entitiesOfType("story").length,
  };
}
