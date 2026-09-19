/**
 * Club-demo search contract:
 * q=Fohenagh → historic + amalgam club cards first, then Tim Sweeney / parish
 * players, before county All-Ireland panel rows.
 */
import assert from "node:assert/strict";
import {
  compareSearchHits,
  isCountyPanelAppearance,
  resultLooksLikeClubQuery,
  sectionSearchResults,
  type SearchRankContext,
} from "../src/lib/searchRank";

function ctx(partial: Partial<SearchRankContext> = {}): SearchRankContext {
  return {
    query: "Fohenagh",
    normalizedQuery: "fohenagh",
    tokens: ["fohenagh"],
    matchedClubs: new Map([
      ["club:fohenagh-historic", "exact"],
      ["club:ahascragh-fohenagh", "exact"],
    ]),
    clubIntent: true,
    playerClubOf: () => "",
    ...partial,
  };
}

const historic = { id: "club:fohenagh-historic", kind: "club", title: "Fohenagh" };
const amalgam = { id: "club:ahascragh-fohenagh", kind: "club", title: "Ahascragh-Fohenagh" };
const tim = { id: "player:tim-sweeney-fohenagh", kind: "player", title: "Tim Sweeney", confidence: "verified", trustLabel: "Verified" };
const cathalPlayer = { id: "player:cathal-mannion", kind: "player", title: "Cathal Mannion", confidence: "high" };
const cathalPanel = {
  id: "appearance:cathal-mannion-shc-2017",
  kind: "appearance",
  title: "Cathal Mannion",
  subtitle: "All-Ireland Senior Hurling Championship · 2017",
  excerpt: "Named on Galway All-Ireland Senior Hurling Champions 2017 panel.",
  confidence: "verified",
};

const attrs: Record<string, Record<string, string>> = {
  "club:fohenagh-historic": { type: "club", name: "Fohenagh" },
  "club:ahascragh-fohenagh": { type: "club", name: "Ahascragh-Fohenagh" },
  "player:tim-sweeney-fohenagh": { type: "player", club: "club:fohenagh-historic", confidence: "verified" },
  "player:cathal-mannion": { type: "player", club: "club:ahascragh-fohenagh", confidence: "high" },
  "appearance:cathal-mannion-shc-2017": {
    type: "appearance",
    player: "player:cathal-mannion",
    club: "club:ahascragh-fohenagh",
    competition: "All-Ireland Senior Hurling Championship",
    excerpt: "Named on Galway All-Ireland Senior Hurling Champions 2017 panel.",
    confidence: "verified",
    tier: "1",
  },
};

assert.equal(isCountyPanelAppearance(cathalPanel, attrs[cathalPanel.id]), true);
assert.equal(resultLooksLikeClubQuery("Fohenagh", [historic, cathalPanel]), true);

const rankCtx = ctx();
const ordered = [cathalPanel, cathalPlayer, historic, amalgam, tim].sort((a, b) =>
  compareSearchHits(a, b, rankCtx, (id) => attrs[id] ?? {})
);
assert.deepEqual(
  ordered.map((h) => h.id),
  [
    "club:fohenagh-historic",
    "club:ahascragh-fohenagh",
    "player:tim-sweeney-fohenagh",
    "player:cathal-mannion",
    "appearance:cathal-mannion-shc-2017",
  ]
);

const sections = sectionSearchResults("Fohenagh", ordered);
assert.deepEqual(
  sections.map((s) => s.title),
  ["Clubs", "Players", "Panels"]
);
assert.equal(sections[0].items[0].id, "club:fohenagh-historic");
assert.equal(sections[1].items[0].id, "player:tim-sweeney-fohenagh");
assert.equal(sections[2].items[0].kind, "appearance");

console.log("smoke-club-search: ranking contract ok");
