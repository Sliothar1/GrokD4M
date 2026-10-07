/**
 * Fohenagh historic landing: club tags stay era-specific, and the pinned
 * 1959 Connacht Tribune cutting is the hero.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeClubTags } from "../src/lib/articles";
import { getEntity } from "../src/lib/data";
import { pinnedCuttingId, resolveEntityHero } from "../src/lib/heroCutting";
import { clubChipTitle } from "../src/lib/playerClubs";
import { annotateEntityVerification } from "../src/lib/verification";
import { resolveEntitySources } from "../src/lib/sources";

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
assert.equal(clubChipTitle("club:fohenagh-historic", "Fohenagh · historic"), "Fohenagh");
assert.equal(
  clubChipTitle("club:ahascragh-historic", "Ahascragh · historic"),
  "Before Ahascragh-Fohenagh"
);

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

  const cathal = await getEntity("player:cathal-lohan");
  assert.ok(cathal);
  const familyKeys = String(cathal.attrs.confirmed_by_family)
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean);
  assert.deepEqual(familyKeys.sort(), ["notable", "notes"]);
  assert.match(
    String(cathal.attrs.notable),
    /^Won an All-Ireland hurling medal at under-14 with Galway/
  );
  const cathalNotes = seed.find(
    (c) => c.row === "player:cathal-lohan" && c.col === "notes"
  ) as { source?: string; val?: string } | undefined;
  assert.equal(cathalNotes?.source, "Verified");
  assert.equal(cathalNotes?.val?.includes("Garry"), false);
  const cathalSources = annotateEntityVerification(
    resolveEntitySources({
      entityId: "player:cathal-lohan",
      attrs: cathal.attrs,
      order: [{ fact: "notes" }],
    }),
    cathal.attrs
  );
  assert.equal(
    cathalSources.facts.find((fact) => fact.factKey === "notes")?.status,
    "verified"
  );
  const cathalNotable = annotateEntityVerification(
    resolveEntitySources({
      entityId: "player:cathal-lohan",
      attrs: cathal.attrs,
      order: [{ fact: "notable" }],
    }),
    cathal.attrs
  );
  assert.equal(
    cathalNotable.facts.find((fact) => fact.factKey === "notable")?.status,
    "verified"
  );
  assert.equal(
    JSON.stringify(cathal.attrs).includes("Garry Lohan"),
    false
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
