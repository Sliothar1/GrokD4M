# Follow-up

Next sprint, not tonight.

## Roadmap (Garry, 10 Oct)

In priority order.

1. Homepage as an invitation to explore: one big search, People / Matches / Stories routes, and a featured story with a clipping.
2. Search as the killer feature: live suggestions, filters for year, club, competition, and source, spelling and Irish-name variants, phrase and score search, and grouped results.
3. Club page template with completeness labels: complete, in progress, awaiting sources.
4. Standard match record: teams, date, venue, competition, round, score in GAA notation, replays, team sheets where evidenced, and explicit "date unknown" and "circa" labels.
5. Compact source panel per claim, marking documented versus inferred.
6. Player career timelines separating verified appearances from mentions, plus disambiguation.
7. Decades as a visual timeline flagging archive gaps.
8. Mobile and older-reader accessibility: WCAG 2.2 AA, big tap targets, zoomable clippings.
9. Canonical club and player ids with aliases, and linked duplicate match records.
10. Contribution and correction loop with review status and credits.

**NEXT:** search, match and source pages, and knowledge-graph links.

**Product rule:** no live scores. The differentiator is the historical record.

## Profiles with the cuttings up front

Profile pages should show the actual clippings, photos and artefacts up front: a flowing narrative instead of a clipping list, and professional numbered references.

## Profile benchmark

Lock Cathal Lohan's current profile as the benchmark. It is a dense dated run of achievements, each tied to a paper and a date, with about 14 numbered references, and newspaper snips that each have "Open snip". Carry that into the new template with the clippings up front. Remove the stray "Ahascragh-Fohenagh" and "Needs a source" header tags.

# Follow-up (after the 10 Oct 15:20 push)

Must-haves for this push are the Bainisteoir fails except the navy change, the general nav and Find a club landing, Patrick Sweeney's decades, the decades rule and its build check, the Sean Carrick merge from #93, and the shorter Grok credit line. The About credit and the link to `/player/garry-lohan` are in this push. The list below is everything else.

## About

- The About page keeps the D4M / Jeremy Kepner / MIT Lincoln Laboratory section, the triple count, what the site draws on, and what is coming next.
- Still open: a fuller Grok Bot explainer, any extra D4M links Garry names later, and a photo on `/player/garry-lohan`. The photo slot is the usual discreet "add a photo" link. No photograph was added.

## Sitemap

- `src/app/sitemap.ts` is in this push and should serve `/sitemap.xml`.
- Confirm the preview actually returns it, and that the club, player, game, and cutting URLs in it resolve. That check did not fit before the deadline.

## 78 unlinked players

- A–Z and decade browse now list public players who are not only the Fohenagh roll.
- An editor pass over the 78 previously unlinked names is still open. This push did not review them one by one.

## Editor pass

- `/editor` is unchanged. Queued proposals still do not rewrite `data/seed.json` on Vercel.
- No new editor review of clippings, quotes, or roster rows in this push.

## Stories, games, easter eggs

- No new parish stories.
- No new games in the Games menu.
- No new easter eggs. The existing Grok tooltip and the 42 stay.
- The discuss-a-game idea is not built.

## Minor fails not done

- `scripts/smoke-fohenagh-hero.ts` still fails on Oliver Deeley. `player:ollie-deeley` has two `notable` cells. The later one is the long Connacht Tribune paragraph, so the lead no longer starts "Won an All-Ireland hurling medal at under-14 with Galway." Append a last-wins `notable` that keeps that opening sentence and the later printed facts.
- Club-page wording, the Athenry book sentence, Cathal Lohan's canonical slug, citation-only leads, clipping quote numbers, and Brendan Lally's 1950s era were handled in this branch. They were not re-crawled against the new preview before the deadline.
- Tynagh appears once in the Games menu, labelled "1956 Tynagh at Kiltormer". The Cussane game is labelled "Cussane".

## Still to come

- More clubs.
- A custom domain.
- Live search suggestions.
- A "Recently added" section.
