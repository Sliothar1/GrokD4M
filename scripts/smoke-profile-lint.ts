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
import { namesPersonHurt, sanitizePublicText } from "../src/lib/publicText";

const STORY_FILES = [
  "src/components/fohenagh/Fohenagh1942Story.tsx",
  "src/components/fohenagh/FohenaghClubHistory.tsx",
  "src/components/fohenagh/FohenaghParishStory.tsx",
];

function fail(errors: string[], message: string) {
  errors.push(message);
}

async function main() {
  const errors: string[] = [];
  const root = process.cwd();

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

  for (const id of A.entitiesOfType("player")) {
    if (A.entityAttrs(id).same_as) continue;
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
    errors: errors.length,
  };
  console.log(JSON.stringify(report, null, 2));
  if (errors.length > 0) {
    console.error(errors.slice(0, 40).join("\n"));
    process.exit(1);
  }
}

main();
