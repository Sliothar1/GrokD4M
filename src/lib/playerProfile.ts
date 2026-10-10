import { correctionsFormEnabled } from "@/lib/corrections/config";
import type { AssocArray, TripleVal } from "@/lib/d4m/AssocArray";
import { displayNameForRef, getAssoc, isEntityRef, isVerifiedFromCutting, linkedCuttingCount } from "@/lib/data";
import { isDisplayableVal } from "@/lib/entityDisplay";
import { SHOW_INA_MEDIA } from "@/lib/ina-media";
import { SHOW_BOOK_MEDIA } from "@/lib/book-media";
import { articleSameAsId, readArticleUploads } from "@/lib/articles";
import { collectClubIdsFromAttrs } from "@/lib/playerClubs";
import { resolvePlayerPhoto } from "@/lib/playerPhoto";
import { markCitations, splitCiteSentences } from "@/lib/citations";
import { mergePlayerAttrRecords } from "@/lib/playerMerge";
import { aliasPlayerIds } from "@/lib/playerSlug";
import {
  composePlayerVignette,
  firstBannedPublicHit,
  firstPublicSentence,
  publicQuote,
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
  src?: string;
  alt: string;
  credit: string;
  creditUrl?: string;
  quote?: string;
  sourceHref?: string;
  sourceTitle?: string;
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
  /** Paper, date, and page. Used to match a sentence to this clipping. */
  cite?: string;
  excerpt?: string;
  sourceUrl?: string;
  bookMedia?: boolean;
  /** Year printed on the cutting as its publication date. */
  publicationYear?: string;
};

export type ProfileContext = {
  A: AssocArray;
  appearancesByPlayer: Map<string, AppearanceRec[]>;
  byMatch: Map<string, AppearanceRec[]>;
  playerName: Map<string, string>;
  nameIndex: Map<string, string[]>;
  articles: Map<string, ArticleCredit>;
  articlesByDay: Map<string, ArticleCredit[]>;
  /** Players whose same_as points at this id. */
  aliasesByCanonical: Map<string, string[]>;
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
  for (const match of text.matchAll(/\b((?:18|19|20)\d{2})s?\b/g)) {
    const year = Number(match[1]);
    if (year >= 1880 && year <= 2035) years.push(year);
  }
  return years;
}

/** A relative's year is not this player's year. "son of the 1959 county champion" drops out. */
const RELATIVE_CLAUSE =
  /\b(?:son|daughter|father|mother|brother|sister|grandson|granddaughter|nephew|niece|uncle|aunt|cousin|namesake|wife|husband)\s+of\b[^.]*/gi;

const RETROSPECTIVE =
  /\b(?:years?\s+ago|anniversary|recalled|recalls|recalling|retrospective|remembered|former)\b/i;

const NEWSPAPER_PAREN =
  /\((?:[^()]*\b(?:Tribune|Herald|Independent|Examiner|Times|Press|Sentinel)\b[^()]*)\)/gi;

const CATALOGUE_RANGE =
  /\b((?:18|19|20)\d{2})\s*[–—-]\s*((?:18|19|20)\d{2})\b/g;

