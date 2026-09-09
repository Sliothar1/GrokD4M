# Cork Ocean Hackathon — PA-Marine win plan

This branch showcases **one D4M engine, two domains**: HurlingWiki (Galway GAA on `main`) and PA-Marine HAB+MHW storytelling on `/marine`. Hurling routes (`/`, `/club/[slug]`, player/match/win pages) are not used as the marine surface.

## What judges should see

1. Open `/marine`. Header: **PA-Marine — D4M for Irish HAB, from Galway Bay**.
2. Three Felix MHW tabs — Instance A / B / C — with **grounded** metrics from PA-Marine-Model notes, not invented early-warning scores.
3. The same associative-array algebra as hurling: sparse `(row, col, val)` with `getrow` / `getcol` / `search`. Marine row pattern: `` `${year}-W${week}@${location_id}` ``.

## Honesty constraints (do not regress)

| Allowed | Not allowed |
| --- | --- |
| Narrative + published SST / CRW / HAB / closure numbers listed below | Invented model probabilities (`p=0.62`) |
| STRONG_OISST LightGBM **test calibrated PR-AUC ~0.295 vs clim ~0.18** | “Flagged 10 days early” unless a real artifact exists |
| Illustrative daily curves **labelled as such**, calibrated to published means | Claiming ODYSSEA or chlorophyll predictive skill |
| Lift from **0.183 → 0.295 ≈ 61% relative** PR-AUC (`(0.295−0.183)/0.183`), absolute **+0.112** | Older draft “53% lift” if it conflicts with 0.183→0.295 |
| Heatwave ≠ automatic bloom | Causation claims from co-occurrence |

`model_p` is omitted from instance JSON and charts. The playground never fabricates a forecast column.

## Three instances

### A — Summer 2018 European / NE Atlantic MHW

- Window: ~2018-06 to 2018-08 (`data/marine/instances/2018-heatwave.json`)
- Grounded: June 2018 Irish-shelf OISST ~**14.90 °C** = #2 warmest June (2002–2026); JJA `in_mhw` ~**0.111** (June ~**0.194**); Connemara Gubbaros peak ~**880 cells/L** week of 2018-06-18; national Dinophysis weeks ISO w22–35 ~**17.4%**
- Angle: warm June + active Connemara blooms (HAB **with** MHW present)

### B — June 2023 North Atlantic / Irish shelf flagship MHW

- Window: June 2023 (May–Aug context) (`data/marine/instances/2023-atlantic-mhw.json`)
- Grounded: CRW Irish-bbox mean `frac_mhw` ≈ **0.964**; peak **1.000** on 2023-06-19; max cat **5**; Mace Head June mean T ≈ **15.98 °C** (~**+2.28 °C** vs other Junes); national Dinophysis exceedance **10.0% vs clim 14.4%**; closures **16.3% vs clim 24.3%** (both **below** clim); Rosmuc **320 cells/L** week 2023-05-29; Mannin **120** week 2023-07-10
- **Lehanagh Pool**: no June 2023 series (NRT from **2024-05-27**)
- Angle: severe MHW ≠ automatic bloom — heighten monitoring, no causation claim
- Skill quote **only**: STRONG_OISST LightGBM test calibrated PR-AUC ~0.295 (vs clim ~0.18)

### C — Summer 2022 Galway / Connemara contrast (home ground)

- Prefer June–Aug 2022 (`data/marine/instances/2022-galway-bay.json`)
- Grounded: Aug 2022 CRW mean `frac_mhw` ≈ **0.521**, peak ≈ **0.914** (31 Aug); June 2022 CRW mean ≈ **0.237**; Connemara focus exceed ~**18.5% (5/27)** vs clim ~**4.6%**; August Connemara focus exceedances often **0**
- Angle: recent contrast vs June 2023 — **local bay weeks matter more than shelf averages**

## Build map

| Piece | Path |
| --- | --- |
| Assoc wrapper | `src/lib/marine/AssocMarine.ts` |
| Seed triples | `data/marine/marine-seed.json` (regenerate: `node scripts/marine/build-seed.mjs`) |
| Instance stories | `data/marine/instances/*.json` |
| Route | `src/app/marine/page.tsx` |
| Charts / map | SVG in `src/components/marine/` (no Leaflet/Recharts in this repo — placeholder map + inline charts) |
| Hurling engine (unchanged) | `src/lib/d4m/AssocArray.ts`, `data/seed.json` |

## Pitch (90 seconds)

HurlingWiki already stores Galway facts as MIT D4M-style triples. PA-Marine reuses that algebra for Irish HAB and marine heatwaves: week × station rows, feature columns, open-data values. Three honest stories — 2018 bloom-with-warmth, 2023 severe MHW without a national bloom spike, 2022 local Connemara weeks that diverge from the shelf average — plus one published skill number (STRONG_OISST PR-AUC 0.295 vs ~0.18). We do not sell a fake early-warning probability.

## Hobday definition (on-page)

Seasonally varying 90th percentile, duration ≥ 5 days (Hobday et al., 2016). Heatwave occupancy is not a Dinophysis forecast.
