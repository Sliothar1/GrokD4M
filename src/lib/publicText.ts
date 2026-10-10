/**
 * Render-side gate for public prose. Pipeline notes stay in the seed;
 * sentences that carry them are dropped here, for every player.
 */

const ID_TOKEN =
  /\b(?:player|club|match|article|appearance|fixture|team|win):[A-Za-z0-9_-]+\b/gi;
const ART_TOKEN = /\bart-[A-Za-z0-9-]+\b/gi;

/**
 * Strings that must never appear in public player text.
 * Word-boundary "verified" does not match inside "unverified".
 */
export const BANNED_PUBLIC_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "tagged for", re: /tagged for/i },
  { name: "camogie lane", re: /camogie lane/i },
  { name: "hurling lane", re: /hurling lane/i },
  { name: "lane tag", re: /lane tags?/i },
  { name: "needs a source", re: /needs a source/i },
  { name: "needs check", re: /needs check/i },
  { name: "INA slip", re: /ina slip/i },
  { name: "INA snip", re: /ina snip/i },
  { name: "unverified", re: /\bunverified\b/i },
  { name: "verified", re: /\bverified\b/i },
  { name: "single-source", re: /single-source/i },
  { name: "single source", re: /single source/i },
  { name: "pending archivist", re: /pending[_\s-]*archivist/i },
  { name: "QC", re: /\bqc\b/i },
  { name: "verification", re: /\bverification\b/i },
  { name: "confirmed by family", re: /confirmed by family/i },
  { name: "player id", re: /\bplayer:/i },
  { name: "club id", re: /\bclub:/i },
  { name: "match id", re: /\bmatch:/i },
  { name: "article id", re: /\barticle:/i },
  { name: "appearance id", re: /\bappearance:/i },
  { name: "fixture id", re: /\bfixture:/i },
  { name: "team id", re: /\bteam:/i },
  { name: "win id", re: /\bwin:/i },
  { name: "article slug", re: /\bart-[a-z0-9]/i },
  { name: "thin fill", re: /thin(?:-club)? fill/i },
  { name: "thin-club", re: /thin-club/i },
  { name: "HOLD", re: /\bHOLD\b/ },
  { name: "RoH", re: /\bRoH\b/ },
  { name: "this run", re: /this run/i },
  { name: "club stamp", re: /club stamp/i },
  { name: "no clear", re: /no clear/i },
  { name: "overwrite", re: /\boverwrite\b/i },
  { name: "orphan", re: /\borphan\b/i },
  { name: "club-less", re: /club-less/i },
  { name: "do not collide", re: /do not collide/i },
  { name: "distinct id", re: /distinct id/i },
  { name: "omitted", re: /\bomitted\b/i },
  { name: "first+last", re: /first\+last/i },
  { name: "seed", re: /\bseed\b/i },
  { name: "HOLD plural", re: /HOLDs\b/ },
  { name: "do not stamp", re: /do not (?:merge|auto-stamp|dual-stamp|invent|collide)/i },
  { name: "auto-stamp", re: /auto-stamp/i },
  { name: "age-plausible", re: /age-plausible/i },
  { name: "spelling twin", re: /spelling twin/i },
  { name: "id uses", re: /\bid uses\b/i },
  { name: "collision risk", re: /collision risk/i },
  { name: "do not link", re: /do not (?:auto-link|auto-merge|dual-link|double-stamp|mint)/i },
  { name: "stamp", re: /\bstamp(?:ed|s)?\b/i },
  { name: "cite chips", re: /cite chips/i },
  { name: "historic predecessor title", re: /historic predecessor title/i },
  { name: "catalog locator", re: /INA catalog|catalog retrospective|\breadkong\b/i },
  { name: "score unchanged", re: /score unchanged/i },
  { name: "new twin", re: /new twin|twin already/i },
  { name: "multi-source clear", re: /no new multi-source/i },
  { name: "wiki spelling", re: /wiki spelling/i },
  { name: "age-match", re: /age-match/i },
  { name: "club-scoped", re: /club-scoped/i },
  { name: "af-first", re: /af-first/i },
  { name: "auto-verified", re: /auto-verified/i },
  { name: "for developers", re: /for developers/i },
  { name: "kid_chip", re: /kid_chip/i },
  { name: "archivist", re: /\barchivist\b/i },
  { name: "ingest", re: /\bingest\b/i },
  { name: "pipeline", re: /\bpipeline\b/i },
  { name: "rising star", re: /rising star/i },
  { name: "substitute", re: /substitut/i },
  { name: "sub", re: /\bsub\b/i },
  { name: "team-list-only", re: /team-list-only/i },
  { name: "privacy", re: /\bprivacy\b/i },
  { name: "clipping not added", re: /not been added yet/i },
];

export function firstBannedPublicHit(text: string): string | null {
  for (const pattern of BANNED_PUBLIC_PATTERNS) {
    if (pattern.re.test(text)) return pattern.name;
  }
  return null;
}

