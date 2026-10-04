/**
 * Audit columns stay off the public site.
 * An in-memory entity carries `audit_note` with the family marker.
 * Public attrs, search, developer triples, and cites must omit it.
 * Confirmed-by-family status is still derived for the note.
 * Seed counts stay 1806 players / 63 uploads, and the filter drops
 * nothing from the current seed.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AssocArray, type Triple } from "../src/lib/d4m/AssocArray";
import {
  entityAttrsPublic,
  getPrivateAttrs,
  getrowPublic,
  matchSeedEntities,
  publicTriples,
  searchPublic,
} from "../src/lib/data";
import {
  isPlayerIdentityFact,
  playerArchiveNote,
  playerNotableText,
  playerNotesText,
} from "../src/lib/entityDisplay";
import { findStrongPrimaryEntities, primaryIdentityLabels } from "../src/lib/searchRank";
import { resolveEntitySources } from "../src/lib/sources";
import {
  annotateEntityVerification,
  familyConfirmedFactKeys,
  headlineVerificationStatus,
} from "../src/lib/verification";

const SENTINEL = "Garry-confirmed 4 Oct 2026 TESTSENTINEL";
const AUDIT_URL = "https://example.com/audit-secret";
const CLUB_SOURCE = "https://example.com/club-record";
const ID = "player:audit-fixture";

const seed = JSON.parse(readFileSync("data/seed.json", "utf8")) as Triple[];
const uploads = JSON.parse(readFileSync("data/article-uploads.json", "utf8")) as unknown[];
const playerRows = new Set(
  seed.filter((t) => t.row.startsWith("player:")).map((t) => t.row)
);
assert.equal(playerRows.size, 1806);
assert.equal(uploads.length, 63);
assert.equal(publicTriples(seed).length, seed.length);

const fixture: Triple[] = [
  { row: ID, col: "type", val: "player" },
  { row: ID, col: "name", val: "Audit Fixture" },
  { row: ID, col: "note", val: "Public parish note about the fixture." },
  { row: ID, col: "notable", val: "A public highlight." },
  { row: ID, col: "club", val: "club:fohenagh-historic" },
  { row: ID, col: "father", val: "player:tim-sweeney-fohenagh" },
  { row: ID, col: "confirmed_by_family", val: "father" },
  { row: ID, col: "source_club", val: CLUB_SOURCE },
  { row: ID, col: "audit_note", val: SENTINEL },
  { row: ID, col: "source_audit_note", val: AUDIT_URL },
  { row: ID, col: "source_note", val: SENTINEL },
];

const A = new AssocArray(fixture);
const attrs = entityAttrsPublic(A, ID);
const triples = getrowPublic(A, ID);
const privateAttrs = getPrivateAttrs(A, ID);

function dumped(value: unknown): string {
  return JSON.stringify(value);
}

assert.equal(privateAttrs.audit_note, SENTINEL);
assert.equal(dumped(attrs).includes(SENTINEL), false);
assert.equal(dumped(attrs).includes("audit_"), false);
assert.equal(dumped(attrs).includes("Garry"), false);
assert.equal(dumped(attrs).includes(AUDIT_URL), false);
assert.equal(attrs.note, "Public parish note about the fixture.");
assert.equal(attrs.source_club, CLUB_SOURCE);
assert.equal(attrs.confirmed_by_family, "father");

assert.equal(dumped(triples).includes(SENTINEL), false);
assert.equal(dumped(triples).includes("audit_"), false);
assert.equal(dumped(triples).includes(AUDIT_URL), false);
assert.equal(
  triples.some((t) => t.col === "note"),
  true
);

const corpus = publicTriples(A.toTriples())
  .map((t) => `${t.row} ${t.col} ${String(t.val)}`)
  .join("\n");
assert.equal(corpus.includes(SENTINEL), false);
assert.equal(corpus.includes("audit_"), false);
assert.equal(corpus.includes("Garry"), false);
assert.equal(corpus.includes(AUDIT_URL), false);

for (const query of [SENTINEL, "TESTSENTINEL", "Garry-confirmed", "audit_note", "audit-secret"]) {
  assert.deepEqual(searchPublic(A, query).rows, [], query);
  assert.deepEqual(findStrongPrimaryEntities(query, A), [], query);
}
for (const query of [SENTINEL, "TESTSENTINEL", "Garry-confirmed", "audit-secret"]) {
  assert.deepEqual(matchSeedEntities(A, query), [], query);
}
const columnQuery = matchSeedEntities(A, "audit_note");
assert.equal(dumped(columnQuery).includes(SENTINEL), false);
assert.equal(dumped(columnQuery).includes("audit_"), false);

const named = matchSeedEntities(A, "Audit Fixture");
assert.equal(named.length, 1);
assert.equal(named[0]?.id, ID);
assert.equal(dumped(named).includes(SENTINEL), false);
assert.equal(dumped(named).includes("audit_"), false);
assert.equal(dumped(named).includes("Garry"), false);

const primary = findStrongPrimaryEntities("Audit Fixture", A);
assert.deepEqual(
  primary.map((hit) => hit.id),
  [ID]
);
const labels = primaryIdentityLabels("player", ID, "Audit Fixture", attrs);
assert.equal(dumped(labels).includes(SENTINEL), false);
assert.equal(dumped(labels).includes("audit_"), false);

assert.deepEqual(
  [...familyConfirmedFactKeys(attrs, privateAttrs)].sort(),
  ["father", "note"]
);
assert.equal(
  [...familyConfirmedFactKeys({ note: "Public", audit_note: SENTINEL })].includes(
    "audit_note"
  ),
  false
);
assert.deepEqual(
  [...familyConfirmedFactKeys({ note: "Public", audit_note: SENTINEL })],
  ["note"]
);

const rawAttrs = Object.fromEntries(fixture.map((t) => [t.col, t.val]));
const citations = annotateEntityVerification(
  resolveEntitySources({
    entityId: ID,
    attrs: rawAttrs,
    order: [{ fact: "club" }, { fact: "note" }, { fact: "notable" }, { fact: "father" }],
  }),
  attrs,
  privateAttrs
);
assert.equal(
  citations.facts.find((fact) => fact.factKey === "note")?.status,
  "confirmed-by-family"
);
assert.equal(
  citations.facts.find((fact) => fact.factKey === "father")?.status,
  "confirmed-by-family"
);
assert.equal(
  headlineVerificationStatus(citations.facts, isPlayerIdentityFact),
  "confirmed-by-family"
);
const citeDump = dumped(citations);
assert.equal(citeDump.includes(SENTINEL), false);
assert.equal(citeDump.includes("audit_"), false);
assert.equal(citeDump.includes("Garry"), false);
assert.equal(citeDump.includes(AUDIT_URL), false);
assert.equal(citeDump.includes(CLUB_SOURCE), true);

const publicCitations = resolveEntitySources({
  entityId: ID,
  attrs,
  order: [{ fact: "club" }, { fact: "note" }, { fact: "father" }],
});
assert.equal(dumped(publicCitations).includes(SENTINEL), false);
assert.equal(dumped(publicCitations).includes(AUDIT_URL), false);

const note = playerArchiveNote(attrs);
const notable = playerNotableText(attrs);
assert.equal(note, "Public parish note about the fixture.");
assert.equal(playerNotesText(attrs), null);
assert.ok(notable);
assert.equal(`${note} ${notable}`.includes(SENTINEL), false);
assert.equal(`${note} ${notable}`.includes("Garry"), false);

const developerLines = publicTriples(A.getrow(ID)).map(
  (t) => `${t.row} · ${t.col} = ${String(t.val)}`
);
assert.equal(developerLines.some((line) => line.includes("Public parish note")), true);
assert.equal(developerLines.join("\n").includes(SENTINEL), false);
assert.equal(developerLines.join("\n").includes("audit_"), false);
assert.equal(developerLines.join("\n").includes("Garry"), false);
assert.equal(developerLines.join("\n").includes(AUDIT_URL), false);

console.log("smoke-audit-private: ok");
