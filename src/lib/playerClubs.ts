import { linkedCuttingCountsFor, readArticleUploads } from "@/lib/articles";
import { isClubAttrColumn } from "@/lib/clubColumns";
import {
  displayNameForRef,
  entityHref,
  linkedCuttingCount,
  playerProfileChip,
  summarizeEntity,
  type EntitySummary,
} from "@/lib/data";
import type { AssocArray, TripleVal } from "@/lib/d4m/AssocArray";

/** Locked three-club model — never collapse these into one jersey. */
export const LOCKED_CLUB_ORDER = [
  "club:fohenagh-historic",
  "club:ahascragh-historic",
  "club:ahascragh-fohenagh",
] as const;

export type ClubChipData = {
  id: string;
  name: string;
  href: string;
  /** Hover title. Historic predecessors keep the #14 “Before …” tooltip. */
  title: string;
};

/** Pull every `club:…` id out of a triple value (single ref or a list). */
export function parseClubIds(val: unknown): string[] {
  if (typeof val !== "string") return [];
  const matches = val.match(/club:[a-z0-9][a-z0-9-]*/gi);
  if (!matches?.length) return [];
  return [...new Set(matches.map((id) => id.toLowerCase()))];
}

export function collectClubIdsFromAttrs(
  attrs: Record<string, TripleVal>
): string[] {
  const ids = new Set<string>();
  for (const [key, val] of Object.entries(attrs)) {
    if (isClubAttrColumn(key)) {
      for (const id of parseClubIds(val)) ids.add(id);
    }
    if (key.startsWith("club:") && parseClubIds(key).length) {
      ids.add(key.toLowerCase());
    }
  }
  return [...ids];
}

function sortClubIds(ids: string[]): string[] {
  return [...ids].sort((a, b) => {
    const ia = LOCKED_CLUB_ORDER.indexOf(a as (typeof LOCKED_CLUB_ORDER)[number]);
    const ib = LOCKED_CLUB_ORDER.indexOf(b as (typeof LOCKED_CLUB_ORDER)[number]);
    if (ia !== -1 || ib !== -1) {
      return (ia === -1 ? 100 : ia) - (ib === -1 ? 100 : ib);
    }
    return a.localeCompare(b);
  });
}

/** Kid-facing chip label. Historic predecessors stay distinct from the amalgam. */
export function clubChipLabel(clubId: string, A: AssocArray): string {
  const name = displayNameForRef(clubId, A);
  if (
    clubId === "club:fohenagh-historic" ||
    clubId === "club:ahascragh-historic"
  ) {
    return `${name} · historic`;
  }
  return name;
}

export function clubChipTitle(clubId: string, label: string): string {
  if (
    clubId === "club:fohenagh-historic" ||
    clubId === "club:ahascragh-historic"
  ) {
    return "Before Ahascragh-Fohenagh";
  }
  return label;
}

export function toClubChip(clubId: string, A: AssocArray): ClubChipData {
  const name = clubChipLabel(clubId, A);
  return {
    id: clubId,
    name,
    href: entityHref(clubId, "club"),
    title: clubChipTitle(clubId, name),
  };
}

/**
 * Every jersey a player wore, from seed attrs + appearance clubs + related clubs.
 * Does not invent clubs — only existing refs.
 */
export function playerClubChips(
  playerId: string,
  attrs: Record<string, TripleVal>,
  related: EntitySummary[],
  A: AssocArray
): ClubChipData[] {
  const ids = new Set(collectClubIdsFromAttrs(attrs));

  for (const r of related) {
    if (r.kind === "club") ids.add(r.id);
    if (r.kind === "appearance") {
      for (const id of parseClubIds(A.get(r.id, "club"))) ids.add(id);
    }
  }

  if (playerId.startsWith("player:")) {
    for (const t of A.getcol("player")) {
      if (t.val !== playerId) continue;
      if (!String(t.row).startsWith("appearance:")) continue;
      for (const id of parseClubIds(A.get(t.row, "club"))) ids.add(id);
    }
  }

  return sortClubIds([...ids])
    .filter((id) => Object.keys(A.entityAttrs(id)).length > 0)
    .map((id) => toClubChip(id, A));
}

export type ClubRosterRow = {
  summary: EntitySummary;
  alsoClubs: ClubChipData[];
  /** Same chip as the player profile strip: Verified or Needs check. */
  trust: string;
};

const AF_CLUB_ID = "club:ahascragh-fohenagh";
const HISTORIC_CLUB_IDS = [
  "club:fohenagh-historic",
  "club:ahascragh-historic",
] as const;

