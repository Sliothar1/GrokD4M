# Multi-club roles (design only)

No payments are wired. Placeholders such as “€1 for another archive scan” do not charge anyone.

## Clubs

A club is a `club:` row. Players point at one or more clubs:

- `club` — the parish jersey this profile leads with (Fohenagh for anyone reared in the parish).
- `also_played_with` — a later club, shown as a subtle “Also played with” link.
- `also_played_with_county` — a county team, same treatment.
- `club_1`, `club_2`, … — extra jerseys already on the roster. Do not invent a fourth locked club.

New clubs are new rows. The profile template does not change.

## Roles

| Role | Scope | What they can do |
| --- | --- | --- |
| Reader | public | Read pages. Send a memory, a correction, or a photo. |
| Club secretary | one `club:` id, paid plan (not built) | Upload a clipping or a photo for that club. See that club’s queue. |
| Editor (Garry, for Fohenagh) | `club:fohenagh-historic` | One-tap approve or reject on the corrections queue. Nothing goes live until approved. |
| Archivist | site | Same queue, any club. |

A secretary never sees another club’s queue. Approval writes an editorial copy only (the memory store already works this way). Photos stay off the page until an editor accepts them.

## Paid extras (placeholder)

Framed as “Pay Grok Bot”. Examples: another archive scan (€1), a second club on the paid plan. The control is disabled and labelled as a placeholder. Plenty of the site stays free: search, profiles, the Fohenagh story, and one correction.
