# Fohenagh pages: standing requirements (Garry, 10 Oct 2026). Never drop any of these.

## Scope
- Anyone born and reared in Fohenagh parish who wore the parish jersey (incl. Fohenagh NS from 1944; Killure/Kilgerrill underage). Pre-2002 club. Post-2002 parish players (e.g. Sarah Noone) get a Fohenagh profile, with later careers shown subtly as "Also played with" + links.
- Hurling, camogie, football, schools (Mountbellew Tech, Holy Rosary, St Cuan's), county call-ups.

## Club landing page
1. The 2021 "Fohenagh's fairytale" feature (Stephen Glennon, Connacht Tribune 29 Jan 2021 pp.82–83, via INA) goes FRONT AND CENTRE at the top, easy to open and read.
2. Directly beneath: a NOTABLE GAMES dropdown ordered by importance (1950s county finals first, then 1940s/1960s, plus the Cup game Garry names), with photos/highlights per game.
3. A PLAYERS dropdown plus a full A–Z list (with decade filter).
4. An in-depth, researched page with story moments: 1959/60 titles, Six for Galway, 1947 camogie, the 1890 Gurteen game, the 1941 Battle of Athenry, Fothannán (village of the thistles), a timeline from 1888 to 2002.
5. Colour: rich blue, a little darker toward navy. No stick-figure/ball icons.

## Player profile
6. A photo slot at the top with a discreet "add a photo" (editor-verified before showing; not obvious).
7. One central narrative: club people who served the club and the community.
8. A professional journalistic write-up summarising ALL archive/clipping content, then references with one "Read the original" link each. No near-empty pages, no "clipping not added yet", no internal tags.
9. Headline = top honour (Galway first); never "sub"/"panel". Warm, never patronising. Brendan Noone: respectful, no death details.
10. Links: "Share a memory or a match you remember" + anonymous correction options. All to Garry's queue; updates weekly.

## Decades
21. A player's decades come only from his own dated mentions: his games, his cuttings, and the sentences about him. List him under every decade from the first of those years to the last. Do not take a year from a namesake, a relative, or the club. Patrick Sweeney is the 1990s and the 2000s. The 1959 beside his father, Tim Sweeney, is not his. `scripts/smoke-profile-lint.ts` fails the build if a decade on the profile sits outside those years.

## Palette
22. The live colours stay as they were on `acb22f2`: light background, existing header. The navy chrome change is not shipping.

## All sites
11. "Built with help from Grok Bot" (x.ai link, Heinlein grok tooltip, 42) + MIT Lincoln Lab D4M credit + "Built by Garry Lohan" (Scholar + LinkedIn). Tasteful easter eggs throughout.
12. Credit every clipping/photo source. INA media removable in one step.

## LOCKED (Garry praised these; never drop or change)
13. The original early footer credit "Built with help from Grok Bot" with the Heinlein grok tooltip and the 42 easter egg, exactly as first shipped (PR #79/#80); it may link to x.ai. Restore anything else Garry praised that was later dropped.
14. Easter eggs throughout, tasteful.

## Platform plan + KPIs
15. Match the PA Marine look and quality standard.
16. One scalable profile template with full create/read/update/delete; simple contributor uploads; a fast one-tap approve/reject editor queue (Garry for Fohenagh).
17. Multi-club: the editor role per club (the club secretary, on a paid plan) plus paid extra archive searches. Design the data model and roles now; NO real payments.
18. Paid extras appear only as discreet placeholders framed as "pay Grok Bot", e.g. "€1 for another archive scan". Plenty stays free.
19. KPIs: upload under 2 minutes; approval in one tap; every page meets the PA Marine standard; new clubs onboard with no code change.

## Sprint (10 Oct)
- Preview to Grok Bot by 11:30; polished before noon. Preview only, no merge without Garry.

## Editor
20. `/editor` is gated by `EDITOR_PASSWORD`. If that variable is unset, the page stays locked. It is `noindex`. The queue approves a memory or rejects an open item in one tap, using the same private store as `scripts/corrections-queue.mjs`. Create, update, and delete for a player, game, or clipping are queued as a proposal. They do not rewrite `data/seed.json` on Vercel; a person applies the proposal in a pull request. HurlingWiki is the benchmark method for Garry's sites.
