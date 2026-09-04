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
  /** Optional badge, e.g. "From cutting" */
  badge?: string;
  /** Public path to an uploaded image when kind is article_upload */
  imagePath?: string;
  /** Cite chip for cuttings, e.g. "1960 · Paper" */
  citeChip?: string;
  /** Short public excerpt for cuttings search cards */
  excerpt?: string;
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
    t === "article_upload"
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
  if (c === "high") return "Verified";
  if (c === "medium") return "Needs check";
  if (c === "low") return "Needs check";
  if (c === "community") return "Fan story";
  if (c === "unverified") return "Needs check";
  return "Needs check";
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
    const isAI =
      String(attrs.type ?? "") === "all_ireland_win" ||
      /all-?ireland/i.test(String(attrs.name ?? attrs.title ?? ""));
    if (isAI) {
      subtitle = `All-Ireland ${attrs.year}${attrs.opponent ? ` vs ${attrs.opponent}` : ""}`;
    } else {
      subtitle = [attrs.title, attrs.year].filter((v) => v != null && String(v)).map(String).join(" · ");
    }
  } else if (kind === "match") {
    const bits = [attrs.score, attrs.result, attrs.date, attrs.venue]
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
  }
  const confidence = attrs.confidence ? String(attrs.confidence) : undefined;
  return {
    id,
    kind,
    title,
    subtitle: subtitle || undefined,
    href: entityHref(id, kind),
    confidence,
    trustLabel: friendlyTrustLabel(confidence),
  };
}

export async function listEntitiesByType(typePrefix: string): Promise<EntitySummary[]> {
  const A = await getAssoc();
  return A.entitiesOfType(typePrefix)
    .map((id) => summarizeEntity(id, A))
    .filter((e): e is EntitySummary => e !== null);
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

  return out;
}

export async function getEntity(id: string): Promise<{
  id: string;
  attrs: Record<string, TripleVal>;
  triples: Triple[];
  summary: EntitySummary;
  related: EntitySummary[];
} | null> {
  const A = await getAssoc();
  const attrs = A.entityAttrs(id);
  if (Object.keys(attrs).length === 0) return null;
  const summary = summarizeEntity(id, A);
  if (!summary) return null;
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
  const related = [...relatedIds]
    .map((rid) => summarizeEntity(rid, A))
    .filter((e): e is EntitySummary => e !== null && e.id !== id);
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
  return {
    nnz: A.nnz(),
    rows: A.rows().length,
    cols: A.cols().length,
    players: A.entitiesOfType("player").length,
    wins: A.entitiesOfType("win").length,
    clubs: A.entitiesOfType("club").length,
    stories: A.entitiesOfType("story").length,
  };
}
