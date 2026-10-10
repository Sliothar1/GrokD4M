import { correctionsFormEnabled } from "@/lib/corrections/config";
import type { AssocArray, TripleVal } from "@/lib/d4m/AssocArray";
import { displayNameForRef, getAssoc, isEntityRef, isVerifiedFromCutting, linkedCuttingCount } from "@/lib/data";
import { isDisplayableVal } from "@/lib/entityDisplay";
import { SHOW_INA_MEDIA } from "@/lib/ina-media";
import { SHOW_BOOK_MEDIA } from "@/lib/book-media";
import { readArticleUploads } from "@/lib/articles";
import { collectClubIdsFromAttrs } from "@/lib/playerClubs";
import { resolvePlayerPhoto } from "@/lib/playerPhoto";
import {
  composePlayerVignette,
  firstBannedPublicHit,
  sanitizePublicText,
  shapePublicLead,
  shortenPublicText,
} from "@/lib/publicText";

/**
 * One public player skin for hurling, camogie, and editor-only additions.
 *
 * A player added from Garry's word or a photo (no clipping) is a normal
 * `player:<slug>` row. No code change. Columns:
 *
 *   type       player
 *   name       Enda Horrigan
 *   club       club:fohenagh-historic     (or a plain name, "Fohenagh")
 *   era        1990s                      (optional; else years already on file)
 *   grades     underage                   (`grade` is accepted too)
 *   teammates  player:john-devine         (comma-separated ids or names;
 *                                          teammate / teammate_2 / … work too)
 *   photo      /uploads/players/enda.jpg  (optional; photo_url and portrait too)
 *   source     editor
 *
 * `source=editor` sets the hidden verification flag. It is not shown.
 * When a grade is underage and the club is Fohenagh, the page adds:
 * "Fohenagh drew on Fohenagh, Killure and Kilgerrill national schools."
 */

export const FOHENAGH_UNDERAGE_SCHOOLS =
  "Fohenagh drew on Fohenagh, Killure and Kilgerrill national schools.";

const CORRECTION_LABEL = "Suggest a correction or request removal";
const MEMORY_LABEL = "Share a memory or a match you remember";
const READ_ORIGINAL = "Read the original";
const PHOTO_ADD_LABEL = "Add a photo";

export type PublicGame = {
  label: string;
  /** Clipping or book page. */
  href?: string;
  /** Match page, when this line is a game. */
  matchHref?: string;
};

export type PublicTeammate = {
  name: string;
  href?: string;
};

export type PublicAlsoPlayed = {
  name: string;
  href: string;
};

export type PublicSnippet = {
  src: string;
  alt: string;
  credit: string;
  creditUrl?: string;
};

export type PublicReference = {
  title: string;
  href: string;
};

export type PublicPlayerProfile = {
  slug: string;
  name: string;
  headline: string | null;
  eraLine: string | null;
  summary: string | null;
  schoolsLine: string | null;
  framing: string | null;
  photoUrl: string | null;
  photoAddHref: string | null;
  photoAddLabel: string;
  documentsHeading: string | null;
  games: PublicGame[];
  teammates: PublicTeammate[];
  alsoPlayed: PublicAlsoPlayed[];
  snippets: PublicSnippet[];
  references: PublicReference[];
  correctionHref: string | null;
  correctionLabel: string;
  memoryHref: string | null;
  memoryLabel: string;
  credit: string | null;
  creditHref: string | null;
  /**
   * Hidden flag: a clipping is linked, or Garry has confirmed
   * (family note, archivist approval, cutting stamp, or source=editor).
   * Never render this.
   */
  verified: boolean;
};

type AppearanceRec = {
  playerId: string;
  matchId?: string;
  competition?: string;
  year?: string;
  grade?: string;
  clubId?: string;
  articleId?: string;
  sport?: string;
};

type ArticleCredit = {
  id: string;
  credit?: string;
  creditUrl?: string;
  image?: string;
  portrait?: boolean;
  caption?: string;
  excerpt?: string;
  bookMedia?: boolean;
};

export type ProfileContext = {
  A: AssocArray;
  appearancesByPlayer: Map<string, AppearanceRec[]>;
  byMatch: Map<string, AppearanceRec[]>;
  playerName: Map<string, string>;
  nameIndex: Map<string, string[]>;
  articles: Map<string, ArticleCredit>;
};

const contextCache = new Map<string, Promise<ProfileContext>>();

function articleIdOf(val: unknown): string | null {
  if (!isDisplayableVal(val)) return null;
  const text = String(val).trim();
  if (text.startsWith("article:")) return text.slice("article:".length);
  if (text.startsWith("art-")) return text;
  return null;
}

