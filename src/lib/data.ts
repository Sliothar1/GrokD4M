import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import {
  AssocArray,
  loadAssocFromJson,
  type Triple,
  type TripleVal,
} from "@/lib/d4m/AssocArray";
import seed from "../../data/seed.json";

export type EntityKind =
  | "player"
  | "team"
  | "match"
  | "club"
  | "win"
  | "season"
  | "source"
  | "community_story"
  | "unknown";

export interface EntitySummary {
  id: string;
  kind: EntityKind;
  title: string;
  subtitle?: string;
  href: string;
  confidence?: string;
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

export function getAssoc(): AssocArray {
  if (!cached) {
    cached = loadAssocFromJson(seed);
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
    t === "community_story"
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
    default:
      return `/search?q=${encodeURIComponent(id)}`;
  }
}

export function summarizeEntity(id: string, A: AssocArray = getAssoc()): EntitySummary | null {
  const attrs = A.entityAttrs(id);
  if (Object.keys(attrs).length === 0) return null;
  const kind = entityKind(id, attrs);
  const title =
    String(attrs.name ?? attrs.title ?? attrs.year ?? id);
  let subtitle: string | undefined;
  if (kind === "player") {
    const clubId = attrs.club ? String(attrs.club) : "";
    const clubName = clubId ? String(A.get(clubId, "name") ?? clubId) : "";
    subtitle = [attrs.position, clubName].filter(Boolean).map(String).join(" · ");
  } else if (kind === "win") {
    subtitle = `All-Ireland ${attrs.year}${attrs.opponent ? ` vs ${attrs.opponent}` : ""}`;
  } else if (kind === "match") {
    subtitle = String(attrs.date ?? attrs.score ?? "");
  } else if (kind === "club") {
    subtitle = String(attrs.county ?? "Galway club");
  } else if (kind === "team") {
    subtitle = String(attrs.nickname ?? attrs.colours ?? "");
  } else if (kind === "community_story") {
    subtitle = attrs.author ? `by ${attrs.author}` : "Community story";
  }
  return {
    id,
    kind,
    title,
    subtitle: subtitle || undefined,
    href: entityHref(id, kind),
    confidence: attrs.confidence ? String(attrs.confidence) : undefined,
  };
}

export function listEntitiesByType(typePrefix: string): EntitySummary[] {
  const A = getAssoc();
  return A.entitiesOfType(typePrefix)
    .map((id) => summarizeEntity(id, A))
    .filter((e): e is EntitySummary => e !== null);
}

export function searchEntities(query: string): EntitySummary[] {
  const A = getAssoc();
  const { rows } = A.search(query);
  const entityRows = rows.filter((r) => r.includes(":"));
  const seen = new Set<string>();
  const out: EntitySummary[] = [];
  for (const id of entityRows) {
    if (seen.has(id)) continue;
    const attrs = A.entityAttrs(id);
    if (!attrs.type && !id.includes(":")) continue;
    const summary = summarizeEntity(id, A);
    if (summary) {
      seen.add(id);
      out.push(summary);
    }
  }
  // Also surface entities whose display name matches even if tokens split oddly
  if (out.length === 0 && query.trim()) {
    for (const id of A.rows()) {
      if (!id.includes(":")) continue;
      const s = summarizeEntity(id, A);
      if (!s) continue;
      const blob = `${s.title} ${s.subtitle ?? ""} ${s.id}`.toLowerCase();
      if (blob.includes(query.trim().toLowerCase())) out.push(s);
    }
  }
  return out;
}

export function getEntity(id: string): {
  id: string;
  attrs: Record<string, TripleVal>;
  triples: Triple[];
  summary: EntitySummary;
  related: EntitySummary[];
} | null {
  const A = getAssoc();
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

export function officialStories(): EntitySummary[] {
  return listEntitiesByType("story");
}

export function demoStats() {
  const A = getAssoc();
  return {
    nnz: A.nnz(),
    rows: A.rows().length,
    cols: A.cols().length,
    players: A.entitiesOfType("player").length,
    wins: A.entitiesOfType("win").length,
  };
}
