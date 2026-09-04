import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import {
  AssocArray,
  loadAssocFromJson,
  type Triple,
  type TripleVal,
} from "@/lib/d4m/AssocArray";
import seed from "../../data/seed.json";
import {
  allDerivedUploadTriples,
  articleToSummary,
  getArticleUpload,
  getLinkedArticleSummaries,
  invalidateBlobMetaCache,
  searchArticleUploads,
} from "@/lib/articles";

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
    const derived = await allDerivedUploadTriples();
    cached = loadAssocFromJson([...seedList, ...derived]);
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
    t === "appearance"
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
    team: "Team",
    position: "Position",
    born: "Born",
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
    grade: "Grade",
    hold: "Hold",
  };
  if (labels[key]) return labels[key];
  // Player × Season → Club cols look like "season:2016"
  if (/^season:\d{4}$/.test(key)) return `Club in ${key.slice(7)}`;
  return key.replace(/_/g, " ");
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
    const clubId = attrs.club ? String(attrs.club) : "";
    const clubName = clubId ? displayNameForRef(clubId, A) : "";
    subtitle = [attrs.position, clubName].filter(Boolean).map(String).join(" · ");
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
    if (
      String(attrs.kid_chip ?? "") === "Before Ahascragh-Fohenagh" ||
      id === "club:fohenagh-historic" ||
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
    subtitle = [attrs.competition, attrs.year]
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
    trustLabel: friendlyTrustLabel(confidence),
    kindLabel,
  };
  if (kind === "article_upload") {
    summary.badge = String(attrs.badge ?? "From cutting");
    if (attrs.excerpt) summary.excerpt = String(attrs.excerpt);
    if (attrs.cite) summary.citeChip = String(attrs.cite);
    if (attrs.score_disputed === true || String(attrs.score_disputed ?? "") === "true") {
      summary.scoreDisputed = true;
    }
  }
  if (kind === "appearance") {
    summary.badge = attrs.grade ? String(attrs.grade) : "Panel";
    if (attrs.cite_chip) summary.citeChip = String(attrs.cite_chip);
    else if (attrs.cite) summary.citeChip = String(attrs.cite);
    if (attrs.excerpt) summary.excerpt = String(attrs.excerpt);
    if (attrs.year != null) summary.seasonChip = String(attrs.year);
    if (attrs.player) summary.groupKey = String(attrs.player);
    else summary.groupKey = `appearance-name:${title.toLowerCase()}`;
  }
  if (kind === "match") {
    if (attrs.secondary_cite) summary.citeChip = String(attrs.secondary_cite);
    else if (attrs.cite) summary.citeChip = String(attrs.cite);
    if (attrs.season_chip) summary.seasonChip = String(attrs.season_chip);
  }
  return summary;
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
  const normalized = query
    .trim()
    .toLowerCase()
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ");
  const tokens = normalized
    .split(" ")
    .filter(Boolean)
    .map((tok) => (tok.length > 3 && tok.endsWith("s") ? tok.slice(0, -1) : tok));

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
      const blob = `${summary.title} ${summary.subtitle ?? ""} ${summary.id} ${Object.values(attrs).join(" ")}`.toLowerCase();
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

  // Rank: verified facts first; Fohenagh appearances before other unverified
  const rankOf = (e: EntitySummary): number => {
    const attrs = A.entityAttrs(e.id);
    const playerId = attrs.player ? String(attrs.player) : "";
    const playerClub = playerId ? String(A.entityAttrs(playerId).club ?? "") : "";
    const clubRef = `${attrs.club ?? ""} ${playerClub}`;
    const blob = `${e.id} ${e.title} ${e.subtitle ?? ""} ${e.citeChip ?? ""} ${e.excerpt ?? ""} ${clubRef}`.toLowerCase();
    const fohenagh = blob.includes("fohenagh") || blob.includes("ahascragh");
    if (e.kind === "appearance") {
      // Prefer Fohenagh-linked panel appearances among unverified panel hits
      return fohenagh ? 12 : 45;
    }
    if (e.kind === "article_upload") return 80;
    const conf = (e.confidence ?? "").toLowerCase();
    if (conf === "unverified" || conf === "low" || conf === "hold") {
      return fohenagh ? 15 : 80;
    }
    if (conf === "high" || conf === "verified") return 0;
    if (fohenagh) return 5;
    if (e.trustLabel === "Verified") return 0;
    return 20;
  };
  out.sort((a, b) => rankOf(a) - rankOf(b));

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
  if (attrs.secondary_cite) summary.citeChip = String(attrs.secondary_cite);
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