function stripIdTokens(input: string): string {
  return input.replace(ID_TOKEN, " ").replace(ART_TOKEN, " ");
}

function tidy(input: string): string {
  return input
    .replace(/\s+([,.;!?])/g, "$1")
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([·])/g, " $1")
    .trim();
}

const ABBREVIATIONS = new Set([
  "co",
  "st",
  "mr",
  "mrs",
  "ms",
  "dr",
  "prof",
  "jr",
  "sr",
  "no",
  "vs",
  "capt",
  "dept",
  "fig",
  "jan",
  "feb",
  "mar",
  "apr",
  "jun",
  "jul",
  "aug",
  "sep",
  "sept",
  "oct",
  "nov",
  "dec",
  "p",
  "pp",
  "vol",
  "al",
  "gen",
]);

function tokenBefore(text: string, index: number): string {
  let start = index - 1;
  while (start >= 0 && /[A-Za-z]/.test(text[start])) start--;
  return text.slice(start + 1, index);
}

/** Split prose on sentence ends. Keep initials ("J. Glynn") and "Co." intact. */
function splitSentences(text: string): string[] {
  const parts: string[] = [];
  let buf = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    buf += ch;
    if (!/[.!?]/.test(ch)) continue;
    if (ch === ".") {
      const token = tokenBefore(text, i);
      if (token.length === 1 || ABBREVIATIONS.has(token.toLowerCase())) continue;
    }
    const rest = text.slice(i + 1).trimStart();
    if (ch === "." && /^\d/.test(rest)) continue;
    const next = text[i + 1] ?? "";
    if (next !== "" && !/\s/.test(next)) continue;
    if (rest !== "" && !/^[A-Z0-9“"']/.test(rest)) continue;
    const sentence = buf.trim();
    if (sentence) parts.push(sentence);
    buf = "";
    while (text[i + 1] === " ") i++;
  }
  const tail = buf.trim();
  if (tail) parts.push(tail);
  return parts;
}

function finishClause(clause: string, sentence: string): string {
  const trimmed = tidy(clause.replace(/[.!?]+$/g, ""));
  if (!trimmed) return "";
  const end = sentence.trim().match(/[.!?]$/)?.[0] ?? "";
  return `${trimmed}${end}`;
}

function normalizePublicWording(input: string): string {
  return input
    .replace(/\bRoH\b/g, "Roll of Honour")
    .replace(/\([^)]*wiki spelling[^)]*\)/gi, "");
}

/**
 * Display label for the 19 Sep 1959 Connacht Tribune team photograph.
 * The stored caption says "team panel"; the page says what the cutting is.
 */
export function publicCuttingLabel(text: string): string {
  const trimmed = text.trim();
  const isThisCutting =
    /team panel/i.test(trimmed) &&
    (/fohenagh/i.test(trimmed) || /19 sep 1959/i.test(trimmed));
  if (!isThisCutting) return trimmed;
  if (/^connacht tribune\s*·/i.test(trimmed)) {
    return trimmed.replace(/\s*·\s*team panel\b/i, "").replace(/\s*·\s*$/, "").trim();
  }
  const names = trimmed.match(/Named on the paper:[\s\S]+/i);
  if (names) {
    return `Team photo after Fohenagh's first Galway senior title. ${names[0].trim()}`;
  }
  return "Team photo after Fohenagh's first Galway senior title";
}

/** Match-page prose. Seed notes stay in the file; banned sentences are dropped. */
export function publicMatchBlurb(attrs: {
  notable?: unknown;
  note?: unknown;
  excerpt?: unknown;
}): string {
  return sanitizePublicText(String(attrs.notable ?? attrs.note ?? attrs.excerpt ?? ""));
}

/** Drop pipeline sentences. Keep the cited remainder. */
export function sanitizePublicText(input: string): string {
  const stripped = tidy(stripIdTokens(normalizePublicWording(input)));
  if (!stripped) return "";
  const kept: string[] = [];
  for (const sentence of splitSentences(stripped)) {
    const clauses = sentence.split(/\s*;\s*/);
    const good = clauses
      .map((clause) => tidy(clause.replace(/[;]+$/g, "")))
      .filter((clause) => clause && !firstBannedPublicHit(clause));
    if (good.length === 0) continue;
    const rejoined = good
      .map((clause, index) =>
        index === good.length - 1 ? finishClause(clause, sentence) : clause.replace(/[.!?]$/, "")
      )
      .join("; ");
    const clean = tidy(rejoined);
    if (clean && !firstBannedPublicHit(clean)) kept.push(clean);
  }
  return tidy(kept.join(" "));
}

export function shortenPublicText(input: string, maxSentences = 2): string {
  const clean = sanitizePublicText(input);
  if (!clean) return "";
  const sentences = splitSentences(clean);
  return tidy(sentences.slice(0, maxSentences).join(" "));
}
