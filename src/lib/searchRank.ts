import type { AssocArray, TripleVal } from "@/lib/d4m/AssocArray";

/** Minimal hit shape — `EntitySummary` satisfies this. */
export interface RankableHit {
  id: string;
  kind: string;
  title: string;
  subtitle?: string;
  confidence?: string;
  trustLabel?: string;
  kindLabel?: string;
  badge?: string;
  citeChip?: string;
  excerpt?: string;
  groupKey?: string;
}

export type ClubMatchStrength = "exact" | "partial";

export interface SearchRankContext {
  query: string;
  normalizedQuery: string;
  tokens: string[];
  matchedClubs: Map<string, ClubMatchStrength>;
  clubIntent: boolean;
  playerClubOf: (playerId: string) => string;
}

export interface SearchSection<T extends RankableHit = RankableHit> {
  key: string;
  title: string;
  items: T[];
}

/** Homepage / club-demo parish faces — keep them under the club cards. */
const CLUB_DEMO_PLAYERS = new Set([
  "player:tim-sweeney-fohenagh",
  "player:martin-glynn-fohenagh",
  "player:joe-rushe-fohenagh",
]);

const CLUB_SECTION_ORDER: Array<{ kinds: string[]; key: string; title: string }> = [
  { kinds: ["club"], key: "clubs", title: "Clubs" },
  { kinds: ["player"], key: "players", title: "Players" },
  { kinds: ["match"], key: "matches", title: "Matches" },
  { kinds: ["win", "team", "season"], key: "titles", title: "Titles" },
  { kinds: ["community_story", "article_upload"], key: "stories", title: "Stories" },
  { kinds: ["appearance"], key: "panels", title: "Panels" },
];

export function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ");
}

export function searchTokens(query: string): string[] {
  return normalizeSearchText(query)
    .split(" ")
    .filter(Boolean)
    .map((tok) => (tok.length > 3 && tok.endsWith("s") ? tok.slice(0, -1) : tok));
}

function clubLabels(id: string, attrs: Record<string, TripleVal>): string[] {
  const name = normalizeSearchText(String(attrs.name ?? ""));
  const slug = normalizeSearchText(id.includes(":") ? id.slice(id.indexOf(":") + 1) : id);
  const aliases = normalizeSearchText(String(attrs.alias ?? ""))
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  return [name, slug, ...aliases].filter(Boolean);
}

function labelMatchesQuery(label: string, query: string): ClubMatchStrength | null {
  if (!label || !query) return null;
  if (label === query) return "exact";
  // Distinctive parish/club tokens only — avoid matching short noise like "gaa".
  if (query.length >= 5 && label.includes(query)) return label.startsWith(query) ? "exact" : "partial";
  if (label.length >= 5 && query.includes(label)) return "partial";
  return null;
}

/** Clubs whose name / alias / id matches the query (not notable-text noise). */
export function findClubsMatchingQuery(
  query: string,
  A: AssocArray
): Map<string, ClubMatchStrength> {
  const q = normalizeSearchText(query);
  const matched = new Map<string, ClubMatchStrength>();
  if (q.length < 4) return matched;
  for (const id of A.entitiesOfType("club")) {
    const attrs = A.entityAttrs(id);
    if (attrs.same_as) continue;
    let best: ClubMatchStrength | null = null;
    for (const label of clubLabels(id, attrs)) {
      const hit = labelMatchesQuery(label, q);
      if (hit === "exact") {
        best = "exact";
        break;
      }
      if (hit === "partial") best = "partial";
    }
    if (best) matched.set(id, best);
  }
  return matched;
}

export function buildSearchRankContext(query: string, A: AssocArray): SearchRankContext {
  const matchedClubs = findClubsMatchingQuery(query, A);
  return {
    query,
    normalizedQuery: normalizeSearchText(query),
    tokens: searchTokens(query),
    matchedClubs,
    clubIntent: matchedClubs.size > 0,
    playerClubOf: (playerId: string) => {
      const attrs = A.entityAttrs(playerId);
      return [attrs.club, attrs.also_club, attrs.club_1]
        .filter((v) => typeof v === "string" && v.startsWith("club:"))
        .join(" ");
    },
  };
}

export function isCountyPanelAppearance(
  hit: RankableHit,
  attrs: Record<string, TripleVal> = {}
): boolean {
  const blob = [
    hit.title,
    hit.subtitle,
    hit.kindLabel,
    hit.badge,
    hit.excerpt,
    attrs.competition,
    attrs.grade,
    attrs.excerpt,
    attrs.note,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/named on galway/.test(blob)) return true;
  if (/all-?ireland/.test(blob) && /panel|champion/.test(blob)) return true;
  const competition = String(attrs.competition ?? "").toLowerCase();
  if (/all-?ireland/.test(competition) && !/club hurling/.test(competition)) return true;
  return false;
}

