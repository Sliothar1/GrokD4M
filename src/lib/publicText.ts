/**
 * Render-side gate for public prose. Pipeline notes stay in the seed;
 * sentences that carry them are dropped here, for every player.
 */

const ID_TOKEN =
  /\b(?:player|club|match|article|appearance|fixture|team|win):[A-Za-z0-9_-]+\b/gi;
const ART_TOKEN = /\bart-[A-Za-z0-9-]+\b/gi;

/**
 * Playing years and facts only. Word-aware, so a late goal, "the late 1950s",
 * and injury time stay. "the late " still catches an obituary name.
 * Funeral and "passed away" sit with death: a profile does not carry them.
 */
export const BEYOND_PLAYING_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "emigrat", re: /\bemigrat/i },
  { name: "America", re: /\bAmerica\b/i },
  { name: "retired", re: /\bretired\b/i },
  { name: "injur", re: /\binjur(?!y(?:[\s-]*time)\b)/i },
  { name: "died", re: /\bdied\b/i },
  { name: "death", re: /\bdeaths?\b/i },
  { name: "the late ", re: /\bthe late (?!\d)/i },
  { name: "RIP", re: /\bRIP\b|\bR\.I\.P\.?\b/i },
  { name: "accident", re: /\baccidents?\b/i },
  { name: "illness", re: /\billness(?:es)?\b/i },
  { name: "funeral", re: /\bfuneral\b/i },
  { name: "passed away", re: /\bpassed away\b/i },
];

const BEYOND_PLAYING_NAMES = new Set(BEYOND_PLAYING_PATTERNS.map((pattern) => pattern.name));

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
  {
    name: "Garry Lohan",
    re: /\bGarry Lohan\b/i,
  },
  { name: "distinct from", re: /distinct from/i },
  { name: "confidence", re: /\bconfidence\b/i },
  ...BEYOND_PLAYING_PATTERNS,
];

/**
 * A line that names a person as assaulted or injured.
 * An unnamed report ("some players were hurt") and the 1956 hospital
 * headline stay. "Mike Barrett was assaulted" does not.
 */
export function namesPersonHurt(text: string): boolean {
  if (/\bassault/i.test(text)) return true;
  if (/\binjured innocence\b/i.test(text)) return true;
  if (!/\b(?:injured|hurt)\b/i.test(text)) return false;
  if (/\bfive men went to hospital\b/i.test(text)) return false;
  if (
    /\b(?:some|several|a number of)\b[\s\S]{0,80}\b(?:players|men|people)\b[\s\S]{0,40}\b(?:hurt|injured)\b/i.test(
      text
    )
  ) {
    return false;
  }
  if (/\b[A-Z]\.\s*[A-Z][a-z]+\b[\s\S]{0,48}\b(?:was|were|been)\s+(?:injured|hurt)\b/.test(text)) {
    return true;
  }
  if (!/\b(?:was|were|been)\s+(?:injured|hurt)\b/i.test(text)) return false;
  const stop =
    /^(?:The|Connacht|Tuam|County|North|East|West|South|Royal|History|Fohenagh|Claregalway|Sunday|Saturday|Irish|Newspaper|Athenry|Galway|Junior|Senior|Board|Tribune|Herald|Sentinel|After|Both|Under|With|Mister)$/;
  const names = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) ?? [];
  return names.some((name) => {
    if (/tribune|herald|sentinel|board|history|hotel|county/i.test(name)) return false;
    return name.split(/\s+/).some((part) => !stop.test(part));
  });
}

/** Footer credit is the one public place this name is allowed. */
const FOOTER_BUILT_BY = "Designed and built by Garry Lohan";

export function firstBannedPublicHit(text: string): string | null {
  const scanned = text.replaceAll(FOOTER_BUILT_BY, "");
  for (const pattern of BANNED_PUBLIC_PATTERNS) {
    if (pattern.re.test(scanned)) return pattern.name;
  }
  return null;
}

