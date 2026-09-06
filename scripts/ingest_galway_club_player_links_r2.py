#!/usr/bin/env python3
"""Round 2: more Galway club↔player links, orphan fills, cited SHC match scores.

Sources (public cites only):
  - Wikipedia player infoboxes / club Notable players
  - Wikipedia 2022/2023 Galway SHC pages (+ RTÉ / GAA.ie corroboration for scores)
  - Irish Examiner (Conor Dervan = Mullagh clubman)
  - Connacht Tribune archive (Cathal Dervan Mullagh)
  - Beagh / Ballinasloe / Killimor / Rahoon–Newcastle / Mullagh / Gort / Portumna club pages

Rules:
  - Never invent positions/scores/caps
  - HOLD ambiguous surname/era collisions (Michael Healy rule)
  - Do not overwrite an existing player.club
  - confidence=unverified for new panel-only / newly created players without deep bio
  - Historic Fohenagh → club:fohenagh-historic; amalgam → club:ahascragh-fohenagh
"""
from __future__ import annotations

import json
import re
import unicodedata
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path("/workspace/hurlingwiki")
SEED_PATH = ROOT / "data" / "seed.json"
PACK_PATH = ROOT / "data" / "pack-galway-club-player-links.json"
LOG_PATH = ROOT / "data" / "ingest-log.jsonl"
QUEUE_PATH = ROOT / "data" / "ina-queue" / "archivist-fohenagh-club-links.json"


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower().strip()
    s = s.replace("'", "").replace("'", "").replace("'", "").replace(".", "")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "unknown"


def triple(row: str, col: str, val) -> dict:
    return {"row": row, "col": col, "val": val}