function playerLinkedToMatchedClubs(
  attrs: Record<string, TripleVal>,
  matchedClubs: Map<string, ClubMatchStrength>
): boolean {
  const clubId = attrs.club != null ? String(attrs.club) : "";
  if (clubId && matchedClubs.has(clubId)) return true;
  for (const [key, val] of Object.entries(attrs)) {
    if (/^season:\d{4}$/.test(key) && matchedClubs.has(String(val))) return true;
  }
  return false;
}

function queryTokenInIdentity(hit: RankableHit, tokens: string[]): boolean {
  const blob = `${hit.id} ${hit.title} ${hit.subtitle ?? ""}`.toLowerCase();
  return tokens.some((tok) => tok.length >= 5 && blob.includes(tok));
}

function titleCloseness(title: string, query: string): number {
  const t = normalizeSearchText(title);
  const q = normalizeSearchText(query);
  if (!t || !q) return 8;
  if (t === q) return 0;
  if (t.startsWith(q) || q.startsWith(t)) return 1;
  if (t.includes(q)) return 2;
  return 5;
}

/**
 * Lower is better. Club-name queries boost clubs + parish players and
 * demote county / All-Ireland panel rows that only share a club token.
 * Other queries keep the historic verified → Fohenagh → provisional order.
 */
export function rankSearchHit(
  hit: RankableHit,
  ctx: SearchRankContext,
  attrs: Record<string, TripleVal>
): number {
  const playerId = attrs.player ? String(attrs.player) : "";
  const playerClub = playerId ? ctx.playerClubOf(playerId) : "";
  const clubRef = `${hit.id} ${hit.title} ${hit.subtitle ?? ""} ${hit.citeChip ?? ""} ${hit.excerpt ?? ""} ${attrs.club ?? ""} ${playerClub}`.toLowerCase();
  const fohenaghFamily = clubRef.includes("fohenagh") || clubRef.includes("ahascragh");
  const conf = (hit.confidence ?? "").toLowerCase();
  const hold =
    attrs.hold === true ||
    String(attrs.hold ?? "") === "true" ||
    String(attrs.status ?? "") === "hold" ||
    conf === "hold";

  if (ctx.clubIntent) {
    if (hit.kind === "club") {
      const strength = ctx.matchedClubs.get(hit.id);
      return 1 + titleCloseness(hit.title, ctx.normalizedQuery) + (strength === "exact" ? 0 : 1);
    }
    if (hit.kind === "player") {
      const linked = playerLinkedToMatchedClubs(attrs, ctx.matchedClubs);
      const identity = queryTokenInIdentity(hit, ctx.tokens);
      if (!linked && !identity) return 48;
      let rank = 12;
      if (identity) rank -= 3;
      if (linked && String(attrs.club ?? "").includes("historic")) rank -= 2;
      if (conf === "verified" || conf === "high" || hit.trustLabel === "Verified") rank -= 1;
      if (CLUB_DEMO_PLAYERS.has(hit.id)) rank -= 3;
      return rank;
    }
    if (hit.kind === "match") {
      const home = String(attrs.home ?? "");
      const away = String(attrs.away ?? "");
      const winner = String(attrs.winner ?? "");
      const club = String(attrs.club ?? "");
      const linked =
        ctx.matchedClubs.has(home) ||
        ctx.matchedClubs.has(away) ||
        ctx.matchedClubs.has(winner) ||
        ctx.matchedClubs.has(club) ||
        queryTokenInIdentity(hit, ctx.tokens);
      return linked ? 22 : 40;
    }
    if (hit.kind === "win" || hit.kind === "team" || hit.kind === "season") return 28;
    if (hit.kind === "community_story" || hit.kind === "article_upload") return 32;
    if (hit.kind === "appearance") {
      if (hold) return 96;
      if (isCountyPanelAppearance(hit, attrs)) return 78;
      return 58;
    }
    if (conf === "unverified" || conf === "low" || conf === "hold") return 70;
    return 44;
  }

  // Non-club queries: preserve existing verified → Fohenagh → provisional ranks.
  // Exact title match (Joe Canning, Niall Leonard) still beats same-rank club noise.
  if (titleCloseness(hit.title, ctx.normalizedQuery) === 0 && hit.kind !== "appearance") {
    return -5;
  }
  if (hit.kind === "appearance") {
    const tier = Number(attrs.tier ?? 0);
    if (hold) return 90;
    if (conf === "verified" || tier === 1) return fohenaghFamily ? 0 : 1;
    return fohenaghFamily ? 12 : 45;
  }
  if (hit.kind === "article_upload") return 80;
  if (conf === "unverified" || conf === "low" || conf === "hold") {
    return fohenaghFamily ? 15 : 80;
  }
  if (conf === "high" || conf === "verified") return 0;
  if (fohenaghFamily) return 5;
  if (hit.trustLabel === "Verified") return 0;
  return 20;
}

