# HurlingWiki at club scale

A short note for the funding pitch. The live demo is one parish, Fohenagh up to 2002. The same shape should hold a club in every county.

## Data model

Facts live as sparse triples in `data/seed.json` (row, column, value), the D4M associative array. Cuttings live beside that, in `data/article-uploads.json`.

What a national wiki needs, and what the demo already sketches:

- **Club.** One id per jersey that people still talk about. Fohenagh before 2002 is `club:fohenagh-historic`. Ahascragh before the join is `club:ahascragh-historic`. The amalgam is `club:ahascragh-fohenagh`, on its own page. Do not fold those three into one name.
- **Era.** There is no era table yet. Time is carried by the separate club id, by `successor`, and by extra club columns (`club`, `also_club`, `club_1`). For many clubs, add an explicit era: club, from year, to year, and the next club. Amalgamations then read as a link, not a special case.
- **Player.** A person can wear more than one of those jerseys. The profile lists each club that the seed already names. A relationship is shown only when a newspaper printed it.
- **Game.** A match row has date, competition, home, away, opponent, and a score only when a cutting or the county record gives one. The Fohenagh page links each of those rows to `/match/[slug]`.
- **Cutting.** An upload is tagged with player and club ids. The public card shows a short excerpt and a paper cite. The full text stays private until an editor publishes it.
- **Remembered.** An optional note on a player, labelled “Remembered — a club memory, not from print”. It is not a cited fact, and it is kept out of `notable`, the facts list, and the developer triples. Joe Madden is the one example.

Aliases (`same_as`) collapse a second spelling onto one profile. New people are not minted to fill a gap.

## Uploads and moderation

Clubs and families are the way new material arrives.

1. **Submit.** Stories → upload a cutting (image, PDF, or URL), or write a short memory. Cuttings land in the ingest queue. Written stories land in `data/pending-stories.json`.
2. **Editor review.** Nothing from that queue is treated as a newspaper fact. Derived triples stay unverified until the archivist clears them. A family note does not become a cite.
3. **Publish.** A cleared cutting shows on the club and the player, with its paper cite. A club memory, if the editor keeps it, is published only under the Remembered label.

Cited and Remembered stay visually separate. The public site never says “Confirmed by family”.

## Search and performance

Today the whole seed is loaded once per server process (`getAssoc`) and search walks entity text. That is fine for one county demo. It will not do for every club.

- Keep a published snapshot per club (players, games, cuttings), and rebuild that club when an editor hits publish. Do not rescan the national file on each page view.
- Search should hit an index of club names, player names, and cite strings, with the club filter first (“Find your club”), then people inside it. Paginate. Do not return every cutting on the club page; the game page holds the cuttings for that day.
- Store images off the HTML. The Fohenagh club page used to inline every cutting and became too heavy to pitch. The tidy page links out instead.
- Roster letters and game years are the right pattern for a long club: an A–Z jump, and games grouped by year. Both stay small on a phone.
- Moderate in a queue with three states (submitted, in review, published) and a label (cited or Remembered). Do not encode that only as a free-text confidence string.

## What this demo is for

Fohenagh is the sample parish: the 1959 headline, every player already in the seed, and the games that are already matches. The same page shape is the pitch. Another club is another id, another era, and the same upload path.