/** Club columns include the amalgam and at least one historic predecessor. */
export function isDualEraAttrs(attrs: Record<string, TripleVal>): boolean {
  const ids = new Set(collectClubIdsFromAttrs(attrs));
  if (!ids.has(AF_CLUB_ID)) return false;
  return HISTORIC_CLUB_IDS.some((id) => ids.has(id));
}

export type DualEraStripEntry = {
  summary: EntitySummary;
  /** Historic jerseys, or the amalgam chip when that link is a playing one. */
  chips: ClubChipData[];
  /**
   * True when an appearance or a match-style cite puts this player in an
   * Ahascragh-Fohenagh lineup. False when the only AF texts are a caption or role.
   */
  afPlaying: boolean;
  /** Short role from those texts, e.g. "squad caption, 2023". Null when playing. */
  roleLabel: string | null;
};

const AF_NAME = /ahascragh[\s\-/–—]*fohenagh/i;
const PLAYING_SIGNAL =
  /\b(scored|scores|goal|goals|point|points|started|starting|lined out|xv|panel|hurler|championship|minor|intermediate|full-back|half-back|midfield|forward|goalkeeper)\b/i;
const OFF_FIELD_ROLE =
  /\b(management|manager|selectors?|coaches?|coaching|mentors?|committee|backroom)\b/i;
/** First match wins. Job words outrank a photo caption. */
const ROLE_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /\bmanagement\b|\bmanager\b/i, label: "management" },
  { re: /\bselectors?\b/i, label: "selector" },
  { re: /\bcoaches?\b|\bcoaching\b/i, label: "coach" },
  { re: /\bmentors?\b/i, label: "mentor" },
  { re: /\bcommittee\b/i, label: "committee" },
  { re: /\bbackroom\b/i, label: "backroom" },
  { re: /\bsquad caption\b/i, label: "squad caption" },
  { re: /\bsquad photo\b|\bteam photo\b|\bteam-photo\b/i, label: "squad photo" },
  { re: /\bcaption\b/i, label: "caption" },
];

function afSentences(text: string): string[] {
  return text
    .split(/(?<=\.)\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => AF_NAME.test(sentence));
}

function yearIn(text: string): string | null {
  return text.match(/\b(?:19|20)\d{2}\b/)?.[0] ?? null;
}

function roleLabelFrom(texts: string[]): string | null {
  let found: { label: string; year: string | null; rank: number } | null = null;
  for (const text of texts) {
    for (let rank = 0; rank < ROLE_PATTERNS.length; rank++) {
      const pattern = ROLE_PATTERNS[rank];
      if (!pattern.re.test(text)) continue;
      const year = yearIn(text);
      if (
        !found ||
        rank < found.rank ||
        (rank === found.rank && year && !found.year)
      ) {
        found = { label: pattern.label, year, rank };
      }
      break;
    }
  }
  if (!found) return null;
  return found.year ? `${found.label}, ${found.year}` : found.label;
}

function hasPlayingAfAppearance(playerId: string, A: AssocArray): boolean {
  for (const triple of A.getcol("player")) {
    if (triple.val !== playerId) continue;
    if (!String(triple.row).startsWith("appearance:")) continue;
    const attrs = A.entityAttrs(triple.row);
    if (!parseClubIds(attrs.club).includes(AF_CLUB_ID)) continue;
    const blob = [attrs.role, attrs.position, attrs.note, attrs.excerpt]
      .filter((val) => val != null && String(val).trim())
      .map(String)
      .join(" ");
    if (OFF_FIELD_ROLE.test(blob) && !PLAYING_SIGNAL.test(blob)) continue;
    return true;
  }
  return false;
}

function foldedName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function playerNameForms(attrs: Record<string, TripleVal>): string[] {
  const raw = [attrs.name, attrs.also_known_as]
    .filter((val): val is string => typeof val === "string")
    .join(";");
  return [
    ...new Set(
      raw
        .split(";")
        .map((part) => foldedName(part))
        .filter((part) => part.length > 3)
    ),
  ];
}

/**
 * Texts that actually name Ahascragh-Fohenagh for this player.
 * A Fohenagh cutting whose club tag was widened to the amalgam does not count.
 * A cutting counts when its player tags match, or when the caption or excerpt
 * writes the player's name.
 */