function clubCardMatchesQuery(query: string, hit: RankableHit): boolean {
  if (hit.kind !== "club") return false;
  const q = normalizeSearchText(query);
  const title = normalizeSearchText(hit.title);
  const slug = normalizeSearchText(hit.id.includes(":") ? hit.id.slice(hit.id.indexOf(":") + 1) : hit.id);
  return Boolean(labelMatchesQuery(title, q) || labelMatchesQuery(slug, q));
}

/** Tie-break so equal ranks don't fall back to `appearance:` before `club:`. */
export function compareSearchHits(
  a: RankableHit,
  b: RankableHit,
  ctx: SearchRankContext,
  attrsOf: (id: string) => Record<string, TripleVal>
): number {
  const ra = rankSearchHit(a, ctx, attrsOf(a.id));
  const rb = rankSearchHit(b, ctx, attrsOf(b.id));
  if (ra !== rb) return ra - rb;
  // Kind order is only for parish/club-name queries — keep Joe Canning / 2017 as-is.
  if (ctx.clubIntent) {
    const kindBoost = (k: string) => {
      if (k === "club") return 0;
      if (k === "player") return 1;
      if (k === "match") return 2;
      if (k === "appearance") return 8;
      return 4;
    };
    const ka = kindBoost(a.kind);
    const kb = kindBoost(b.kind);
    if (ka !== kb) return ka - kb;
    const ta = titleCloseness(a.title, ctx.normalizedQuery);
    const tb = titleCloseness(b.title, ctx.normalizedQuery);
    if (ta !== tb) return ta - tb;
    return a.title.localeCompare(b.title);
  }
  return 0;
}

export function resultLooksLikeClubQuery<T extends RankableHit>(
  query: string,
  results: T[]
): boolean {
  const q = normalizeSearchText(query);
  if (q.length < 4) return false;
  return results.some((r) => {
    if (r.kind !== "club") return false;
    const title = normalizeSearchText(r.title);
    const slug = normalizeSearchText(r.id.includes(":") ? r.id.slice(r.id.indexOf(":") + 1) : r.id);
    return Boolean(
      labelMatchesQuery(title, q) || labelMatchesQuery(slug, q)
    );
  });
}

export function sectionSearchResults<T extends RankableHit>(
  query: string,
  results: T[]
): SearchSection<T>[] {
  if (results.length === 0) return [];
  if (!resultLooksLikeClubQuery(query, results)) {
    return [{ key: "all", title: "", items: results }];
  }
  const used = new Set<string>();
  const sections: SearchSection<T>[] = [];
  for (const spec of CLUB_SECTION_ORDER) {
    const items = results.filter((r) => {
      if (!spec.kinds.includes(r.kind)) return false;
      // Clubs header = name/alias hits only, not opponents mentioned in notes.
      if (spec.key === "clubs") return clubCardMatchesQuery(query, r);
      return true;
    });
    if (items.length === 0) continue;
    for (const item of items) used.add(item.id);
    sections.push({ key: spec.key, title: spec.title, items });
  }
  const rest = results.filter((r) => !used.has(r.id));
  if (rest.length) sections.push({ key: "more", title: "More", items: rest });
  return sections;
}

/** Player / club / team — the only kinds the kid-facing search chooser lists. */
export const PRIMARY_ENTITY_KINDS = ["player", "club", "team"] as const;
export type PrimaryEntityKind = (typeof PRIMARY_ENTITY_KINDS)[number];
export type PrimaryMatchStrength = "exact" | "prefix" | "token";

export interface PrimaryEntityHit {
  id: string;
  kind: PrimaryEntityKind;
  strength: PrimaryMatchStrength;
}

function isPrimaryEntityKind(kind: string): kind is PrimaryEntityKind {
  return (PRIMARY_ENTITY_KINDS as readonly string[]).includes(kind);
}

function aliasLabels(attrs: Record<string, TripleVal>): string[] {
  return normalizeSearchText(String(attrs.alias ?? ""))
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
}

/**
 * Public name labels only. Player slugs often include a club ("tim-sweeney-fohenagh")
 * and must not count as a name hit for a club search.
 */
