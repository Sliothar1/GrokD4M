import { correctionsFormEnabled } from "@/lib/corrections/config";
import type { AssocArray, TripleVal } from "@/lib/d4m/AssocArray";
import { displayNameForRef, getAssoc, isEntityRef, isVerifiedFromCutting, linkedCuttingCount } from "@/lib/data";
import { isDisplayableVal } from "@/lib/entityDisplay";
import { SHOW_INA_MEDIA } from "@/lib/ina-media";
import { readArticleUploads } from "@/lib/articles";
import { resolvePlayerPhoto } from "@/lib/playerPhoto";
import { firstBannedPublicHit, sanitizePublicText, shortenPublicText } from "@/lib/publicText";

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

export const NO_CLIPPING_LINE = "A newspaper clipping has not been added yet.";

export const FOHENAGH_UNDERAGE_SCHOOLS =
  "Fohenagh drew on Fohenagh, Killure and Kilgerrill national schools.";

const CORRECTION_LABEL = "Suggest a correction or request removal";
const MEMORY_LABEL = "Share a memory";
const READ_ORIGINAL = "Read the original";

export type PublicGame = {
  label: string;
  href?: string;
};

export type PublicTeammate = {
  name: string;
  href?: string;
};

export type PublicPlayerProfile = {
  slug: string;
  name: string;
  headline: string | null;
  eraLine: string | null;
  summary: string | null;
  schoolsLine: string | null;
  photoUrl: string | null;
  games: PublicGame[];
  teammates: PublicTeammate[];
  correctionHref: string | null;
  correctionLabel: string;
  memoryHref: string;
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
  credit?: string;
  creditUrl?: string;
};

type ProfileContext = {
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
    if (line && line.length <= 140) return line;
  }
  return null;
}

function citedProse(attrs: Record<string, TripleVal>): string | null {
  const cutting = linkedCuttingCount(attrs) > 0 || isDisplayableVal(attrs.cutting_cite);
  const picks: Array<string | null> = [];
  if (hasFieldSource(attrs, "notable") && isDisplayableVal(attrs.notable)) {
    picks.push(String(attrs.notable));
  }
  if (hasFieldSource(attrs, "notes") && isDisplayableVal(attrs.notes)) {
    picks.push(String(attrs.notes));
  }
  const noteCited =
    hasFieldSource(attrs, "note") || cutting || httpSource(attrs);
  if (noteCited && isDisplayableVal(attrs.note)) picks.push(String(attrs.note));
  for (const raw of picks) {
    const text = shortenPublicText(raw ?? "", 2);
    if (text) return text;
  }
  return null;
}

function splitPeople(raw: string): string[] {
  return raw
    .split(/\s*(?:,|;|\band\b)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);
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
  const club = clubRaw ? jerseyFor(clubRaw, ctx.A) : null;
  const jersey = club?.jersey ?? null;

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
  const eraBit = eraRaw || decadeSpan(years);
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
    const key = `${label}|${href ?? ""}`;
    if (seenGames.has(key)) continue;
    seenGames.add(key);
    games.push(href ? { label, href } : { label });
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

  const editorish =
    String(attrs.source ?? "").trim().toLowerCase() === "editor" ||
    Boolean(gradesRaw) ||
    Boolean(eraRaw) ||
    teammateTokens(attrs).length > 0;
  let summary = citedProse(attrs);
  if (!summary && editorish) {
    summary = editorSummary(
      name,
      jersey,
      gradesRaw ? sanitizePublicText(gradesRaw) : null,
      teammates.map((mate) => mate.name)
    );
  }
  const hasClipping = games.some((game) => game.href) || creditIds.size > 0;
  if (
    summary &&
    headline &&
    summary.replace(/[.!?]+$/g, "") === headline.replace(/[.!?]+$/g, "")
  ) {
    summary = null;
  }
  if (!summary && !honour && games[0]) summary = `Named in ${games[0].label}.`;
  if (!summary && !hasClipping) summary = NO_CLIPPING_LINE;

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

  return {
    slug,
    name,
    headline,
    eraLine,
    summary,
    schoolsLine,
    photoUrl: resolvePlayerPhoto(slug, attrs),
    games,
    teammates,
    correctionHref: showCorrection ? `/corrections?page=${encodeURIComponent(`/player/${slug}`)}` : null,
    correctionLabel: CORRECTION_LABEL,
    memoryHref: "/stories",
    memoryLabel: MEMORY_LABEL,
    credit,
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
    profile.games.length > 0 ? "Games" : null,
    ...profile.games.flatMap((game) =>
      game.href ? [game.label, READ_ORIGINAL] : [game.label]
    ),
    profile.teammates.length > 0 ? "Played alongside" : null,
    ...profile.teammates.map((mate) => mate.name),
    profile.correctionHref ? profile.correctionLabel : null,
    profile.memoryLabel,
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
    articles.set(upload.id, { credit: upload.credit, creditUrl: upload.creditUrl });
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
