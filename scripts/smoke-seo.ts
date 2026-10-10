import assert from "node:assert/strict";
import type { Metadata } from "next";
import { generateMetadata } from "../src/app/player/[slug]/page";
import { firstBannedPublicHit } from "../src/lib/publicText";
import { playerShareDescription } from "../src/lib/playerShare";
import { SITE_DESCRIPTION, DEFAULT_SITE_URL, sitemapUrl, siteUrl } from "../src/lib/site";
import {
  articleNode,
  jsonLdGraph,
  organizationNode,
  personNode,
  publicProse,
  schemaDate,
  sportsEventNode,
} from "../src/lib/structuredData";

assert.equal(siteUrl(), DEFAULT_SITE_URL);
assert.equal(sitemapUrl(), `${DEFAULT_SITE_URL}/sitemap.xml`);

const org = organizationNode();
assert.equal(org["@type"], "Organization");
assert.equal(org.url, DEFAULT_SITE_URL);
assert.equal(publicProse("He died in 1950. He scored 1-2."), "He scored 1-2.");
assert.equal(publicProse("Internal note: confidence high."), "");

assert.equal(schemaDate("date unknown"), undefined);
assert.equal(schemaDate("circa 1959"), undefined);
assert.equal(schemaDate("c. 1959"), undefined);
assert.equal(schemaDate("15 July 1890"), "1890-07-15");
assert.equal(schemaDate("1959-09-15"), "1959-09-15");
assert.equal(schemaDate("1959"), "1959");

const person = personNode({
  name: "Cathal Lohan",
  path: "/player/cathal-lohan-fohenagh",
  description: "All-Ireland hurling winner at underage with Galway. He died later.",
});
assert.ok(person);
assert.equal(person.description, "All-Ireland hurling winner at underage with Galway.");
assert.equal(JSON.stringify(person).includes("died"), false);
assert.equal(JSON.stringify(person).includes("same_as"), false);

const event = sportsEventNode({
  name: "Fohenagh v Gurteen",
  path: "/match/fohenagh-gurteen-tournament-1890",
  startDate: "date unknown",
  venue: "Athenry",
  description: "A note for the editor only, confidence low.",
});
assert.ok(event);
assert.equal(event.startDate, undefined);
assert.equal(event.description, undefined);
assert.equal((event.location as { name: string }).name, "Athenry");

const article = articleNode({
  headline: "Fifty minutes, no score",
  path: "/story/fohenagh-gurteen-1890",
  date: "1890",
  citation: "A History of Fohenagh (Tony O'Gorman), chapter 17, p.139",
  description: "Passed away before the game. After fifty minutes the score was nothing all.",
});
assert.ok(article);
assert.equal(article.datePublished, "1890");
assert.match(String(article.description), /nothing all/);
assert.equal(JSON.stringify(article).includes("Passed away"), false);

const graph = jsonLdGraph([person, event, null]);
assert.equal((graph["@graph"] as unknown[]).length, 2);

function shareFields(meta: Metadata): [string, string, string] {
  const og = meta.openGraph;
  const tw = meta.twitter;
  const ogDesc = og && "description" in og ? String(og.description ?? "") : "";
  const twDesc = tw && "description" in tw ? String(tw.description ?? "") : "";
  return [String(meta.description ?? ""), ogDesc, twDesc];
}

async function playerShare(slug: string): Promise<[string, string, string]> {
  const meta = await generateMetadata({ params: Promise.resolve({ slug }) });
  const fields = shareFields(meta);
  assert.equal(fields[0], fields[1], slug);
  assert.equal(fields[0], fields[2], slug);
  assert.ok(fields[0].length > 0 && fields[0].length <= 160, slug);
  assert.equal(firstBannedPublicHit(fields[0]), null, slug);
  assert.doesNotMatch(fields[0], /\[\d+\]|Garry Lohan|internal note/i, slug);
  return fields;
}

const clipped = playerShareDescription({
  headline: null,
  summary: `${"Scored from the wing ".repeat(12)}Then the paper named the full forward line.`,
});
assert.ok(clipped.length <= 160);
assert.ok(clipped.startsWith("Scored from the wing"));
assert.doesNotMatch(clipped, /Then the paper/);
assert.equal(clipped, clipped.trim());
assert.equal(
  playerShareDescription({
    headline: "Garry Lohan is the source of this line.",
    summary: "He scored 1-2[4]. The next sentence stays off the card.",
  }),
  "He scored 1-2."
);
assert.equal(
  playerShareDescription({
    headline: "Internal note: confidence high.",
    summary: null,
  }),
  SITE_DESCRIPTION
);

async function main(): Promise<void> {
  const cathal = await playerShare("cathal-lohan-fohenagh");
  assert.equal(cathal[0], "All-Ireland hurling winner at underage with Galway");
  const jason = await playerShare("jason-lohan");
  assert.equal(jason[0], "All-Ireland hurling winner with Galway");

  const thin = await playerShare("conor-geraghty-fohenagh");
  const ownLine = thin[0] !== SITE_DESCRIPTION;
  assert.ok(ownLine || thin[0] === SITE_DESCRIPTION, "thin player share text");
  console.log(`thin share: ${thin[0]}`);
  console.log("smoke-seo ok");
}

main();