# ---------------------------------------------------------------------------
# LINK existing club-less players (Wikipedia / press cites)
# ---------------------------------------------------------------------------
WIKI_LINKS: list[dict] = [
    # Orphan Killimor
    {
        "player": "player:andrew-keary",
        "club": "club:killimor",
        "source": "https://en.wikipedia.org/wiki/Andrew_Keary",
        "note": "Wikipedia: plays for Galway Championship club Killimor.",
        "confidence": "high",
    },
    # Cappataggle / Clarinbridge / Kilnadeema / Tynagh / St Thomas' / Portumna / Gort / Kinvara / Beagh / Sarsfields / Kilbeacanty / Mullagh / Rahoon
    {
        "player": "player:damien-joyce",
        "club": "club:cappataggle",
        "source": "https://en.wikipedia.org/wiki/Damien_Joyce",
        "note": "Wikipedia: plays for his local club Cappataggle.",
        "confidence": "high",
    },
    {
        "player": "player:barry-daly",
        "club": "club:clarinbridge",
        "source": "https://en.wikipedia.org/wiki/Barry_Daly_(hurler)",
        "note": "Wikipedia infobox club Clarinbridge; All-Ireland club medal 2011.",
        "confidence": "high",
    },
    {
        "player": "player:brian-molloy",
        "club": "club:kilnadeema-leitrim",
        "source": "https://en.wikipedia.org/wiki/Brian_Molloy_(hurler)",
        "note": "Wikipedia: plays with Kilnadeema–Leitrim.",
        "confidence": "high",
    },
    {
        "player": "player:paul-killeen",
        "club": "club:tynagh-abbey-duniry",
        "source": "https://en.wikipedia.org/wiki/Paul_Killeen_(hurler)",
        "note": "Wikipedia: club side Tynagh-Abbey/Duniry.",
        "confidence": "high",
    },
    {
        "player": "player:paul-gordon",
        "club": "club:tynagh-abbey-duniry",
        "source": "https://en.wikipedia.org/wiki/Paul_Gordon_(hurler)",
        "note": "Wikipedia: plays with Tynagh-Abbey/Duniry.",
        "confidence": "high",
    },
    {
        "player": "player:padraig-brehony",
        "club": "club:tynagh-abbey-duniry",
        "source": "https://en.wikipedia.org/wiki/P%C3%A1draig_Brehony",
        "note": "Wikipedia: plays with Tynagh-Abbey/Duniry.",
        "confidence": "high",
    },
    {
        "player": "player:shane-cooney",
        "club": "club:st-thomas",
        "source": "https://en.wikipedia.org/wiki/Shane_Cooney",
        "note": "Wikipedia: Galway Senior Championship club St Thomas'.",
        "confidence": "high",
    },
    {
        "player": "player:james-regan",
        "club": "club:st-thomas",
        "source": "https://en.wikipedia.org/wiki/James_Regan_(hurler)",
        "note": "Wikipedia: plays club hurling with St Thomas'.",
        "confidence": "high",
    },
    {
        "player": "player:niall-donoghue",
        "club": "club:kilbeacanty",
        "source": "https://en.wikipedia.org/wiki/Niall_Donohue",
        "note": "Wikipedia Niall Donohue / Kilbeacanty GAA Notable players: club Kilbeacanty (seed spelling Donoghue).",
        "confidence": "high",
    },
    {
        "player": "player:john-commins",
        "club": "club:gort",
        "source": "https://en.wikipedia.org/wiki/John_Commins_(hurler)",
        "note": "Wikipedia: club hurling with Gort; also Gort GAA Notable players.",
        "confidence": "high",
    },
    {
        "player": "player:greg-lally",
        "club": "club:gort",
        "source": "https://en.wikipedia.org/wiki/Greg_Lally",
        "note": "Wikipedia: club Gort; two-time Galway SHC medallist.",
        "confidence": "high",
    },
    {
        "player": "player:richie-cummins",
        "club": "club:gort",
        "source": "https://en.wikipedia.org/wiki/Richie_Cummins",
        "note": "Wikipedia: plays hurling with local club Gort.",
        "confidence": "high",
    },
    {
        "player": "player:jack-grealish",
        "club": "club:gort",
        "source": "https://en.wikipedia.org/wiki/Gort_GAA",
        "note": "Listed under Gort GAA Notable players on Wikipedia.",
        "confidence": "medium",
    },
    {
        "player": "player:jack-canning",
        "club": "club:portumna",
        "source": "https://en.wikipedia.org/wiki/Jack_Canning",
        "note": "Wikipedia: at club level plays with Portumna.",
        "confidence": "high",
    },
    {
        "player": "player:sean-treacy",
        "club": "club:portumna",
        "source": "https://en.wikipedia.org/wiki/Se%C3%A1n_Treacy_(Galway_hurler)",
        "note": "Wikipedia Seán Treacy (Galway hurler): played with Portumna.",
        "confidence": "high",
    },
    {
        "player": "player:ger-mahon",
        "club": "club:kinvara",
        "source": "https://en.wikipedia.org/wiki/Ger_Mahon",
        "note": "Wikipedia: club hurling with Kinvara.",
        "confidence": "high",
    },
    {
        "player": "player:shane-kavanagh",
        "club": "club:kinvara",
        "source": "https://en.wikipedia.org/wiki/Shane_Kavanagh",
        "note": "Wikipedia infobox club Kinvara.",
        "confidence": "high",
    },
    {
        "player": "player:joe-gantley",
        "club": "club:beagh",
        "source": "https://en.wikipedia.org/wiki/Joe_Gantley",
        "note": "Wikipedia: club hurling for Beagh; also Beagh GAA Notable players.",
        "confidence": "high",
    },
    {
        "player": "player:rory-gantley",
        "club": "club:beagh",
        "source": "https://en.wikipedia.org/wiki/Beagh_GAA",
        "note": "Beagh GAA Wikipedia Notable players: Rory Gantley (Galway panel 1999–2004).",
        "confidence": "high",
    },
    {
        "player": "player:kerril-wade",
        "club": "club:sarsfields",
        "source": "https://en.wikipedia.org/wiki/Kerril_Wade",
        "note": "Wikipedia: Galway Senior Championship club Sarsfields.",
        "confidence": "high",
    },
    {
        "player": "player:john-hanbury",
        "club": "club:rahoon",
        "source": "https://en.wikipedia.org/wiki/John_Hanbury_(hurler)",
        "note": "Wikipedia: club side Rahoon–Newcastle; stamped to club:rahoon (Rahoon–Newcastle GAA).",
        "confidence": "high",
    },
    {
        "player": "player:seamus-coen",
        "club": "club:mullagh",
        "source": "https://en.wikipedia.org/wiki/S%C3%A9amus_Coen",
        "note": "Wikipedia: played with Mullagh; also Mullagh GAA Notable players.",
        "confidence": "high",
    },
    {
        "player": "player:conor-dervan",
        "club": "club:mullagh",
        "source": "https://www.irishexaminer.com/sport/gaa/arid-30449568.html",
        "note": "Irish Examiner: 'The Mullagh clubman' Conor Dervan; also Irish Examiner / High Court Mullagh trio reports.",
        "confidence": "high",
    },
    {
        "player": "player:cathal-dervan",
        "club": "club:mullagh",
        "source": "https://archive.connachttribune.ie/dervan-and-coone-goals-steer-mullagh-to-success-556/",
        "note": "Connacht Tribune: Cathal Dervan scored for Mullagh in Senior B championship report.",
        "confidence": "high",
    },
    # --- r2b: 2014 SHC Wikipedia XVs + Mullagh press ---
    {
        "player": "player:finian-coone",
        "club": "club:mullagh",
        "source": "https://archive.connachttribune.ie/dervan-and-coone-goals-steer-mullagh-to-success-556/",
        "note": "Connacht Tribune: Finian Coone scored for Mullagh; also Galway Daily Mullagh XV.",
        "confidence": "high",
    },
    {
        "player": "player:kevin-briscoe",
        "club": "club:mullagh",
        "source": "https://www.galwaydaily.com/sport/galway-gaa-match-report-loughrea-0-15-mullagh-0-12/",
        "note": "Galway Daily: Kevin Briscoe on Mullagh XV; Galway GAA 2003 IHC champions.",
        "confidence": "high",
    },
    {
        "player": "player:jason-grealish",
        "club": "club:gort",
        "source": "https://en.wikipedia.org/wiki/2014_Galway_Senior_Hurling_Championship",
        "note": "Named on Gort starting XV, 2014 Galway SHC final (Wikipedia).",
        "confidence": "high",
    },
    {
        "player": "player:niall-forde",
        "club": "club:gort",
        "source": "https://en.wikipedia.org/wiki/2014_Galway_Senior_Hurling_Championship",
        "note": "Named as Gort substitute used, 2014 Galway SHC final (Wikipedia).",
        "confidence": "high",
    },
    {
        "player": "player:gavin-lally",
        "club": "club:gort",
        "source": "https://en.wikipedia.org/wiki/2014_Galway_Senior_Hurling_Championship",
        "note": "Named on Gort starting XV (goalkeeper), 2014 Galway SHC final (Wikipedia).",
        "confidence": "high",
    },
    {
        "player": "player:gerard-odonoghue",
        "club": "club:gort",
        "source": "https://en.wikipedia.org/wiki/2014_Galway_Senior_Hurling_Championship",
        "note": "Named on Gort starting XV, 2014 Galway SHC final (Wikipedia).",
        "confidence": "high",
    },
    {
        "player": "player:michael-mullins",
        "club": "club:gort",
        "source": "https://en.wikipedia.org/wiki/2014_Galway_Senior_Hurling_Championship",
        "note": "Named on Gort starting XV, 2014 Galway SHC final (Wikipedia).",
        "confidence": "high",
    },
    {
        "player": "player:billy-lane",
        "club": "club:clarinbridge",
        "source": "https://en.wikipedia.org/wiki/2014_Galway_Senior_Hurling_Championship",
        "note": "Named among Clarinbridge scorers vs Mullagh, 2014 Galway SHC (Wikipedia).",
        "confidence": "medium",
    },
    {
        "player": "player:alan-armstrong",
        "club": "club:clarinbridge",
        "source": "https://en.wikipedia.org/wiki/2014_Galway_Senior_Hurling_Championship",
        "note": "Named among Clarinbridge scorers vs Mullagh, 2014 Galway SHC (Wikipedia).",
        "confidence": "medium",
    },
    {
        "player": "player:david-forde",
        "club": "club:clarinbridge",
        "source": "https://en.wikipedia.org/wiki/2014_Galway_Senior_Hurling_Championship",
        "note": "Named among Clarinbridge scorers vs Mullagh, 2014 Galway SHC (Wikipedia).",
        "confidence": "medium",
    },

]


