/**
 * Every player slug that has been on main answers 200 or 308.
 * Unresolvable names are listed. They are not guessed.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  catalogsMatch,
  collectHistoricalCatalog,
  type HistoricalCatalog,
} from "./collect-historical-player-slugs";
import { CANONICAL_PLAYER_SLUG } from "../src/lib/playerSlug";
import {
  getPlayerRedirectIndex,
  historicalSeedCommits,
  historicalSlugRecords,
  resolvePlayerSlug,
  type PlayerSlugResolution,
} from "../src/lib/playerRedirects";

function loadCatalog(): HistoricalCatalog {
  return JSON.parse(readFileSync("data/historical-player-slugs.json", "utf8")) as HistoricalCatalog;
}

function repoPlayerLinks(): string[] {
  const text = [
    readFileSync("next.config.ts", "utf8"),
    readFileSync("src/lib/playerSlug.ts", "utf8"),
  ].join("\n");
  return [...text.matchAll(/\/player\/([a-z0-9]+(?:-[a-z0-9]+)+)/g)].map((match) => match[1]);
}

async function main() {
  const committed = loadCatalog();
  const live = collectHistoricalCatalog();
  if (live && live.seedCommits >= committed.seedCommits) {
    assert.equal(
      catalogsMatch(live, { ...committed, seedCommits: live.seedCommits }),
      true,
      "data/historical-player-slugs.json is behind git history. Run npx tsx scripts/collect-historical-player-slugs.ts"
    );
    assert.equal(committed.seedCommits, historicalSeedCommits());
  } else {
    console.log(
      `player-urls: git seed history is shallow (${live?.seedCommits ?? 0} commits); using the committed catalog (${committed.seedCommits})`
    );
  }

  const index = await getPlayerRedirectIndex();
  const slugs = new Set<string>(index.players);
  for (const record of historicalSlugRecords()) slugs.add(record.slug);
  for (const slug of Object.keys(CANONICAL_PLAYER_SLUG)) slugs.add(slug);
  for (const slug of repoPlayerLinks()) slugs.add(slug);

  let served = 0;
  let redirected = 0;
  let unresolved = 0;
  const unresolvedSlugs: string[] = [];
  const extraReport: string[] = [];
  const extras = new Set(historicalSlugRecords().map((record) => record.slug));

  for (const slug of [...slugs].sort()) {
    const decision = resolvePlayerSlug(slug, index);
    if (decision.status === 200) served += 1;
    else if (decision.status === 308) redirected += 1;
    else {
      unresolved += 1;
      unresolvedSlugs.push(slug);
    }
    if (decision.status === 308) {
      const landed = resolvePlayerSlug(decision.target, index);
      assert.equal(landed.status, 200, `${slug} → ${decision.target} does not serve`);
    }
    if (extras.has(slug)) extraReport.push(formatDecision(decision));
    if (index.players.has(slug)) {
      assert.notEqual(decision.status, 404, slug);
    }
  }

  assert.equal(served + redirected + unresolved, slugs.size);
  assert.deepEqual(resolvePlayerSlug("cathal-lohan", index), {
    status: 308,
    slug: "cathal-lohan",
    target: "cathal-lohan-fohenagh",
  });
  assert.equal(resolvePlayerSlug("cathal-lohan-fohenagh", index).status, 200);

  const redirects = readFileSync("next.config.ts", "utf8");
  assert.doesNotMatch(redirects, /permanent:\s*false/);
  for (const match of redirects.matchAll(
    /source:\s*"\/player\/([^"]+)",\s*destination:\s*"\/player\/([^"]+)"/g
  )) {
    const decision = resolvePlayerSlug(match[1], index);
    assert.equal(decision.status, 308, match[1]);
    if (decision.status === 308) assert.equal(decision.target, match[2], match[1]);
  }

  console.log(`player-urls: served=${served} redirected=${redirected} unresolved=${unresolved}`);
  if (unresolvedSlugs.length) {
    console.log("unresolved:");
    for (const slug of unresolvedSlugs) {
      const names = historicalSlugRecords().find((record) => record.slug === slug)?.names ?? [];
      console.log(`  ${slug}${names.length ? ` (${names.join("; ")})` : ""}`);
    }
  }
  console.log("historical extras:");
  for (const line of extraReport) console.log(`  ${line}`);
  console.log("smoke-player-urls: ok");
}

function formatDecision(decision: PlayerSlugResolution): string {
  if (decision.status === 308) return `${decision.slug} 308 → ${decision.target}`;
  if (decision.status === 200) return `${decision.slug} 200`;
  return `${decision.slug} unresolved`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