const PAPER_DATELINE =
  /\b(?:\d{1,2}\s+)?(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+((?:18|19|20)\d{2})\b/gi;

const ARCHIVE_CODE = /\b(?:CTT|TTH|CSL|GLC|INA)((?:19|20)\d{2})\d{4}\b/gi;

function keepYear(year: number): boolean {
  return year >= 1880 && year <= 2035;
}

function publicationYearsIn(text: string): number[] {
  const years: number[] = [];
  for (const match of text.matchAll(PAPER_DATELINE)) {
    const year = Number(match[1]);
    if (keepYear(year)) years.push(year);
  }
  for (const match of text.matchAll(ARCHIVE_CODE)) {
    const year = Number(match[1]);
    if (keepYear(year)) years.push(year);
  }
  return years;
}

/**
 * Years the sentence is about. A retrospective keeps the year it depicts.
 * The newspaper's own date counts only when the piece is not looking back.
 */
function eventYearsInSentence(sentence: string): number[] {
  const cleaned = sentence
    .replace(/\b(?:also\s+)?the\s+author of\b[^.]*/gi, " ")
    .replace(RELATIVE_CLAUSE, " ")
    .replace(NEWSPAPER_PAREN, " ")
    .replace(CATALOGUE_RANGE, (full, start: string, end: string) =>
      Number(end) - Number(start) >= 10 ? "" : full
    );
  const published = new Set(publicationYearsIn(cleaned));
  const years = [...new Set([...allYears(cleaned), ...published].filter(keepYear))];
  const depicted = years.filter((year) => [...published].some((pub) => year < pub));
  if (depicted.length > 0) return depicted;
  if (RETROSPECTIVE.test(cleaned) && published.size > 0) {
    return years.filter((year) => !published.has(year));
  }
  return years;
}

function yearsInOwnProse(text: string): number[] {
  const years: number[] = [];
  for (const sentence of text.split(/(?<=[.!?\n])\s+/)) {
    years.push(...eventYearsInSentence(sentence));
  }
  return [...new Set(years)];
}

type MentionSources = {
  articles?: Map<string, ArticleCredit>;
  attrsForArticle?: (id: string) => Record<string, TripleVal>;
  playerName?: string;
};

const NON_PLAYING =
  /\bauthor of\b|\bA History of Fohenagh\s+by\b|\bgraced the hurling scene\b|\bwith pride and distinction\b/i;

function foldName(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
}

function namesMatch(captionName: string, playerName: string): boolean {
  const caption = foldName(captionName);
  const player = foldName(playerName);
  if (!caption || !player) return false;
  if (caption === player || caption.includes(player) || player.includes(caption)) return true;
  const captionParts = caption.split(" ");
  const playerParts = player.split(" ");
  if (captionParts.length < 2 || playerParts.length < 2) return false;
  if (captionParts[captionParts.length - 1] !== playerParts[playerParts.length - 1]) return false;
  return captionParts[0][0] === playerParts[0][0];
}

/**
 * When a caption prints a year beside a name, that year belongs to that person.
 * Returns null when the caption does not pair names with years.
 */
function pairedCaptionYears(text: string, playerName: string | undefined): number[] | null {
  const pairs: { name: string; year: number }[] = [];
  const re = /([A-ZÀ-Ž][\p{L}'’.-]+(?:\s+[A-ZÀ-Ž][\p{L}'’.-]+)*)\s*\(([^)]+)\)/gu;
  for (const match of text.matchAll(re)) {
    for (const year of allYears(match[2]).filter(keepYear)) {
      pairs.push({ name: match[1], year });
    }
  }
  if (pairs.length === 0) return null;
  if (!playerName) return [];
  return [...new Set(pairs.filter((pair) => namesMatch(pair.name, playerName)).map((pair) => pair.year))];
}

function explicitPieceYear(attrs: Record<string, TripleVal> | undefined, keys: string[]): number | null {
  if (!attrs) return null;
  for (const key of keys) {
    const year = yearOf(attrs[key]);
    if (year) return year;
  }
  return null;
}

/** Event year for a cutting: depicted year, then match date, then season, then publication. */
function eventYearsForArticle(
  articleId: string,
  sources?: MentionSources
): number[] {
  const art = sources?.articles?.get(articleId);
  const piece = sources?.attrsForArticle?.(articleId) ?? {};
  const depicted = explicitPieceYear(piece, ["depicted_year", "depictedYear", "event_year", "eventYear"]);
  if (depicted) return [depicted];
  const match = explicitPieceYear(piece, ["match_date", "matchDate"]);
  if (match) return [match];
  const season = explicitPieceYear(piece, ["season", "season_year", "seasonYear"]);
  if (season) return [season];

  const id = art?.id || articleId;
  const dated = id.match(/((?:18|19|20)\d{2})-\d{2}-\d{2}/);
  const idPub = dated ? Number(dated[1]) : null;
  const fieldYear = yearOf(art?.publicationYear);
  if (idPub && fieldYear && fieldYear < idPub) return [fieldYear];
  const pub = fieldYear ?? idPub;

  const caption = [art?.caption, art?.excerpt, piece.caption, piece.title, piece.headline, piece.name]
    .filter((part) => isDisplayableVal(part))
    .join(" ");
  const paired = pairedCaptionYears(caption, sources?.playerName);
  if (paired) return paired;
  if (NON_PLAYING.test(caption)) return [];
  const slugRest = dated ? id.slice((dated.index ?? 0) + dated[0].length) : id;
  const earlier = [
    ...new Set(
      [...allYears(caption), ...allYears(slugRest)].filter((year) => keepYear(year) && (pub == null || year < pub))
    ),
  ];
  const marked =
    piece.retrospective === true ||
    String(piece.retrospective ?? "").toLowerCase() === "true" ||
    RETROSPECTIVE.test(caption) ||
    RETROSPECTIVE.test(slugRest.replace(/-/g, " "));
  if (earlier.length > 0) return earlier;
  if (marked) return [];
  if (pub && keepYear(pub)) return [pub];
  return allYears(caption).filter(keepYear);
}

