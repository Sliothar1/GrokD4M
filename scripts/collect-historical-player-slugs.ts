/**
 * Every player slug that has appeared on main.
 * Seed history is walked commit by commit. Other slug sources are the
 * rest of data/, the site source, docs, and the redirect maps.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const SLUG_BODY = "[a-z0-9]+(?:-[a-z0-9]+)+";
const SLUG = new RegExp(`^${SLUG_BODY}$`);
const TOKEN = new RegExp(`player:(${SLUG_BODY})`, "g");
const PLAYER_URL = new RegExp(`/player/(${SLUG_BODY})`, "g");
const NAME_TRIPLE = new RegExp(
  `"row"\\s*:\\s*"player:(${SLUG_BODY})"\\s*,\\s*"col"\\s*:\\s*"name"\\s*,\\s*"val"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`,
  "g"
);

export type HistoricalCatalog = {
  seedCommits: number;
  slugs: { slug: string; names: string[] }[];
};

function git(args: string[], maxBuffer = 32_000_000): string {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer });
}

function addSlug(slugs: Map<string, Set<string>>, slug: string) {
  const key = slug.trim().toLowerCase();
  if (!SLUG.test(key)) return;
  if (!slugs.has(key)) slugs.set(key, new Set());
}

function addName(slugs: Map<string, Set<string>>, slug: string, raw: string) {
  addSlug(slugs, slug);
  const decoded = JSON.parse(`"${raw}"`) as string;
  const name = decoded.trim();
  if (name) slugs.get(slug.trim().toLowerCase())?.add(name);
}

function harvest(text: string, slugs: Map<string, Set<string>>) {
  for (const match of text.matchAll(TOKEN)) addSlug(slugs, match[1]);
  for (const match of text.matchAll(PLAYER_URL)) addSlug(slugs, match[1]);
  for (const match of text.matchAll(NAME_TRIPLE)) addName(slugs, match[1], match[2]);
}

function currentSeedRows(): Set<string> {
  const rows = new Set<string>();
  const triples = JSON.parse(readFileSync("data/seed.json", "utf8")) as { row?: string }[];
  for (const triple of triples) {
    const row = String(triple.row ?? "");
    if (!row.startsWith("player:")) continue;
    const slug = row.slice("player:".length);
    if (SLUG.test(slug)) rows.add(slug);
  }
  return rows;
}

export function collectHistoricalCatalog(): HistoricalCatalog | null {
  let commits: string[] = [];
  try {
    commits = git(["rev-list", "HEAD", "--", "data/seed.json"])
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return null;
  }
  if (commits.length === 0) return null;

  const slugs = new Map<string, Set<string>>();
  for (const commit of commits) {
    harvest(git(["show", `${commit}:data/seed.json`], 20_000_000), slugs);
  }
  try {
    harvest(
      git(
        [
          "log",
          "-p",
          "-U0",
          "--pretty=format:",
          "HEAD",
          "--",
          "data",
          "src",
          "docs",
          "next.config.ts",
          ":!data/seed.json",
        ],
        64_000_000
      ),
      slugs
    );
  } catch {
    // A shallow checkout can still resolve from the committed catalog.
  }

  const current = currentSeedRows();
  const extras = [...slugs.keys()]
    .filter((slug) => !current.has(slug))
    .sort();
  return {
    seedCommits: commits.length,
    slugs: extras.map((slug) => ({
      slug,
      names: [...(slugs.get(slug) ?? [])].sort((a, b) => a.localeCompare(b)),
    })),
  };
}

export function catalogsMatch(left: HistoricalCatalog, right: HistoricalCatalog): boolean {
  if (left.slugs.length !== right.slugs.length) return false;
  for (let i = 0; i < left.slugs.length; i += 1) {
    const a = left.slugs[i];
    const b = right.slugs[i];
    if (a.slug !== b.slug) return false;
    if (a.names.join("\n") !== b.names.join("\n")) return false;
  }
  return true;
}

function writeCatalog(catalog: HistoricalCatalog) {
  writeFileSync("data/historical-player-slugs.json", `${JSON.stringify(catalog, null, 2)}\n`);
}

if (process.argv[1]?.endsWith("collect-historical-player-slugs.ts")) {
  const catalog = collectHistoricalCatalog();
  if (!catalog) {
    console.error("git history for data/seed.json is not available");
    process.exit(1);
  }
  writeCatalog(catalog);
  console.log(
    `wrote data/historical-player-slugs.json commits=${catalog.seedCommits} extras=${catalog.slugs.length}`
  );
}