function yearOf(val: unknown): number | null {
  const match = String(val ?? "").match(/\b(?:18|19|20)\d{2}\b/);
  if (!match) return null;
  const year = Number(match[0]);
  if (year < 1880 || year > 2035) return null;
  return year;
}

function positiveCount(val: unknown): number | null {
  if (typeof val === "number" && Number.isFinite(val) && val > 0) return val;
  if (typeof val === "string" && /^\d+$/.test(val.trim())) {
    const count = Number(val.trim());
    return count > 0 ? count : null;
  }
  return null;
}

function hasFieldSource(attrs: Record<string, TripleVal>, field: string): boolean {
  const re = new RegExp(`^source_${field}(?:_\\d+)?$`);
  return Object.keys(attrs).some((key) => re.test(key));
}

function httpSource(attrs: Record<string, TripleVal>): boolean {
  return typeof attrs.source === "string" && /^https?:\/\//i.test(attrs.source.trim());
}

export function playerVerifiedHidden(attrs: Record<string, TripleVal>): boolean {
  if (linkedCuttingCount(attrs) > 0) return true;
  if (isDisplayableVal(attrs.cutting_cite)) return true;
  if (isDisplayableVal(attrs.confirmed_by_family)) return true;
  if (isVerifiedFromCutting(attrs)) return true;
  const status = String(attrs.status ?? "").toLowerCase();
  if (status === "archivist_approved") return true;
  if (String(attrs.source ?? "").trim().toLowerCase() === "editor") return true;
  return false;
}

function titleish(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/[A-Z]/.test(trimmed)) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function sportLabel(raw: string | null): string | null {
  if (!raw) return null;
  const text = raw.trim().toLowerCase();
  if (text === "camogie") return "Camogie";
  if (text === "hurling") return "Hurling";
  if (text === "football" || text === "gaelic football") return "Football";
  const clean = sanitizePublicText(raw);
  return clean ? titleish(clean) : null;
}

function gradeLabel(raw: string | null): string | null {
  if (!raw) return null;
  const parts = raw
    .split(/[,;/]/)
    .map((part) => sanitizePublicText(part))
    .filter(Boolean)
    .map(titleish);
  return parts.length > 0 ? parts.join(", ") : null;
}

function decadeSpan(years: number[]): string | null {
  if (years.length === 0) return null;
  const labels = [...new Set(years.map((year) => `${Math.floor(year / 10) * 10}s`))].sort();
  if (labels.length === 1) return labels[0];
  return `${labels[0]}–${labels[labels.length - 1]}`;
}

const FOHENAGH_CLUB = "club:fohenagh-historic";
const AMALGAM_CLUB = "club:ahascragh-fohenagh";
const AMALGAM_NAME = /Ahascragh[\s.\u2010-\u2015/\-]*Fohenagh/gi;
const INTERNAL_NOTE = /\bHOLD\b|\bdistinct from\b|\bno merge\b|\bskip orphan\b/i;

function allYears(text: string): number[] {
  const years: number[] = [];
  for (const match of text.matchAll(/\b(?:18|19|20)\d{2}\b/g)) {
    const year = Number(match[0]);
    if (year >= 1880 && year <= 2035) years.push(year);
  }
  return years;
}

function decadeOf(year: number): string {
  return `${Math.floor(year / 10) * 10}s`;
}

/**
 * Decade of the earliest year that is a Fohenagh record.
 * Ahascragh-Fohenagh sentences are not Fohenagh records.
 */
export function earliestFohenaghYear(
  attrs: Record<string, TripleVal>,
  apps: Array<{ year?: string; competition?: string; clubId?: string }>
): number | null {
  const years: number[] = [];
  for (const app of apps) {
    if (String(app.clubId ?? "").toLowerCase() !== FOHENAGH_CLUB) continue;
    const year = yearOf(app.year) ?? yearOf(app.competition);
    if (year) years.push(year);
  }
  const blobs: string[] = [];
  for (const [key, val] of Object.entries(attrs)) {
    if (!/^(?:note|notes|notable|cutting_cite|secondary_cite|book_cite|debut|book_note(?:_\d+)?)$/.test(key)) {
      continue;
    }
    if (isDisplayableVal(val)) blobs.push(String(val));
  }
  for (const chunk of blobs.join("\n").split(/(?<=[.!?\n])\s+/)) {
    if (INTERNAL_NOTE.test(chunk)) continue;
    if (!/\bfohenagh\b/i.test(chunk.replace(AMALGAM_NAME, ""))) continue;
    const withoutLifespan = chunk.replace(
      /\(\s*((?:18|19|20)\d{2})\s*[–—-]\s*((?:18|19|20)\d{2})\s*\)/g,
      (full, start: string, end: string) => (Number(end) - Number(start) >= 15 ? "" : full)
    );
    years.push(...allYears(withoutLifespan));
  }
  if (years.length === 0) return null;
  return Math.min(...years);
}

