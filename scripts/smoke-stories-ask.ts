/**
 * Printed stories stay free of oral-only detail, and questions
 * are answered only from those records.
 */
import assert from "node:assert/strict";
import { askRecords } from "../src/lib/askRecords";
import { assertStoriesArePrintOnly, PARISH_STORIES, storyText } from "../src/lib/parishStories";

async function main() {
  assert.equal(assertStoriesArePrintOnly(), null);
  assert.ok(PARISH_STORIES.length >= 8);
  for (const story of PARISH_STORIES) {
    const text = storyText(story);
    assert.match(text, /\[\d+\]/, story.slug);
    assert.doesNotMatch(text, /blackcoats|fifteen yards|belt from|moustache|bonfire|Garry Lohan/i, story.slug);
    assert.ok(story.references.every((ref) => ref.href.startsWith("/article/")), story.slug);
  }
  assert.ok(PARISH_STORIES.some((story) => story.matchHref === "/match/fohenagh-claregalway-1941-county-semi"));
  assert.ok(PARISH_STORIES.some((story) => story.slug === "fohenagh-turf-lorry-1947"));

  const athenry = await askRecords("1941 semi-final Athenry");
  assert.equal(athenry.empty, false);
  assert.match(athenry.hits.map((hit) => hit.text).join(" "), /Athenry/i);

  const tim = await askRecords("Tim Sweeney scored 1-4");
  assert.equal(tim.empty, false);
  assert.match(tim.hits.map((hit) => hit.text).join(" "), /1-4/);

  const oral = await askRecords("who got a belt from Barrett");
  assert.equal(oral.empty, true);

  console.log(`smoke-stories-ask: ok stories=${PARISH_STORIES.length}`);
  console.log("q1", athenry.hits[0]?.text);
  console.log("q2", tim.hits[0]?.text);
  console.log("q3 empty", oral.empty);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
