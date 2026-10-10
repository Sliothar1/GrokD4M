/**
 * Story S2: per-fact verification from resolved sources.
 * Confidence and cutting_cite do not verify a fact.
 * Player and upload counts come from the data files: >0, unique ids, and
 * the live player catalog matches the seed.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { demoStats, friendlyAttrLabel, getAssoc, getEntity } from "../src/lib/data";
import { clubColumnLabel } from "../src/lib/clubColumns";
import { playerClubChips } from "../src/lib/playerClubs";
import {
  formatDivision,
  isPlayerIdentityFact,
  playerOnPageFactKeys,
  playerSourceOrder,
} from "../src/lib/entityDisplay";
import { cuttingFactKey, resolveEntitySources } from "../src/lib/sources";
import {
  createPlayerProfileContext,
  playerVerifiedHidden,
  profileForPlayer,
  publicProfileText,
} from "../src/lib/playerProfile";
import { firstBannedPublicHit } from "../src/lib/publicText";
import {
  annotateEntityVerification,
  classifyFact,
  familyConfirmedFactKeys,
  headlineVerificationStatus,
  isOfficialRecordUrl,
  isPrimarySource,
  publisherKey,
  registrableDomain,
  type FactSourceStatus,
} from "../src/lib/verification";

const triples = JSON.parse(readFileSync("data/seed.json", "utf8")) as Array<{
  row: string;
  col: string;
  val: unknown;
}>;
const uploads = JSON.parse(readFileSync("data/article-uploads.json", "utf8")) as unknown[];
const playerTypeIds = triples
  .filter((t) => t.col === "type" && t.val === "player")
  .map((t) => String(t.row));
const playerRows = new Set(
  triples.filter((t) => String(t.row).startsWith("player:")).map((t) => t.row)
);
assert.ok(playerTypeIds.length > 0, "seed has no players");
assert.equal(
  new Set(playerTypeIds).size,
  playerTypeIds.length,
  "duplicate player rows in seed"
);
assert.equal(
  playerRows.size,
  playerTypeIds.length,
  "player: rows drifted from type=player"
);

const uploadIds = (uploads as Array<{ id?: string }>).map((upload) => upload.id);
assert.ok(uploadIds.length > 0, "no article uploads");
assert.ok(uploadIds.every((id) => id), "upload missing id");
assert.equal(new Set(uploadIds).size, uploadIds.length, "duplicate upload ids");

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
const yearPdf = {
  ...pdf,
  date: "1957",
  key: "article:clip4",
  href: "/article/clip4",
};
const wikiArticle = {
  number: 3,
  key: "https://en.wikipedia.org/wiki/Joe_Canning",
  title: "Joe Canning",
  href: "https://en.wikipedia.org/wiki/Joe_Canning",
  publication: "Wikipedia",
};
const wikiApex = {
  number: 4,
  key: "https://wikipedia.org/wiki/Hurling",
  title: "Hurling",
  href: "https://wikipedia.org/wiki/Hurling",
  publication: "Wikipedia",
};
const tribuneA = {
  number: 1,
  key: "article:a",
  title: "A",
  href: "/article/a",
  publication: "Connacht Tribune",
  date: "1957",
};
const tribuneB = {
  number: 2,
  key: "article:b",
  title: "B",
  href: "/article/b",
  publication: "Connacht Tribune",
  date: "1959",
};
const herald = {
  number: 2,
  key: "article:c",
  title: "C",
  href: "/article/c",
  publication: "Tuam Herald",
  date: "1959",
};

assert.equal(classifyFact([], false), "unverified");
assert.equal(classifyFact([wiki], false), "single-source");
assert.equal(classifyFact([wiki, wikiOldid], false), "single-source");
assert.equal(classifyFact([wiki, wikiArticle], false), "single-source");
assert.equal(classifyFact([wiki, wikiApex], false), "single-source");
assert.equal(classifyFact([wiki, other], false), "verified");
assert.equal(classifyFact([png], false), "verified");
assert.equal(classifyFact([yearPng], false), "single-source");
assert.equal(classifyFact([pdf], false), "verified");
assert.equal(classifyFact([yearPdf], false), "single-source");
assert.equal(classifyFact([tribuneA, tribuneB], false), "single-source");
assert.equal(classifyFact([tribuneA, herald], false), "verified");
assert.equal(registrableDomain("en.wikipedia.org"), "wikipedia.org");
assert.equal(registrableDomain("www.rte.ie"), "rte.ie");
assert.equal(registrableDomain("news.bbc.co.uk"), "bbc.co.uk");
assert.equal(publisherKey(wiki), publisherKey(wikiApex));
assert.equal(publisherKey(tribuneA), publisherKey(tribuneB));
assert.notEqual(publisherKey(tribuneA), publisherKey(herald));
assert.equal(formatDivision("A", 2023), "Senior A (2023)");
assert.equal(formatDivision("B", "2023"), "Senior B (2023)");
assert.equal(formatDivision("Intermediate", 2025), "Intermediate (2025)");
assert.equal(formatDivision("A"), "Senior A");
assert.equal(formatDivision("A", "season"), "Senior A");
assert.equal(clubColumnLabel("parish"), "Parish");
assert.equal(clubColumnLabel("colours"), "Colours");
assert.equal(clubColumnLabel("county_titles"), "County titles");
assert.equal(clubColumnLabel("division"), "Division");
assert.equal(clubColumnLabel("pihc_2026_status"), "Pihc 2026 status");
assert.equal(friendlyAttrLabel("parish"), "Parish");
assert.equal(friendlyAttrLabel("county_titles"), "County titles");
assert.equal(friendlyAttrLabel("colours"), "Colours");
assert.equal(friendlyAttrLabel("division"), "Division");
assert.equal(classifyFact([png], true), "verified");
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
      note: "Identity confirmed",
      notable: "No marker here",
    }),
  ],
  []
);

const ROUTES = [
  "jim-moclair-fohenagh",
  "tim-sweeney-fohenagh",
  "jason-lohan",
  "joe-cooney",
  "joe-canning",
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
  assert.equal(stats.players, playerRows.size, "player count drifted from seed");

  const rows: string[] = [];
  const A = await getAssoc();
  const profiles = await createPlayerProfileContext();
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
    const hidden = playerVerifiedHidden(data.attrs);
    const publicText = publicProfileText(profileForPlayer(profiles, data.id, data.attrs));
    const banned = firstBannedPublicHit(publicText);
    assert.equal(banned, null, `${slug} public text hit ${banned}`);
    assert.doesNotMatch(publicText, /Needs a source|Single-source|Needs check/);
    rows.push(
      `${slug}\thidden=${hidden ? "yes" : "no"}\tV=${counts.verified}\tS=${counts.single}\tN=${counts.needs}\tF=${counts.family}`
    );

    if (slug === "joe-cooney") {
      assert.equal(data.attrs.confidence, "high");
      assert.equal(hidden, false);
      assert.equal(byKey.all_ireland_medals, "unverified");
      assert.equal(byKey.all_stars, "single-source");
      assert.equal(byKey.notes, "single-source");
      assert.equal(byKey.notable, "unverified");
      assert.equal(byKey.club, "unverified");
      assert.equal(byKey.position, "unverified");
      assert.equal(profile, "unverified");
      assert.equal(index.markers.all_ireland_medals?.length ?? 0, 0);
      assert.deepEqual(index.markers.all_stars, [1]);
      assert.deepEqual(index.markers.notes, [1]);
      assert.equal(index.sources.length, 1);
    }
    if (slug === "joe-canning") {
      assert.equal(byKey.notes, "verified");
      assert.equal(byKey.debut, "single-source");
      assert.equal(byKey.all_ireland_medals, "unverified");
      assert.equal(byKey.club, "unverified");
      assert.equal(profile, "unverified");
      assert.equal(index.markers.notes?.length, 2);
      assert.equal(index.sources.length, 2);
      assert.deepEqual(index.markers.debut, [index.markers.notes?.[1]]);
    }
    if (slug === "jason-lohan" || slug === "tim-sweeney-fohenagh" || slug === "jim-moclair-fohenagh") {
      assert.equal(hidden, true, slug);
    }
    if (slug === "jim-moclair-fohenagh") {
      assert.equal(profile, "verified");
      assert.equal(
        byKey[cuttingFactKey("art-ina-ct-1959-09-19-fohenagh-castlegar-replay")],
        "verified"
      );
      assert.equal(byKey[cuttingFactKey("art-fohenagh-clip4")], "single-source");
      assert.equal(byKey.notable, "single-source");
      assert.equal(byKey.club, "single-source");
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
      "verified",
      id
    );
    for (const v of Object.values(data.attrs)) {
      if (typeof v === "string") {
        assert.ok(!/Garry|Confirmed by family/.test(v), `${id} public text`);
      }
    }
  }

  const portumna = await getEntity("club:portumna");
  assert.ok(portumna);
  assert.equal(
    formatDivision(portumna.attrs.division, portumna.attrs.division_season),
    "Senior A (2023)"
  );
  const ahascragh = await getEntity("club:ahascragh-fohenagh");
  assert.ok(ahascragh);
  assert.equal(
    formatDivision(ahascragh.attrs.division, ahascragh.attrs.division_season),
    "Senior B (2023)"
  );

  console.log(rows.join("\n"));
  console.log("smoke-verification: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
