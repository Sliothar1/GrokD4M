/**
 * Story S2: per-fact verification from resolved sources.
 * Confidence and cutting_cite do not verify a fact.
 * Counts stay 1806 players / 63 uploads.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { demoStats, getAssoc, getEntity } from "../src/lib/data";
import { playerClubChips } from "../src/lib/playerClubs";
import {
  isPlayerIdentityFact,
  playerOnPageFactKeys,
  playerSourceOrder,
} from "../src/lib/entityDisplay";
import { cuttingFactKey, resolveEntitySources } from "../src/lib/sources";
import {
  annotateEntityVerification,
  classifyFact,
  familyConfirmedFactKeys,
  headlineVerificationStatus,
  isOfficialRecordUrl,
  isPrimarySource,
  VERIFICATION_LABEL,
  type FactSourceStatus,
} from "../src/lib/verification";

const triples = JSON.parse(readFileSync("data/seed.json", "utf8")) as Array<{
  row: string;
  col: string;
  val: unknown;
}>;
const uploads = JSON.parse(readFileSync("data/article-uploads.json", "utf8")) as unknown[];
const playerRows = new Set(
  triples.filter((t) => String(t.row).startsWith("player:")).map((t) => t.row)
);
assert.equal(playerRows.size, 1806);
assert.equal(uploads.length, 63);

const wiki = {
  number: 1,
  key: "https://en.wikipedia.org/wiki/Joe_Cooney",
  title: "Joe Cooney",
  href: "https://en.wikipedia.org/wiki/Joe_Cooney",
  publication: "Wikipedia",
};
const wikiOldid = {
  number: 2,
  key: "https://en.wikipedia.org/w/index.php?title=Joe_Cooney&oldid=1370776870",
  title: "Joe Cooney",
  href: "https://en.wikipedia.org/w/index.php?title=Joe_Cooney&oldid=1370776870",
  publication: "Wikipedia",
};
const other = {
  number: 2,
  key: "https://example.com/joe",
  title: "Joe",
  href: "https://example.com/joe",
  publication: "example.com",
};
const png = {
  number: 1,
  key: "article:replay",
  title: "Replay",
  href: "/article/replay",
  publication: "Connacht Tribune",
  date: "19 Sep 1959",
  imagePath: "/uploads/articles/replay.png",
};
const yearPng = {
  ...png,
  date: "2002",
  imagePath: "/uploads/articles/gaa.png",
};
const pdf = {
  number: 1,
  key: "article:clip",
  title: "Clip",
  href: "/article/clip",
  publication: "Connacht Tribune",
  date: "19 Sep 1959",
};

assert.equal(classifyFact([], false), "unverified");
assert.equal(classifyFact([wiki], false), "single-source");
assert.equal(classifyFact([wiki, wikiOldid], false), "single-source");
assert.equal(classifyFact([wiki, other], false), "verified");
assert.equal(classifyFact([png], false), "verified");
assert.equal(classifyFact([yearPng], false), "single-source");
assert.equal(classifyFact([pdf], false), "single-source");
assert.equal(classifyFact([png], true), "confirmed-by-family");
assert.equal(isPrimarySource(png), true);
assert.equal(isPrimarySource(wiki), false);
assert.equal(
  isOfficialRecordUrl("https://www.galwaygaa.ie/history/all-ireland-winning-teams/"),
  true
);
assert.equal(isOfficialRecordUrl("https://www.gaa.ie/news/x"), true);
assert.equal(isOfficialRecordUrl("https://tommylarkins.gaa.ie/roll"), true);
assert.equal(isOfficialRecordUrl("https://notgaa.ie/roll"), false);
assert.equal(isOfficialRecordUrl("https://en.wikipedia.org/wiki/Joe_Cooney"), false);

assert.deepEqual(
  [...familyConfirmedFactKeys({ confirmed_by_family: "note, father" })].sort(),
  ["father", "note"]
);
assert.deepEqual(
  [
    ...familyConfirmedFactKeys({
      note: "Identity Garry-confirmed 4 Oct 2026",
      notable: "No marker here",
    }),
  ],
  ["note"]
);

const ROUTES = [
  "jim-moclair-fohenagh",
  "tim-sweeney-fohenagh",
  "jason-lohan",
  "joe-cooney",
  "seamus-moclair",
];

function countStatuses(statuses: FactSourceStatus[]) {
  return {
    verified: statuses.filter((s) => s === "verified").length,
    single: statuses.filter((s) => s === "single-source").length,
    needs: statuses.filter((s) => s === "unverified").length,
    family: statuses.filter((s) => s === "confirmed-by-family").length,
  };
}

async function main() {
  const stats = await demoStats();
  assert.equal(stats.players, 1806);

  const rows: string[] = [];
  const A = await getAssoc();
  for (const slug of ROUTES) {
    const data = await getEntity(`player:${slug}`);
    assert.ok(data, slug);
    const clubs = playerClubChips(data.id, data.attrs, data.related, A);
    const cuttings = data.related
      .filter((r) => r.kind === "article_upload")
      .map((cutting) => ({
        id: cutting.id,
        title: cutting.title,
        href: cutting.href,
        citeChip: cutting.citeChip,
        imagePath: cutting.imagePath,
      }));
    const shown = playerOnPageFactKeys(data.attrs, clubs.length > 0);
    const index = annotateEntityVerification(
      resolveEntitySources({
        entityId: data.id,
        attrs: data.attrs,
        cuttings,
        order: playerSourceOrder(shown),
      }),
      data.attrs
    );
    const profile = headlineVerificationStatus(index.facts, isPlayerIdentityFact);
    const counts = countStatuses(
      index.facts.map((fact) => fact.status ?? "unverified")
    );
    const byKey = Object.fromEntries(
      index.facts.map((fact) => [fact.factKey, fact.status])
    );
    rows.push(
      `${slug}\tprofile=${VERIFICATION_LABEL[profile]}\tV=${counts.verified}\tS=${counts.single}\tN=${counts.needs}\tF=${counts.family}`
    );

    if (slug === "joe-cooney") {
      assert.equal(data.attrs.confidence, "high");
      assert.equal(byKey.all_ireland_medals, "unverified");
      assert.equal(byKey.all_stars, "single-source");
      assert.equal(byKey.notable, "unverified");
      assert.equal(byKey.club, "unverified");
      assert.equal(byKey.position, "unverified");
      assert.equal(profile, "unverified");
      assert.equal(index.markers.all_ireland_medals?.length ?? 0, 0);
      assert.deepEqual(index.markers.all_stars, [1]);
    }
    if (slug === "jim-moclair-fohenagh") {
      assert.equal(profile, "verified");
      assert.equal(
        byKey[cuttingFactKey("art-ina-ct-1959-09-19-fohenagh-castlegar-replay")],
        "verified"
      );
      assert.equal(byKey[cuttingFactKey("art-fohenagh-clip4")], "single-source");
      assert.equal(byKey.notable, "unverified");
      assert.equal(byKey.club, "unverified");
    }
  }

  for (const id of [
    "player:alan-moclair-ahascragh-fohenagh",
    "player:paddy-lohan-fohenagh",
    "player:patrick-sweeney-fohenagh",
  ]) {
    const data = await getEntity(id);
    assert.ok(data, id);
    const index = annotateEntityVerification(
      resolveEntitySources({
        entityId: id,
        attrs: data.attrs,
        cuttings: [],
        order: [{ fact: "note" }, { fact: "notable" }],
      }),
      data.attrs
    );
    assert.equal(
      index.facts.find((fact) => fact.factKey === "note")?.status,
      "confirmed-by-family",
      id
    );
  }

  console.log(rows.join("\n"));
  console.log("smoke-verification: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