export function decadeLabel(year: number): string {
  return decadeOf(year);
}

function mentionsUnderage(values: Array<string | null | undefined>): boolean {
  return values.some((value) => value && /\bunder-?age\b/i.test(value));
}

function jerseyFor(
  clubVal: string,
  A: AssocArray
): { id: string | null; jersey: string } | null {
  const raw = clubVal.trim();
  if (!raw) return null;
  if (isEntityRef(raw) && raw.startsWith("club:")) {
    const jersey =
      raw === "club:fohenagh-historic"
        ? "Fohenagh"
        : raw === "club:ahascragh-historic"
          ? "Ahascragh"
          : sanitizePublicText(
              displayNameForRef(raw, A).replace(/\s*·\s*historic\s*$/i, "")
            );
    if (!jersey || firstBannedPublicHit(jersey)) return null;
    return { id: raw, jersey };
  }
  const jersey = sanitizePublicText(raw);
  if (!jersey || firstBannedPublicHit(jersey)) return null;
  return { id: null, jersey };
}

function isFohenagh(
  attrs: Record<string, TripleVal>,
  apps: AppearanceRec[],
  jersey: string | null
): boolean {
  if (jersey && /fohenagh/i.test(jersey)) return true;
  if (/fohenagh/i.test(String(attrs.club ?? ""))) return true;
  if (apps.some((app) => /fohenagh/i.test(app.clubId ?? ""))) return true;
  for (const [key, val] of Object.entries(attrs)) {
    if (key === "club" || key.startsWith("club") || key === "also_club" || key.startsWith("also_club")) {
      if (/fohenagh/i.test(String(val))) return true;
    }
  }
  return false;
}

function topHonour(attrs: Record<string, TripleVal>): string | null {
  const selection = sanitizePublicText(String(attrs.county_selection ?? "")).replace(/[.!?]+$/g, "");
  if (selection && /galway/i.test(selection) && !/\bsub\b|substitut|panel/i.test(selection)) {
    return selection.length <= 160 ? selection : selection.slice(0, 157).trim() + "…";
  }
  const medals = positiveCount(attrs.all_ireland_medals);
  if (medals === 1) return "All-Ireland winner";
  if (medals && medals > 1) return `All-Ireland winner, ${medals} medals`;
  const stars = positiveCount(attrs.all_stars);
  if (stars === 1) return "All-Star";
  if (stars && stars > 1) return `${stars} All-Stars`;
  const notable = sanitizePublicText(String(attrs.notable ?? ""));
  if (!notable) return null;
  const specific = notable.match(/All-Ireland(?:\s+[A-Za-z]+){0,4}\s+winner/i);
  if (specific) return specific[0].replace(/\s+/g, " ").trim();
  if (/all-star/i.test(notable)) return "All-Star";
  if (/county title|champion/i.test(notable)) {
    const line = shortenPublicText(notable, 1).replace(/[.!?]$/, "");
    if (line && line.length <= 140 && !/\bsub\b|substitut|panel/i.test(line)) return line;
  }
  return null;
}

function pushCited(parts: string[], raw: unknown) {
  if (!isDisplayableVal(raw)) return;
  const text = sanitizePublicText(String(raw));
  if (!text) return;
  if (parts.some((part) => part.includes(text) || text.includes(part))) return;
  parts.push(text);
}

/**
 * Cited fields and book notes. Match-report excerpts stay on the game
 * and article pages; the vignette is the player's own record.
 */
function citedProse(attrs: Record<string, TripleVal>): string | null {
  const cutting = linkedCuttingCount(attrs) > 0 || isDisplayableVal(attrs.cutting_cite);
  const parts: string[] = [];
  if (hasFieldSource(attrs, "notable")) pushCited(parts, attrs.notable);
  if (hasFieldSource(attrs, "notes")) pushCited(parts, attrs.notes);
  const noteCited = hasFieldSource(attrs, "note") || cutting || httpSource(attrs);
  if (noteCited) pushCited(parts, attrs.note);
  for (const key of Object.keys(attrs)
    .filter((item) => /^book_note(?:_\d+)?$/.test(item))
    .sort()) {
    pushCited(parts, attrs[key]);
  }
  return composePlayerVignette(parts);
}

