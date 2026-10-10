# Methodology

How HurlingWiki is built and checked. The method is Scrum. Garry Lohan is the product owner for Fohenagh. The Bainisteoir is the quality check against his spot-checks.

## Sprints

A sprint is a short, dated run with one lane and a push deadline. Sprint 1 (10 Oct 2026) is front end, navigation, and profile-template rendering. The deadline is 14:15 Irish time (13:15 UTC). Preview only: do not merge to the live site without Garry's sign-off.

Each sprint starts from a written list: the standing requirements in `docs/fohenagh-requirements.md`, the continuity-panel review, and anything already queued. Work the highest-impact items first. Push incremental commits so a later failure does not hide earlier work.

A sprint is done when the lane's tick-list is filled (done, partial, or not), the head SHA is recorded, and a preview link is sent. Items that belong to another live site stay out of the commit until Garry signs them off.

## Scrum of scrums

When more than one lane is open (front end, data, another parish site), each lane reports three things: what landed, what is blocked, and what the other lane needs. The report is short. It does not restate the whole backlog. Shared rules — credits, care, and the profile template — are decided once and written here or in `docs/DESIGN_GUIDELINES.md`, so the next lane does not invent a second version.

## Retro

Every sprint ends with a three-line retro:

1. What went well.
2. What did not.
3. One action item for the next sprint.

The action item is specific (a file, a check, or a page), and it is carried into the next sprint's list. A retro with no action item does not count.

## Bainisteoir QC

The Bainisteoir checks the preview against Garry's spot-checks before anyone calls the sprint done. The checks are the ones he has already named, not a new taste test:

- The fairytale feature leads the club page.
- Notable games are one dropdown, including the 1942 Panzer Divisions game, with no long list underneath.
- The turf-lorry story and the word "class" stay as he locked them.
- A player page is a short vignette with numbered citations, not a run of clippings.
- Garry's name, Scholar, and LinkedIn appear only on About and the landing page, and never as a source.
- The footer keeps the Grok Bot credit (with the 42 easter egg) and the D4M / MIT Lincoln Laboratory credit.
- Printed facts only. No oral punchline, no naming of who was injured or who struck whom, no death details, no internal notes.
- Short name slugs resolve (`/player/alan-moclair` and the other common ones).
- Text on the navy and paper colours meets WCAG AA.

A spot-check that fails is a sprint item, not a footnote. Record it on the tick-list as partial or not, with the page it failed on.
