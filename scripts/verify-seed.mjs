import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const seedPath = new URL("../data/seed.json", import.meta.url);
const bytes = await readFile(seedPath);
const seed = JSON.parse(bytes.toString("utf8"));

if (!Array.isArray(seed) || seed.length === 0) {
  throw new Error("data/seed.json must contain a non-empty JSON array");
}

for (const [index, triple] of seed.entries()) {
  if (!triple || typeof triple !== "object") {
    throw new Error(`Seed item ${index} is not an object`);
  }
  for (const key of ["row", "col", "val"]) {
    if (!(key in triple)) throw new Error(`Seed item ${index} has no ${key}`);
  }
  if (typeof triple.row !== "string" || typeof triple.col !== "string") {
    throw new Error(`Seed item ${index} has a non-string row or column`);
  }
}

const digest = createHash("sha256").update(bytes).digest("hex");
console.log(`seed triples=${seed.length} bytes=${bytes.length} sha256=${digest}`);
