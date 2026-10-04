/**
 * Story S1: cite markers come only from source_<col> URLs and linked cuttings.
 * Counts stay 1806 players / 63 uploads.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  cuttingFactKey,
  parseCuttingCite,
  resolveEntitySources,
  sourceMarkerLabel,
  type LinkedCuttingSource,
  type SourceOrderSlot,
} from "../src/lib/sources";

const PLAYER_ORDER: SourceOrderSlot[] = [
  { fact: "club" },
  { fact: "notable" },
  { fact: "note" },
  { cuttings: true },
  { fact: "kid_chip" },
  { fact: "position" },
  { fact: "born" },
  { fact: "debut" },
  { fact: "nickname" },
  { fact: "father" },
  { fact: "also_known_as" },
  { fact: "all_ireland_medals" },
  { fact: "all_stars" },
];

type Triple = { row: string; col: string; val: unknown };

const triples = JSON.parse(readFileSync("data/seed.json", "utf8")) as Triple[];
const uploads = JSON.parse(readFileSync("data/article-uploads.json", "utf8")) as Array<{
  id: string;
  kind?: string;
  caption?: string;
  year?: string;
  citeChip?: string;
  publicUrl?: string;
  path?: string;
  sourceUrl?: string;
  playerTags?: string[];
}>;

const playerRows = new Set(
  triples.filter((t) => String(t.row).startsWith("player:")).map((t) => t.row)
);
assert.equal(playerRows.size, 1806);
assert.equal(uploads.length, 63);

function attrsFor(id: string): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  for (const triple of triples) {
    if (triple.row === id) attrs[triple.col] = triple.val;
  }
  return attrs;
}

function cuttingsFor(playerId: string): LinkedCuttingSource[] {
  return uploads
    .filter((upload) => (upload.playerTags ?? []).includes(playerId))
    .map((upload) => ({
      id: upload.id,
      title: upload.caption ?? upload.id,
      href: `/article/${upload.id}`,
      citeChip: upload.citeChip,
      year: upload.year,
      imagePath:
        upload.kind === "pdf"
          ? undefined
          : upload.publicUrl || upload.path,
      sourceUrl: upload.sourceUrl,
    }));
}

const tribune = parseCuttingCite(
  "Connacht Tribune · 12 Dec 2003 · p.10 · INA",
  "2003"
);
assert.equal(tribune.publication, "Connacht Tribune");
assert.equal(tribune.date, "12 Dec 2003");

const yearOnly = parseCuttingCite(
  "Connacht Tribune · 1959 Galway SHC final replay",
  "1959"
);
assert.equal(yearOnly.publication, "Connacht Tribune");
assert.equal(yearOnly.date, "1959");

const localPaper = parseCuttingCite("Local paper · Fohenagh beat Maree · 1957");
assert.equal(localPaper.publication, "Local paper");
assert.equal(localPaper.date, "1957");

const gaa = parseCuttingCite("Galway GAA · All-Ireland winning teams · 2002");
assert.equal(gaa.publication, "Galway GAA");
assert.equal(gaa.date, "2002");

const joe = resolveEntitySources({
  entityId: "player:joe-cooney",
  attrs: attrsFor("player:joe-cooney"),
  cuttings: cuttingsFor("player:joe-cooney"),
  order: PLAYER_ORDER,
});
assert.equal(joe.sources.length, 1);
assert.deepEqual(joe.markers.all_stars, [1]);
assert.deepEqual(joe.markers.notable, []);
assert.deepEqual(joe.markers.all_ireland_medals, []);
assert.deepEqual(joe.markers.club, []);
assert.equal(
  joe.sources[0].href,
  "https://en.wikipedia.org/w/index.php?title=Joe_Cooney&oldid=1370776870"
);
assert.equal(joe.sources[0].publication, "Wikipedia");
assert.equal(joe.sources[0].title, "Joe Cooney");
assert.ok(
  !joe.sources.some((source) => source.href === "https://en.wikipedia.org/wiki/Joe_Cooney"),
  "bare source column must not become a citation"
);
assert.equal(
  sourceMarkerLabel(joe.sources[0]),
  "Source 1: Wikipedia Joe Cooney"
);

const whelan = resolveEntitySources({
  entityId: "player:conor-whelan",
  attrs: attrsFor("player:conor-whelan"),
  cuttings: [],
  order: PLAYER_ORDER,
});
assert.equal(whelan.sources.length, 1);
assert.deepEqual(whelan.markers.debut, [1]);
assert.deepEqual(whelan.markers.all_stars, [1]);
assert.deepEqual(whelan.markers.notable, []);
assert.deepEqual(whelan.markers.all_ireland_medals, []);

const ignored = resolveEntitySources({
  entityId: "player:synthetic",
  attrs: {
    notable: "A sentence with no source column.",
    debut: "2008",
    source_debut: "see the paper",
    source: "https://example.com/not-a-fact-source",
    club: "club:example",
  },
  cuttings: [],
  order: PLAYER_ORDER,
});
assert.equal(ignored.sources.length, 0);
assert.deepEqual(ignored.markers.notable, []);
assert.deepEqual(ignored.markers.debut, []);
assert.ok(ignored.facts.some((fact) => fact.factKey === "notable" && fact.sources.length === 0));

const jimCuttings = cuttingsFor("player:jim-moclair-fohenagh");
const jim = resolveEntitySources({
  entityId: "player:jim-moclair-fohenagh",
  attrs: attrsFor("player:jim-moclair-fohenagh"),
  cuttings: jimCuttings,
  order: PLAYER_ORDER,
});
assert.equal(jim.sources.length, jimCuttings.length);
assert.deepEqual(jim.markers.notable, []);
assert.deepEqual(jim.markers.club, []);
assert.ok(
  jim.sources.every((source) => source.href.startsWith("/article/")),
  "cutting sources link to the cutting page"
);
assert.equal(
  jim.markers[cuttingFactKey("art-ina-ct-1959-09-19-fohenagh-castlegar-replay")]?.length,
  1
);
const replay = jim.sources.find((source) =>
  source.href.endsWith("art-ina-ct-1959-09-19-fohenagh-castlegar-replay")
);
assert.ok(replay?.imagePath?.endsWith(".png"));
assert.equal(replay?.publication, "Connacht Tribune");
assert.equal(replay?.date, "19 Sep 1959");
assert.equal(sourceMarkerLabel(replay!), "Source " + replay!.number + ": Connacht Tribune 19 Sep 1959");
assert.ok(jim.sources.filter((source) => source.href.includes("clip4")).every((source) => !source.imagePath));

const club = resolveEntitySources({
  entityId: "club:example",
  attrs: {
    name: "Example",
    grounds: "The field",
    source_grounds: "https://example.com/grounds",
    source: "https://example.com/ignored",
  },
  cuttings: [
    {
      id: "art-club-snip",
      title: "Club snip",
      href: "/article/art-club-snip",
      citeChip: "Connacht Tribune · 12 Dec 2003 · p.10 · INA",
      year: "2003",
      imagePath: "/uploads/articles/art-club-snip.png",
    },
  ],
  order: [{ fact: "grounds" }, { cuttings: true }, { fact: "name" }],
});
assert.equal(club.entityId, "club:example");
assert.deepEqual(club.markers.grounds, [1]);
assert.deepEqual(club.markers[cuttingFactKey("art-club-snip")], [2]);
assert.deepEqual(club.markers.name, []);
assert.equal(club.sources[1].imageAlt, "Connacht Tribune cutting, 12 Dec 2003");
assert.equal(
  sourceMarkerLabel(club.sources[1]),
  "Source 2: Connacht Tribune 12 Dec 2003"
);

console.log(
  `smoke-sources: ok (players ${playerRows.size}, uploads ${uploads.length}, joe sources ${joe.sources.length}, jim sources ${jim.sources.length})`
);