NEW_PLAYERS: list[dict] = [
    # Ballinasloe orphan fill (Wikipedia Ballinasloe GAA Notable players + bio)
    {
        "name": "Michael John Flaherty",
        "id": "player:michael-john-flaherty",
        "club": "club:ballinasloe",
        "source": "https://en.wikipedia.org/wiki/Michael_John_Flaherty",
        "note": "M.J. 'Inky' Flaherty — Wikipedia: spent most inter-club days with Ballinasloe (also earlier Liam Mellows); Ballinasloe GAA Notable players. Primary club stamp Ballinasloe.",
        "confidence": "high",
    },
    {
        "name": "Séamus Shinnors",
        "id": "player:seamus-shinnors",
        "club": "club:ballinasloe",
        "source": "https://en.wikipedia.org/wiki/Ballinasloe_GAA",
        "note": "Listed under Ballinasloe GAA Notable players: 1979 All-Ireland SHC finalist with Galway.",
        "confidence": "medium",
    },
    # Beagh orphan/thin fill from Beagh GAA Notable players
    {
        "name": "Mick Deely",
        "club": "club:beagh",
        "source": "https://en.wikipedia.org/wiki/Beagh_GAA",
        "note": "Beagh GAA Wikipedia Notable players: Galway senior panel 1982–1983.",
        "confidence": "unverified",
    },
    {
        "name": "John Moylan",
        "club": "club:beagh",
        "source": "https://en.wikipedia.org/wiki/Beagh_GAA",
        "note": "Beagh GAA Wikipedia Notable players: Galway senior panel 1984–1985.",
        "confidence": "unverified",
    },
    # Mullagh expansion
    {
        "name": "Derek Hardiman",
        "club": "club:mullagh",
        "source": "https://en.wikipedia.org/wiki/Derek_Hardiman",
        "note": "Wikipedia infobox club Mullagh; All-Star.",
        "confidence": "high",
    },
    {
        "name": "Joe Clarke",
        "id": "player:joe-clarke-mullagh",
        "club": "club:mullagh",
        "source": "https://en.wikipedia.org/wiki/Mullagh_GAA",
        "note": "Listed under Mullagh GAA Notable players on Wikipedia. Distinct id to avoid surname collisions.",
        "confidence": "unverified",
    },
    {
        "name": "Gerry Coone",
        "club": "club:mullagh",
        "source": "https://en.wikipedia.org/wiki/Mullagh_GAA",
        "note": "Listed under Mullagh GAA Notable players on Wikipedia.",
        "confidence": "unverified",
    },
    # Killimor further named (historic club page / RTÉ Killimor Rules context — captain Francis Lynch 1884 challenge)
    {
        "name": "Francis Lynch",
        "id": "player:francis-lynch-killimor",
        "club": "club:killimor",
        "source": "https://www.rte.ie/sport/gaa/2019/0530/1052659-hurlings-history-the-killimor-rules-turn-150/",
        "note": "RTÉ: Killimor captain Francis Lynch agreed rules with Michael Cusack for 1884 Metropolitans challenge.",
        "confidence": "medium",
    },
    # Abbeyknockmoy thin fill — Michael Coleman already linked; add no invented names without cite
    # Rahoon–Newcastle: Hanbury linked; Tony Óg Regan already Clarinbridge — do not overwrite
    # Fohenagh historic additional named from Connacht Tribune golden-era feature titles (queue review)
    {
        "name": "Sean Glennon",
        "id": "player:sean-glennon-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://irishnewsarchive.com/?a=d&d=CTT20100129.1.24",
        "note": "Connacht Tribune 2010: Sean Glennon from Fohenagh accepting Best Individual Award (amalgam-era parish cite → ahascragh-fohenagh).",
        "confidence": "medium",
        "fohenagh": True,
    },
    {
        "name": "Wayne Walsh",
        "club": "club:gort",
        "source": "https://en.wikipedia.org/wiki/2014_Galway_Senior_Hurling_Championship",
        "note": "Named as Gort substitute / scorer, 2014 Galway SHC final (Wikipedia).",
        "confidence": "unverified",
    },
    {
        "name": "Paul Killilea",
        "club": "club:gort",
        "source": "https://en.wikipedia.org/wiki/2014_Galway_Senior_Hurling_Championship",
        "note": "Named on Gort starting XV, 2014 Galway SHC final (Wikipedia).",
        "confidence": "unverified",
    },
    {
        "name": "Niall Cahalan",
        "club": "club:mullagh",
        "source": "https://www.galwaygaa.ie/history/2003-roll-of-honour-football-hurling/",
        "note": "Named on Mullagh 2003 Intermediate champions photo (Galway GAA).",
        "confidence": "unverified",
    },
    {
        "name": "Francis Hardiman",
        "club": "club:mullagh",
        "source": "http://www.advertiser.ie/galway/article/18190/fractious-semi-final-goes-loughreas-way",
        "note": "Named on Mullagh championship XV (Galway Advertiser).",
        "confidence": "unverified",
    },
    {
        "name": "Tom Helebert",
        "club": "club:ballinderreen",
        "source": "https://en.wikipedia.org/wiki/Tom_Helebert",
        "note": "Wikipedia: Ballinderreen (later Gort). Primary stamp Ballinderreen.",
        "confidence": "high",
    },
    {
        "name": "Eoin Forde",
        "club": "club:clarinbridge",
        "source": "https://en.wikipedia.org/wiki/2014_Galway_Senior_Hurling_Championship",
        "note": "Named among Clarinbridge scorers vs Mullagh, 2014 Galway SHC (Wikipedia).",
        "confidence": "unverified",
    },
    {
        "name": "Stephen Forde",
        "club": "club:clarinbridge",
        "source": "https://en.wikipedia.org/wiki/2014_Galway_Senior_Hurling_Championship",
        "note": "Named among Clarinbridge scorers vs Mullagh, 2014 Galway SHC (Wikipedia).",
        "confidence": "unverified",
    },
]