export function primaryIdentityLabels(
  kind: string,
  id: string,
  title: string,
  attrs: Record<string, TripleVal> = {}
): string[] {
  const name = normalizeSearchText(String(attrs.name ?? attrs.title ?? title ?? ""));
  const labels = [name, ...aliasLabels(attrs)].filter(Boolean);
  if (kind === "player") {
    const nickname = normalizeSearchText(String(attrs.nickname ?? ""));
    if (nickname) labels.push(nickname);
    return [...new Set(labels)];
  }
  const slug = normalizeSearchText(id.includes(":") ? id.slice(id.indexOf(":") + 1) : id);
  if (slug) labels.push(slug);
  return [...new Set(labels.filter(Boolean))];
}

function wordsOf(label: string): string[] {
  return label.split(" ").filter(Boolean);
}

function tokenHitsWord(token: string, word: string): boolean {
  if (word === token) return true;
  return token.length >= 4 && word.startsWith(token);
}

export function primaryIdentityMatch(
  query: string,
  kind: string,
  id: string,
  title: string,
  attrs: Record<string, TripleVal> = {}
): PrimaryMatchStrength | null {
  if (!isPrimaryEntityKind(kind)) return null;
  const q = normalizeSearchText(query);
  if (q.length < 3) return null;
  const tokens = searchTokens(query);
  if (tokens.length === 0) return null;

  let best: PrimaryMatchStrength | null = null;
  const consider = (strength: PrimaryMatchStrength) => {
    if (strength === "exact") best = "exact";
    else if (strength === "prefix" && best !== "exact") best = "prefix";
    else if (!best) best = "token";
  };

  for (const label of primaryIdentityLabels(kind, id, title, attrs)) {
    if (label === q) {
      consider("exact");
      break;
    }
    // Prefix = the typed query is a leading slice of the name (e.g. "Ahascragh" → Ahascragh-Fohenagh).
    // Do not treat "Ahascragh-Fohenagh" as a prefix of historic Ahascragh — that blocks a unique redirect.
    if (q.length >= 4 && label.startsWith(q)) {
      consider("prefix");
      continue;
    }
    const words = wordsOf(label);
    if (tokens.every((tok) => words.some((w) => tokenHitsWord(tok, w)))) {
      consider("token");
    }
  }
  return best;
}

function primaryKindOrder(kind: string): number {
  if (kind === "club") return 0;
  if (kind === "player") return 1;
  if (kind === "team") return 2;
  return 9;
}

function primaryStrengthOrder(strength: PrimaryMatchStrength): number {
  if (strength === "exact") return 0;
  if (strength === "prefix") return 1;
  return 2;
}

/**
 * Collapse panel / appearance / season rows for the same person into one player card.
 * Keep player/club/team; drop cuttings and match dumps (they live on the profile).
 */
export function collapseToUniquePlayers<T extends RankableHit>(hits: T[]): T[] {
  const seenPlayer = new Set<string>();
  const out: T[] = [];
  for (const hit of hits) {
    if (hit.kind !== "player") continue;
    if (seenPlayer.has(hit.id)) continue;
    seenPlayer.add(hit.id);
    out.push(hit);
  }
  for (const hit of hits) {
    if (
      hit.kind === "player" ||
      hit.kind === "appearance" ||
      hit.kind === "article_upload" ||
      hit.kind === "match" ||
      hit.kind === "season"
    ) {
      continue;
    }
    if (out.some((e) => e.id === hit.id)) continue;
    out.push(hit);
  }
  return out;
}

/** Strong player / club / team name hits — not cuttings, matches, or club-roster bleed. */
export function findStrongPrimaryEntities(query: string, A: AssocArray): PrimaryEntityHit[] {
  const hits: PrimaryEntityHit[] = [];
  for (const kind of PRIMARY_ENTITY_KINDS) {
    for (const id of A.entitiesOfType(kind)) {
      const attrs = A.entityAttrs(id);
      if (attrs.same_as) continue;
      const title = String(attrs.name ?? attrs.title ?? "");
      const strength = primaryIdentityMatch(query, kind, id, title, attrs);
      if (!strength) continue;
      hits.push({ id, kind, strength });
    }
  }
  hits.sort((a, b) => {
    const sa = primaryStrengthOrder(a.strength) - primaryStrengthOrder(b.strength);
    if (sa !== 0) return sa;
    const ka = primaryKindOrder(a.kind) - primaryKindOrder(b.kind);
    if (ka !== 0) return ka;
    return a.id.localeCompare(b.id);
  });
  return hits;
}

