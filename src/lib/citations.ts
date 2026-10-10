/**
 * Numbered markers for a write-up. The numbers are the reference list.
 * A marker links to the clipping when we have one, otherwise to the
 * reference on the same page. Nothing is fetched from outside the records.
 */

export type CiteRef = {
  title: string;
  href: string;
};

const ABBREVIATIONS = new Set([
  "co", "st", "mr", "mrs", "ms", "dr", "prof", "jr", "sr", "no", "vs",
  "capt", "fr", "rev", "dept", "fig", "jan", "feb", "mar", "apr", "jun", "jul", "aug",
  "sep", "sept", "oct", "nov", "dec", "p", "pp", "vol", "al", "gen",
]);

function tokenBefore(text: string, index: number): string {
  let start = index - 1;
  while (start >= 0 && /[A-Za-z]/.test(text[start])) start--;
  return text.slice(start + 1, index);
}

export function splitCiteSentences(text: string): string[] {
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

function yearsIn(text: string): string[] {
  return [...text.matchAll(/\b(?:18|19|20)\d{2}\b/g)].map((match) => match[0]);
}

function parentheticals(sentence: string): string[] {
  return [...sentence.matchAll(/\(([^)]{3,160})\)/g)].map((match) => match[1].trim());
}

function isSourceNote(text: string): boolean {
  return /tribune|herald|sentinel|wikipedia|history of fohenagh|roll of honour|archive|independent|examiner|\bpress\b|\btimes\b|\bgaa\b|\bina\b|\bbook\b/i.test(
    text
  );
}

function scoreCandidate(sentence: string, candidate: CiteRef): number {
  const hay = `${candidate.title} ${candidate.href}`.toLowerCase();
  const notes = parentheticals(sentence);
  let source = 0;
  if (/connacht tribune/i.test(sentence) && /connacht tribune/i.test(hay)) source += 1;
  if (/tuam herald/i.test(sentence) && /tuam herald/i.test(hay)) source += 1;
  if (/connacht sentinel/i.test(sentence) && /sentinel/i.test(hay)) source += 1;
  if (/galway city tribune/i.test(sentence) && /city tribune/i.test(hay)) source += 1;
  if (/\birish press\b/i.test(sentence) && /\birish press\b|\bipr\d{6,}/i.test(hay)) source += 1;
  if (/wikipedia/i.test(sentence) && /wikipedia/i.test(hay)) source += 1;
  if (/history of fohenagh|\bthe book\b/i.test(sentence) && /history of fohenagh|o'gorman|ogorman/i.test(hay)) {
    source += 1;
  }
  if (/roll of honour/i.test(sentence) && /roll of honour/i.test(hay)) source += 1;
  if (/turloughmore/i.test(sentence) && /turloughmore/i.test(hay)) source += 1;
  if (/\bgaa\b/i.test(sentence) && /\bgaa\b/i.test(hay)) source += 1;
  if (source === 0) return 0;
  const years = yearsIn(sentence);
  const candidateYears = yearsIn(hay);
  if (
    years.length > 0 &&
    candidateYears.length > 0 &&
    !years.some((year) => candidateYears.includes(year))
  ) {
    return 0;
  }
  let score = source * 3;
  for (const year of years) if (hay.includes(year)) score += 2;
  for (const note of notes) {
    const words = note.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 4);
    const shared = words.filter((word) => hay.includes(word)).length;
    if (shared >= 2) score += 2;
  }
  return score;
}

function withMarker(sentence: string, n: number): string {
  if (new RegExp(`\\[${n}\\]`).test(sentence)) return sentence;
  if (/[.!?]$/.test(sentence)) return sentence.replace(/([.!?])$/, `[${n}]$1`);
  return `${sentence}[${n}]`;
}

/**
 * Put [n] on each sentence that names a source, or that continues the
 * source just cited. Numbers follow the order the sources first appear.
 */
export function markCitations(
  text: string,
  candidates: CiteRef[]
): { text: string; references: CiteRef[] } {
  const sentences = splitCiteSentences(text);
  if (sentences.length === 0) return { text, references: [] };
  const used: CiteRef[] = [];
  let previous = 0;

  const numberFor = (ref: CiteRef): number => {
    const existing = used.findIndex((item) => item.href === ref.href && item.title === ref.title);
    if (existing >= 0) return existing + 1;
    used.push(ref);
    return used.length;
  };

  const marked = sentences.map((sentence) => {
    let best: CiteRef | null = null;
    let bestScore = 0;
    for (const candidate of candidates) {
      if (!candidate.title || !candidate.href) continue;
      const score = scoreCandidate(sentence, candidate);
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
    if (best && bestScore >= 3) {
      const undatedPaper = yearsIn(sentence).length === 0;
      if (undatedPaper && previous > 0) {
        const prior = used[previous - 1];
        const samePaper =
          (/connacht tribune/i.test(sentence) && /connacht tribune/i.test(`${prior.title} ${prior.href}`)) ||
          (/tuam herald/i.test(sentence) && /tuam herald/i.test(`${prior.title} ${prior.href}`)) ||
          (/connacht sentinel/i.test(sentence) && /sentinel/i.test(`${prior.title} ${prior.href}`)) ||
          (/\birish press\b/i.test(sentence) && /\birish press\b|\bipr\d{6,}/i.test(`${prior.title} ${prior.href}`)) ||
          (/wikipedia/i.test(sentence) && /wikipedia/i.test(`${prior.title} ${prior.href}`)) ||
          (/\bthe book\b|history of fohenagh/i.test(sentence) &&
            /history of fohenagh|o'gorman|ogorman/i.test(`${prior.title} ${prior.href}`));
        if (samePaper) return withMarker(sentence, previous);
      }
      previous = numberFor(best);
      return withMarker(sentence, previous);
    }
    const noted = parentheticals(sentence).find(isSourceNote);
    const bookish = /\bthe book\b|a history of fohenagh/i.test(sentence);
    if (noted || bookish) {
      const title = (noted || "A History of Fohenagh (Tony O'Gorman)").toLowerCase();
      const real =
        candidates.find((item) => clickable(item) && sharesTitle(item, title)) ??
        candidates.find((item) => clickable(item) && scoreCandidate(sentence, item) > 0) ??
        (bookish
          ? candidates.find(
              (item) => clickable(item) && /history of fohenagh|o'gorman|ogorman/i.test(`${item.title} ${item.href}`)
            )
          : undefined);
      if (real) {
        previous = numberFor(real);
        return withMarker(sentence, previous);
      }
    }
    if (previous > 0 && clickable(used[previous - 1])) return withMarker(sentence, previous);
    return sentence;
  });

  return { text: marked.join(" "), references: used.filter((ref) => clickable(ref)) };
}

function clickable(ref: CiteRef | undefined): ref is CiteRef {
  return Boolean(ref && (/^\//.test(ref.href) || /^https?:\/\//i.test(ref.href)));
}

function sharesTitle(ref: CiteRef, title: string): boolean {
  const hay = ref.title.toLowerCase();
  const head = title.slice(0, 18);
  return hay.includes(head) || title.includes(hay.slice(0, 18));
}
