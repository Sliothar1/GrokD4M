/**
 * Fohenagh historic landing: club tags stay era-specific, and the pinned
 * 1959 Connacht Tribune cutting is the hero.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeClubTags } from "../src/lib/articles";
import { getEntity } from "../src/lib/data";
import { pinnedCuttingId, resolveEntityHero } from "../src/lib/heroCutting";

assert.deepEqual(normalizeClubTags(["fohenagh"]), ["club:fohenagh-historic"]);
assert.deepEqual(normalizeClubTags(["old-fohenagh"]), ["club:fohenagh-historic"]);
assert.deepEqual(normalizeClubTags(["ahascragh-fohenagh"]), [
  "club:ahascragh-fohenagh",
]);
assert.deepEqual(normalizeClubTags(["club:ahascragh-fohenagh"]), [
  "club:ahascragh-fohenagh",
]);
assert.deepEqual(normalizeClubTags(["club:fohenagh-historic"]), [
  "club:fohenagh-historic",
]);
assert.deepEqual(
  normalizeClubTags(["club:fohenagh-historic", "club:ahascragh-fohenagh"]),
  ["club:fohenagh-historic", "club:ahascragh-fohenagh"]
);
assert.deepEqual(normalizeClubTags(["ahascragh-historic"]), [
  "club:ahascragh-historic",
]);

const seed = JSON.parse(readFileSync("data/seed.json", "utf8")) as Array<{
  row: string;
  col: string;
  val: string;
}>;
const players = new Set(
  seed.filter((c) => c.col === "type" && c.val === "player").map((c) => c.row)
);
assert.equal(
  seed.find((c) => c.row === "club:fohenagh-historic" && c.col === "hero_cutting")
    ?.val,
  "art-ct-1959-09-05-fohenagh-castlegar-portrait"
);

async function main() {
  const club = await getEntity("club:fohenagh-historic");
  assert.ok(club);
  assert.equal(club.summary.title, "Fohenagh");
  assert.notEqual(club.summary.subtitle, "Before Ahascragh-Fohenagh");
  assert.equal(
    pinnedCuttingId(club.attrs),
    "art-ct-1959-09-05-fohenagh-castlegar-portrait"
  );
  assert.equal(
    pinnedCuttingId({
      hero_cutting: "article:art-ct-1959-09-05-fohenagh-castlegar-portrait",
    }),
    "art-ct-1959-09-05-fohenagh-castlegar-portrait"
  );

  const hero = await resolveEntityHero({
    entityId: club.id,
    kind: club.summary.kind,
    attrs: club.attrs,
    cuttings: club.related.filter((r) => r.kind === "article_upload"),
  });
  assert.ok(hero?.imagePath);
  assert.match(hero.id, /art-ct-1959-09-05-fohenagh-castlegar-portrait/);
  assert.doesNotMatch(hero.id, /trevor-lohan/);
  assert.equal(
    club.related.some((r) => r.id.includes("art-ina-tth-2002-03-09-af-trevor-lohan")),
    false
  );

  const trevor = await getEntity("player:trevor-lohan");
  assert.ok(trevor);
  assert.equal(
    trevor.related.some((r) => r.id.includes("art-ina-tth-2002-03-09-af-trevor-lohan")),
    true
  );

  const amalgam = await getEntity("club:ahascragh-fohenagh");
  assert.ok(amalgam);
  assert.equal(
    amalgam.related.some((r) => r.id.includes("art-ina-tth-2002-03-09-af-trevor-lohan")),
    true
  );

  console.log("smoke-fohenagh-hero: ok", {
    players: players.size,
    seedCells: seed.length,
    hero: hero.id,
    subtitle: club.summary.subtitle,
  });
}

main();