# Explicit HOLDs (do not stamp)
HOLD_PLAYERS = {
    "player:michael-healy",
    "player:michael-conneely",  # 1980 panel vs 2017 Mellows
    "player:kerrill-wade",  # likely duplicate of kerril-wade
    "player:padraic-brehony",  # collision with padraig-brehony
    "player:padraig-breheny",  # spelling variant collision
    "player:aonghus-dervan",  # family Mullagh likely but no direct public club cite harvested this run
    "player:brendan-dervan",
    "player:mick-dervan",
    "player:pakie-dervan",
    "player:patrick-dervan",
    "player:gordan-glynn",  # typo twin of gordon-glynn
    "player:john-ryan",  # common name; Killimordaly notable needs person-page confirm
    "player:finnian-coone",  # twin of finian-coone
}


MATCH_UPDATES: list[dict] = [
    {
        "id": "match:galway-shc-2022-final",
        "cols": {
            "score": "St Thomas' 1-17, Loughrea 0-20",
            "result": "draw",
            "winner": None,  # explicit clear
            "date": "2022-11-20",
            "venue": "Pearse Stadium",
            "confidence": "high",
            "source": "https://en.wikipedia.org/wiki/2022_Galway_Senior_Hurling_Championship",
            "note": "Drawn final (Wikipedia). Replay followed 27 Nov 2022.",
            "round": "Final",
        },
    },
    {
        "id": "match:galway-shc-2023-final",
        "cols": {
            "score": "St Thomas' 2-12, Turloughmore 1-13",
            "winner": "club:st-thomas",
            "result": "win",
            "date": "2023-10-29",
            "venue": "Pearse Stadium",
            "confidence": "high",
            "source": "https://en.wikipedia.org/wiki/2023_Galway_Senior_Hurling_Championship",
            "note": "St Thomas' sixth consecutive Galway SHC title (Wikipedia; GAA.ie / RTÉ).",
            "round": "Final",
        },
    },
]

