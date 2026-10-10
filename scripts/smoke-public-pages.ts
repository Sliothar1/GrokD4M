/**
 * Public pages must not show seed or editor notes.
 * Match pages also must not show a verification chip.
 */
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { articleToSummary, readArticleUploads } from "../src/lib/articles";
import { getAssoc, searchWiki, summarizeEntity } from "../src/lib/data";
import { isDisplayableVal, isHiddenFactKey, MATCH_FACT_KEYS } from "../src/lib/entityDisplay";
import {
  firstBannedPublicHit,
  publicCuttingLabel,
  publicMatchBlurb,
  sanitizePublicText,
} from "../src/lib/publicText";

const EDITOR =
  /cite chips|historic predecessor title|readkong|score unchanged|INA catalog|catalog retrospective|Pay Grok Bot|team panel|for developers|Awaiting Archivist/i;

function assertClean(label: string, text: string) {
  const hit = firstBannedPublicHit(text);
  assert.equal(hit, null, `${label} hit ${hit}\n${text.slice(0, 280)}`);
  assert.doesNotMatch(text, EDITOR, label);
}

function readSrc(path: string): string {
  return readFileSync(path, "utf8");
}

async function main() {
  const matchView = readSrc("src/components/match/MatchView.tsx");
  assert.doesNotMatch(matchView, /TrustChip|Needs check|DeveloperTriples|Pay Grok Bot/);
  assert.match(matchView, /publicMatchBlurb/);

  const playerView = readSrc("src/components/player/PlayerView.tsx");
  const parish = readSrc("src/components/fohenagh/FohenaghParishStory.tsx");
  const entityView = readSrc("src/components/EntityView.tsx");
  assert.doesNotMatch(playerView, /Pay Grok Bot|GrokBotExtra/);
  assert.doesNotMatch(parish, /Pay Grok Bot|GrokBotExtra/);
  assert.doesNotMatch(entityView, /DeveloperTriples|Pay Grok Bot/);
  assert.match(readSrc("src/components/fohenagh/FohenaghPlayerIndex.tsx"), /Also played with/);
  assert.match(readSrc("src/components/club/ClubRoster.tsx"), /Also played with/);
  assert.doesNotMatch(readSrc("src/components/club/ClubRoster.tsx"), /· also /);
  assert.doesNotMatch(readSrc("src/app/about/page.tsx"), /Pay Grok Bot|cite chips|Needs check/);

  const A = await getAssoc();
  let matches = 0;
  for (const id of A.entitiesOfType("match")) {
    const attrs = A.entityAttrs(id);
    if (attrs.same_as) continue;
    matches += 1;
    const summary = summarizeEntity(id, A);
    const lines = [summary?.title ?? "", publicMatchBlurb(attrs)];
    for (const key of MATCH_FACT_KEYS) {
      if (!isDisplayableVal(attrs[key])) continue;
      const clean = sanitizePublicText(String(attrs[key]));
      if (clean) lines.push(clean);
    }
    for (const key of Object.keys(attrs)) {
      if (!/^catalog_cite/.test(key) || !isDisplayableVal(attrs[key])) continue;
      const raw = String(attrs[key]);
      const clean = raw.startsWith("http") ? "" : sanitizePublicText(raw);
      if (clean) lines.push(clean);
    }
    const text = lines.filter(Boolean).join("\n");
    assertClean(id, text);
    assert.doesNotMatch(text, /\bNeeds check\b|\bVerified\b|\bUnverified\b/, id);
    if (id === "match:fohenagh-historic-1960-galway-shc-final") {
      assert.match(text, /Fohenagh won Galway in 1960/);
      assert.doesNotMatch(text, /captain stamped|Cite chips|amalgam title/);
    }
  }

  let entities = 0;
  for (const prefix of ["club", "team", "win", "story"]) {
    for (const id of A.entitiesOfType(prefix)) {
      const attrs = A.entityAttrs(id);
      if (attrs.same_as) continue;
      entities += 1;
      const summary = summarizeEntity(id, A);
      const blurb =
        id === "club:fohenagh-historic"
          ? ""
          : sanitizePublicText(
              String(attrs.notable ?? attrs.note ?? attrs.body ?? attrs.summary ?? attrs.excerpt ?? "")
            );
      const lines = [summary?.title ?? "", blurb];
      for (const [key, value] of Object.entries(attrs)) {
        if (typeof value !== "string" || value.startsWith("http")) continue;
        if (isHiddenFactKey(key) || key === "confidence" || key === "type") continue;
        const clean = sanitizePublicText(value);
        if (clean) lines.push(clean);
      }
      assertClean(id, lines.filter(Boolean).join("\n"));
    }
  }

  const uploads = await readArticleUploads();
  let saw1959 = false;
  for (const upload of uploads) {
    const summary = articleToSummary(upload);
    const text = [summary.title, summary.excerpt ?? "", summary.citeChip ?? ""].join("\n");
    assert.doesNotMatch(text, /team panel/i, upload.id);
    if (upload.id === "art-ct-1959-09-19-fohenagh-team-caption") {
      saw1959 = true;
      assert.match(summary.title, /Team photo after Fohenagh's first Galway senior title/);
      assert.match(summary.excerpt ?? "", /Named on the paper/);
      assert.doesNotMatch(summary.citeChip ?? "", /team panel/i);
    }
  }
  assert.equal(saw1959, true);

  for (const query of ["Tim Sweeney", "Fohenagh", "1959"]) {
    for (const hit of await searchWiki(query)) {
      const trust = hit.kind === "match" ? "" : "";
      const text = [hit.title, hit.excerpt ?? "", hit.citeChip ?? "", hit.subtitle ?? "", trust]
        .filter(Boolean)
        .join("\n");
      assert.doesNotMatch(text, /team panel|Pay Grok Bot|cite chips|Needs check/i, `${query} ${hit.id}`);
      if (hit.kind === "match") {
        assert.equal(trust, "");
      }
    }
  }
  const tim = await searchWiki("Tim Sweeney");
  assert.ok(
    tim.some((hit) => /Team photo after Fohenagh's first Galway senior title/.test(hit.title))
  );

  const home = sanitizePublicText(
    publicCuttingLabel("Connacht Tribune 19 Sep 1959 — Fohenagh team panel after first Galway SHC title")
  );
  assert.match(home, /Team photo after Fohenagh's first Galway senior title/);

  console.log(`smoke-public-pages: ok (matches ${matches}, other entities ${entities}, uploads ${uploads.length})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
