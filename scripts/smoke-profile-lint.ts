/**
 * Public-text gate. Profiles, parish stories, and the 1942 story from PR #88.
 * A reference must open a page. Nobody is named as assaulted or injured.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { getAssoc, getEntity } from "../src/lib/data";
import { articleToSummary, getArticleUpload, readArticleUploads } from "../src/lib/articles";
import { listBrowsePlayers } from "../src/lib/browsePlayers";
import { canonicalPlayerSlug } from "../src/lib/playerSlug";
import { PARISH_STORIES } from "../src/lib/parishStories";
import {
  createPlayerProfileContext,
  decadesSpanned,
  playingYearsFor,
  profileForPlayer,
  publicProfileText,
} from "../src/lib/playerProfile";
import {
  beyondPlayingHit,
  countPublicPlayingYearsEdits,
  namesPersonHurt,
  sanitizePublicText,
} from "../src/lib/publicText";

const STORY_FILES = [
  "src/components/fohenagh/Fohenagh1942Story.tsx",
  "src/components/fohenagh/FohenaghClubHistory.tsx",
  "src/components/fohenagh/FohenaghParishStory.tsx",
];

function fail(errors: string[], message: string) {
  errors.push(message);
}

function assertLifeRule(errors: string[]) {
  const stays = ["a late goal", "scored in the late 1950s", "an injury-time goal", "pointed in injury time"];
  for (const line of stays) {
    if (beyondPlayingHit(line)) fail(errors, `life rule false hit: ${line}`);
  }
  const goes = [
    "he emigrated to America",
    "he retired",
    "until injured",
    "he died",
    "death notices",
    "the late Frank Glynn",
    "RIP",
    "a car accident",
    "a long illness",
    "the funeral Mass",
    "he passed away",
  ];
  for (const line of goes) {
    if (!beyondPlayingHit(line)) fail(errors, `life rule missed: ${line}`);
  }
}

const PROSE_FIELD = /^(?:note|notes|notable|book_note(?:_\d+)?)$/;

function walkSources(dir: string, out: string[]) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walkSources(path, out);
    else if (/\.(tsx|ts)$/.test(name)) out.push(path);
  }
}

async function internalHrefOk(
  href: string,
  A: Awaited<ReturnType<typeof getAssoc>>
): Promise<boolean> {
  const [kind, slug] = href.split("/").filter(Boolean);
  if (!kind || !slug) return false;
  if (kind === "browse") return ["players", "games", "decades", "stories"].includes(slug);
  if (kind === "player") {
    const mapped = canonicalPlayerSlug(slug);
    const target = `player:${mapped ?? slug}`;
    return Boolean(A.entityAttrs(target).type || A.entityAttrs(`player:${slug}`).type);
  }
  if (kind === "article") {
    if (await getArticleUpload(slug)) return true;
    if (Object.keys(A.entityAttrs(`article:${slug}`)).length > 0) return true;
    if (slug.startsWith("art-") && Object.keys(A.entityAttrs(`article:${slug.slice(4)}`)).length > 0) {
      return true;
    }
    return false;
  }
  if (!["match", "club", "team", "story", "win"].includes(kind)) return true;
  return Object.keys(A.entityAttrs(`${kind}:${slug}`)).length > 0;
}

async function assertCrawlLints(A: Awaited<ReturnType<typeof getAssoc>>, errors: string[]) {
  const entity = readFileSync("src/components/EntityView.tsx", "utf8");
  const index = readFileSync("src/components/fohenagh/FohenaghPlayerIndex.tsx", "utf8");
  const articlePage = readFileSync("src/app/article/[id]/page.tsx", "utf8");
  if (/Players who wore the jersey/.test(index)) fail(errors, "club page still has the jersey heading");
  if (/HistoricStoryChips|Do not invent scores/.test(entity)) {
    fail(errors, "club page still shows the internal note");
  }
  if (/tag === "fohenagh-historic"/.test(entity)) fail(errors, "club page still opens article clips");
  if (/#\{/.test(articlePage)) fail(errors, "public pages still print raw hash tags");

  const uploads = await readArticleUploads();
  for (const upload of uploads) {
    const summary = articleToSummary(upload);
    const text = `${summary.title}\n${summary.excerpt ?? ""}\n${summary.citeChip ?? ""}`;
    if (/ina snip/i.test(text)) fail(errors, `${upload.id} public text still says INA snip`);
    if (/#\s*(?:fohenagh|book|story)\b/i.test(text)) fail(errors, `${upload.id} public text has a raw tag`);
  }

  const listed = new Set((await listBrowsePlayers()).map((row) => row.href));
  let orphans = 0;
  for (const id of A.entitiesOfType("player")) {
    if (A.entityAttrs(id).same_as) continue;
    const href = `/player/${id.slice("player:".length)}`;
    if (!listed.has(href)) {
      orphans += 1;
      if (orphans <= 8) fail(errors, `orphan player ${href}`);
    }
  }
  if (orphans > 8) fail(errors, `${orphans} orphan players are not on the A–Z browse`);

  const files: string[] = [];
  walkSources("src", files);
  const hrefs = new Set<string>();
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(
      /["'`](\/(?:player|article|match|club|team|story|win|browse)\/[A-Za-z0-9][^"'`\s${]*)["'`]/g
    )) {
      hrefs.add(match[1].split("?")[0].split("#")[0]);
    }
  }
  let broken = 0;
  for (const href of hrefs) {
    if (await internalHrefOk(href, A)) continue;
    broken += 1;
    if (broken <= 12) fail(errors, `broken internal link ${href}`);
  }
  if (broken > 12) fail(errors, `${broken} broken internal links`);
}

async function main() {
  const errors: string[] = [];
  const root = process.cwd();
  assertLifeRule(errors);

  for (const file of STORY_FILES) {
    const text = readFileSync(join(root, file), "utf8");
    if (/\bassault/i.test(text) || /\binjured\b/i.test(text)) {
      fail(errors, `${file} names an assault or an injury`);
    }
    if (/blackcoats/i.test(text)) fail(errors, `${file} quotes blackcoats`);
    if (/barrett/i.test(text) && /assault|injured|murdered/i.test(text)) {
      fail(errors, `${file} links Barrett past the captain line`);
    }
  }

  for (const story of PARISH_STORIES) {
    const text = story.sentences.map((sentence) => sentence.text).join(" ");
    if (namesPersonHurt(text)) fail(errors, `parish story ${story.slug} names a person hurt`);
    if (/\bconfidence\b/i.test(text)) fail(errors, `parish story ${story.slug} says confidence`);
    if (/blackcoats/i.test(text)) fail(errors, `parish story ${story.slug} quotes blackcoats`);
    for (const ref of story.references) {
      if (!ref.href || ref.href.startsWith("#") || !/^(\/|https?:)/.test(ref.href)) {
        fail(errors, `parish story ${story.slug} ref not clickable: ${ref.href}`);
      }
    }
  }

  const uploads = await readArticleUploads();
  const battle = uploads.find((upload) => upload.id === "art-book-fohenagh-story-battle-of-athenry");
  const battlePublic = sanitizePublicText(battle?.excerpt ?? "");
  if (namesPersonHurt(battlePublic) || /barrett/i.test(battlePublic) && /assault/i.test(battlePublic)) {
    fail(errors, "battle of athenry excerpt still names Barrett as assaulted");
  }
  if (/\bconfidence\b/i.test(battlePublic)) fail(errors, "battle excerpt says confidence");

  const cussane = await getEntity("match:fohenagh-cussane-north-board-junior-final-1942");
  assert.ok(cussane);
  assert.match(String(cussane.attrs.opponent), /^Cussane$/);
  assert.match(String(cussane.attrs.date), /29 March 1942/);
  assert.match(String(cussane.attrs.name), /Fohenagh v Cussane/);
  assert.doesNotMatch(String(cussane.attrs.note), /\[(\?)\]|assault|injured/i);

  const athenry = await getEntity("match:fohenagh-claregalway-1941-county-semi");
  assert.ok(athenry);
  assert.match(String(athenry.attrs.date), /24 May 1942/);
  assert.doesNotMatch(`${athenry.attrs.note ?? ""} ${athenry.attrs.name ?? ""}`, /assault|injured|blackcoats/i);

  const A = await getAssoc();
  const ctx = await createPlayerProfileContext();
  let players = 0;
  let clickableRefs = 0;
  let unclickable = 0;
  let hurt = 0;
  let confidence = 0;
  let eraMissing = 0;
  let beyondPlaying = 0;
  let linesRemoved = 0;
  let linesRewritten = 0;

  for (const id of A.entitiesOfType("player")) {
    const attrs = A.entityAttrs(id);
    for (const [key, val] of Object.entries(attrs)) {
      if (!PROSE_FIELD.test(key) || typeof val !== "string") continue;
      const edit = countPublicPlayingYearsEdits(val);
      linesRemoved += edit.removed;
      linesRewritten += edit.rewritten;
    }
    if (attrs.same_as) continue;
    players++;
    const profile = profileForPlayer(ctx, id, A.entityAttrs(id));
    const text = publicProfileText(profile);
    if (namesPersonHurt(text)) {
      hurt++;
      fail(errors, `${id} names a person as hurt`);
    }
    if (/\bconfidence\b/i.test(text)) {
      confidence++;
      fail(errors, `${id} says confidence`);
    }
    const life = beyondPlayingHit(text);
    if (life) {
      beyondPlaying++;
      fail(errors, `${id} life beyond playing (${life})`);
    }
    const years = `${text} ${JSON.stringify(A.entityAttrs(id))}`.match(/\b(?:18|19|20)\d{2}s?\b/);
    if (years && profile.eraLine && !/\b(?:18|19|20)\d{2}s\b/.test(profile.eraLine)) {
      eraMissing++;
      fail(errors, `${id} era has no decade: ${profile.eraLine}`);
    }
    const allowed = new Set(decadesSpanned(playingYearsFor(ctx, id, A.entityAttrs(id))));
    for (const match of (profile.eraLine ?? "").matchAll(/\b((?:18|19|20)\d{2})s\b/g)) {
      const decade = `${match[1]}s`;
      if (!allowed.has(decade)) {
        eraMissing++;
        fail(errors, `${id} decade ${decade} is outside his own dated mentions`);
      }
    }
    if (profile.headline && profile.summary) {
      const bare = profile.headline.replace(/\[\d+\]/g, "").replace(/[.!?]+$/g, "").trim().toLowerCase();
      const first = (profile.summary.split(/(?<=[.!?])\s+/)[0] ?? "")
        .replace(/\[\d+\]/g, "")
        .replace(/[.!?]+$/g, "")
        .trim()
        .toLowerCase();
      if (bare.length >= 12 && first === bare) {
        fail(errors, `${id} lead repeats headline: ${profile.headline}`);
      }
    }
    for (const ref of profile.references) {
      if (!ref.href || ref.href.startsWith("#") || !/^(\/|https?:)/.test(ref.href)) {
        unclickable++;
        fail(errors, `${id} unclickable ref ${ref.href || "(empty)"} ${ref.title}`);
      } else clickableRefs++;
    }
  }

  assert.equal(
    A.entityAttrs("player:packie-burke-fohenagh").same_as,
    "player:packie-burke-turloughmore"
  );
  assert.equal(A.entityAttrs("player:packie-burke-fohenagh").club, "club:turloughmore");
  const packie = profileForPlayer(
    ctx,
    "player:packie-burke-turloughmore",
    A.entityAttrs("player:packie-burke-turloughmore")
  );
  assert.match(packie.summary ?? "", /full-back/i);

  assert.equal(A.entityAttrs("player:s-carrick-fohenagh").same_as, "player:sean-carrick-fohenagh");
  assert.equal(A.entityAttrs("player:sean-carrig-fohenagh").same_as, "player:sean-carrick-fohenagh");
  const carrick = profileForPlayer(
    ctx,
    "player:sean-carrick-fohenagh",
    A.entityAttrs("player:sean-carrick-fohenagh")
  );
  const carrickText = publicProfileText(carrick);
  assert.match(carrickText, /Killimordaly/);
  assert.doesNotMatch(carrickText, /substitut|\bsub\b/i);
  const lally = profileForPlayer(
    ctx,
    "player:brendan-lally-fohenagh",
    A.entityAttrs("player:brendan-lally-fohenagh")
  );
  assert.match(lally.eraLine ?? "", /1950s/);
  const patrick = profileForPlayer(
    ctx,
    "player:patrick-sweeney-fohenagh",
    A.entityAttrs("player:patrick-sweeney-fohenagh")
  );
  assert.match(patrick.eraLine ?? "", /1990s/);
  assert.match(patrick.eraLine ?? "", /2000s/);
  assert.doesNotMatch(patrick.eraLine ?? "", /1950s/);
  const tim = profileForPlayer(
    ctx,
    "player:tim-sweeney-fohenagh",
    A.entityAttrs("player:tim-sweeney-fohenagh")
  );
  assert.match(tim.eraLine ?? "", /1940s/);
  assert.match(tim.eraLine ?? "", /1960s/);
  assert.doesNotMatch(tim.eraLine ?? "", /1970s|1980s|1990s|2000s|2010s/);
  const kirwan = profileForPlayer(
    ctx,
    "player:tony-kirwan-fohenagh",
    A.entityAttrs("player:tony-kirwan-fohenagh")
  );
  assert.match(kirwan.eraLine ?? "", /1990s/);
  assert.doesNotMatch(kirwan.eraLine ?? "", /1970s/);
  const seamus = profileForPlayer(ctx, "player:seamus-moclair", A.entityAttrs("player:seamus-moclair"));
  assert.match(seamus.eraLine ?? "", /1990s/);
  assert.match(seamus.eraLine ?? "", /2020s/);
  assert.doesNotMatch(seamus.eraLine ?? "", /1970s/);
  const ogorman = profileForPlayer(ctx, "player:tony-ogorman", A.entityAttrs("player:tony-ogorman"));
  assert.match(ogorman.eraLine ?? "", /1950s/);
  assert.match(ogorman.eraLine ?? "", /1960s/);
  assert.doesNotMatch(ogorman.eraLine ?? "", /1970s|1980s|1990s|2000s|2010s|2020s/);

  const barrett = profileForPlayer(ctx, "player:mike-barrett-fohenagh", A.entityAttrs("player:mike-barrett-fohenagh"));
  if (/assault|injured/i.test(barrett.summary ?? "")) {
    fail(errors, `mike barrett lead: ${barrett.summary}`);
  }

  await assertCrawlLints(A, errors);

  const report = {
    players,
    clickableRefs,
    unclickable,
    hurt,
    confidence,
    eraMissing,
    beyondPlaying,
    linesRemoved,
    linesRewritten,
    linesRemovedOrRewritten: linesRemoved + linesRewritten,
    errors: errors.length,
  };
  console.log(JSON.stringify(report, null, 2));
  if (errors.length > 0) {
    console.error(errors.slice(0, 40).join("\n"));
    process.exit(1);
  }
}

main();