/** Pipeline wording, ignoring the playing-years ban. Used to count that ban on its own. */
export function firstPipelineHit(text: string): string | null {
  const scanned = text.replaceAll(FOOTER_BUILT_BY, "");
  for (const pattern of BANNED_PUBLIC_PATTERNS) {
    if (BEYOND_PLAYING_NAMES.has(pattern.name)) continue;
    if (pattern.re.test(scanned)) return pattern.name;
  }
  return null;
}

export function beyondPlayingHit(text: string): string | null {
  for (const pattern of BEYOND_PLAYING_PATTERNS) {
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
    .replace(/,\s*,+/g, ",")
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([·])/g, " $1")
    .replace(/^\s*,\s*/, "")
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
  "fr",
  "rev",
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
    // Keep decimals such as 3.14 together. A following sentence that
    // starts with a year ("final. 1995") must still split.
    if (ch === "." && /\d/.test(text[i + 1] ?? "")) continue;
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

const GARRY_COLLECTION_PHRASE =
  /\b(?:(?:newspaper|matchday)\s+)?(?:clipping|programme|program)\s+from\s+Garry Lohan['’]s collection\b|\bfrom\s+Garry Lohan['’]s collection\b|\bGarry Lohan['’]s collection\b/gi;

const PAPER_NAME =
  /\b(Connacht Tribune|Tuam Herald|Connacht Sentinel|Galway Advertiser|Irish Independent|Sunday Independent|Irish Examiner|The Irish Times|Irish Times|Irish Press|Sunday Press)\b/i;

function citesGarryAsSource(input: string): boolean {
  return /Garry Lohan['’]s collection|(?:clipping|programme|program)\s+from\s+Garry Lohan|\bfrom\s+Garry Lohan\b/i.test(
    input
  );
}

/**
 * Collection credits name a person as the source. Public text uses the
 * archive or the paper. The footer credit is left untouched.
 */
export function publicSourceCredit(input: string): string {
  if (!input || !citesGarryAsSource(input)) return input;
  const paper = input.match(PAPER_NAME)?.[1];
  GARRY_COLLECTION_PHRASE.lastIndex = 0;
  let next = input.replace(GARRY_COLLECTION_PHRASE, " ");
  next = next
    .replace(/\s*·\s*(?:·\s*)+/g, " · ")
    .replace(/(?:\s*·\s*){2,}/g, " · ")
    .replace(/^(?:\s*[·,;:\-–—]+\s*)+|(?:\s*[·,;:\-–—]+\s*)+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  const bare = next.replace(/[.\s]/g, "");
  if (
    !next ||
    /^(?:DATE_TBD|undated(?:\s+clipping)?|\d{4})$/i.test(next) ||
    bare.length < 3
  ) {
    return paper ?? "Courtesy of Irish Newspaper Archives";
  }
  return next;
}

function normalizePublicWording(input: string): string {
  return publicSourceCredit(input)
    .replace(/\bINA snip\s*[—–:-]\s*/gi, "")
    .replace(/\bRoH\b/g, "Roll of Honour")
    .replace(/\([^)]*wiki spelling[^)]*\)/gi, "")
    .replace(/\s*\([^)]*\bdistinct from\b[^)]*\)/gi, "")
    .replace(/\s*;\s*distinct from\b[^.]*/gi, "")
    .replace(/\s+distinct from\b[^.]*/gi, "")
    .replace(/\s*\(club role, not a playing record\)/gi, "")
    .replace(
      /Mentioned in match report for Fohenagh on the 1959 Galway SHC final XV vs Castlegar(?:\s*\([^)]*\))?/gi,
      "On the Fohenagh XV for the 1959 Galway SHC final against Castlegar"
    )
    .replace(/wore the ahascragh[-\s/]fohenagh jersey\.?/gi, "");
}

function tidySpaces(input: string): string {
  return input.replace(/\s{2,}/g, " ").replace(/\s+([,.;!?])/g, "$1").trim();
}

