/**
 * Public player pages: one template, no pipeline text, no verification badge.
 * Hidden verification is computed (clipping linked, or Garry confirmed). It is
 * not written into the seed and not rendered.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getAssoc } from "../src/lib/data";
import { uniquePlayerRedirect } from "../src/lib/playerSlug";
import { auditPlayerProfiles } from "./audit-player-profiles";
import {
  FOHENAGH_UNDERAGE_SCHOOLS,
  createPlayerProfileContext,
  profileForPlayer,
  publicProfileText,
} from "../src/lib/playerProfile";
import { siteCredit } from "../src/config/siteCredit";
import { firstBannedPublicHit, sanitizePublicText } from "../src/lib/publicText";

function isPlainLead(name: string, summary: string): boolean {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const jersey = new RegExp(`^${escaped} wore the .+ jersey\\.(?:\\s+\\S[^.]{0,120}\\.)?$`);
  return jersey.test(summary) && !/\bNamed\b/.test(summary) && !/[()]/.test(summary);
}

function garrySourceLines(name: string, text: string): string[] {
  return text
    .replaceAll(siteCredit.builtBy, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line !== name && /Garry Lohan/i.test(line));
}

const SAMPLE = [
  "j-glynn-fohenagh-camogie",
  "a-glynn-fohenagh-camogie",
  "a-madden-fohenagh-camogie",
  "m-barrett-fohenagh-camogie",
  "m-madden-fohenagh-camogie",
  "p-hopkins-fohenagh-camogie",
  "rita-clinton-fohenagh-camogie",
  "p-clinton-fohenagh-camogie",
  "l-madden-fohenagh-camogie",
  "m-farrell-fohenagh-camogie",
  "m-glynn-fohenagh-camogie",
  "k-naughton-fohenagh-camogie",
  "b-clinton-fohenagh-camogie",
  "joe-canning",
  "joe-cooney",
  "jason-lohan",
  "tim-sweeney-fohenagh",
  "jim-moclair-fohenagh",
  "jimmy-devine-fohenagh",
  "maureen-madden-fohenagh-camogie",
];

async function main() {
  const glynnNote =
    "Named as J. Glynn for Fohenagh (Connacht Tribune · 30 Aug 1947 · p.19 · INA). Camogie player; tagged for the camogie lane.";
  const cleaned = sanitizePublicText(glynnNote);
  assert.match(cleaned, /Named as J\. Glynn for Fohenagh/);
  assert.match(cleaned, /INA/);
  assert.equal(firstBannedPublicHit(cleaned), null);
  assert.doesNotMatch(cleaned, /tagged for|camogie lane/i);

  const A = await getAssoc();
  const ctx = await createPlayerProfileContext();
  const hiddenCtx = await createPlayerProfileContext(false);
  let placeholders = 0;
  let citedLeads = 0;
  let plainLines = 0;

  for (const id of A.entitiesOfType("player")) {
    const attrs = A.entityAttrs(id);
    const profile = profileForPlayer(ctx, id, attrs);
    const text = publicProfileText(profile);
    const hit = firstBannedPublicHit(text);
    assert.equal(hit, null, `${id} public text hit ${hit}\n${text}`);
    assert.equal(profile.name.length > 0, true, id);
    assert.match(text, /Share a memory/);
    const summary = profile.summary?.trim() ?? "";
    if (!summary || /not been added yet/i.test(summary)) placeholders++;
    assert.ok(summary.length > 0, `${id} empty body`);
    const marked = [summary, ...profile.snippets.map((snippet) => snippet.quote ?? "")].join("\n");
    const marks = [...marked.matchAll(/\[(\d+)\]/g)].map((match) => Number(match[1]));
    if (marks.length > 0) {
      assert.equal(profile.references.length, Math.max(...marks), `${id} cite count`);
      for (const n of marks) assert.ok(profile.references[n - 1]?.title, `${id} cite ${n}`);
    }
    if (id === "player:tim-sweeney-fohenagh") {
      assert.ok(
        profile.references.some((ref) => /wikipedia\.org/i.test(ref.href)),
        "Tim's Wikipedia citation opens Wikipedia"
      );
    }
    if (isPlainLead(profile.name, summary)) plainLines++;
    else citedLeads++;
    assert.doesNotMatch(`${profile.headline ?? ""}\n${summary}`, /\bpanels?\b/i, `${id} panel in lead`);
    const lead = summary.split(/(?<=[.!?])\s/)[0] ?? summary;
    assert.doesNotMatch(
      lead,
      /^(?:Turloughmore|Galway GAA Roll of Honour|Connacht Tribune|Tuam Herald)\b[^:\n]{0,80}:/i,
      `${id} lead opens with a source label`
    );
    const garry = garrySourceLines(profile.name, text);
    assert.deepEqual(garry, [], `${id} cites Garry Lohan\n${garry.join("\n")}`);
    assert.equal(
      Object.prototype.hasOwnProperty.call(profile, "verified"),
      true
    );
    assert.doesNotMatch(text, /\bverified\b/i);
  }

  const glynn = profileForPlayer(
    ctx,
    "player:j-glynn-fohenagh-camogie",
    A.entityAttrs("player:j-glynn-fohenagh-camogie")
  );
  const glynnText = publicProfileText(glynn);
  assert.equal(glynn.verified, true);
  assert.equal(glynn.headline, "Wore the Fohenagh jersey");
  assert.equal(glynn.eraLine, "Camogie, 1940s");
  assert.match(glynn.summary ?? "", /Named as J\. Glynn for Fohenagh/);
  assert.doesNotMatch(glynnText, /tagged for|camogie lane|Needs a source|INA slip/i);
  assert.ok(glynn.games.length >= 1);
  assert.equal(
    glynn.games.some((game) => game.href?.includes("/article/")),
    true
  );
  assert.ok((glynnText.match(/Read the original/g) ?? []).length >= 1);
  assert.ok(glynn.teammates.some((mate) => mate.name === "Rita Clinton"));
  assert.match(glynn.credit ?? "", /Courtesy of Irish Newspaper Archives/);
  assert.equal(glynn.schoolsLine, null);

  const clinton = profileForPlayer(
    ctx,
    "player:b-clinton-fohenagh-camogie",
    A.entityAttrs("player:b-clinton-fohenagh-camogie")
  );
  assert.equal(clinton.eraLine, "Camogie, 1940s");
  assert.match(clinton.credit ?? "", /Courtesy of Irish Newspaper Archives/);
  assert.doesNotMatch(publicProfileText(clinton), /tagged for|lane/i);

  const jason = profileForPlayer(ctx, "player:jason-lohan", A.entityAttrs("player:jason-lohan"));
  assert.match(jason.headline ?? "", /All-Ireland/);
  assert.match(jason.summary ?? "", /Killnadeema/);
  assert.doesNotMatch(publicProfileText(jason), /\bVerified\b|kid_chip|in a Co\.$/);

  const glynnHidden = profileForPlayer(
    hiddenCtx,
    "player:j-glynn-fohenagh-camogie",
    A.entityAttrs("player:j-glynn-fohenagh-camogie")
  );
  assert.equal(
    glynnHidden.games.some((game) => game.href?.includes("1947-08-30")),
    false
  );
  assert.doesNotMatch(glynnHidden.credit ?? "", /Irish Newspaper Archives/);
  assert.match(publicProfileText(glynnHidden), /Named as J\. Glynn/);

  const enda = profileForPlayer(ctx, "player:enda-horrigan", {
    type: "player",
    name: "Enda Horrigan",
    club: "club:fohenagh-historic",
    era: "1990s",
    grades: "underage",
    teammates: "player:john-devine",
    photo: "/uploads/players/enda-horrigan.jpg",
    source: "editor",
  });
  const endaText = publicProfileText(enda);
  assert.equal(enda.verified, true);
  assert.equal(enda.headline, "Wore the Fohenagh jersey");
  assert.equal(enda.eraLine, "Underage, 1990s");
  assert.equal(
    enda.summary,
    "Enda Horrigan, Fohenagh, underage squad with John Devine."
  );
  assert.equal(enda.schoolsLine, FOHENAGH_UNDERAGE_SCHOOLS);
  assert.equal(enda.photoUrl, "/uploads/players/enda-horrigan.jpg");
  assert.deepEqual(enda.teammates, [
    { name: "John Devine", href: "/player/john-devine" },
  ]);
  assert.equal(enda.games.length, 0);
  assert.equal(firstBannedPublicHit(endaText), null);
  assert.doesNotMatch(endaText, /unverified|editor|player:/i);
  assert.match(endaText, /John Devine/);
  assert.match(endaText, /Killure and Kilgerrill/);

  const sarah = profileForPlayer(
    ctx,
    "player:sarah-noone-fohenagh",
    A.entityAttrs("player:sarah-noone-fohenagh")
  );
  assert.equal(
    sarah.alsoPlayed.some((club) => club.href === "/club/ahascragh-fohenagh"),
    true
  );
  assert.equal(
    sarah.alsoPlayed.some((club) => club.href === "/team/galway"),
    true
  );
  assert.match(publicProfileText(sarah), /Also played with/);
  assert.doesNotMatch(publicProfileText(sarah), /rising star/i);

  const brendan = profileForPlayer(
    ctx,
    "player:brendan-noone-fohenagh",
    A.entityAttrs("player:brendan-noone-fohenagh")
  );
  const brendanText = publicProfileText(brendan);
  assert.equal(brendan.headline, "Named with the Fohenagh Minor C champions, 1996");
  assert.doesNotMatch(brendan.summary ?? "", /^Named with the Fohenagh Minor C champions, 1996/);
  assert.match(brendan.summary ?? "", /1990 underage team photograph/);
  assert.match(brendan.summary ?? "", /Mountbellew Vocational School All Stars/);
  assert.match(brendan.summary ?? "", /8 December 1995/);
  assert.doesNotMatch(brendanText, /substitut|\bsub\b|\bpanel\b|died|death|passed away|rising star/i);

  const otherClub = profileForPlayer(ctx, "player:pat-example", {
    type: "player",
    name: "Pat Example",
    club: "Portumna",
    era: "2000s",
    grades: "underage",
    source: "editor",
  });
  assert.equal(otherClub.schoolsLine, null);
  assert.equal(otherClub.eraLine, "Underage, 2000s");
  assert.match(otherClub.summary ?? "", /Pat Example, Portumna, underage/);

  const bare = profileForPlayer(ctx, "player:bare-name", {
    type: "player",
    name: "Bare Name",
    club: "Fohenagh",
  });
  assert.equal(bare.verified, false);
  assert.match(bare.summary ?? "", /Bare Name wore the Fohenagh jersey/);
  assert.doesNotMatch(bare.summary ?? "", /The name stays|served the club/i);
  assert.equal(bare.framing, null);
  assert.equal(bare.schoolsLine, null);
  assert.equal(bare.headline, "Wore the Fohenagh jersey");
  assert.doesNotMatch(publicProfileText(bare), /unverified|needs a source|not been added yet/i);

  for (const slug of SAMPLE) {
    const id = `player:${slug}`;
    const attrs = A.entityAttrs(id);
    assert.equal(attrs.type, "player", slug);
    const text = publicProfileText(profileForPlayer(ctx, id, attrs));
    assert.equal(firstBannedPublicHit(text), null, slug);
  }

  console.log(`sample=${SAMPLE.length}`);
  console.log(SAMPLE.join("\n"));
  const thinIds = [
    "conor-geraghty-fohenagh",
    "david-faulkner-fohenagh",
    "john-donelan-fohenagh",
    "damien-obeirne-fohenagh",
    "damien-poland-fohenagh",
    "paul-leonard-fohenagh",
    "cathal-farragher-fohenagh",
  ];
  for (const slug of thinIds) {
    const profile = profileForPlayer(ctx, `player:${slug}`, A.entityAttrs(`player:${slug}`));
    assert.match(profile.summary ?? "", /Pictured with the Fohenagh underage team of 1990 \(A History of Fohenagh\)/, slug);
    assert.doesNotMatch(profile.summary ?? "", /wore the Fohenagh jersey|privacy|team-list-only/i, slug);
  }

  const mick = profileForPlayer(
    ctx,
    "player:mick-moylette-fohenagh",
    A.entityAttrs("player:mick-moylette-fohenagh")
  );
  assert.match(
    mick.summary ?? "",
    /Mick Moylette was one of the replacements who impressed in 1961, when Fohenagh played without nine of their county cup-winning side \(Westmeath Independent, 4 March 1961, p\.5\)\[\d+\]\./
  );
  assert.match(
    mick.summary ?? "",
    /Started for Fohenagh in the 1963 Galway SHC final \(Turloughmore GAA archive\)(?:\[\d+\])?\./
  );
  assert.doesNotMatch(mick.credit ?? "", /Garry Lohan/i);
  assert.match(mick.credit ?? "", /Courtesy of Irish Newspaper Archives/);

  const tim = profileForPlayer(
    ctx,
    "player:tim-sweeney-fohenagh",
    A.entityAttrs("player:tim-sweeney-fohenagh")
  );
  assert.match(tim.summary ?? "", /hurled with Fohenagh and for Galway seniors from 1949–1963/i);
  assert.match(tim.summary ?? "", /team photo/i);
  assert.match(tim.summary ?? "", /He scored 1-4/i);
  assert.match(tim.summary ?? "", /\[\d+\]/);
  assert.match(tim.summary ?? "", /top man in Fohenagh hurling history/);
  assert.match(tim.summary ?? "", /first played for the club in 1945/);
  assert.doesNotMatch(tim.summary ?? "", /\bpanel\b/i);
  assert.doesNotMatch(tim.summary ?? "", /distinct from/i);
  assert.doesNotMatch(tim.summary ?? "", /cavemen|Murray's long drives|Gardaí/);
  const timSentences = (tim.summary ?? "")
    .replace(/\b[A-Z]\.\s+/g, "")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  assert.ok(timSentences.length <= 8, `tim vignette sentences ${timSentences.length}`);
  assert.doesNotMatch(tim.credit ?? "", /Garry Lohan/i);
  assert.match(tim.credit ?? "", /Courtesy of Irish Newspaper Archives/);

  const garryMitchell = profileForPlayer(
    ctx,
    "player:garry-mitchell-fohenagh",
    A.entityAttrs("player:garry-mitchell-fohenagh")
  );
  assert.match(
    garryMitchell.summary ?? "",
    /^Fohenagh Minor C hurling champion, 1996 \(Galway GAA Roll of Honour\)(?:\[\d+\])?\./
  );
  assert.doesNotMatch(garryMitchell.summary ?? "", /\bpanel\b/i);

  const peter = profileForPlayer(
    ctx,
    "player:peter-lally-fohenagh",
    A.entityAttrs("player:peter-lally-fohenagh")
  );
  assert.match(
    peter.summary ?? "",
    /Peter Lally was pictured with the Fohenagh under-16 hurlers who captured the Galway title in 1995 \(Connacht Tribune, 8 December 1995, p\.8\)\[\d+\]\./
  );
  assert.match(
    peter.summary ?? "",
    /Fohenagh Minor C hurling champion, 1996 \(Galway GAA Roll of Honour\)(?:\[\d+\])?\./
  );
  assert.doesNotMatch(peter.summary ?? "", /\bpanel\b/i);

  const alan = profileForPlayer(
    ctx,
    "player:alan-moclair-ahascragh-fohenagh",
    A.entityAttrs("player:alan-moclair-ahascragh-fohenagh")
  );
  assert.match(alan.eraLine ?? "", /1990s/);
  assert.equal(alan.headline, "Wore the Fohenagh jersey");
  assert.equal(
    alan.alsoPlayed.some((club) => club.href === "/club/ahascragh-fohenagh"),
    true
  );
  assert.doesNotMatch(`${alan.headline ?? ""}\n${alan.eraLine ?? ""}`, /Ahascragh-Fohenagh/i);

  const killalea = profileForPlayer(
    ctx,
    "player:pj-killalea-fohenagh",
    A.entityAttrs("player:pj-killalea-fohenagh")
  );
  assert.match(
    killalea.summary ?? "",
    /On the Fohenagh XV for the 1959 Galway SHC final against Castlegar/
  );
  assert.doesNotMatch(killalea.summary ?? "", /distinct from/i);

  for (const id of A.entitiesOfType("player")) {
    const profile = profileForPlayer(ctx, id, A.entityAttrs(id));
    const header = `${profile.headline ?? ""}\n${profile.eraLine ?? ""}`;
    assert.doesNotMatch(header, /Ahascragh[\s.\u2010-\u2015/\-]*Fohenagh/i, id);
    assert.doesNotMatch(publicProfileText(profile), /wore the ahascragh-fohenagh jersey/i, id);
    assert.doesNotMatch(publicProfileText(profile), /distinct from/i, id);
  }

  const ids = A.entitiesOfType("player");
  assert.equal(uniquePlayerRedirect("alan-moclair", ids), "alan-moclair-ahascragh-fohenagh");
  assert.equal(uniquePlayerRedirect("tim-sweeney", ids), "tim-sweeney-fohenagh");
  assert.equal(uniquePlayerRedirect("jimmy-devine", ids), "jimmy-devine-fohenagh");
  assert.equal(uniquePlayerRedirect("brendan-noone", ids), "brendan-noone-fohenagh");
  assert.equal(uniquePlayerRedirect("sarah-noone", ids), "sarah-noone-fohenagh");
  assert.equal(uniquePlayerRedirect("jason-lohan", ids), null);
  assert.equal(A.entityAttrs("player:jason-lohan").type, "player");

  const footer = readFileSync("src/components/SiteFooter.tsx", "utf8");
  const missing = readFileSync("src/app/not-found.tsx", "utf8");
  const about = readFileSync("src/app/about/page.tsx", "utf8");
  const home = readFileSync("src/app/page.tsx", "utf8");
  const family = readFileSync("src/components/PaFamilyNav.tsx", "utf8");
  const searchBox = readFileSync("src/components/SearchBox.tsx", "utf8");
  for (const src of [footer, missing]) {
    assert.doesNotMatch(src, /Garry Lohan|siteCredit\.builtBy|siteCredit\.scholar|siteCredit\.linkedin|scholar\.google|linkedin\.com\/in\/garry/i);
  }
  assert.match(about, /siteCredit\.builtBy/);
  assert.match(about, /siteCredit\.scholar/);
  assert.match(about, /siteCredit\.linkedin/);
  assert.match(home, /siteCredit\.builtBy/);
  assert.match(siteCredit.builtBy, /Garry Lohan/);
  assert.match(home, /What you can do here/);
  assert.match(home, /<PaFamilyNav/);
  assert.match(family, /aria-label="The PA family of sites"/);
  assert.match(family, /PA Marine/);
  assert.match(family, /https:\/\/sliothar1\.github\.io\/PA-Marine-Demo\//);
  assert.match(family, /PA Réalt/);
  assert.match(family, /https:\/\/sliothar1\.github\.io\/pa-realt\//);
  assert.match(searchBox, /Search HurlingWiki/);
  assert.doesNotMatch(searchBox, /Search Galway Wiki/);

  const audit = await auditPlayerProfiles(ctx);
  console.log(
    `audit players=${audit.players} era found=${audit.eraFound} fixed=${audit.eraFixed} remaining=${audit.eraRemaining} jersey found=${audit.jerseyFound} fixed=${audit.jerseyFixed} remaining=${audit.jerseyRemaining}`
  );
  console.log(audit.samples.join("\n"));
  assert.equal(audit.eraRemaining, 0);
  assert.equal(audit.jerseyRemaining, 0);

  assert.equal(citedLeads + plainLines, A.entitiesOfType("player").length);
  assert.equal(placeholders, 0);
  console.log(`players=${A.entitiesOfType("player").length} placeholders=${placeholders}`);
  console.log(`cited-lead=${citedLeads} plain-line=${plainLines}`);
  console.log("smoke-public-profiles: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
