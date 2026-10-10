/**
 * Public-text gate. Profiles, parish stories, and the 1942 story from PR #88.
 * A reference must open a page. Nobody is named as assaulted or injured.
 */
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join } from "path";
import { getAssoc, getEntity } from "../src/lib/data";
import { readArticleUploads } from "../src/lib/articles";
import { PARISH_STORIES } from "../src/lib/parishStories";
import {
  createPlayerProfileContext,
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
    const years = `${text} ${JSON.stringify(A.entityAttrs(id))}`.match(/\b(?:18|19|20)\d{2}\b/);
    if (years && profile.eraLine && !/\b(?:18|19|20)\d{2}s\b/.test(profile.eraLine)) {
      eraMissing++;
      fail(errors, `${id} era has no decade: ${profile.eraLine}`);
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

  assert.equal(A.entityAttrs("player:s-carrick-fohenagh").same_as, "player:sean-carrig-fohenagh");
  const carrig = profileForPlayer(
    ctx,
    "player:sean-carrig-fohenagh",
    A.entityAttrs("player:sean-carrig-fohenagh")
  );
  const carrigText = publicProfileText(carrig);
  assert.match(carrigText, /Killimordaly/);
  assert.doesNotMatch(carrigText, /substitut|\bsub\b/i);

  const barrett = profileForPlayer(ctx, "player:mike-barrett-fohenagh", A.entityAttrs("player:mike-barrett-fohenagh"));
  if (/assault|injured/i.test(barrett.summary ?? "")) {
    fail(errors, `mike barrett lead: ${barrett.summary}`);
  }

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