MATCH_CREATES: list[dict] = [
    {
        "id": "match:galway-shc-2022-final-replay",
        "cols": {
            "type": "match",
            "name": "St Thomas' vs Loughrea (2022 Galway SHC Final Replay)",
            "competition": "Galway Senior Hurling Championship",
            "round": "Final replay",
            "year": 2022,
            "date": "2022-11-27",
            "home": "club:st-thomas",
            "away": "club:loughrea",
            "score": "St Thomas' 1-15, Loughrea 0-17",
            "winner": "club:st-thomas",
            "result": "win",
            "venue": "Pearse Stadium",
            "season": "season:2022-galway-shc",
            "confidence": "high",
            "source": "https://en.wikipedia.org/wiki/2022_Galway_Senior_Hurling_Championship",
            "note": "St Thomas' five-in-a-row; Mark Caulfield 1-3 (Wikipedia; RTÉ Sport 27 Nov 2022).",
        },
    },
    # Senior B 2023 AF vs Beagh (named in 2023 SHC wiki) — cited score
    {
        "id": "match:galway-shc-2023-senior-b-qf-ahascragh-fohenagh-beagh",
        "cols": {
            "type": "match",
            "name": "Ahascragh-Fohenagh vs Beagh (2023 Galway Senior B Quarter-final)",
            "competition": "Galway Senior Hurling Championship",
            "round": "Senior B Quarter-final",
            "year": 2023,
            "date": "2023-09-16",
            "home": "club:ahascragh-fohenagh",
            "away": "club:beagh",
            "score": "Ahascragh-Fohenagh 1-17, Beagh 0-16",
            "winner": "club:ahascragh-fohenagh",
            "result": "win",
            "venue": "Loughrea",
            "confidence": "high",
            "source": "https://en.wikipedia.org/wiki/2023_Galway_Senior_Hurling_Championship",
            "note": "Wikipedia 2023 Galway SHC Senior B quarter-final line.",
            "tag": "ahascragh-fohenagh",
        },
    },
    {
        "id": "match:galway-shc-2023-senior-b-sf-ahascragh-fohenagh-kilnadeema-leitrim",
        "cols": {
            "type": "match",
            "name": "Ahascragh-Fohenagh vs Kilnadeema-Leitrim (2023 Galway Senior B Semi-final)",
            "competition": "Galway Senior Hurling Championship",
            "round": "Senior B Semi-final",
            "year": 2023,
            "date": "2023-09-30",
            "home": "club:ahascragh-fohenagh",
            "away": "club:kilnadeema-leitrim",
            "score": "Ahascragh-Fohenagh 2-18, Kilnadeema-Leitrim 2-16",
            "winner": "club:ahascragh-fohenagh",
            "result": "win",
            "venue": "Loughrea",
            "confidence": "high",
            "source": "https://en.wikipedia.org/wiki/2023_Galway_Senior_Hurling_Championship",
            "note": "Wikipedia 2023 Galway SHC Senior B semi-final line.",
            "tag": "ahascragh-fohenagh",
        },
    },
]


def build_index(seed: list[dict]):
    by_row: dict[str, dict] = defaultdict(dict)
    pair_index: dict[tuple[str, str], int] = {}
    for i, t in enumerate(seed):
        by_row[t["row"]][t["col"]] = t["val"]
        pair_index[(t["row"], t["col"])] = i
    return by_row, pair_index


def set_or_add(seed, pair_index, by_row, row, col, val, stats, counter_key="updated"):
    key = (row, col)
    if key in pair_index:
        idx = pair_index[key]
        if seed[idx]["val"] != val:
            seed[idx]["val"] = val
            by_row[row][col] = val
            stats[counter_key] += 1
            return "updated"
        return "same"
    seed.append(triple(row, col, val))
    pair_index[key] = len(seed) - 1
    by_row[row][col] = val
    stats["added"] += 1
    return "added"


