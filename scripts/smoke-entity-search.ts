/**
 * Entity-first search contract:
 * unique player/club → one hit (page redirects);
 * several name hits → chooser of those entities only;
 * no name hit → empty (no cuttings dump).
 */
import assert from "node:assert/strict";
import { searchPrimaryEntities } from "../src/lib/data";
import { collapseToUniquePlayers, primaryIdentityMatch } from "../src/lib/searchRank";

assert.equal(
  primaryIdentityMatch("Cathal Mannion", "player", "player:cathal-mannion", "Cathal Mannion"),
  "exact"
);
assert.equal(
  primaryIdentityMatch("Jason Lohan", "player", "player:jason-lohan", "Jason Lohan"),
  "exact"
);
assert.equal(
  primaryIdentityMatch("Fohenagh", "club", "club:fohenagh-historic", "Fohenagh"),
  "exact"
);
assert.equal(
  primaryIdentityMatch("Fohenagh", "club", "club:ahascragh-fohenagh", "Ahascragh-Fohenagh"),
  "token"
);
assert.equal(
  primaryIdentityMatch(
    "Ahascragh-Fohenagh",
    "club",
    "club:fohenagh-historic",
    "Fohenagh"
  ),
  null
);
assert.equal(
  primaryIdentityMatch(
    "Ahascragh-Fohenagh",
    "club",
    "club:ahascragh-historic",
    "Ahascragh"
  ),
  null
);
assert.equal(
  primaryIdentityMatch(
    "Ahascragh-Fohenagh",
    "club",
    "club:ahascragh-fohenagh",
    "Ahascragh-Fohenagh"
  ),
  "exact"
);
assert.equal(
  primaryIdentityMatch("Fohenagh", "player", "player:tim-sweeney-fohenagh", "Tim Sweeney", {
    club: "club:fohenagh-historic",
  }),
  null
);
assert.equal(
  primaryIdentityMatch("Lohan", "player", "player:jason-lohan", "Jason Lohan"),
  "token"
);
assert.equal(
  primaryIdentityMatch("Lohan", "player", "player:john-colohan-meelick", "John Colohan"),
  null
);
assert.equal(
  primaryIdentityMatch("Cathal Mannion", "appearance", "appearance:cathal-mannion-shc-2017", "Cathal Mannion"),
  null
);
assert.equal(
  primaryIdentityMatch("1959", "club", "club:fohenagh-historic", "Fohenagh"),
  null
);

const collapsed = collapseToUniquePlayers([
  {
    id: "appearance:cathal-mannion-shc-2017",
    kind: "appearance",
    title: "Cathal Mannion",
    groupKey: "player:cathal-mannion",
  },
  {
    id: "appearance:cathal-mannion-minor-2011",
    kind: "appearance",
    title: "Cathal Mannion",
    groupKey: "player:cathal-mannion",
  },
  { id: "player:cathal-mannion", kind: "player", title: "Cathal Mannion" },
  {
    id: "article:cathal-clip",
    kind: "article_upload",
    title: "Cathal Mannion cutting",
  },
]);
assert.deepEqual(
  collapsed.map((h) => h.id),
  ["player:cathal-mannion"]
);

console.log("smoke-entity-search: identity contract ok");

async function liveSeedContract() {
  const cathal = await searchPrimaryEntities("Cathal Mannion");
  assert.deepEqual(
    cathal.map((e) => e.id),
    ["player:cathal-mannion"]
  );
  assert.equal(cathal[0].href, "/player/cathal-mannion");
  assert.equal(cathal.filter((e) => e.title === "Cathal Mannion").length, 1);

  const jason = await searchPrimaryEntities("Jason Lohan");
  assert.deepEqual(
    jason.map((e) => e.id),
    ["player:jason-lohan"]
  );

  const fohenagh = await searchPrimaryEntities("Fohenagh");
  assert.deepEqual(
    fohenagh.map((e) => e.id).sort(),
    ["club:ahascragh-fohenagh", "club:fohenagh-historic"]
  );
  assert.ok(fohenagh.every((e) => e.kind === "club"));
  assert.ok(!fohenagh.some((e) => e.kind === "appearance" || e.kind === "article_upload"));

  const lohans = await searchPrimaryEntities("Lohan");
  assert.ok(lohans.length > 1);
  assert.ok(lohans.every((e) => e.kind === "player"));
  assert.ok(lohans.some((e) => e.id === "player:jason-lohan"));

  const empty = await searchPrimaryEntities("xyzzy-no-such-club");
  assert.equal(empty.length, 0);

  const year = await searchPrimaryEntities("1959");
  assert.equal(year.length, 0);

  console.log("smoke-entity-search: live seed contract ok");
}

liveSeedContract().catch((err) => {
  console.error(err);
  process.exit(1);
});
