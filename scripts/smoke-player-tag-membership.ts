/**
 * Cuttings stay linked for every player tag, including index >= 12.
 * Membership is getLinkedArticleSummaries (same path as the player page).
 */
import assert from "node:assert/strict";
import { getLinkedArticleSummaries } from "../src/lib/articles";
import { demoStats } from "../src/lib/data";

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

  const stats = await demoStats();
  assert.equal(stats.players, 1806);
  console.log(`smoke-player-tag-membership: ok (players ${stats.players})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