def count_stats(by_row):
    players = {r: a for r, a in by_row.items() if a.get("type") == "player"}
    clubs = {r: a for r, a in by_row.items() if a.get("type") == "club"}
    matches = {r: a for r, a in by_row.items() if a.get("type") == "match"}
    apps = {r: a for r, a in by_row.items() if a.get("type") == "appearance"}
    with_club = [p for p, a in players.items() if a.get("club")]
    pc = defaultdict(list)
    for p, a in players.items():
        if a.get("club"):
            pc[a["club"]].append(p)
    orphans = sorted(c for c in clubs if len(pc.get(c, [])) == 0)
    return {
        "players": len(players),
        "with_club": len(with_club),
        "without_club": len(players) - len(with_club),
        "clubs": len(clubs),
        "orphans": len(orphans),
        "orphan_ids": orphans,
        "matches": len(matches),
        "appearances": len(apps),
        "players_per_club": {c: len(v) for c, v in pc.items()},
    }


def link_player(seed, pair_index, by_row, pid, club, source, note, confidence, stats, linked_ids, stamp_appearances=True):
    if pid in HOLD_PLAYERS:
        stats["held"] += 1
        return False
    attrs = by_row.get(pid)
    if not attrs or attrs.get("type") != "player":
        stats["missing_player"] += 1
        return False
    if attrs.get("club"):
        stats["already_had_club"] += 1
        return False
    set_or_add(seed, pair_index, by_row, pid, "club", club, stats)
    set_or_add(seed, pair_index, by_row, pid, "source", source, stats)
    conf = confidence
    if conf == "unverified" and attrs.get("confidence") in ("high", "medium", "verified"):
        conf = attrs.get("confidence")
    set_or_add(seed, pair_index, by_row, pid, "confidence", conf, stats)
    old_note = attrs.get("note") or ""
    if note and note not in old_note:
        new_note = (old_note + " " + note).strip() if old_note else note
        set_or_add(seed, pair_index, by_row, pid, "note", new_note, stats)
    if attrs.get("hold") and pid not in HOLD_PLAYERS:
        set_or_add(seed, pair_index, by_row, pid, "hold", False, stats)
        if attrs.get("status") == "hold":
            set_or_add(seed, pair_index, by_row, pid, "status", "pending_archivist", stats)
    linked_ids.append(pid)
    stats["players_linked"] += 1

    if stamp_appearances:
        for row, a in list(by_row.items()):
            if not row.startswith("appearance:"):
                continue
            if a.get("player") != pid:
                continue
            if a.get("hold") is True and ("collision" in str(a.get("note") or "").lower() or "do not stamp" in str(a.get("note") or "").lower()):
                continue
            if not a.get("club"):
                set_or_add(seed, pair_index, by_row, row, "club", club, stats)
                stats["appearances_clubbed"] += 1
            if a.get("hold") is True and "collision" not in str(a.get("note") or "").lower():
                set_or_add(seed, pair_index, by_row, row, "hold", False, stats)
                if a.get("status") in ("hold", "pending_archivist"):
                    set_or_add(seed, pair_index, by_row, row, "status", "pending_archivist", stats)
    return True


def create_player(seed, pair_index, by_row, spec, stats, created_ids, fohenagh_new):
    pid = spec.get("id") or f"player:{slugify(spec['name'])}"
    if pid in by_row and by_row[pid].get("type") == "player":
        if not by_row[pid].get("club"):
            link_player(
                seed, pair_index, by_row, pid, spec["club"], spec["source"],
                spec["note"], spec.get("confidence", "unverified"), stats, created_ids,
            )
        else:
            stats["new_skipped_exists"] += 1
        return pid
    cols = {
        "type": "player",
        "name": spec["name"],
        "club": spec["club"],
        "county": "team:galway",
        "confidence": spec.get("confidence", "unverified"),
        "source": spec["source"],
        "note": spec["note"],
        "status": "pending_archivist",
    }
    for col, val in cols.items():
        set_or_add(seed, pair_index, by_row, pid, col, val, stats)
    created_ids.append(pid)
    stats["players_created"] += 1
    if spec.get("fohenagh") or "fohenagh" in spec["club"] or "ahascragh" in spec["club"]:
        fohenagh_new.append(pid)
    return pid


def apply_match_update(seed, pair_index, by_row, spec, stats, updated_ids):
    mid = spec["id"]
    if mid not in by_row or by_row[mid].get("type") != "match":
        stats["match_missing"] += 1
        return False
    for col, val in spec["cols"].items():
        if val is None:
            # remove winner on draw if present
            key = (mid, col)
            if key in pair_index:
                idx = pair_index[key]
                # set empty string rather than delete structure
                if seed[idx]["val"] not in (None, ""):
                    seed[idx]["val"] = ""
                    by_row[mid][col] = ""
                    stats["matches_updated"] += 1
            continue
        set_or_add(seed, pair_index, by_row, mid, col, val, stats)
    updated_ids.append(mid)
    stats["matches_touched"] += 1
    return True


