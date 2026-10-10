/**
 * Fohenagh profile record: cited years, one link per game, teammates who
 * share a clipping. Labels are ours. Clipping prose is not copied onto the page.
 */

import {
  isHeldForReview,
  normalizePlayerTags,
  readArticleUploads,
  type ArticleUpload,
} from "@/lib/articles";
import { displayNameForRef, entityHref } from "@/lib/data";
import type { AssocArray, TripleVal } from "@/lib/d4m/AssocArray";
import {
  citedPlayerYears,
  editorialPlayerText,
} from "@/lib/fohenaghPlayerIntro";
import { hasPlayQualifier, scrubPublicCopy } from "@/lib/publicCopy";

const FULL_RECORD = new Set([
  "player:tim-sweeney-fohenagh",
  "player:jim-moclair-fohenagh",
  "player:cathal-lohan",
  "player:jason-lohan",
  "player:seamus-moclair",
  "player:eric-lally-fohenagh",
  "player:tony-kirwan-fohenagh",
  "player:tony-kirwan",
  "player:john-devine",
]);

export type FohenaghGameLink = {
  id: string;
  label: string;
  href: string;
  year: number | null;
  group: "featured" | "other";
};

export type FohenaghTeammate = {
  id: string;
  name: string;
  href: string;
};

export type FohenaghRecord = {
  years: number[];
  era: string | null;
  games: FohenaghGameLink[];
  teammates: FohenaghTeammate[];
};

function yearNumber(value: unknown): number | null {
  const match = String(value ?? "").match(/\b((?:19|20)\d{2})\b/);
  if (!match) return null;
  const year = Number(match[1]);
  if (year < 1930 || year > 2005) return null;
  return year;
}

function isLookback(article: ArticleUpload): boolean {
  const blob = `${article.id} ${article.caption ?? ""} ${(article.tags ?? []).join(" ")}`.toLowerCase();
  return /golden-era|champs-honoured|honoured|reunion|roll-of-honour|roll of honour/.test(
    blob
  );
}

function playerAliases(playerId: string, A: AssocArray): Set<string> {
  const ids = new Set<string>([playerId]);
  const next = A.entityAttrs(playerId).same_as;
  if (typeof next === "string" && next.startsWith("player:")) ids.add(next);
  for (const triple of A.getcol("same_as")) {
    if (String(triple.val) === playerId && triple.row.startsWith("player:")) {
      ids.add(triple.row);
    }
  }
  return ids;
}

function canonicalPlayer(playerId: string, A: AssocArray): string {
  let current = playerId;
  const seen = new Set<string>();
  while (!seen.has(current)) {
    seen.add(current);
    const next = A.entityAttrs(current).same_as;
    if (typeof next !== "string" || !next.startsWith("player:")) break;
    current = next;
  }
  return current;
}

function articleNamesPlayer(article: ArticleUpload, aliases: Set<string>): boolean {
  const tags = normalizePlayerTags(article.playerTags);
  return tags.some((tag) => aliases.has(tag));
}

function matchIdOf(tag: string): string {
  return tag.startsWith("match:") ? tag : `match:${tag}`;
}

function matchName(article: ArticleUpload, A: AssocArray): string | null {
  for (const tag of article.matchTags ?? []) {
    const id = matchIdOf(tag);
    const name = A.entityAttrs(id).name;
    if (typeof name === "string" && name.trim()) return name.trim();
  }
  return null;
}

function plainOccasion(article: ArticleUpload, match: string | null): string | null {
  const blob = `${(article.tags ?? []).join(" ")} ${match ?? ""}`.toLowerCase();
  if (/\btrial\b|forristal/.test(blob)) return "Trial";
  if (/\bu-?12\b|under-?12/.test(blob)) return "Under-12 game";
  if (/\bu-?14\b|under-?14/.test(blob)) return "Under-14 game";
  if (/\bu-?15\b|under-?15/.test(blob)) return "Under-15 game";
  if (/\bu-?16\b|under-?16/.test(blob)) return "Under-16 game";
  if (/\bminor\b/.test(blob) && /\bfinal\b/.test(blob)) return "Minor final";
  if (/\bminor\b/.test(blob)) return "Minor game";
  if (/junior\s*c|u-?21\s*c|u21c/.test(blob)) return "Junior C game";
  if (/\bjunior\b/.test(blob) && /\bfinal\b/.test(blob)) return "Junior final";
  if (/\bjunior\b/.test(blob)) return "Junior championship";
  if (/\bu-?21\b|under-?21|\bu21\b/.test(blob)) return "Under-21 game";
  if (/\bintermediate\b/.test(blob)) return "Intermediate game";
  if (/\bsenior\b/.test(blob) && /\bfinal\b/.test(blob)) return "Senior final";
  if (/\bsenior\b/.test(blob)) return "Senior game";
  return null;
}

