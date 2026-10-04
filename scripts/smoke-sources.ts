/**
 * Story S1: cite markers come only from source_<col> URLs and linked cuttings.
 * Counts stay 1806 players / 63 uploads.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { linkedCuttingFromUpload } from "../src/lib/articles";
import type { ArticleUpload } from "../src/lib/articles";
import {
  cuttingFactKey,
  factKeyForSourceColumn,
  parseCuttingCite,
  resolveEntitySources,
  sourceMarkerLabel,
  type LinkedCuttingSource,
  type SourceOrderSlot,
} from "../src/lib/sources";
import { classifyFact, isPrimarySource } from "../src/lib/verification";

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
const uploads = JSON.parse(readFileSync("data/article-uploads.json", "utf8")) as Array<ArticleUpload & {
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

const canningOrder: SourceOrderSlot[] = [...PLAYER_ORDER, { fact: "notes" }];
const canning = resolveEntitySources({
  entityId: "player:joe-canning",
  attrs: attrsFor("player:joe-canning"),
  cuttings: [],
  order: canningOrder,
});
assert.equal(canning.sources.length, 2, "notes URL and debut URL dedupe to two sources");
assert.equal(canning.markers.notes?.length, 2);
assert.deepEqual(canning.markers.debut, [canning.markers.notes?.[1]]);
assert.deepEqual(canning.markers.club, []);
assert.ok(
  canning.sources.some((source) => source.href.includes("rte.ie")),
  "source_notes is the RTE cutting"
);
assert.ok(
  canning.sources.some((source) => source.href.includes("oldid=1372044432")),
  "source_notes_club and source_debut share the Wikipedia oldid"
);
assert.ok(
  !canning.sources.some((source) => source.href === "https://en.wikipedia.org/wiki/Joe_Canning"),
  "bare source column must not become a citation"
);

const titles = resolveEntitySources({
  entityId: "club:st-thomas",
  attrs: attrsFor("club:st-thomas"),
  cuttings: [],
  order: [{ fact: "county" }, { fact: "county_titles" }, { fact: "division" }],
});
assert.equal(titles.markers.county_titles?.length, 2);
assert.deepEqual(titles.markers.county, []);
assert.equal(titles.markers.division?.length, 1);
assert.ok(
  titles.sources.some((source) => source.href.includes("galwaygaa.ie")),
  "source_county_titles stays on county_titles"
);
assert.ok(
  titles.sources.some((source) =>
    source.href.includes("Galway_Senior_Hurling_Championship")
  ),
  "source_county_titles_wiki attaches to county_titles, not county"
);

const portumna = resolveEntitySources({
  entityId: "club:portumna",
  attrs: attrsFor("club:portumna"),
  cuttings: [],
  order: [{ fact: "division" }, { fact: "note" }],
});
assert.equal(portumna.markers.division?.length, 1);
assert.deepEqual(portumna.markers.note, []);
assert.equal(portumna.sources.length, 1);

assert.equal(
  factKeyForSourceColumn("source_notes_club", ["notes", "club"]),
  "notes"
);
assert.equal(
  factKeyForSourceColumn("source_notes_club", ["notes", "notes_club"]),
  "notes_club"
);
assert.equal(
  factKeyForSourceColumn("source_county_titles_wiki", ["county", "county_titles"]),
  "county_titles"
);
assert.equal(factKeyForSourceColumn("source_wiki", ["name", "grounds"]), null);
assert.equal(factKeyForSourceColumn("source", ["name"]), null);

const prefixed = resolveEntitySources({
  entityId: "club:synthetic-prefix",
  attrs: {
    notes: "A note",
    notes_club: "A club note",
    source_notes: "https://example.com/notes",
    source_notes_club: "https://example.com/notes-club",
    source_wiki: "https://en.wikipedia.org/wiki/Example",
    source: "https://example.com/ignored",
  },
  cuttings: [],
  order: [{ fact: "notes" }, { fact: "notes_club" }, { fact: "name" }],
});
assert.deepEqual(
  prefixed.markers.notes?.map((n) => prefixed.sources.find((s) => s.number === n)?.href),
  ["https://example.com/notes"]
);
assert.deepEqual(
  prefixed.markers.notes_club?.map(
    (n) => prefixed.sources.find((s) => s.number === n)?.href
  ),
  ["https://example.com/notes-club"]
);
assert.equal(prefixed.sources.length, 2);

const duplicate = resolveEntitySources({
  entityId: "player:synthetic-dup",
  attrs: {
    notes: "Same page twice",
    source_notes: "https://en.wikipedia.org/wiki/Joe_Canning",
    source_notes_club: "https://en.wikipedia.org/wiki/Joe_Canning",
  },
  cuttings: [],
  order: [{ fact: "notes" }],
});
assert.equal(duplicate.sources.length, 1);
assert.deepEqual(duplicate.markers.notes, [1]);

const historic = resolveEntitySources({
  entityId: "club:ahascragh-historic",
  attrs: attrsFor("club:ahascragh-historic"),
  cuttings: [],
  order: [{ fact: "name" }],
});
assert.equal(
  historic.sources.length,
  0,
  "source_wiki, source_grounds, and source_club_history stay unattached"
);

const datedUpload = uploads.find(
  (upload) => upload.id === "art-ct-fohenagh-ahascragh-sadie-kilcommons"
);
const yearUpload = uploads.find((upload) => upload.id === "art-fohenagh-clip4");
assert.ok(datedUpload && yearUpload);
const datedCutting = linkedCuttingFromUpload(datedUpload);
const yearCutting = linkedCuttingFromUpload(yearUpload);
const uploadCatalog: LinkedCuttingSource[] = [datedCutting, yearCutting];

const citedById = resolveEntitySources({
  entityId: "player:upload-id-fixture",
  attrs: {
    notable: "Named in the cutting.",
    club: "club:example",
    debut: "1998",
    source_notable: `${datedUpload.id}, ${datedUpload.id}`,
    source_club: "art-not-a-real-upload",
    source_debut: "https://en.wikipedia.org/wiki/Hurling",
  },
  cuttings: [datedCutting],
  uploads: uploadCatalog,
  order: [
    { fact: "notable" },
    { fact: "club" },
    { fact: "debut" },
    { cuttings: true },
  ],
});
assert.equal(
  citedById.sources.length,
  2,
  "the upload id dedupes with the playerTags cutting; the URL is separate"
);
assert.deepEqual(citedById.markers.notable, [1]);
assert.deepEqual(citedById.markers.club, []);
assert.deepEqual(citedById.markers.debut, [2]);
assert.deepEqual(citedById.markers[cuttingFactKey(datedUpload.id)], [1]);
assert.equal(citedById.sources[0].href, `/article/${datedUpload.id}`);
assert.ok(citedById.sources[0].imagePath?.endsWith(".png"));
assert.equal(isPrimarySource(citedById.sources[0]), true);
assert.equal(
  classifyFact(
    citedById.facts.find((fact) => fact.factKey === "notable")?.sources ?? []
  ),
  "verified"
);
assert.equal(
  classifyFact(
    citedById.facts.find((fact) => fact.factKey === "debut")?.sources ?? []
  ),
  "single-source"
);
assert.ok(
  !citedById.sources.some((source) => source.href.includes("art-not-a-real-upload"))
);

const unknownId = resolveEntitySources({
  entityId: "player:unknown-art",
  attrs: { notable: "No such cutting.", source_notable: "art-missing-upload" },
  uploads: uploadCatalog,
  order: [{ fact: "notable" }],
});
assert.equal(unknownId.sources.length, 0);
assert.deepEqual(unknownId.markers.notable, []);

const yearOnlyId = resolveEntitySources({
  entityId: "player:year-only-id",
  attrs: { notable: "Year only.", source_notable: yearUpload.id },
  uploads: uploadCatalog,
  order: [{ fact: "notable" }],
});
assert.equal(yearOnlyId.sources.length, 1);
assert.equal(isPrimarySource(yearOnlyId.sources[0]), false);
assert.equal(classifyFact(yearOnlyId.facts[0].sources), "single-source");

const mixedCell = resolveEntitySources({
  entityId: "player:mixed-cell",
  attrs: {
    notable: "Id and URL.",
    source_notable: `${datedUpload.id} https://example.com/second-source`,
  },
  uploads: uploadCatalog,
  order: [{ fact: "notable" }],
});
assert.equal(mixedCell.markers.notable?.length, 2);
assert.equal(classifyFact(mixedCell.facts[0].sources), "verified");

console.log(
  `smoke-sources: ok (players ${playerRows.size}, uploads ${uploads.length}, joe sources ${joe.sources.length}, jim sources ${jim.sources.length}, canning sources ${canning.sources.length})`
);