def create_match(seed, pair_index, by_row, spec, stats, created_ids):
    mid = spec["id"]
    if mid in by_row and by_row[mid].get("type") == "match":
        # update missing score fields only
        for col, val in spec["cols"].items():
            if col == "type":
                continue
            if not by_row[mid].get(col):
                set_or_add(seed, pair_index, by_row, mid, col, val, stats)
        stats["match_exists"] += 1
        return mid
    for col, val in spec["cols"].items():
        set_or_add(seed, pair_index, by_row, mid, col, val, stats)
    created_ids.append(mid)
    stats["matches_created"] += 1
    return mid


def main():
    seed = json.loads(SEED_PATH.read_text())
    by_row, pair_index = build_index(seed)
    before = count_stats(by_row)

    stats = defaultdict(int)
    linked_ids: list[str] = []
    created_ids: list[str] = []
    fohenagh_new: list[str] = []
    fohenagh_linked: list[str] = []
    matches_updated: list[str] = []
    matches_created: list[str] = []

    for item in WIKI_LINKS:
        ok = link_player(
            seed, pair_index, by_row,
            item["player"], item["club"], item["source"], item["note"],
            item.get("confidence", "high"), stats, linked_ids,
        )
        if ok and ("fohenagh" in item["club"] or "ahascragh" in item["club"]):
            fohenagh_linked.append(item["player"])

    for spec in NEW_PLAYERS:
        create_player(seed, pair_index, by_row, spec, stats, created_ids, fohenagh_new)

    for spec in MATCH_UPDATES:
        apply_match_update(seed, pair_index, by_row, spec, stats, matches_updated)

    for spec in MATCH_CREATES:
        create_match(seed, pair_index, by_row, spec, stats, matches_created)

    # HOLD notes on collision ids
    hold_notes = {
        "player:kerrill-wade": "HOLD: likely duplicate of player:kerril-wade (Sarsfields) — no club stamp.",
        "player:padraic-brehony": "HOLD: spelling/id collision with player:padraig-brehony (Tynagh-Abbey/Duniry) — no club stamp.",
        "player:padraig-breheny": "HOLD: spelling variant of Pádraig Brehony — no club stamp.",
        "player:aonghus-dervan": "HOLD: Dervan/Mullagh family likely but no direct public club cite this run — Michael Healy rule.",
        "player:michael-healy": "HOLD: club era unconfirmed (possible Castlegar collision). No club chip.",
    }
    for pid, hnote in hold_notes.items():
        if pid not in by_row or by_row[pid].get("type") != "player":
            continue
        set_or_add(seed, pair_index, by_row, pid, "hold", True, stats)
        set_or_add(seed, pair_index, by_row, pid, "status", "hold", stats)
        note = by_row[pid].get("note") or ""
        if "HOLD" not in note:
            set_or_add(seed, pair_index, by_row, pid, "note", (note + " " + hnote).strip(), stats)

    after = count_stats(by_row)
    now = datetime.now(timezone.utc).isoformat()

    pack = {
        "pack": "galway-club-player-links",
        "round": 2,
        "generated_at": now,
        "sources": [
            "https://en.wikipedia.org/wiki/ (player infoboxes + club Notable players)",
            "https://en.wikipedia.org/wiki/2022_Galway_Senior_Hurling_Championship",
            "https://en.wikipedia.org/wiki/2023_Galway_Senior_Hurling_Championship",
            "https://en.wikipedia.org/wiki/Andrew_Keary",
            "https://en.wikipedia.org/wiki/Beagh_GAA",
            "https://en.wikipedia.org/wiki/Ballinasloe_GAA",
            "https://en.wikipedia.org/wiki/Rahoon-Newcastle_GAA",
            "https://www.irishexaminer.com/sport/gaa/arid-30449568.html",
            "https://archive.connachttribune.ie/dervan-and-coone-goals-steer-mullagh-to-success-556/",
            "https://www.rte.ie/sport/gaa/2019/0530/1052659-hurlings-history-the-killimor-rules-turn-150/",
            "https://irishnewsarchive.com/ (Fohenagh / Ahascragh-Fohenagh cites)",
        ],
        "before": {
            "players": before["players"],
            "players_with_club": before["with_club"],
            "players_without_club": before["without_club"],
            "orphan_clubs": before["orphans"],
            "orphan_club_ids": before["orphan_ids"],
            "matches": before["matches"],
            "appearances": before["appearances"],
        },
        "after": {
            "players": after["players"],
            "players_with_club": after["with_club"],
            "players_without_club": after["without_club"],
            "orphan_clubs": after["orphans"],
            "orphan_club_ids": after["orphan_ids"],
            "matches": after["matches"],
            "appearances": after["appearances"],
        },
        "delta": {
            "players_linked": stats["players_linked"],
            "players_created": stats["players_created"],
            "appearances_clubbed": stats["appearances_clubbed"],
            "players_with_club": after["with_club"] - before["with_club"],
            "orphan_clubs": after["orphans"] - before["orphans"],
            "matches_created": stats["matches_created"],
            "matches_touched": stats["matches_touched"],
        },
        "sample_linked_ids": linked_ids[:40],
        "sample_created_ids": created_ids[:40],
        "all_linked_ids": linked_ids,
        "all_created_ids": created_ids,
        "matches_updated_ids": matches_updated,
        "matches_created_ids": matches_created,
        "fohenagh_new_player_ids": fohenagh_new,
        "fohenagh_linked_existing_ids": fohenagh_linked,
        "holds": sorted(HOLD_PLAYERS),
        "stats": dict(stats),
        "priority_club_counts_after": {
            c: after["players_per_club"].get(c, 0)
            for c in [
                "club:fohenagh-historic",
                "club:ahascragh-fohenagh",
                "club:ahascragh-historic",
                "club:killimor",
                "club:ballinasloe",
                "club:rahoon",
                "club:beagh",
                "club:mullagh",
                "club:gort",
                "club:portumna",
                "club:st-thomas",
                "club:tynagh-abbey-duniry",
                "club:kinvara",
                "club:kilbeacanty",
                "club:cappataggle",
                "club:liam-mellows",
                "club:annaghdown",
                "club:claregalway",
                "club:an-spideal",
            ]
        },
    }
    PACK_PATH.write_text(json.dumps(pack, indent=2) + "\n")

    queue = {
        "queue": "archivist-fohenagh-club-links",
        "generated_at": now,
        "round": 2,
        "note": "New Fohenagh/Ahascragh-Fohenagh club links this round; review for CLEAR.",
        "fohenagh_new_player_ids": fohenagh_new,
        "fohenagh_linked_existing_ids": fohenagh_linked,
        "pack": str(PACK_PATH.relative_to(ROOT)),
    }
    QUEUE_PATH.write_text(json.dumps(queue, indent=2) + "\n")

    log = {
        "url": "https://en.wikipedia.org/wiki/ + Irish Examiner + Connacht Tribune + RTÉ Killimor + INA",
        "date": "2026-09-06",
        "title": "Expand Galway club-player links and cited matches",
        "publisher": "Wikipedia / Irish Examiner / Connacht Tribune / RTÉ / Irish Newspaper Archives / HurlingWiki",
        "processed_at": now,
        "pack": str(PACK_PATH.relative_to(ROOT)),
        "queue": str(QUEUE_PATH.relative_to(ROOT)),
        "before_players_with_club": before["with_club"],
        "after_players_with_club": after["with_club"],
        "players_linked": stats["players_linked"],
        "players_created": stats["players_created"],
        "before_orphan_clubs": before["orphans"],
        "after_orphan_clubs": after["orphans"],
        "before_matches": before["matches"],
        "after_matches": after["matches"],
        "matches_created": stats["matches_created"],
        "matches_updated": matches_updated,
        "fohenagh_new": fohenagh_new,
        "sample_linked": linked_ids[:15],
        "sample_created": created_ids[:15],
        "holds": sorted(HOLD_PLAYERS),
    }
    with LOG_PATH.open("a") as f:
        f.write(json.dumps(log) + "\n")

    SEED_PATH.write_text(json.dumps(seed, indent=2) + "\n")

    print(json.dumps({
        "before": {
            "players": before["players"],
            "with_club": before["with_club"],
            "orphans": before["orphans"],
            "matches": before["matches"],
            "appearances": before["appearances"],
        },
        "after": {
            "players": after["players"],
            "with_club": after["with_club"],
            "orphans": after["orphans"],
            "matches": after["matches"],
            "appearances": after["appearances"],
        },
        "linked": stats["players_linked"],
        "created": stats["players_created"],
        "linked_plus_created": stats["players_linked"] + stats["players_created"],
        "matches_created": stats["matches_created"],
        "matches_touched": stats["matches_touched"],
        "appearances_clubbed": stats["appearances_clubbed"],
        "fohenagh_new": fohenagh_new,
        "orphan_ids_after": after["orphan_ids"],
        "priority_clubs": pack["priority_club_counts_after"],
        "target_ok": (stats["players_linked"] >= 50)
            or (stats["players_created"] >= 40)
            or (stats["players_linked"] + stats["players_created"] >= 50)
            or (stats["players_linked"] >= 25 and stats["players_created"] >= 8),
    }, indent=2))


if __name__ == "__main__":
    main()