function afEvidenceTexts(
  playerId: string,
  attrs: Record<string, TripleVal>,
  articles: Awaited<ReturnType<typeof readArticleUploads>>
): string[] {
  const texts: string[] = [];
  for (const key of ["note", "notable", "role", "position", "job"]) {
    const val = attrs[key];
    if (typeof val === "string") texts.push(...afSentences(val));
  }
  const names = playerNameForms(attrs);
  for (const article of articles) {
    const tags = [...(article.playerTags ?? []), ...(article.tags ?? [])].map(
      (tag) => tag.toLowerCase()
    );
    const bare = playerId.slice("player:".length);
    const tagged = tags.includes(playerId) || tags.includes(bare);
    const captionExcerpt = [article.caption, article.excerpt]
      .filter(Boolean)
      .join(". ");
    const named =
      names.length > 0 &&
      names.some((name) => foldedName(captionExcerpt).includes(name));
    if (!tagged && !named) continue;
    const blob = [
      article.caption,
      article.excerpt,
      article.citeChip,
      article.year,
      ...(article.tags ?? []),
    ]
      .filter(Boolean)
      .join(". ");
    if (AF_NAME.test(blob)) texts.push(blob);
  }
  return texts;
}

/**
 * Verified dual-era players for one of the three locked club pages.
 * Historic chips stay. The amalgam chip is only shown when the AF link is a
 * playing one; a caption or other off-field cite becomes a role label instead.
 * Needs-check players are left out — they stay in the roster.
 */
export async function verifiedDualEraStrip(
  clubId: string,
  rows: ClubRosterRow[],
  A: AssocArray
): Promise<DualEraStripEntry[]> {
  const amalgam = clubId === AF_CLUB_ID;
  const historic =
    clubId === "club:fohenagh-historic" ||
    clubId === "club:ahascragh-historic";
  if (!amalgam && !historic) return [];

  const articles = await readArticleUploads();
  const entries: DualEraStripEntry[] = [];
  for (const row of rows) {
    if (row.trust !== "Verified") continue;
    const attrs = A.entityAttrs(row.summary.id);
    const ids = collectClubIdsFromAttrs(attrs);
    if (!ids.includes(clubId) || !isDualEraAttrs(attrs)) continue;
    const evidence = afEvidenceTexts(row.summary.id, attrs, articles);
    const afPlaying =
      hasPlayingAfAppearance(row.summary.id, A) ||
      evidence.some((text) => PLAYING_SIGNAL.test(text));
    const chipIds = amalgam
      ? HISTORIC_CLUB_IDS.filter((id) => ids.includes(id))
      : afPlaying
        ? [AF_CLUB_ID]
        : [];
    entries.push({
      summary: row.summary,
      chips: chipIds.map((id) => toClubChip(id, A)),
      afPlaying,
      roleLabel: afPlaying ? null : roleLabelFrom(evidence),
    });
  }
  return entries;
}

function valueMentionsClub(val: TripleVal, clubId: string): boolean {
  return parseClubIds(val).includes(clubId);
}

function addPlayerFromRow(
  row: string,
  val: TripleVal,
  clubId: string,
  A: AssocArray,
  playerIds: Set<string>
): void {
  if (!valueMentionsClub(val, clubId)) return;
  if (row.startsWith("player:")) {
    if (!A.entityAttrs(row).same_as) playerIds.add(row);
    return;
  }
  if (row.startsWith("appearance:")) {
    const player = A.get(row, "player");
    if (typeof player === "string" && player.startsWith("player:")) {
      if (!A.entityAttrs(player).same_as) playerIds.add(player);
    }
  }
}

/** Players who wore this club's jersey (attrs + appearances). */
export async function listClubRoster(
  clubId: string,
  A: AssocArray
): Promise<ClubRosterRow[]> {
  const playerIds = new Set<string>();

  for (const col of A.cols()) {
    if (!isClubAttrColumn(col)) continue;
    for (const t of A.getcol(col)) {
      addPlayerFromRow(t.row, t.val, clubId, A, playerIds);
    }
  }

  const cuttingCounts = await linkedCuttingCountsFor(playerIds);
  const rows: ClubRosterRow[] = [];
  for (const id of playerIds) {
    const summary = summarizeEntity(id, A);
    if (!summary || summary.kind !== "player") continue;
    const attrs = A.entityAttrs(id);
    const also = sortClubIds(
      collectClubIdsFromAttrs(attrs).filter((c) => c !== clubId)
    ).map((c) => toClubChip(c, A));
    const linkedCuttings = Math.max(
      cuttingCounts.get(id) ?? 0,
      linkedCuttingCount(attrs)
    );
    rows.push({
      summary,
      alsoClubs: also,
      trust:
        playerProfileChip(attrs, summary.confidence, linkedCuttings) ??
        "Needs check",
    });
  }

  rows.sort((a, b) => {
    const va = a.trust === "Verified" ? 0 : 1;
    const vb = b.trust === "Verified" ? 0 : 1;
    if (va !== vb) return va - vb;
    return a.summary.title.localeCompare(b.summary.title);
  });

  return rows;
}
