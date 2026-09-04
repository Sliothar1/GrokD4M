# Irish Newspaper Archives (INA) — continuous ingest scaffolding

**Galway first.** Human-driven search + paste OCR/excerpt → proposed Match/Club/Player triples. No live login/scrape from automation.

## Hard rules

1. **Cited triples only** — emit Match / Club / Player facts for the D4M seed. **Never** dump full copyrighted article text into the public seed or into `data/ina-queue/pending.jsonl`.
2. **Scores only when clearly stated** in the pasted excerpt. If unclear, omit `score` (or set `null`). New proposals default to `verification_status: "unverified"` until **dual-source** confirmation or **Archivist** approval.
3. **Priority order**
   1. Fohenagh / Ahascragh (historic Fohenagh, historic Ahascragh, amalgam Ahascragh-Fohenagh)
   2. All other Galway clubs present in `data/seed.json`
   3. County / grade season sweeps (championship, league, junior, intermediate, minor)
4. **Auth** — known username hint: `garrylohan_77`. Login is **human-only**. Do **not** store or request passwords in this repo.

Private full-text cuttings (if any) belong under `data/private/` (gitignored / not for public seed), never in queue JSONL.

## Files

| Path | Role |
| --- | --- |
| `queries.json` | Continuous search batches: query string + year range + priority + decade |
| `pending-triples.schema.json` | JSON Schema for one pending JSONL record |
| `extract_triples.py` | Sample extractor: pasted OCR/excerpt → proposed triples (no invented scores) |
| `../../data/ina-queue/pending.jsonl` | Queue of proposed triples awaiting review |
| `../../data/ina-queue/archivist-packets.jsonl` | Archivist-ruled packets (CLEAR / HOLD) |
| `apply_fohenagh_batch1.py` | Promote batch-1 Fohenagh rulings into seed (no score overwrite) |
| `../../data/ina-queue/.gitkeep` | Keeps the queue folder in git |

## Widened search queries

Use INA advanced/keyword search with **decade year filters** (`queries.json` decades: **1880s–2020s**).

### Competition / grade stems (county sweeps)

- `Galway hurling championship`
- `Galway senior hurling` / `Galway SHC`
- `Galway intermediate hurling` / `Galway IHC`
- `Galway junior hurling` / `Galway JHC`
- `Galway minor hurling` / `Galway MHC`
- `Galway hurling league`
- `Galway hurling All-Ireland` / `Galway hurlers`

### Club names (from seed)

Priority first: **Fohenagh**, **Ahascragh**, **Ahascragh-Fohenagh** (also try `Ahascragh Fohenagh`).

Then every other Galway club in seed, e.g. Portumna, Castlegar, Sarsfields, St Thomas', Loughrea, Clarinbridge, Athenry, Turloughmore, Cappataggle, …

Suggested club query shapes (already expanded in `queries.json`):

- `{Club} hurling`
- `{Club} Galway championship`
- `{Club} hurling Galway`

### Decade batches

Each query is queued once per decade window: 1880–1889, …, 2020–2029. Work **priority 1** batches first, then 2, then 3. Mark batch `status` locally as you complete human searches (do not invent scrape results).

## Human workflow (continuous)

1. Open INA in a browser; sign in as `garrylohan_77` (password never stored here).
2. Pick the next `status: "queued"` batch from `queries.json` (lowest `priority`, then decade).
3. Run the search with the batch `year_from`–`year_to` filter.
4. For useful hits: copy a **short** OCR/excerpt or results-line (fair-use locator), plus the article URL and paper/date.
5. Run the sample extractor:

```bash
python3 scripts/ina/extract_triples.py \
  --text-file /path/to/excerpt.txt \
  --paper "Tuam Herald" \
  --date 1959-09-05 \
  --url "https://irishnewsarchive.com/?a=d&d=TTH19590905.1.8" \
  --competition "Galway Senior Hurling Championship" \
  --season 1959 \
  --batch-id batch-0001 \
  --append data/ina-queue/pending.jsonl
```

6. Review JSONL lines; promote only Archivist / dual-source verified facts into seed packs. Log cites in `data/ingest-log.jsonl`.

## Schema summary (pending JSONL)

Each line: `match_id`, `clubs[]`, optional `score`, `competition`, `season`, `paper`, `date`, `cite.url` + `cite.snippet_note`, `verification_status`, `entity_kind`.

See `pending-triples.schema.json` for full constraints.

## Out of scope (this scaffolding)

- Automated INA login, session cookies, or bulk scrape
- Writing full article bodies into git
- Inventing scores, winners, or player lists not present in the pasted text
