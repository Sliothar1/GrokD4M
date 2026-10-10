# Design guidelines

HurlingWiki follows the PA Marine benchmark: a light cool page, deep navy for structure, and no decoration that does not carry a fact. These rules apply to every public page.

## Palette

The page is cool paper, not cream. Body background is `#f4f6fb`. Fohenagh structure (header bar, links, borders, the poster band) uses navy `#1c3a8f`, with `#142a68` where a control needs a darker navy. Ink is `#1a1215`. Small secondary lines use `#3a4560`, which is at least 7:1 on the paper.

Do not return to the cream ground (`#F7F1E8`). Do not paint the whole page navy: body text stays dark on the light ground so it meets WCAG AA. Gold `#f6e27a` is a small accent only, and gold text uses `#8a6d12` when it has to be read. Run `scripts/audit-contrast.ts` when a colour changes.

## Profile template

Profiles are journalistic and free-flowing. Make every player sound good. The words stay inside cited facts: a paper, a book page, or a roll of honour. Do not invent a compliment, a motive, or a result.

The benchmark is the earlier praised write-ups, still in git history:

- Jason Lohan (`154cb59`): the lead is the honour, in a sentence a reader can say aloud. "Undefeated as captain: two cups lifted, two from two." The cuttings follow as part of that sentence, not as a list.
- Phillip Lohan, public name on `player:philip-lohan` (`154cb59`): "Captain of the Fohenagh side that won the Galway Minor C hurling final…" One fact, then the score, the ground, and the paper.
- Tim Sweeney: the same shape for a longer career. Prose, not a run of clipping titles. Each fact keeps its source.

Every player with a record gets that shape:

1. Photo slot. If there is no verified photo, a quiet "Add a photo". No grey caption and no nostalgic tagline.
2. Headline is the top honour (Galway before club). Never "sub" or "panel".
3. A vignette in flowing prose. Each fact carries a numbered marker, as in `captain in 1996[1]`.
4. The marker opens the clipping or the article page when we hold it. The same numbers appear in the reference list, each with one link to the original.
5. Up to two clipping snippets under the vignette, then the reference list.
6. Played-with links, and "Also played with" only for a later club. Parish scope is people born and reared in Fohenagh who wore the parish jersey.

A thin record stays short. It does not borrow another player's sentences, and it does not invent a line to fill the template. Short can still sound like a person, not a label.

## Tone

On a player page, write the way those three read: a person in a parish, told in order, with the good of the printed record left in. No fairytale language on a player page (the 2021 fairytale feature is the club-page lead, and it stays there). No "the good old days", no elegy, and no joke that is not in the printed source.

## Credits

- Garry Lohan's name, Google Scholar, and LinkedIn appear on the About page and on one line of the landing page. Nowhere else: not the footer, not a player page, not a match page, not the 404.
- Garry is never named as a source. A fact that reached us through a note is published only when a printed source carries it, and the citation is that printed source.
- The footer on every page carries two credits: "Built with help from Grok Bot" (the Heinlein grok tooltip and the 42 easter egg) and the D4M / MIT Lincoln Laboratory credit. One footer per page.
- Clippings and photographs are credited to the Irish Newspaper Archive, the paper, or the book, on the article and in the reference list. Book text is credited to *A History of Fohenagh* (Tony O'Gorman) with the page.

## Care

- Printed facts only. Oral notes decide which story to look up. They are not copied onto the page.
- A profile covers playing years and facts only. Nothing about stopping, retiring, leaving, emigrating (why or where), injury, illness, death, or personal life.
- A player's decades come only from his own dated mentions: his games, his cuttings, and the sentences about him. List him under every decade from the first of those years to the last. Do not take a year from a namesake, a relative, or the club. Patrick Sweeney is the 1990s and 2000s. The 1959 beside his father's name is not his. Count the year the game happened. A retrospective counts for the year it depicts, not the day the paper printed it. Tim Sweeney is the 1940s through the 1960s. The 2005 Tuam Herald photo of the 1955 team does not put him in the 2000s.
- Where a cited clipping exists, show it, with the reference. Where none exists, one dignified line about the player's time in the jersey. Top-newspaper standard: no elegy, no "Remembered" note.
- The build lint fails if public profile text matches, case-insensitive and word-aware: emigrat, America, retired, injur, died, death, "the late ", RIP, accident, illness. The same lint also fails on funeral and "passed away". Word-aware means a late goal, "the late 1950s", and injury time are playing phrases and stay. "the late " still fails when it introduces a person.
- A Remembered note that touches any of those subjects is removed. The cited playing fact beside it stays.
- Do not name who was injured, or who struck whom.
- Do not print death details, and do not open a deceased player's page with "substitute".
- Do not print internal notes, pipeline tags, verification chips, or "clipping not added yet".
- "Ahascragh-Fohenagh" is allowed only as a quiet "also played with" link, never in a header.
- The locked lines stay: the turf-lorry story, and the word "class" where Garry locked it.
