import assert from "node:assert/strict";
import {
  articleNode,
  jsonLdGraph,
  organizationNode,
  personNode,
  publicProse,
  schemaDate,
  sportsEventNode,
} from "../src/lib/structuredData";
import { DEFAULT_SITE_URL, sitemapUrl, siteUrl } from "../src/lib/site";

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

console.log("smoke-seo ok");
