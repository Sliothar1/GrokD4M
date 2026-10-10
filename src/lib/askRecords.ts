/**
 * Club questions are answered from the records already on the site.
 * Matching is token overlap. There is no model call and no secret.
 */
import { getAssoc } from "@/lib/data";
import { publicMatchBlurb } from "@/lib/publicText";
import { createPlayerProfileContext, profileForPlayer } from "@/lib/playerProfile";
import { PARISH_STORIES, storyText } from "@/lib/parishStories";

export type RecordHit = {
  text: string;
  href: string;
  source: string;
};

const STOP = new Set([
  "the", "a", "an", "of", "in", "on", "for", "and", "to", "did", "was", "were",
  "who", "what", "when", "where", "how", "which", "is", "are", "with", "from",
  "by", "at", "it", "his", "her", "their", "that", "this", "into", "about",
  "after", "before", "does", "do", "has", "have", "had", "be", "or", "not",
  "yet", "our", "records",
]);

let corpusPromise: Promise<RecordHit[]> | null = null;

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word.length > 2 && !STOP.has(word));
}

function sentencesOf(text: string): string[] {
  return text
    .replace(/\[\d+\]/g, "")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 20);
}

export async function recordCorpus(): Promise<RecordHit[]> {
  if (!corpusPromise) corpusPromise = buildCorpus();
  return corpusPromise;
}

async function buildCorpus(): Promise<RecordHit[]> {
  const hits: RecordHit[] = [];
  for (const story of PARISH_STORIES) {
    const source = story.references[0]?.title ?? story.title;
    const href = story.references[0]?.href ?? `/story/${story.slug}`;
    hits.push({ text: story.title, href: `/story/${story.slug}`, source });
    for (const sentence of sentencesOf(storyText(story))) {
      hits.push({ text: sentence, href, source });
    }
  }

  const A = await getAssoc();
  const ctx = await createPlayerProfileContext();
  for (const id of A.entitiesOfType("player")) {
    const attrs = A.entityAttrs(id);
    if (attrs.same_as) continue;
    const profile = profileForPlayer(ctx, id, attrs);
    const slug = id.slice("player:".length);
    const source = profile.references[0]?.title ?? profile.name;
    for (const sentence of sentencesOf(profile.summary ?? "")) {
      hits.push({ text: sentence, href: `/player/${slug}`, source });
    }
  }
  for (const id of A.entitiesOfType("match")) {
    const attrs = A.entityAttrs(id);
    if (attrs.same_as) continue;
    const blurb = publicMatchBlurb(attrs);
    const name = String(attrs.name ?? attrs.title ?? "");
    const slug = id.slice("match:".length);
    const source = String(attrs.cite ?? attrs.cutting_cite ?? "Match record");
    if (name) hits.push({ text: name, href: `/match/${slug}`, source });
    for (const sentence of sentencesOf(blurb)) {
      hits.push({ text: sentence, href: `/match/${slug}`, source });
    }
  }
  return hits;
}

export async function askRecords(question: string): Promise<{
  question: string;
  hits: RecordHit[];
  empty: boolean;
}> {
  const wanted = [...new Set(tokens(question))];
  if (wanted.length === 0) {
    return { question, hits: [], empty: true };
  }
  const corpus = await recordCorpus();
  const pageWords = new Map<string, Set<string>>();
  for (const hit of corpus) {
    const words = pageWords.get(hit.href) ?? new Set<string>();
    for (const word of tokens(hit.text)) words.add(word);
    pageWords.set(hit.href, words);
  }
  const pages = new Set(
    [...pageWords.entries()]
      .filter(([, words]) => wanted.every((word) => words.has(word)))
      .map(([href]) => href)
  );
  const ranked = corpus
    .filter((hit) => pages.has(hit.href))
    .map((hit) => {
      const hay = new Set(tokens(hit.text));
      return { hit, matched: wanted.filter((word) => hay.has(word)).length };
    })
    .filter((row) => row.matched > 0)
    .sort((a, b) => b.matched - a.matched || a.hit.text.length - b.hit.text.length);

  const seen = new Set<string>();
  const hits: RecordHit[] = [];
  const take = (row: { hit: RecordHit }) => {
    if (seen.has(row.hit.text) || hits.length >= 5) return;
    seen.add(row.hit.text);
    hits.push(row.hit);
  };
  for (const word of wanted) {
    const row = ranked.find((item) => tokens(item.hit.text).includes(word));
    if (row) take(row);
  }
  for (const row of ranked) take(row);
  return { question, hits, empty: hits.length === 0 };
}
