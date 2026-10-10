/**
 * Cuttings stay linked for every player tag, including index >= 12.
 * Membership is getLinkedArticleSummaries (same path as the player page).
 * Player count is the seed's player rows: >0, no duplicate ids, and the
 * live catalog matches that set.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getLinkedArticleSummaries } from "../src/lib/articles";
import { demoStats } from "../src/lib/data";

/** Unique `type=player` rows in seed.json. */
function seedPlayerIds(): string[] {
  const triples = JSON.parse(readFileSync("data/seed.json", "utf8")) as Array<{
    row: string;
    col: string;
    val: unknown;
  }>;
  const ids = triples
    .filter((t) => t.col === "type" && t.val === "player")
    .map((t) => String(t.row));
  assert.ok(ids.length > 0, "seed has no players");
  assert.equal(new Set(ids).size, ids.length, "duplicate player rows in seed");
  return ids;
}

const CASES: { articleId: string; playerIds: string[] }[] = [
  {
    articleId: "art-ina-ct-1999-09-10-fohenagh-1959-60-champs-honoured",
    playerIds: ["player:tim-killalea", "player:frank-madden"],
  },
  {
    articleId: "art-ina-ct-1981-11-20-ahascragh-junior-final",
    playerIds: ["player:joe-burke-ahascragh", "player:dermott-murphy-ahascragh"],
  },
];

function includesArticle(
  summaries: { id: string; href: string }[],
  articleId: string
): boolean {
  const summaryId = `article:${articleId}`;
  return summaries.some(
    (s) => s.id === summaryId || s.href === `/article/${articleId}`
  );
}

async function main() {
  for (const c of CASES) {
    for (const playerId of c.playerIds) {
      const summaries = await getLinkedArticleSummaries(playerId);
      assert.ok(
        includesArticle(summaries, c.articleId),
        `${playerId} missing ${c.articleId}`
      );
    }
  }

  const control = await getLinkedArticleSummaries("player:tom-moylette-fohenagh");
  assert.ok(
    includesArticle(
      control,
      "art-ina-ct-1999-09-10-fohenagh-1959-60-champs-honoured"
    ),
    "control player:tom-moylette-fohenagh missing the 1999 cutting"
  );

  const players = seedPlayerIds();
  const stats = await demoStats();
  assert.equal(
    stats.players,
    players.length,
    "player count drifted from seed"
  );
  console.log(`smoke-player-tag-membership: ok (players ${stats.players})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