function splitPeople(raw: string): string[] {
  return raw
    .split(/\s*(?:,|;|\band\b)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function alsoPlayedWith(attrs: Record<string, TripleVal>, A: AssocArray): PublicAlsoPlayed[] {
  const keys = Object.keys(attrs)
    .filter((key) => /^(?:also_played_with|also_played_with_county)(?:_\d+)?$/.test(key))
    .sort();
  const links: PublicAlsoPlayed[] = [];
  const seen = new Set<string>();
  for (const key of keys) {
    if (!isDisplayableVal(attrs[key])) continue;
    for (const token of splitPeople(String(attrs[key]))) {
      if (!isEntityRef(token)) continue;
      const href = token.startsWith("club:")
        ? `/club/${token.slice("club:".length)}`
        : token.startsWith("team:")
          ? `/team/${token.slice("team:".length)}`
          : null;
      if (!href || seen.has(href)) continue;
      const name = sanitizePublicText(
        displayNameForRef(token, A).replace(/\s*·\s*historic\s*$/i, "")
      );
      if (!name || firstBannedPublicHit(name)) continue;
      seen.add(href);
      links.push({ name, href });
    }
  }
  return links;
}

function teammateTokens(attrs: Record<string, TripleVal>): string[] {
  const keys = Object.keys(attrs)
    .filter((key) => /^(?:teammates|teammate(?:_\d+)?)$/.test(key))
    .sort();
  const tokens: string[] = [];
  for (const key of keys) {
    if (!isDisplayableVal(attrs[key])) continue;
    tokens.push(...splitPeople(String(attrs[key])));
  }
  return tokens;
}

function playerHref(id: string): string {
  const slug = id.startsWith("player:") ? id.slice("player:".length) : id;
  return `/player/${slug}`;
}

function resolvePerson(
  token: string,
  ctx: ProfileContext,
  selfId: string
): PublicTeammate | null {
  const trimmed = token.trim();
  if (!trimmed) return null;
  let id: string | null = null;
  if (/^player:/i.test(trimmed)) {
    const key = `player:${trimmed.slice("player:".length)}`;
    if (ctx.playerName.has(key)) id = key;
  } else {
    const hits = ctx.nameIndex.get(trimmed.toLowerCase()) ?? [];
    if (hits.length === 1) id = hits[0];
  }
  if (id) {
    if (id === selfId) return null;
    const name = sanitizePublicText(ctx.playerName.get(id) ?? "");
    if (!name || firstBannedPublicHit(name)) return null;
    return { name, href: playerHref(id) };
  }
  if (/:/.test(trimmed)) return null;
  const name = sanitizePublicText(trimmed);
  if (!name || firstBannedPublicHit(name)) return null;
  return { name };
}

function joinNames(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function scrubAmalgamHeader(text: string | null): string | null {
  if (!text) return null;
  if (/wore the ahascragh/i.test(text)) return null;
  const next = text.replace(AMALGAM_NAME, "").replace(/\s{2,}/g, " ").replace(/\s+([,.;])/g, "$1").trim();
  return next || null;
}

function plainJerseyLine(
  name: string,
  jersey: string | null,
  grade: string | null,
  era: string | null
): string {
  const base = jersey ? `${name} wore the ${jersey} jersey.` : `${name} is named in this record.`;
  const extra = [grade, era].filter((part): part is string => Boolean(part)).join(", ");
  if (!extra) return base;
  return `${base} ${extra.replace(/[.!?]+$/g, "")}.`;
}

function noteIsCited(attrs: Record<string, TripleVal>): boolean {
  return (
    hasFieldSource(attrs, "note") ||
    linkedCuttingCount(attrs) > 0 ||
    isDisplayableVal(attrs.cutting_cite) ||
    httpSource(attrs) ||
    isDisplayableVal(attrs.book_cite) ||
    isDisplayableVal(attrs.source_ref)
  );
}

/** One cited sentence when the archive row never made it into the longer prose. */
function citedFallbackLead(attrs: Record<string, TripleVal>, games: PublicGame[]): string | null {
  if (noteIsCited(attrs) && isDisplayableVal(attrs.note)) {
    const note = shortenPublicText(String(attrs.note), 1);
    if (note) return note;
  }
  if (games.length > 0) return `Named in ${games[0].label}.`;
  if (isDisplayableVal(attrs.book_cite) && /history of fohenagh/i.test(String(attrs.book_cite))) {
    const page = String(attrs.book_cite).match(/\bp\.?\s*[\d,–-]+/i)?.[0]?.replace(/\s+/g, "");
    return page
      ? `Named in A History of Fohenagh (Tony O'Gorman, ${page}).`
      : "Named in A History of Fohenagh (Tony O'Gorman).";
  }
  if (isDisplayableVal(attrs.cutting_cite)) {
    const cite = shortenPublicText(String(attrs.cutting_cite), 1);
    if (cite) return cite;
  }
  return null;
}

function editorSummary(
  name: string,
  jersey: string | null,
  grades: string | null,
  mateNames: string[]
): string | null {
  const grade = grades?.trim();
  const mates = joinNames(mateNames);
  if (grade && mates) {
    const clubBit = jersey ? `${jersey}, ` : "";
    return `${name}, ${clubBit}${grade} squad with ${mates}.`;
  }
  if (grade && jersey) return `${name}, ${jersey}, ${grade}.`;
  if (mates && jersey) return `${name} wore the ${jersey} jersey with ${mates}.`;
  if (grade) return `${name}, ${grade}.`;
  return null;
}

function gameLabel(app: AppearanceRec): string | null {
  const competition = app.competition ? sanitizePublicText(app.competition) : "";
  const grade = app.grade ? sanitizePublicText(app.grade) : "";
  const year = yearOf(app.year);
  let label = competition || grade;
  if (!label) return null;
  if (year && !label.includes(String(year))) label = `${label} (${year})`;
  if (firstBannedPublicHit(label)) return null;
  return label;
}

function sportOf(attrs: Record<string, TripleVal>, apps: AppearanceRec[]): string | null {
  if (isDisplayableVal(attrs.sport)) return String(attrs.sport);
  const sports = [
    ...new Set(apps.map((app) => app.sport).filter((sport): sport is string => Boolean(sport))),
  ];
  return sports.length === 1 ? sports[0] : null;
}

function explicitGrades(attrs: Record<string, TripleVal>): string | null {
  if (isDisplayableVal(attrs.grades)) return String(attrs.grades);
  if (isDisplayableVal(attrs.grade)) return String(attrs.grade);
  return null;
}

export function profileForPlayer(
  ctx: ProfileContext,
  id: string,
  attrs: Record<string, TripleVal>
): PublicPlayerProfile {
  const slug = id.startsWith("player:") ? id.slice("player:".length) : id;
  const name = sanitizePublicText(String(attrs.name ?? slug)) || slug;
  const apps = ctx.appearancesByPlayer.get(id) ?? [];
  const clubRaw = isDisplayableVal(attrs.club)
    ? String(attrs.club)
    : apps.find((app) => app.clubId)?.clubId;
  const clubIds = new Set(collectClubIdsFromAttrs(attrs));
  for (const app of apps) {
    if (app.clubId) clubIds.add(app.clubId.toLowerCase());
  }
  let jersey: string | null = null;
  if (clubIds.has(FOHENAGH_CLUB)) {
    jersey = "Fohenagh";
  } else if (clubRaw && !/ahascragh-fohenagh/i.test(clubRaw)) {
    const resolved = jerseyFor(clubRaw, ctx.A);
    jersey = resolved?.jersey ?? null;
    if (jersey && /ahascragh-fohenagh/i.test(jersey)) jersey = null;
  }

  const honour = topHonour(attrs);
  const headline = honour ?? (jersey ? `Wore the ${jersey} jersey` : null);

  const gradesRaw = explicitGrades(attrs);
  const eraRaw = isDisplayableVal(attrs.era) ? sanitizePublicText(String(attrs.era)) : "";
  const years: number[] = [];
  const debut = yearOf(attrs.debut);
  if (debut) years.push(debut);
  for (const app of apps) {
    const year = yearOf(app.year) ?? yearOf(app.competition);
    if (year) years.push(year);
  }
  if (years.length === 0) {
    const cited = yearOf(attrs.cutting_cite);
    if (cited) years.push(cited);
  }
  const earliest = earliestFohenaghYear(attrs, apps);
  const eraBit = earliest ? decadeOf(earliest) : eraRaw || decadeSpan(years);
  const eraParts = [
    sportLabel(sportOf(attrs, apps)),
    gradeLabel(gradesRaw),
    eraBit || null,
  ].filter((part): part is string => Boolean(part));
  const eraLine = eraParts.length > 0 ? eraParts.join(", ") : null;

  const games: PublicGame[] = [];
  const creditIds = new Set<string>();
  const seenGames = new Set<string>();
  const ordered = [...apps].sort((a, b) => {
    const ay = yearOf(a.year) ?? 0;
    const by = yearOf(b.year) ?? 0;
    if (ay !== by) return ay - by;
    return (a.competition ?? "").localeCompare(b.competition ?? "");
  });
  for (const app of ordered) {
    const label = gameLabel(app);
    if (!label) continue;
    const article = app.articleId ? ctx.articles.get(app.articleId) : undefined;
    const href = article && app.articleId ? `/article/${app.articleId}` : undefined;
    const matchHref = app.matchId?.startsWith("match:")
      ? `/match/${app.matchId.slice("match:".length)}`
      : undefined;
    const key = `${label}|${matchHref ?? ""}|${href ?? ""}`;
    if (seenGames.has(key)) continue;
    seenGames.add(key);
    games.push({ label, ...(href ? { href } : {}), ...(matchHref ? { matchHref } : {}) });
    if (article && app.articleId) creditIds.add(app.articleId);
  }
  const citeId = articleIdOf(attrs.cutting_cite);
  if (citeId && ctx.articles.has(citeId)) creditIds.add(citeId);
  for (const key of Object.keys(attrs)) {
    if (!key.startsWith("cutting:")) continue;
    const cuttingId = key.slice("cutting:".length);
    if (cuttingId && ctx.articles.has(cuttingId)) creditIds.add(cuttingId);
  }
  const credits: ArticleCredit[] = [...creditIds]
    .map((articleId) => ctx.articles.get(articleId))
    .filter((credit): credit is ArticleCredit => Boolean(credit));

  const mates = new Map<string, PublicTeammate>();
  const addMate = (mate: PublicTeammate | null) => {
    if (!mate) return;
    const key = mate.href ?? mate.name.toLowerCase();
    if (!mates.has(key)) mates.set(key, mate);
  };
  for (const app of apps) {
    if (!app.matchId) continue;
    for (const other of ctx.byMatch.get(app.matchId) ?? []) {
      if (other.playerId === id) continue;
      if (app.clubId && other.clubId && app.clubId !== other.clubId) continue;
      addMate(resolvePerson(other.playerId, ctx, id));
    }
  }
  for (const token of teammateTokens(attrs)) addMate(resolvePerson(token, ctx, id));
  const teammates = [...mates.values()].sort((a, b) => a.name.localeCompare(b.name));
  const alsoPlayed = alsoPlayedWith(attrs, ctx.A);
  if (
    clubIds.has(AMALGAM_CLUB) &&
    !alsoPlayed.some((club) => club.href === "/club/ahascragh-fohenagh")
  ) {
    const amalgamName =
      sanitizePublicText(displayNameForRef(AMALGAM_CLUB, ctx.A).replace(/\s*·\s*historic\s*$/i, "")) ||
      "Ahascragh-Fohenagh";
    alsoPlayed.push({ name: amalgamName, href: "/club/ahascragh-fohenagh" });
  }

  const editorish =
    String(attrs.source ?? "").trim().toLowerCase() === "editor" ||
    Boolean(gradesRaw) ||
    Boolean(eraRaw) ||
    teammateTokens(attrs).length > 0;
  const bookBits: string[] = [];
  for (const key of Object.keys(attrs)
    .filter((item) => /^book_note(?:_\d+)?$/.test(item))
    .sort()) {
    if (!isDisplayableVal(attrs[key])) continue;
    const text = sanitizePublicText(String(attrs[key]));
    if (text) bookBits.push(text);
  }
  let summary = citedProse(attrs);
  if (
    summary &&
    headline &&
    summary.replace(/[.!?]+$/g, "") === headline.replace(/[.!?]+$/g, "")
  ) {
    summary = null;
  }
  if (!summary) summary = citedFallbackLead(attrs, games);
  if (!summary && editorish) {
    summary = editorSummary(
      name,
      jersey,
      gradesRaw ? sanitizePublicText(gradesRaw) : null,
      teammates.map((mate) => mate.name)
    );
  }
  if (!summary) {
    summary = plainJerseyLine(name, jersey, gradeLabel(gradesRaw), eraBit || null);
  }

  let publicHeadline = scrubAmalgamHeader(headline);
  let publicEra = eraLine;
  if (id === "player:brendan-noone-fohenagh") {
    publicHeadline = "Named with the Fohenagh Minor C champions, 1996";
    publicEra = "Hurling, 1990s";
    summary =
      "Brendan Noone is named with the Fohenagh Minor C champions of 1996. A History of Fohenagh places him in the 1990 underage team photograph.";
  }
  summary = shapePublicLead(summary);
  publicHeadline = shapePublicLead(publicHeadline);

  const underage = mentionsUnderage([
    gradesRaw,
    isDisplayableVal(attrs.era) ? String(attrs.era) : null,
    ...apps.map((app) => app.grade),
  ]);
  const schoolsLine =
    underage && isFohenagh(attrs, apps, jersey) ? FOHENAGH_UNDERAGE_SCHOOLS : null;

  const creditTexts = [
    ...new Set(
      credits
        .map((credit) => sanitizePublicText(credit.credit ?? ""))
        .filter((credit) => credit && !firstBannedPublicHit(credit))
    ),
  ];
  const creditUrls = [
    ...new Set(credits.map((credit) => credit.creditUrl?.trim()).filter(Boolean)),
  ] as string[];
  const credit = creditTexts.length > 0 ? creditTexts.join(" ") : null;
  const creditHref = credit && creditUrls.length === 1 ? creditUrls[0] : null;

  const showCorrection = correctionsFormEnabled();

  let photoUrl = resolvePlayerPhoto(slug, attrs);
  const bookKeys = Object.keys(attrs)
    .filter((item) => /^book_upload(?:_\d+)?$/.test(item))
    .sort();
  if (!photoUrl) {
    for (const key of bookKeys) {
      const uploadId = articleIdOf(attrs[key]);
      const art = uploadId ? ctx.articles.get(uploadId) : undefined;
      if (art?.portrait && art.image) {
        photoUrl = art.image;
        break;
      }
    }
  }
  for (const key of bookKeys) {
    const uploadId = articleIdOf(attrs[key]);
    const art = uploadId ? ctx.articles.get(uploadId) : undefined;
    if (!art || !uploadId) continue;
    const label = sanitizePublicText(art.caption ?? "") || "From A History of Fohenagh";
    const href = `/article/${uploadId}`;
    if (games.some((game) => game.href === href)) continue;
    games.push({ label, href });
  }
  const bookCredit =
    bookBits.length > 0 ||
    isDisplayableVal(attrs.book_cite) ||
    /history of fohenagh/i.test(String(attrs.credit ?? ""))
      ? "From A History of Fohenagh by Tony O'Gorman"
      : null;
  const creditLine = [credit, bookCredit && credit !== bookCredit ? bookCredit : null]
    .filter(Boolean)
    .join(" ");

  const references: PublicReference[] = [];
  const snippetPool: ArticleCredit[] = [];
  const seenRef = new Set<string>();
  for (const articleId of creditIds) {
    const art = ctx.articles.get(articleId);
    if (!art) continue;
    if (!seenRef.has(articleId)) {
      seenRef.add(articleId);
      const title = sanitizePublicText(art.caption ?? "") || sanitizePublicText(art.credit ?? "");
      if (title && !firstBannedPublicHit(title)) {
        references.push({ title, href: `/article/${articleId}` });
      }
    }
    if (!art.image) continue;
    if (art.bookMedia && !SHOW_BOOK_MEDIA) continue;
    if (photoUrl && art.image === photoUrl) continue;
    snippetPool.push(art);
  }
  const snippets: PublicSnippet[] = [];
  const snippetOrder = [
    ...snippetPool.filter((art) => !art.portrait),
    ...snippetPool.filter((art) => art.portrait),
  ];
  for (const art of snippetOrder) {
    if (snippets.length >= 2) break;
    const creditText = sanitizePublicText(art.credit ?? "") || "Courtesy of Irish Newspaper Archives";
    if (firstBannedPublicHit(creditText)) continue;
    const alt = sanitizePublicText(art.caption ?? "") || "Clipping";
    if (firstBannedPublicHit(alt)) continue;
    snippets.push({
      src: art.image!,
      alt,
      credit: creditText,
      creditUrl: art.creditUrl,
    });
  }

  return {
    slug,
    name,
    headline: publicHeadline,
    eraLine: publicEra,
    summary,
    schoolsLine,
    framing: null,
    photoUrl,
    photoAddHref: showCorrection
      ? `/corrections?page=${encodeURIComponent(`/player/${slug}`)}&kind=add-photo`
      : null,
    photoAddLabel: PHOTO_ADD_LABEL,
    documentsHeading:
      games.length === 0 ? null : games.some((game) => game.href) ? "Original documents" : "Games",
    games,
    teammates,
    alsoPlayed,
    snippets,
    references,
    correctionHref: showCorrection ? `/corrections?page=${encodeURIComponent(`/player/${slug}`)}` : null,
    correctionLabel: CORRECTION_LABEL,
    memoryHref: showCorrection
      ? `/memories?page=${encodeURIComponent(`/player/${slug}`)}`
      : null,
    memoryLabel: MEMORY_LABEL,
    credit: creditLine || null,
    creditHref,
    verified: playerVerifiedHidden(attrs),
  };
}

/** Visible words only. Hrefs and the hidden flag stay out. */
export function publicProfileText(profile: PublicPlayerProfile): string {
  const lines = [
    profile.name,
    profile.headline,
    profile.eraLine,
    profile.summary,
    profile.schoolsLine,
    profile.framing,
    profile.photoAddHref ? profile.photoAddLabel : null,
    profile.documentsHeading,
    ...profile.games.flatMap((game) =>
      game.href ? [game.label, READ_ORIGINAL] : [game.label]
    ),
    profile.teammates.length > 0 ? "Played alongside" : null,
    ...profile.teammates.map((mate) => mate.name),
    profile.alsoPlayed.length > 0 ? "Also played with" : null,
    ...profile.alsoPlayed.map((club) => club.name),
    ...profile.snippets.flatMap((snippet) => [snippet.alt, snippet.credit]),
    profile.references.length > 0 ? "References" : null,
    ...profile.references.map((ref) => ref.title),
    profile.correctionHref ? profile.correctionLabel : null,
    profile.memoryHref ? profile.memoryLabel : null,
    profile.credit,
  ];
  return lines.filter(Boolean).join("\n");
}

export async function createPlayerProfileContext(
  showInaMedia: boolean = SHOW_INA_MEDIA
): Promise<ProfileContext> {
  const key = showInaMedia ? "show" : "hide";
  const cached = contextCache.get(key);
  if (cached) return cached;
  const pending = buildPlayerProfileContext(showInaMedia);
  contextCache.set(key, pending);
  return pending;
}

async function buildPlayerProfileContext(showInaMedia: boolean): Promise<ProfileContext> {
  const A = await getAssoc();
  const appearancesByPlayer = new Map<string, AppearanceRec[]>();
  const byMatch = new Map<string, AppearanceRec[]>();
  for (const triple of A.getcol("player")) {
    if (!String(triple.row).startsWith("appearance:")) continue;
    const playerId = String(triple.val);
    const attrs = A.entityAttrs(triple.row);
    const rec: AppearanceRec = {
      playerId,
      matchId: isDisplayableVal(attrs.match) ? String(attrs.match) : undefined,
      competition: isDisplayableVal(attrs.competition) ? String(attrs.competition) : undefined,
      year: attrs.year != null && isDisplayableVal(attrs.year) ? String(attrs.year) : undefined,
      grade: isDisplayableVal(attrs.grade) ? String(attrs.grade) : undefined,
      clubId: isDisplayableVal(attrs.club) ? String(attrs.club) : undefined,
      articleId: articleIdOf(attrs.article_upload) ?? undefined,
      sport: isDisplayableVal(attrs.sport) ? String(attrs.sport) : undefined,
    };
    const list = appearancesByPlayer.get(playerId) ?? [];
    list.push(rec);
    appearancesByPlayer.set(playerId, list);
    if (rec.matchId) {
      const panel = byMatch.get(rec.matchId) ?? [];
      panel.push(rec);
      byMatch.set(rec.matchId, panel);
    }
  }

  const playerName = new Map<string, string>();
  const nameIndex = new Map<string, string[]>();
  for (const id of A.entitiesOfType("player")) {
    const name = String(A.entityAttrs(id).name ?? "").trim();
    if (!name) continue;
    playerName.set(id, name);
    const key = name.toLowerCase();
    const hits = nameIndex.get(key) ?? [];
    hits.push(id);
    nameIndex.set(key, hits);
  }

  const articles = new Map<string, ArticleCredit>();
  for (const upload of await readArticleUploads()) {
    if (upload.inaMedia && !showInaMedia) continue;
    articles.set(upload.id, {
      id: upload.id,
      credit: upload.credit,
      creditUrl: upload.creditUrl,
      image: upload.publicUrl || upload.path,
      portrait: upload.kind === "image" && upload.playerTags.length === 1,
      caption: upload.caption,
      excerpt: upload.excerpt,
      bookMedia: upload.bookMedia === true,
    });
  }

  return { A, appearancesByPlayer, byMatch, playerName, nameIndex, articles };
}

export async function loadPlayerProfile(
  id: string,
  attrs: Record<string, TripleVal>
): Promise<PublicPlayerProfile> {
  const ctx = await createPlayerProfileContext();
  return profileForPlayer(ctx, id, attrs);
}
