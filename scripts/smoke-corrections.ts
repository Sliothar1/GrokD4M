/**
 * Correction kinds, anonymous submissions, and the public memory shape.
 * Pending memories are not public notes. Names never survive toPublicTerraceNote.
 */
import assert from "node:assert/strict";
import { notificationLine } from "../src/lib/corrections/notify";
import {
  priorityForKind,
  toPublicTerraceNote,
} from "../src/lib/corrections/types";
import { validateSubmission } from "../src/lib/corrections/validate";

const page = "/player/jimmy-devine-fohenagh";

const anon = validateSubmission({
  page,
  requestKind: "fix-detail",
  whatsWrong: "The year on the junior final line is out by one.",
});
assert.equal(anon.ok, true);
if (anon.ok) {
  assert.equal(anon.value.name, undefined);
  assert.equal(anon.value.email, undefined);
  assert.equal(anon.value.priority, "correction");
  assert.equal(anon.value.removalRequest, false);
  assert.equal(anon.value.requestKind, "fix-detail");
}

for (const kind of ["remove-line", "take-down-photo"] as const) {
  const v = validateSubmission({
    page,
    requestKind: kind,
    whatsWrong: "Please take this down. It names the wrong man.",
  });
  assert.equal(v.ok, true);
  if (v.ok) {
    assert.equal(v.value.priority, "removal");
    assert.equal(v.value.removalRequest, true);
    assert.equal(priorityForKind(kind), "removal");
  }
}

const other = validateSubmission({
  page: "/club/fohenagh-historic",
  requestKind: "other",
  whatsWrong: "A small note about the caption under the cutting.",
});
assert.equal(other.ok, true);
if (other.ok) assert.equal(other.value.priority, "correction");

const memory = validateSubmission({
  page,
  requestKind: "memory",
  whatsWrong: "I remember him at midfield on a wet day in Ballygar.",
  name: "Should Stay Private",
  email: "private@example.com",
});
assert.equal(memory.ok, true);
if (memory.ok) {
  assert.equal(memory.value.priority, "memory");
  assert.equal(memory.value.name, "Should Stay Private");
}

const memoryOnClub = validateSubmission({
  page: "/club/fohenagh-historic",
  requestKind: "memory",
  whatsWrong: "This memory is on a club page and should be refused.",
});
assert.equal(memoryOnClub.ok, false);

const legacy = validateSubmission({
  page,
  removalRequest: true,
  whatsWrong: "Old clients still send the removal checkbox.",
});
assert.equal(legacy.ok, true);
if (legacy.ok) {
  assert.equal(legacy.value.requestKind, "remove-line");
  assert.equal(legacy.value.priority, "removal");
}

const leaked = toPublicTerraceNote({
  id: "abc123def456",
  page,
  text: "A line from the terrace.",
  name: "Should Stay Private",
  email: "private@example.com",
  approvedAt: "2026-10-10T00:00:00.000Z",
});
assert.deepEqual(leaked, { id: "abc123def456", text: "A line from the terrace." });
assert.equal(JSON.stringify(leaked).includes("Should Stay Private"), false);
assert.equal(toPublicTerraceNote({ id: "no", text: "too short an id" }), null);

const line = notificationLine({ priority: "memory", page, id: "abc123def456" });
assert.equal(line.includes("Should Stay Private"), false);
assert.equal(line.includes("private@example.com"), false);
assert.match(line, /^New memory request: \/player\/jimmy-devine-fohenagh, id abc123def456$/);

console.log("smoke-corrections: ok");