/**
 * Years from this player's own games and dated mentions.
 * A namesake, a relative, or the club's era does not count.
 */
export function ownMentionYears(
  attrs: Record<string, TripleVal>,
  apps: Array<{ year?: string; competition?: string; articleId?: string }>,
  sources?: MentionSources
): number[] {
  const years: number[] = [];
  const publicationOnly: number[] = [];
  for (const app of apps) {
    const gameYear = yearOf(app.year) ?? yearOf(app.competition);
    if (app.articleId && sources?.articles?.has(app.articleId)) {
      const event = eventYearsForArticle(app.articleId, sources);
      const published = yearOf(sources.articles.get(app.articleId)?.publicationYear);
      const depictsEarlier = published != null && event.some((year) => year < published);
      if (gameYear && published === gameYear && depictsEarlier) {
        years.push(...event);
        continue;
      }
      if (gameYear) {
        years.push(gameYear);
        continue;
      }
      years.push(...event);
      continue;
    }
    if (gameYear) years.push(gameYear);
  }
  for (const [key, val] of Object.entries(attrs)) {
    if (
      key === "name" ||
      key === "father" ||
      key.startsWith("father_") ||
      key === "same_as" ||
      key === "alias"
    ) {
      continue;
    }
    if (key.startsWith("cutting:")) {
      years.push(...eventYearsForArticle(key.slice("cutting:".length), sources));
      continue;
    }
    if (!isDisplayableVal(val)) continue;
    const text = String(val);
    if (/^source_/.test(key)) {
      const articleId = articleIdOf(text);
      if (articleId) {
        years.push(...eventYearsForArticle(articleId, sources));
        continue;
      }
      publicationOnly.push(...eventYearsInSentence(text));
      continue;
    }
    const ownField = /^(?:note|notes|notable|cutting_cite|secondary_cite|book_cite|debut|era|book_note(?:_\d+)?)$/.test(
      key
    );
    if (!ownField) continue;
    years.push(...yearsInOwnProse(text));
  }
  if (years.length === 0) years.push(...publicationOnly);
  return [...new Set(years)];
}

/** Merged record, then this player's own years. Alias cuttings count. A relative's year does not. */
export function playingYearsFor(
  ctx: ProfileContext,
  id: string,
  passed: Record<string, TripleVal>
): number[] {
  const slug = id.startsWith("player:") ? id.slice("player:".length) : id;
  let attrs = { ...passed };
  const inbound = ctx.aliasesByCanonical.get(id) ?? [];
  const aliasIds = [...new Set([...aliasPlayerIds(slug), ...inbound])];
  for (const aliasId of aliasIds) {
    if (aliasId === id) continue;
    attrs = mergePlayerAttrRecords(attrs, ctx.A.entityAttrs(aliasId));
  }
  const apps = [
    ...(ctx.appearancesByPlayer.get(id) ?? []),
    ...aliasIds.flatMap((aliasId) => ctx.appearancesByPlayer.get(aliasId) ?? []),
  ];
  return ownMentionYears(attrs, apps, {
    articles: ctx.articles,
    playerName: String(attrs.name ?? ""),
    attrsForArticle: (articleId) => {
      const keys = [
        articleId,
        articleId.startsWith("article:") ? articleId : `article:${articleId}`,
        articleId.startsWith("art-") ? `article:${articleId.slice(4)}` : "",
      ].filter(Boolean);
      for (const key of keys) {
        const found = ctx.A.entityAttrs(key);
        if (Object.keys(found).length > 0) return found;
      }
      return {};
    },
  });
}