function gameLabel(article: ArticleUpload, A: AssocArray): string {
  const match = matchName(article, A);
  const fromMatch = match ? scrubPublicCopy(match) : null;
  if (fromMatch) return fromMatch;
  const occasion = plainOccasion(article, match);
  const year = yearNumber(article.year);
  if (occasion && year) return `${occasion}, ${year}`;
  if (occasion) return occasion;
  const cite = (article.citeChip ?? "").replace(/\s*·\s*INA\s*$/i, "").trim();
  if (cite && !hasPlayQualifier(cite)) return cite;
  return year ? `Game, ${year}` : "Newspaper cutting";
}

function classifyText(article: ArticleUpload, label: string, A: AssocArray): string {
  return [
    label,
    matchName(article, A),
    (article.tags ?? []).join(" "),
    article.caption,
    article.year,
  ]
    .filter(Boolean)
    .join(" ");
}

function isGalwayOrTrial(text: string): boolean {
  if (/\b(all-ireland|forristal|trials?)\b/i.test(text)) return true;
  if (/\b(for|with)\s+galway\b/i.test(text)) return true;
  if (/\bgalway\s+(?:u-?21|under-21|senior|intermediate)\b/i.test(text)) return true;
  return false;
}

function isHonour(text: string): boolean {
  return /\b(county final|champion|captain|\bfinal\b)\b/i.test(text);
}

function isQuietGame(text: string): boolean {
  return /\b(u-?12|under-?12|u12|junior\s*c|u-?21\s*c|u21c)\b/i.test(text) ||
    (/\bminor\b/i.test(text) && !isHonour(text));
}

/** Under-12, junior C, and minor lines sit under Other games once a stronger game is listed. */
function isQuietAppearance(text: string, galway: boolean, full: boolean): boolean {
  if (galway) return false;
  if (full && isHonour(text)) return false;
  return isQuietGame(text);
}

/** Played: 1959, or Played: 1951–1956. Years are the ones on the cuttings. */
export function playedEraLabel(years: number[]): string | null {
  const sorted = [...new Set(years)]
    .filter((year) => year >= 1930 && year <= 2005)
    .sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return first === last ? `Played: ${first}` : `Played: ${first}\u2013${last}`;
}

/** Years that place a player on the Fohenagh decade filter, through 2002. */
export function decadeYears(years: number[]): number[] {
  return [...new Set(years)]
    .filter((year) => year >= 1930 && year <= 2002)
    .sort((a, b) => a - b);
}

function onFohenaghClub(playerId: string, A: AssocArray): boolean {
  const attrs = A.entityAttrs(playerId);
  return Object.values(attrs).some((value) => String(value) === "club:fohenagh-historic");
}

export async function fohenaghRosterYears(
  playerIds: string[],
  A: AssocArray
): Promise<Map<string, number[]>> {
  const articles = await readArticleUploads();
  const out = new Map<string, number[]>();
  for (const playerId of playerIds) {
    out.set(playerId, decadeYears(collectYears(playerId, articles, A)));
  }
  return out;
}

function collectYears(
  playerId: string,
  articles: ArticleUpload[],
  A: AssocArray
): number[] {
  const aliases = playerAliases(playerId, A);
  const years = new Set<number>();
  const attrs = A.entityAttrs(playerId);
  for (const year of citedPlayerYears([
    editorialPlayerText(playerId),
    textAttr(attrs.notable),
    textAttr(attrs.note),
    textAttr(attrs.notes),
  ])) {
    years.add(year);
  }
  for (const article of articles) {
    if (isHeldForReview(article) || isLookback(article)) continue;
    if (!articleNamesPlayer(article, aliases)) continue;
    const year = yearNumber(article.year);
    if (year) years.add(year);
    const match = matchName(article, A);
    const fromName = yearNumber(match);
    if (fromName) years.add(fromName);
  }
  for (const triple of A.getcol("player")) {
    if (!triple.row.startsWith("appearance:")) continue;
    if (!aliases.has(String(triple.val))) continue;
    const year = yearNumber(A.entityAttrs(triple.row).year);
    if (year) years.add(year);
  }
  return [...years].sort((a, b) => a - b);
}

