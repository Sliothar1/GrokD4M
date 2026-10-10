/**
 * Public player pages: one template, no pipeline text, no verification badge.
 * Hidden verification is computed (clipping linked, or Garry confirmed). It is
 * not written into the seed and not rendered.
 */
import assert from "node:assert/strict";
import { getAssoc } from "../src/lib/data";
import {
  FOHENAGH_UNDERAGE_SCHOOLS,
  createPlayerProfileContext,
  profileForPlayer,
  publicProfileText,
} from "../src/lib/playerProfile";
import { firstBannedPublicHit, sanitizePublicText } from "../src/lib/publicText";

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

  for (const id of A.entitiesOfType("player")) {
    const attrs = A.entityAttrs(id);
    const profile = profileForPlayer(ctx, id, attrs);
    const text = publicProfileText(profile);
    const hit = firstBannedPublicHit(text);
    assert.equal(hit, null, `${id} public text hit ${hit}\n${text}`);
    assert.equal(profile.name.length > 0, true, id);
    assert.match(text, /Share a memory/);
    if (!profile.summary || /not been added yet/i.test(profile.summary)) placeholders++;
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
  assert.match(bare.summary ?? "", /The name stays with the people of the club/);
  assert.equal(bare.framing, "Club people who served the club and the community.");
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
  assert.equal(placeholders, 0);
  console.log(`players=${A.entitiesOfType("player").length} placeholders=${placeholders}`);
  console.log("smoke-public-profiles: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