/** Every decade from the first dated mention through the last, inclusive. */
export function decadesSpanned(years: number[]): string[] {
  if (years.length === 0) return [];
  const start = Math.floor(Math.min(...years) / 10) * 10;
  const end = Math.floor(Math.max(...years) / 10) * 10;
  const decades: string[] = [];
  for (let year = start; year <= end; year += 10) decades.push(`${year}s`);
  return decades;
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
    const withoutLifespan = chunk
      .replace(RELATIVE_CLAUSE, " ")
      .replace(
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
    if (
      line &&
      line.length <= 140 &&
      !/\bsub\b|substitut|panel/i.test(line) &&
      !/^see also\b/i.test(line)
    ) {
      return line;
    }
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

const MONTH_LONG: Record<string, string> = {
  jan: "January",
  feb: "February",
  mar: "March",
  apr: "April",
  may: "May",
  jun: "June",
  jul: "July",
  aug: "August",
  sep: "September",
  sept: "September",
  oct: "October",
  nov: "November",
  dec: "December",
};

function expandMonth(date: string): string {
  return date.replace(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*/i,
    (_full, stem: string) => MONTH_LONG[stem.toLowerCase()] ?? _full
  );
}

/** Turn a bare cite chip into one sentence. A sentence that is already prose is left alone. */
function sentenceFromCiteChip(name: string, chip: string): string | null {
  const clean = chip.replace(/\s*·\s*INA\s*$/i, "").replace(/[.\s]+$/, "").trim();
  if (!clean.includes("·")) return null;
  if (/\b(?:is|was|were|played|won|kept|scored|named|pictured|stood|captained|lists)\b/i.test(clean)) {
    return null;
  }
  const match = clean.match(
    /^([^·]+?)\s*·\s*(\d{1,2}\s+[A-Za-z]+\s+(?:18|19|20)\d{2})(?:\s*·\s*p\.?\s*([\d–-]+))?/i
  );
  if (!match) return null;
  const paper = match[1].trim();
  const date = expandMonth(match[2].trim());
  const page = match[3] ? `, page ${match[3]}` : "";
  return `${name} is named in the ${paper} of ${date}${page}.`;
}

/** One cited sentence when the archive row never made it into the longer prose. */
function citedFallbackLead(
  attrs: Record<string, TripleVal>,
  games: PublicGame[],
  name: string
): string | null {
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
    if (cite) return sentenceFromCiteChip(name, cite) ?? cite;
  }
  return null;
}

function withoutRepeatedHeadline(summary: string | null, headline: string | null): string | null {
  if (!summary || !headline) return summary;
  const bare = headline.replace(/\[\d+\]/g, "").replace(/[.!?]+$/g, "").trim().toLowerCase();
  if (bare.length < 12) return summary;
  const sentences = splitCiteSentences(summary);
  if (sentences.length === 0) return summary;
  const first = sentences[0].replace(/\[\d+\]/g, "").replace(/[.!?]+$/g, "").trim().toLowerCase();
  if (first !== bare) return summary;
  const rest = sentences.slice(1).join(" ").trim();
  return rest || null;
}

function stampSnippetQuotes(
  snippets: PublicSnippet[],
  references: PublicReference[]
): { snippets: PublicSnippet[]; references: PublicReference[] } {
  const refs = [...references];
  const next = snippets.map((snippet) => {
    if (!snippet.quote || /\[\d+\]/.test(snippet.quote) || !snippet.sourceHref) return snippet;
    let index = refs.findIndex((ref) => ref.href === snippet.sourceHref);
    if (index < 0) {
      const title = snippet.sourceTitle || snippet.credit || "The cutting";
      if (!title || firstBannedPublicHit(title)) return snippet;
      refs.push({ title, href: snippet.sourceHref });
      index = refs.length - 1;
    }
    const quote = snippet.quote.replace(/[.!?]+$/g, "");
    return { ...snippet, quote: `${quote}[${index + 1}].` };
  });
  return { snippets: next, references: refs };
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

const MONTHS: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  sept: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

function isoDay(text: string): string | null {
  const match = text.match(
    /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+((?:18|19|20)\d{2})\b/i
  );
  if (!match) return null;
  const month = MONTHS[match[2].toLowerCase()];
  if (!month) return null;
  return `${match[3]}-${month}-${match[1].padStart(2, "0")}`;
}

function httpHref(raw: string): string | null {
  const match = raw.match(/https?:\/\/[^\s)"']+/i);
  if (!match) return null;
  return match[0].replace(/[.,;]+$/, "");
}

function clickableHref(href: string): boolean {
  return href.startsWith("/") || /^https?:\/\//i.test(href);
}

export function profileForPlayer(
  ctx: ProfileContext,
  id: string,
  passed: Record<string, TripleVal>
): PublicPlayerProfile {
  const slug = id.startsWith("player:") ? id.slice("player:".length) : id;
  let attrs = { ...passed };
  const inbound = ctx.aliasesByCanonical.get(id) ?? [];
  const aliasIds = [...new Set([...aliasPlayerIds(slug), ...inbound])];
  for (const aliasId of aliasIds) {
    if (aliasId === id) continue;
    attrs = mergePlayerAttrRecords(attrs, ctx.A.entityAttrs(aliasId));
  }
  const name = sanitizePublicText(String(attrs.name ?? slug)) || slug;
  const apps = [
    ...(ctx.appearancesByPlayer.get(id) ?? []),
    ...aliasIds.flatMap((aliasId) => ctx.appearancesByPlayer.get(aliasId) ?? []),
  ];
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
  const ownYears = playingYearsFor(ctx, id, passed);
  let eraBit = decadeSpan(ownYears);
  if (!eraBit && eraRaw && /\b(?:18|19|20)\d{2}s\b/.test(eraRaw)) eraBit = eraRaw;
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
  for (const val of Object.values(attrs)) {
    const articleId = articleIdOf(val);
    if (articleId && ctx.articles.has(articleId)) creditIds.add(articleId);
  }
  const citeDay = isoDay(String(attrs.cutting_cite ?? attrs.cite ?? ""));
  if (citeDay) {
    const paper = String(attrs.cutting_cite ?? "");
    for (const art of ctx.articlesByDay.get(citeDay) ?? []) {
      const hay = `${art.cite ?? ""} ${art.id}`.toLowerCase();
      const wantsTribune = /tribune/i.test(paper);
      const wantsHerald = /herald/i.test(paper);
      const wantsSentinel = /sentinel/i.test(paper);
      if (wantsTribune && !/tribune/.test(hay)) continue;
      if (wantsHerald && !/herald/.test(hay)) continue;
      if (wantsSentinel && !/sentinel/.test(hay)) continue;
      creditIds.add(art.id);
    }
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
  const citedHeadline =
    Boolean(summary) &&
    Boolean(headline) &&
    /\((?:[^)]*(?:Tribune|Herald|Sentinel|Independent|Examiner)[^)]*)\)/i.test(summary ?? "");
  if (
    summary &&
    headline &&
    summary.replace(/[.!?]+$/g, "") === headline.replace(/[.!?]+$/g, "") &&
    !citedHeadline
  ) {
    summary = null;
  }
  if (!summary) summary = citedFallbackLead(attrs, games, name);
  if (summary && splitCiteSentences(summary).length < 2) {
    const extra: string[] = [summary];
    const already = summary.toLowerCase();
    if (isDisplayableVal(attrs.book_cite) && !/history of fohenagh/i.test(already)) {
      const page = String(attrs.book_cite).match(/\bp\.?\s*[\d,–-]+/i)?.[0]?.replace(/\s+/g, "");
      extra.push(
        page
          ? `Named in A History of Fohenagh (Tony O'Gorman, ${page}).`
          : "Named in A History of Fohenagh (Tony O'Gorman)."
      );
    }
    if (isDisplayableVal(attrs.cutting_cite)) {
      const cite = shortenPublicText(String(attrs.cutting_cite), 1);
      const head = cite.slice(0, 28).toLowerCase();
      if (cite && head && !already.includes(head)) extra.push(cite.endsWith(".") ? cite : `${cite}.`);
    }
    if (games[0]?.label && !already.includes(games[0].label.toLowerCase().slice(0, 24))) {
      extra.push(`Named in ${games[0].label}.`);
    }
    if (extra.length > 1) {
      const padded = composePlayerVignette(extra);
      if (padded) summary = padded;
    }
  }
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
  const publicEra = eraLine;
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
      const title =
        sanitizePublicText(art.cite ?? "") ||
        sanitizePublicText(art.caption ?? "") ||
        sanitizePublicText(art.credit ?? "");
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
    const quote = publicQuote(art.excerpt ?? "") || firstPublicSentence(art.excerpt ?? "");
    snippets.push({
      src: art.image!,
      alt,
      credit: creditText,
      creditUrl: art.creditUrl,
      sourceHref: `/article/${art.id}`,
      sourceTitle: sanitizePublicText(art.cite ?? art.caption ?? "") || creditText,
      ...(quote ? { quote } : {}),
    });
  }
  if (snippets.length < 2) {
    for (const articleId of creditIds) {
      if (snippets.length >= 2) break;
      const art = ctx.articles.get(articleId);
      if (!art?.excerpt) continue;
      if (snippets.some((item) => item.quote && art.excerpt && item.quote.length > 0 && art.excerpt.includes(item.quote.slice(0, 40)))) {
        continue;
      }
      const quote = publicQuote(art.excerpt);
      if (!quote) continue;
      const creditText = sanitizePublicText(art.cite ?? art.credit ?? "") || "The cutting";
      if (firstBannedPublicHit(creditText)) continue;
      snippets.push({
        alt: creditText,
        credit: creditText,
        creditUrl: art.creditUrl,
        quote,
        sourceHref: `/article/${articleId}`,
        sourceTitle: creditText,
      });
    }
  }

  let citedSummary = summary;
  let citedRefs = references;
  if (summary) {
    const candidates = [...references];
    const seenHref = new Set(candidates.map((item) => item.href));
    const addCandidate = (title: string, href: string) => {
      if (!clickableHref(href) || seenHref.has(href)) return;
      const clean = sanitizePublicText(title) || title.trim();
      if (!clean || firstBannedPublicHit(clean)) return;
      seenHref.add(href);
      candidates.push({ title: clean, href });
    };
    for (const articleId of creditIds) {
      const art = ctx.articles.get(articleId);
      if (!art) continue;
      addCandidate(art.cite || art.caption || art.credit || "The cutting", `/article/${articleId}`);
      if (art.sourceUrl) addCandidate(art.cite || "Irish Newspaper Archives", art.sourceUrl);
    }
    for (const [key, value] of Object.entries(attrs)) {
      const raw = String(value ?? "");
      const href = httpHref(raw);
      if (!href) continue;
      const prose = /^source_notable/.test(key)
        ? String(attrs.notable ?? "")
        : /^source_notes/.test(key)
          ? String(attrs.notes ?? "")
          : "";
      const paper = prose.match(/\(([^)]*(?:Tribune|Herald|Sentinel|Independent|Examiner)[^)]*)\)/i);
      const title = /wikipedia\.org/i.test(href)
        ? "Wikipedia"
        : paper?.[1] ||
          String(attrs.cutting_cite ?? attrs.book_cite ?? attrs.cite ?? "Irish Newspaper Archives");
      addCandidate(title, href);
    }
    const marked = markCitations(summary, candidates);
    citedSummary = marked.text;
    if (marked.references.length > 0) citedRefs = marked.references;
  }

  let leadHeadline = publicHeadline;
  const leadEra = publicEra;
  let leadSummary = citedSummary;
  if (id === "player:brendan-noone-fohenagh") {
    leadHeadline = "Named with the Fohenagh Minor C champions, 1996";
    const photo = "A History of Fohenagh places him in the 1990 underage team photograph.";
    const rest = (citedSummary ?? "")
      .replace(/Named with the Fohenagh Minor C champions, 1996\.?\s*/gi, "")
      .replace(/Brendan Noone is named with the Fohenagh Minor C champions of 1996\.?\s*/gi, "")
      .replace(/\bsubstitut\w*/gi, "")
      .trim();
    const bits: string[] = [];
    if (!/1990 underage team photograph/i.test(rest)) bits.push(photo);
    if (rest) bits.push(rest);
    leadSummary = bits.join(" ").trim() || null;
  }
  if (
    leadHeadline &&
    leadSummary &&
    /\((?:[^)]*(?:Tribune|Herald|Sentinel|Independent|Examiner)[^)]*)\)/i.test(leadHeadline)
  ) {
    const bare = leadHeadline.replace(/[.!?]+$/g, "").toLowerCase();
    const marked = splitCiteSentences(leadSummary).find((sentence) =>
      sentence.replace(/\[\d+\]/g, "").replace(/[.!?]+$/g, "").toLowerCase().startsWith(bare.slice(0, 48))
    );
    if (marked && /\[\d+\]/.test(marked)) leadHeadline = marked.replace(/[.!?]+$/g, "");
  }
  leadSummary = withoutRepeatedHeadline(leadSummary, leadHeadline);
  if (id === "player:cathal-lohan" || id === "player:cathal-lohan-fohenagh") {
    leadHeadline = "All-Ireland hurling winner at underage with Galway";
  } else if (id === "player:jason-lohan") {
    leadHeadline = "All-Ireland hurling winner with Galway";
  }
  const stamped = stampSnippetQuotes(snippets, citedRefs);
  const stampedSnippets = stamped.snippets;
  citedRefs = stamped.references;

  return {
    slug,
    name,
    headline: leadHeadline,
    eraLine: leadEra,
    summary: leadSummary,
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
    snippets: stampedSnippets,
    references: citedRefs,
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
    ...profile.snippets.flatMap((snippet) => [snippet.alt, snippet.quote, snippet.credit]),
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

  const aliasesByCanonical = new Map<string, string[]>();
  for (const playerId of A.entitiesOfType("player")) {
    const same = String(A.entityAttrs(playerId).same_as ?? "");
    if (!same.startsWith("player:") || same === playerId) continue;
    const list = aliasesByCanonical.get(same) ?? [];
    list.push(playerId);
    aliasesByCanonical.set(same, list);
  }

  const articles = new Map<string, ArticleCredit>();
  const articlesByDay = new Map<string, ArticleCredit[]>();
  const aliases: { id: string; target: string }[] = [];
  for (const upload of await readArticleUploads()) {
    const target = articleSameAsId(upload);
    if (target) {
      aliases.push({ id: upload.id, target });
      continue;
    }
    if (upload.inaMedia && !showInaMedia) continue;
    const credit: ArticleCredit = {
      id: upload.id,
      credit: upload.credit,
      creditUrl: upload.creditUrl,
      image: upload.publicUrl || upload.path,
      portrait: upload.kind === "image" && upload.playerTags.length === 1,
      caption: upload.caption,
      cite: upload.citeChip,
      excerpt: upload.excerpt,
      sourceUrl: upload.sourceUrl,
      bookMedia: upload.bookMedia === true,
      publicationYear: upload.year,
    };
    articles.set(upload.id, credit);
    const day = upload.id.match(/((?:18|19|20)\d{2}-\d{2}-\d{2})/);
    if (day) {
      const list = articlesByDay.get(day[1]) ?? [];
      list.push(credit);
      articlesByDay.set(day[1], list);
    }
  }
  for (const alias of aliases) {
    const canonical = articles.get(alias.target);
    if (canonical) articles.set(alias.id, canonical);
  }

  return { A, appearancesByPlayer, byMatch, playerName, nameIndex, articles, articlesByDay, aliasesByCanonical };
}

export async function loadPlayerProfile(
  id: string,
  attrs: Record<string, TripleVal>
): Promise<PublicPlayerProfile> {
  const ctx = await createPlayerProfileContext();
  return profileForPlayer(ctx, id, attrs);
}