function textAttr(value: TripleVal | undefined): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export async function buildFohenaghRecord(
  playerId: string,
  A: AssocArray
): Promise<FohenaghRecord> {
  const articles = await readArticleUploads();
  const aliases = playerAliases(playerId, A);
  const years = collectYears(playerId, articles, A);
  const full = FULL_RECORD.has(playerId) || [...aliases].some((id) => FULL_RECORD.has(id));

  const seenMatch = new Set<string>();
  const drafts: Array<FohenaghGameLink & { quiet: boolean; galway: boolean }> = [];
  for (const article of articles) {
    if (isHeldForReview(article) || isLookback(article)) continue;
    if (!articleNamesPlayer(article, aliases)) continue;
    const paperYear = Number(String(article.year ?? "").match(/\b((?:19|20)\d{2})\b/)?.[1] ?? "");
    if (paperYear > 2005) continue;
    const matchKey = (article.matchTags ?? [])[0];
    if (matchKey) {
      const key = matchIdOf(matchKey);
      if (seenMatch.has(key)) continue;
      seenMatch.add(key);
    }
    const label = gameLabel(article, A);
    const text = classifyText(article, label, A);
    const galway = isGalwayOrTrial(text);
    drafts.push({
      id: article.id,
      label,
      href: `/article/${article.id}`,
      year: yearNumber(article.year) ?? yearNumber(label),
      group: "featured",
      quiet: isQuietAppearance(text, galway, full),
      galway,
    });
  }

  for (const triple of A.getcol("player")) {
    if (!triple.row.startsWith("appearance:")) continue;
    if (!aliases.has(String(triple.val))) continue;
    const attrs = A.entityAttrs(triple.row);
    const year = yearNumber(attrs.year);
    const source = typeof attrs.source === "string" ? attrs.source : "";
    if (!source.startsWith("http")) continue;
    const competition = textAttr(attrs.competition) ?? "";
    const grade = textAttr(attrs.grade) ?? "";
    const blob = `${competition} ${grade} ${year ?? ""}`;
    if (hasPlayQualifier(blob)) continue;
    const already = drafts.some(
      (game) => game.year != null && game.year === year && game.year === yearNumber(blob)
    );
    if (already && year != null) {
      const sameGrade = drafts.some((game) => {
        if (game.year !== year) return false;
        const minor = /\bminor\b/i.test(blob);
        return minor ? /\bminor\b/i.test(game.label) : !/\bminor\b/i.test(game.label);
      });
      if (sameGrade) continue;
    }
    const labelBits = [grade && !hasPlayQualifier(grade) ? grade : null, competition, year]
      .filter(Boolean)
      .join(", ");
    const label = scrubPublicCopy(labelBits) ?? (year ? `Game, ${year}` : "Game");
    const galway = isGalwayOrTrial(blob);
    drafts.push({
      id: triple.row,
      label,
      href: source,
      year,
      group: "featured",
      quiet: isQuietAppearance(blob, galway, full),
      galway,
    });
  }

  drafts.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.label.localeCompare(b.label));
  const featured = drafts.filter((game) => !game.quiet || game.galway);
  const other = drafts.filter((game) => game.quiet && !game.galway);
  const games: FohenaghGameLink[] =
    featured.length === 0
      ? drafts.map((game) => ({ ...game, group: "featured" as const }))
      : [
          ...featured.map((game) => ({ ...game, group: "featured" as const })),
          ...other.map((game) => ({ ...game, group: "other" as const })),
        ];

  const teammateCounts = new Map<string, number>();
  for (const article of articles) {
    if (isHeldForReview(article) || isLookback(article)) continue;
    const paperYear = Number(String(article.year ?? "").match(/\b((?:19|20)\d{2})\b/)?.[1] ?? "");
    if (paperYear > 2005) continue;
    if (!articleNamesPlayer(article, aliases)) continue;
    const tagged = new Set<string>();
    for (const tag of normalizePlayerTags(article.playerTags)) {
      const canonical = canonicalPlayer(tag, A);
      if (aliases.has(canonical) || aliases.has(tag)) continue;
      tagged.add(canonical);
    }
    for (const id of tagged) {
      teammateCounts.set(id, (teammateCounts.get(id) ?? 0) + 1);
    }
  }
  const teammates = [...teammateCounts.entries()]
    .map(([id, count]) => {
      const attrs = A.entityAttrs(id);
      if (!attrs.name || attrs.same_as) return null;
      return {
        id,
        name: displayNameForRef(id, A),
        href: entityHref(id, "player"),
        count,
        fohenagh: onFohenaghClub(id, A),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null && Boolean(item.name))
    .sort(
      (a, b) =>
        Number(b.fohenagh) - Number(a.fohenagh) ||
        b.count - a.count ||
        a.name.localeCompare(b.name)
    )
    .slice(0, 18)
    .map(({ id, name, href }) => ({ id, name, href }));

  return {
    years,
    era: playedEraLabel(years),
    games,
    teammates,
  };
}