function cleanGradeMarks(input: string): string {
  return input
    .replace(/[‘’“”]/g, "")
    .replace(/'([A-E])'/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Drop the word "panel" from a lead sentence without adding a new fact. */
function rewritePanelSentence(sentence: string): string {
  const honour = sentence.match(
    /^(.*?Roll of Honour)(?:\s+(\d{4}))?:\s+.+?\bnamed on\s+(.+?)\s+Hurling Champions panels?\.?$/i
  );
  if (honour) {
    const source = honour[1].replace(/\s+\d{4}$/, "").trim();
    const year = honour[2] ?? "";
    const team = cleanGradeMarks(honour[3]).replace(/\s+Hurling$/i, "");
    const yearBit = year ? `, ${year}` : "";
    return tidySpaces(`${team} hurling champion${yearBit} (${source}).`);
  }

  let text = sentence
    .replace(/\bteam panels\b/gi, "team photos")
    .replace(/\bteam panel\b/gi, "team photo");
  text = text.replace(
    /\bchampions(?:\s+((?:18|19|20)\d{2}))?\s+panels?\b/gi,
    (_match, year: string | undefined) => (year ? `champions ${year}` : "champions")
  );
  text = text.replace(/\bwinners(?:\s+((?:18|19|20)\d{2}))?\s+panels?\b/gi, (_match, year: string | undefined) =>
    year ? `winners ${year}` : "winners"
  );
  text = rewriteOpeningLabel(text);
  if (/\bpanels?\b/i.test(text)) {
    text = text.replace(/\bpanel lists\b/gi, "lists");
    text = text.replace(/\bpanels\b/gi, "teams");
    text = text.replace(/\bpanel\b/gi, "team");
    text = text.replace(/\bteam teams?\b/gi, "team");
    text = text.replace(/\bteams teams\b/gi, "teams");
    text = cleanGradeMarks(text);
  }
  return tidySpaces(text);
}

function looksLikeSourceLabel(label: string): boolean {
  const opens = label.match(/\(/g)?.length ?? 0;
  const closes = label.match(/\)/g)?.length ?? 0;
  if (opens !== closes) return false;
  if (
    /^(named|selected|shown|scored|started|mentioned|identified|called|printed|the|he|she|a|an|undefeated)\b/i.test(
      label
    )
  ) {
    return false;
  }
  if (
    /\b(archive|roll of honour|tribune|herald|advertiser|independent|examiner|times|team sheet|wikipedia|gaa|bay fm|panel|sheet|programme|program|history|heritage|hoganstand|parish|player list|report)\b/i.test(
      label
    ) ||
    /\bfm\b/i.test(label) ||
    /\brté\b/i.test(label)
  ) {
    return true;
  }
  const words = label.split(/\s+/).filter(Boolean);
  if (
    words.length >= 1 &&
    words.length <= 6 &&
    words.every((word) => /^[\dA-ZÁÉÍÓÚ“"'(]/.test(word))
  ) {
    return true;
  }
  return (
    /\b(?:18|19|20)\d{2}\b/.test(label) &&
    /\b(final|champion|honour|archive|sheet|panel)\b/i.test(label)
  );
}

function rewriteOpeningLabel(sentence: string): string {
  const match = sentence.match(/^([^:]{3,180}):\s+([\s\S]+)$/);
  if (!match) return sentence;
  const label = match[1].trim();
  const rest = match[2].trim();
  const namedIn = label.match(/^Named in\s+(.+)$/i);
  const sourceLabel = namedIn?.[1] ?? label;
  if (!looksLikeSourceLabel(sourceLabel)) return sentence;
  if (rest.replace(/[.!?]/g, "").trim().length < 8) return sentence;

  const sheet = label.match(
    /^(.+?)\s+((?:18|19|20)\d{2})\s+([A-Za-z]{2,8})\s+final(?:\s+team sheet)?$/i
  );
  const played = rest.match(
    /^(.+?)\s+(started\/scored|started|scored a goal|scored|goal)\s+for\s+(.+?)\.?$/i
  );
  if (sheet && played) {
    const archive = sheet[1].replace(/\s+team sheet$/i, "").trim();
    const year = sheet[2];
    const comp = sheet[3].toUpperCase();
    const club = played[3].replace(/[.!?]+$/g, "").trim();
    const action = played[2];
    const verb = /started\/scored/i.test(action)
      ? "Started and scored for"
      : /^goal$/i.test(action)
        ? "Scored a goal for"
        : /^scored/i.test(action)
          ? "Scored for"
          : "Started for";
    const competition = comp === "SHC" ? "Galway SHC" : comp;
    return `${verb} ${club} in the ${year} ${competition} final (${archive}).`;
  }

  const fact = rest.replace(/[.!?]+$/g, "").trim();
  const capital = fact.charAt(0).toUpperCase() + fact.slice(1);
  return `${capital} (${sourceLabel}).`;
}

/** Book team-photo captions drop row letters and become one plain sentence. */
function rewriteBookPhoto(sentence: string): string {
  const year = sentence.match(/\b((?:18|19|20)\d{2})\s+underage team photo\b/i);
  if (!year) return sentence;
  if (!/fohenagh|book|history/i.test(sentence)) return sentence;
  return `Pictured with the Fohenagh underage team of ${year[1]} (A History of Fohenagh).`;
}

/** Profile lead: no "panel", and the opening is the fact rather than a source label. */
export function shapePublicLead(input: string | null): string | null {
  if (!input?.trim()) return input;
  const sentences = splitSentences(input).map((sentence) =>
    tidySpaces(rewriteOpeningLabel(rewriteBookPhoto(rewritePanelSentence(sentence))))
  );
  if (sentences.length === 0) return input;
  const shaped = tidy(sentences.join(" "));
  return shaped || input;
}

const CATALOGUE_START =
  /^(named|mentioned|shown|identified|selected|pictured|called up)\b/i;

function finishSentence(sentence: string): string {
  const body = sentence.replace(/[.!?]+$/g, "").trim();
  if (!body) return "";
  return `${body}.`;
}

/** Keep a career line with internal semicolons in one piece. */
function clausesOf(sentence: string): string[] {
  if (/\bclub;\s+/i.test(sentence) && /\btitles?\b/i.test(sentence)) return [sentence];
  const parts: string[] = [];
  let buf = "";
  let depth = 0;
  for (let i = 0; i < sentence.length; i++) {
    const ch = sentence[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === ";" && depth === 0) {
      if (buf.trim()) parts.push(buf.trim());
      buf = "";
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts.length > 0 ? parts : [sentence];
}

/**
 * "Name (1929–2018) Fohenagh club; Galway SHC titles 1959–1960; Galway senior 1949–1963 (Wikipedia)."
 * becomes one career sentence. Only groups already in the clause are used.
 */
function expandCareerStub(sentence: string): string | null {
  const cleaned = sentence.replace(/[.]+$/g, "").trim();
  const match = cleaned.match(
    /^(.+?)\s+\((\d{4})\s*[–—-]\s*(\d{4})\)\s+(.+?)\s+club;\s+(.+?)\s+titles?\s+([^;]+);\s+(.+?)\s+senior\s+([^.(]+?)\s*\(([^)]+)\)\.?$/i
  );
  if (!match) return null;
  const person = match[1].trim();
  const club = match[4].trim();
  const comp = match[5].trim();
  const titleYears = match[6].trim();
  const county = match[7].trim();
  const seniorYears = match[8].trim();
  const source = match[9].trim();
  return `${person} (${match[2]}–${match[3]}) hurled with ${club} and for ${county} seniors from ${seniorYears}, and was on the ${comp} title sides of ${titleYears} (${source}).`;
}

export type VignettePronoun = "he" | "she";

function subjectPronoun(pronoun: VignettePronoun): "He" | "She" {
  return pronoun === "she" ? "She" : "He";
}

function toProseClause(sentence: string, pronoun: VignettePronoun = "he"): string {
  const body = sentence.replace(/[.]+$/g, "").trim();
  if (!body) return "";
  const subject = subjectPronoun(pronoun);
  if (/^pictured\b/i.test(body)) return finishSentence(body);
  if (/^(mentioned|named|identified|selected)\b/i.test(body)) {
    return `${subject} was ${body.charAt(0).toLowerCase()}${body.slice(1)}.`;
  }
  if (/^(shown|called up)\b/i.test(body)) {
    return `${subject} is ${body.charAt(0).toLowerCase()}${body.slice(1)}.`;
  }
  if (/^scored\b/i.test(body)) return `${subject} ${body.charAt(0).toLowerCase()}${body.slice(1)}.`;
  return finishSentence(body);
}

const VIGNETTE_SENTENCES = 8;

function isCatalogueSentence(sentence: string): boolean {
  return CATALOGUE_START.test(sentence) || /^scored\b/i.test(sentence);
}

/** A score, a team photo, or a title is worth keeping when the clipping list is long. */
function priorityCatalogue(sentence: string): boolean {
  return /\b(scored|team photo|champions?|winning goal)\b/i.test(sentence);
}

/** "Named in the photos through 1963" restates the clippings. The book prose does not. */
function clippingEcho(sentence: string): boolean {
  return /\bnamed in\b/i.test(sentence) && /\bphotos?\b/i.test(sentence);
}

function sameFact(a: string, b: string): boolean {
  const norm = (sentence: string) => sentence.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const left = norm(a);
  const right = norm(b);
  if (!left || !right) return false;
  if (left === right || left.includes(right) || right.includes(left)) return true;
  const years = (sentence: string) => [...sentence.matchAll(/\b(?:18|19|20)\d{2}\b/g)].map((match) => match[0]);
  const leftYears = new Set(years(a));
  const rightYears = years(b);
  if (leftYears.size > 0 && rightYears.length > 0 && !rightYears.some((year) => leftYears.has(year))) {
    return false;
  }
  if (left.length < 24 || right.length < 24) return false;
  const words = (sentence: string) =>
    new Set(sentence.split(" ").filter((word) => word.length > 3));
  const leftWords = words(left);
  const rightWords = words(right);
  if (rightWords.size < 6) return false;
  let shared = 0;
  for (const word of rightWords) if (leftWords.has(word)) shared++;
  return shared / rightWords.size >= 0.62;
}

function dedupeSentences(sentences: string[]): string[] {
  const kept: string[] = [];
  for (const sentence of sentences) {
    if (kept.some((earlier) => sameFact(earlier, sentence))) continue;
    kept.push(sentence);
  }
  return kept;
}

/**
 * Turn a clipping catalogue into a short vignette.
 * Career lines and book prose lead. A long run of "Named… / Shown…"
 * clippings is cut back to the score, the team photo, and the title,
 * in the order the record gives them. Tim Sweeney's cutting list is
 * the pattern this follows for every player.
 */
export function composePlayerVignette(
  parts: string[],
  pronoun: VignettePronoun = "he"
): string | null {
  const cleaned = parts.map((part) => part.trim()).filter(Boolean);
  if (cleaned.length === 0) return null;
  const shaped = shapePublicLead(cleaned.join(" "));
  if (!shaped) return null;
  const sentences = splitSentences(shaped)
    .flatMap(clausesOf)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  type VignetteKind = "career" | "narrative" | "priority" | "other";
  const items: { text: string; kind: VignetteKind }[] = [];
  let seenCatalogue = false;
  for (const sentence of sentences) {
    const expanded = expandCareerStub(sentence);
    if (expanded) {
      items.push({ text: expanded, kind: "career" });
      continue;
    }
    if (isCatalogueSentence(sentence)) {
      const asLead = !seenCatalogue && !items.some((item) => item.kind !== "career");
      seenCatalogue = true;
      const prose = asLead ? finishSentence(sentence) : toProseClause(sentence, pronoun);
      if (!prose) continue;
      items.push({
        text: prose,
        kind: !asLead && priorityCatalogue(sentence) ? "priority" : "other",
      });
      continue;
    }
    const plain = finishSentence(sentence);
    if (plain) items.push({ text: plain, kind: "narrative" });
  }

  for (let i = 0; i < items.length; i++) {
    if (!/\bthat (?:replay|game|final|match|draw)\b/i.test(items[i].text)) continue;
    for (let j = i - 1; j >= 0; j--) {
      if (items[j].kind === "other") {
        items[j].kind = "priority";
        break;
      }
      if (items[j].kind !== "other") break;
    }
  }

  const career = items.filter((item) => item.kind === "career");
  const rest = items.filter((item) => item.kind !== "career" && !clippingEcho(item.text));
  const chosen = dedupeSentences([...career, ...rest].map((item) => item.text)).map((text) => {
    const item = [...career, ...rest].find((candidate) => candidate.text === text);
    return item ?? { text, kind: "narrative" as VignetteKind };
  });
  const protectedCount = career.length > 0 ? career.length : Math.min(1, chosen.length);
  while (chosen.length > VIGNETTE_SENTENCES) {
    let dropAt = -1;
    for (let i = chosen.length - 1; i >= protectedCount; i--) {
      if (chosen[i].kind === "other") {
        dropAt = i;
        break;
      }
    }
    if (dropAt < 0) {
      for (let i = chosen.length - 1; i >= protectedCount; i--) {
        if (chosen[i].kind === "narrative") {
          dropAt = i;
          break;
        }
      }
    }
    if (dropAt < 0) {
      for (let i = chosen.length - 1; i >= protectedCount; i--) {
        if (chosen[i].kind === "priority") {
          dropAt = i;
          break;
        }
      }
    }
    if (dropAt < 0) break;
    chosen.splice(dropAt, 1);
  }
  const vignette = tidy(chosen.map((item) => item.text).join(" "));
  return vignette || null;
}

/**
 * Display label for the 19 Sep 1959 Connacht Tribune team photograph.
 * The stored caption says "team panel"; the page says what the cutting is.
 */
export function publicCuttingLabel(text: string): string {
  const trimmed = publicSourceCredit(text).replace(/\bINA snip\s*[—–:-]\s*/gi, "").trim();
  const isThisCutting =
    /team (?:panel|photo)/i.test(trimmed) &&
    /fohenagh/i.test(trimmed) &&
    (/19 sep 1959/i.test(trimmed) ||
      /first galway (?:shc|senior)/i.test(trimmed) ||
      /team panel/i.test(trimmed));
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
function withoutConfidence(sentence: string): string {
  return tidy(
    sentence
      .replace(/\([^)]*\bconfidence\b[^)]*\)/gi, "")
      .replace(/,?\s*[^,;.]*\bconfidence\b[^,;.]*/gi, "")
  );
}

export function firstPublicSentence(input: string): string {
  const clean = sanitizePublicText(input);
  return splitSentences(clean)[0] ?? "";
}

/** First printable sentence long enough to stand as a clipping quote. */
export function publicQuote(input: string): string {
  const sentences = splitSentences(sanitizePublicText(input))
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  return sentences.find((sentence) => sentence.length >= 40) ?? sentences.find((sentence) => sentence.length >= 20) ?? "";
}

function exciseBeyondPlaying(sentence: string): { text: string; kind: "keep" | "rewrite" | "remove" } {
  if (!beyondPlayingHit(sentence)) return { text: sentence, kind: "keep" };
  let text = sentence.replace(/\((?:[^()]*)\)/g, (paren) => (beyondPlayingHit(paren) ? "" : paren));
  text = text
    .replace(/,?\s*until injured\s*,?/gi, "")
    .replace(/\s+before\s+[\w-]+\s+injury\s+sub\b/gi, "")
    .replace(/\s+for injured\s+[A-Z][\w'.-]*(?:\s+[A-Z][\w'.-]*)?/g, "")
    .replace(/\s+through injury\b/gi, "");
  const pieces = text.split(/\s*;\s*/);
  if (pieces.length > 1) {
    const kept = pieces.filter((piece) => piece && !beyondPlayingHit(piece));
    if (kept.length > 0 && kept.length < pieces.length) text = kept.join("; ");
  }
  if (beyondPlayingHit(text)) {
    const commas = text.split(/,\s+/);
    if (commas.length > 1) {
      const kept = commas.filter((piece) => piece && !beyondPlayingHit(piece));
      if (kept.length > 0 && kept.length < commas.length) text = kept.join(", ");
    }
  }
  text = tidy(text.replace(/\s+([,.;])/g, "$1"));
  if (!text || beyondPlayingHit(text)) return { text: "", kind: "remove" };
  return { text, kind: "rewrite" };
}

/**
 * Drop emigration, retirement, injury, illness, death, and personal-life lines.
 * A Remembered note that touches any of those goes entirely.
 * A cited playing fact in the same sentence stays when the banned phrase can be cut.
 */
export function applyPlayingYearsRule(input: string): {
  text: string;
  removed: number;
  rewritten: number;
} {
  const sentences = splitSentences(input);
  const joined = sentences.join(" ");
  const rememberedLife = /\bremembered\b/i.test(joined) && Boolean(beyondPlayingHit(joined));
  let removed = 0;
  let rewritten = 0;
  const kept: string[] = [];
  for (const sentence of sentences) {
    if (rememberedLife && (/\bremembered\b/i.test(sentence) || beyondPlayingHit(sentence))) {
      removed += 1;
      continue;
    }
    const excised = exciseBeyondPlaying(sentence);
    if (excised.kind === "remove") {
      removed += 1;
      continue;
    }
    if (excised.kind === "rewrite") rewritten += 1;
    if (excised.text) kept.push(excised.text);
  }
  return { text: tidy(kept.join(" ")), removed, rewritten };
}

/** Edits the playing-years rule makes on lines that would otherwise be public. */
export function countPublicPlayingYearsEdits(input: string): { removed: number; rewritten: number } {
  let removed = 0;
  let rewritten = 0;
  for (const sentence of splitSentences(input)) {
    const edit = applyPlayingYearsRule(sentence);
    if (edit.removed + edit.rewritten === 0) continue;
    const wasPublic = !firstPipelineHit(sentence) && !namesPersonHurt(sentence);
    const nowPublic = Boolean(edit.text) && !firstPipelineHit(edit.text) && !namesPersonHurt(edit.text);
    if (!wasPublic && !nowPublic) continue;
    removed += edit.removed;
    rewritten += edit.rewritten;
  }
  return { removed, rewritten };
}

export function sanitizePublicText(input: string): string {
  const prepared = tidy(stripIdTokens(normalizePublicWording(input)));
  if (!prepared) return "";
  const stripped = applyPlayingYearsRule(prepared).text;
  if (!stripped) return "";
  const kept: string[] = [];
  for (const rawSentence of splitSentences(stripped)) {
    const sentence = withoutConfidence(rawSentence);
    if (!sentence || namesPersonHurt(sentence)) continue;
    const clauses = sentence.split(/\s*;\s*/);
    const good = clauses
      .map((clause) => tidy(withoutConfidence(clause.replace(/[;]+$/g, ""))))
      .filter((clause) => clause && !firstBannedPublicHit(clause) && !namesPersonHurt(clause));
    if (good.length === 0) continue;
    const rejoined = good
      .map((clause, index) =>
        index === good.length - 1 ? finishClause(clause, sentence) : clause.replace(/[.!?]$/, "")
      )
      .join("; ");
    const clean = tidy(rejoined);
    if (clean && !firstBannedPublicHit(clean) && !namesPersonHurt(clean)) kept.push(clean);
  }
  return tidy(kept.join(" "));
}

export function shortenPublicText(input: string, maxSentences = 2): string {
  const clean = sanitizePublicText(input);
  if (!clean) return "";
  const sentences = splitSentences(clean);
  return tidy(sentences.slice(0, maxSentences).join(" "));
}
