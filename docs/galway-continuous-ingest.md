# Galway continuous ingest plan (widened)

## Priority order
1. **Fohenagh / Ahascragh-Fohenagh** cuttings & verified matches (shipped).
2. **Galway SHC club finals 1887–2021** — this pack (Galway GAA stats + Wikipedia double-source).
3. **Intermediate / Junior title rolls** — Wikipedia rolls (wins only; scores only when double-sourced later).
4. Ongoing: year pages on galwaygaa.ie Roll of Honour, Wikipedia season pages, club sites.

## Rules (D4M seed)
- Assoc triples only in `data/seed.json` (`row` / `col` / `val`).
- **Scores only when double-sourced** (e.g. Galway GAA stats page ∧ Wikipedia, or two newspaper sources).
- Always cite `source` / `source_wiki`; never invent scores or venues.
- Deduplicate by match id / competition+year final / existing win year+title+club.
- Historic predecessors get distinct ids (`club:fohenagh-historic`, `club:tynagh-historic`, …).

## Continuous scrape targets
| Feed | URL pattern | Cadence | Emit |
|------|-------------|---------|------|
| SHC finals archive | `galwaygaa.ie/stats-galway-senior-hurling-club-finals-1887-2021/` | rare (static) | match + win |
| Post-2021 SHC | Wikipedia `YYYY_Galway_Senior_Hurling_Championship` | after each final | match + season |
| IHC / JHC rolls | Wikipedia championship pages + galwaygaa.ie `/history/*roll-of-honour*` | yearly | win (± match if score double-sourced) |
| Club packs | club sites / archivist JSON under `data/club-*.json` | as donated | club attrs + titles |
| Cuttings | INA / Blob uploads | continuous | another stream owns Stories/Blob |

## Next packs
1. Double-source remaining SHC final scores (pre-1933 / conflict years) via newspaper archives.
2. IHC/JHC **match** shells with scores only where a second public source agrees.
3. Portumna / St Thomas' / Athenry deep packs (players, All-Ireland club ties).
4. Automate `scripts/ingest_galway_shc_1887_2021.py`-style merge in CI against `ingest-log.jsonl` URLs.

## Fohenagh INA batch-1 (Archivist)

Ruled 2026-09-04. Script: `scripts/ina/apply_fohenagh_batch1.py`.

- **CLEAR secondary_cite only** on existing historic seed matches (pack ids `galway-shc-1959-final`, `galway-shc-1959-final-replay`, `galway-shc-1960-final`, `galway-shc-1963-final`). Never overwrite scores.
- Search: cite chips on those match cards; 1959 draw+replay grouped under **Fohenagh · 1959**.
- **HOLD** cuttings (unverified, not tier-1): 1981 Junior A (dated cite, no score line); 2016 Connacht IHC (excerpt + score disputed, tallies hidden); 2000 Oranmore-Maree (excerpt only).
