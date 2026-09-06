#!/usr/bin/env python3
"""Round 3: fill more Galway orphan clubs + club-less player links (cited public sources only).

Priority: Fohenagh/AF first, then Annaghdown, Sylane, Abbeyknockmoy, Tynagh historic,
Army Galway, Peterswell historic, Micheál Breathnach, An Spidéal, Tommy Larkin's thin,
Duniry historic. HOLD ambiguous collisions. Never invent scores/caps. New players unverified.
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
# Fohenagh / AF first
# ---------------------------------------------------------------------------
WIKI_LINKS: list[dict] = [
    # Fohenagh / Ahascragh-Fohenagh (2025 Galway SHC Wikipedia scorers)
    {
        "player": "player:diarmuid-obrien",
        "club": "club:ahascragh-fohenagh",
        "source": "https://en.wikipedia.org/wiki/2025_Galway_Senior_Hurling_Championship",
        "note": "Named among Ahascragh–Fohenagh scorers, 2025 Galway SHC (Wikipedia).",
        "confidence": "medium",
    },
    # Abbeyknockmoy (Wikipedia Category:Abbeyknockmoy hurlers + bios)
    {
        "player": "player:brian-costello",
        "club": "club:abbeyknockmoy",
        "source": "https://en.wikipedia.org/wiki/Category:Abbeyknockmoy_hurlers",
        "note": "Wikipedia Category:Abbeyknockmoy hurlers; named on Abbeyknockmoy 2016 All-Ireland IHC final XV (Galway Bay FM archive).",
        "confidence": "high",
    },
    {
        "player": "player:brian-flaherty",
        "club": "club:abbeyknockmoy",
        "source": "https://en.wikipedia.org/wiki/Category:Abbeyknockmoy_hurlers",
        "note": "Wikipedia Category:Abbeyknockmoy hurlers; Abbeyknockmoy 2016 All-Ireland IHC final starting XV (Galway Bay FM).",
        "confidence": "high",
    },
    {
        "player": "player:john-culkin",
        "club": "club:abbeyknockmoy",
        "source": "https://en.wikipedia.org/wiki/Category:Abbeyknockmoy_hurlers",
        "note": "Wikipedia Category:Abbeyknockmoy hurlers; Abbeyknockmoy 2016 All-Ireland IHC final starting XV (Galway Bay FM).",
        "confidence": "high",
    },
    # Tynagh historic — 1923 All-Ireland panelists named on Wikipedia Tynagh GAA Notable players
    {
        "player": "player:jim-power",
        "club": "club:tynagh-historic",
        "source": "https://en.wikipedia.org/wiki/Jim_Power_(hurler)",
        "note": "Wikipedia: club hurling with Tynagh (five Galway SHC medals); Tynagh GAA Notable players.",
        "confidence": "high",
    },
    {
        "player": "player:mick-kenny",
        "club": "club:tynagh-historic",
        "source": "https://en.wikipedia.org/wiki/Tynagh_GAA",
        "note": "Wikipedia Tynagh GAA Notable players: All-Ireland SHC-winner 1923.",
        "confidence": "high",
    },
    {
        "player": "player:mick-dervan",
        "club": "club:tynagh-historic",
        "source": "https://en.wikipedia.org/wiki/Tynagh_GAA",
        "note": "Wikipedia Tynagh GAA Notable players: All-Ireland SHC-winner 1923 (historic Tynagh; distinct from modern Mullagh Dervan family HOLD).",
        "confidence": "high",
    },
    {
        "player": "player:ignatius-harney",
        "club": "club:tynagh-historic",
        "source": "https://en.wikipedia.org/wiki/Tynagh_GAA",
        "note": "Wikipedia Tynagh GAA Notable players: All-Ireland SHC-winner 1923.",
        "confidence": "high",
    },
    {
        "player": "player:andy-kelly",
        "club": "club:tynagh-historic",
        "source": "https://en.wikipedia.org/wiki/Tynagh_GAA",
        "note": "Wikipedia Tynagh GAA Notable players / TAD club history: Tynagh 1920s golden age.",
        "confidence": "high",
    },
    # Modern Tynagh-Abbey/Duniry
    {
        "player": "player:liam-hodgins",
        "club": "club:tynagh-abbey-duniry",
        "source": "https://en.wikipedia.org/wiki/Liam_Hodgins",
        "note": "Wikipedia: club Tynagh-Abbey/Duniry; All Star 2001.",
        "confidence": "high",
    },
    # Sylane
    {
        "player": "player:keelan-creaven",
        "club": "club:sylane",
        "source": "https://www.tuamherald.ie/2025/08/27/martin-stars-in-crucial-sylanevictory/",
        "note": "Tuam Herald: Keelan Creaven scorer-in-chief for Sylane vs Athenry, Galway IHC 2025.",
        "confidence": "medium",
    },
    # Tommy Larkin's (Woodford/Ballinakill amalgam) — roll of honour county players
    {
        "player": "player:alan-garvey",
        "club": "club:tommy-larkins",
        "source": "https://www.tommylarkins.gaa.ie/roll-of-honour",
        "note": "Tommy Larkin's GAA Roll of Honour: county U-21 All-Ireland medallist listed for Tommy Larkins.",
        "confidence": "medium",
    },
    {
        "player": "player:damien-kelly",
        "club": "club:tommy-larkins",
        "source": "https://www.tommylarkins.gaa.ie/roll-of-honour",
        "note": "Tommy Larkin's GAA Roll of Honour: county U-21 All-Ireland medallist listed for Tommy Larkins.",
        "confidence": "medium",
    },
    {
        "player": "player:darren-duggan",
        "club": "club:tommy-larkins",
        "source": "https://www.tommylarkins.gaa.ie/roll-of-honour",
        "note": "Tommy Larkin's GAA Roll of Honour: county minor All-Ireland medallist listed for Tommy Larkins.",
        "confidence": "medium",
    },
    {
        "player": "player:noel-power",
        "club": "club:tommy-larkins",
        "source": "https://www.tommylarkins.gaa.ie/roll-of-honour",
        "note": "Tommy Larkin's GAA Roll of Honour: county intermediate / U-21 All-Ireland medallist listed for Tommy Larkins.",
        "confidence": "medium",
    },
]


NEW_PLAYERS: list[dict] = [
    # --- Fohenagh / AF first (2024/2025 Galway SHC Wikipedia named scorers) ---
    {
        "name": "Owen Naughton",
        "club": "club:ahascragh-fohenagh",
        "source": "https://en.wikipedia.org/wiki/2025_Galway_Senior_Hurling_Championship",
        "note": "Named among Ahascragh–Fohenagh scorers, 2025 Galway SHC (Wikipedia).",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Ronan Kelly",
        "id": "player:ronan-kelly-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://en.wikipedia.org/wiki/2025_Galway_Senior_Hurling_Championship",
        "note": "Named among Ahascragh–Fohenagh scorers, 2025 Galway SHC (Wikipedia). Distinct id — common surname.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Cian Kelly",
        "id": "player:cian-kelly-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://en.wikipedia.org/wiki/2025_Galway_Senior_Hurling_Championship",
        "note": "Named among Ahascragh–Fohenagh scorers, 2025 Galway SHC (Wikipedia). Distinct id — common surname.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Andrew Fitzgerald",
        "id": "player:andrew-fitzgerald-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://en.wikipedia.org/wiki/2025_Galway_Senior_Hurling_Championship",
        "note": "Named among Ahascragh–Fohenagh scorers, 2025 Galway SHC (Wikipedia).",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Darragh Glynn",
        "id": "player:darragh-glynn-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://en.wikipedia.org/wiki/2024_Galway_Senior_Hurling_Championship",
        "note": "Named among Ahascragh–Fohenagh scorers (2-0), 2024 Galway SHC vs Athenry (Wikipedia mirror / championship report).",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Noel Warde",
        "club": "club:ahascragh-fohenagh",
        "source": "https://en.wikipedia.org/wiki/2025_Galway_Senior_Hurling_Championship",
        "note": "Named among Ahascragh–Fohenagh scorers, 2025 Galway SHC (Wikipedia).",
        "confidence": "unverified",
        "fohenagh": True,
    },
    # --- Annaghdown orphan ---
    {
        "name": "Damien Comer",
        "club": "club:annaghdown",
        "source": "https://en.wikipedia.org/wiki/Damien_Comer",
        "note": "Wikipedia: Annaghdown club; Connacht JHC 2014 + Galway JAHC 2014 hurling honours; HoganStand named on Annaghdown Connacht JHC final XV (2-1).",
        "confidence": "high",
    },
    {
        "name": "Tommy Greaney",
        "id": "player:tommy-greaney-annaghdown",
        "club": "club:annaghdown",
        "source": "https://annaghdown.ie/2024/10/10/tommy-greaney-cup/",
        "note": "Annaghdown Parish Council: Tommy Greaney memorialled as one of Annaghdown's finest dual players (1980s); inspired 1987 junior hurling champions.",
        "confidence": "medium",
    },
    {
        "name": "Tom Naughton",
        "id": "player:tom-naughton-annaghdown",
        "club": "club:annaghdown",
        "source": "https://en.wikipedia.org/wiki/Annaghdown_GAA",
        "note": "Listed under Annaghdown GAA Notable players on Wikipedia.",
        "confidence": "medium",
    },
    # --- Army (Galway) orphan — An Céad Cath Gaelach ---
    {
        "name": "Jim Brophy",
        "club": "club:army-galway",
        "source": "https://en.wikipedia.org/wiki/Jim_Brophy",
        "note": "Wikipedia: two-time Galway SHC medallist as An Céad Cath Gaelach (Army) captain 1947 & 1948; also one season Liam Mellows. Primary stamp Army Galway.",
        "confidence": "high",
    },
    # --- Sylane orphan ---
    {
        "name": "Oran Martin",
        "club": "club:sylane",
        "source": "https://www.connachttribune.ie/sport/sylane-edge-past-padraig-pearses-in-thrilling-division-3-league-final-8791839",
        "note": "Connacht Tribune / Tuam Herald: Sylane captain Oran Martin (Division 3 League final lineup).",
        "confidence": "unverified",
    },
    {
        "name": "Sean Newell",
        "id": "player:sean-newell-sylane",
        "club": "club:sylane",
        "source": "https://www.connachttribune.ie/sport/sylane-edge-past-padraig-pearses-in-thrilling-division-3-league-final-8791839",
        "note": "Connacht Tribune: Sean Newell named on Sylane starting XV / scorer (1-3) Division 3 League final.",
        "confidence": "unverified",
    },
    {
        "name": "John Igoe",
        "id": "player:john-igoe-sylane",
        "club": "club:sylane",
        "source": "https://www.connachttribune.ie/sport/sylane-edge-past-padraig-pearses-in-thrilling-division-3-league-final-8791839",
        "note": "Connacht Tribune: John Igoe named on Sylane starting XV / scorer (1-3).",
        "confidence": "unverified",
    },
    {
        "name": "Jake Hogan",
        "id": "player:jake-hogan-sylane",
        "club": "club:sylane",
        "source": "https://www.connachttribune.ie/sport/sylane-edge-past-padraig-pearses-in-thrilling-division-3-league-final-8791839",
        "note": "Connacht Tribune: Jake Hogan named as Sylane goalkeeper / scorer (1-1).",
        "confidence": "unverified",
    },
    # --- Micheál Breathnach orphan (HoganStand Connacht JHC 2019 lineup) ---
    {
        "name": "Brian Ó Conghaile",
        "id": "player:brian-o-conghaile-breathnach",
        "club": "club:micheal-breathnach",
        "source": "https://www.hoganstand.com/Article/Index/305723",
        "note": "HoganStand: B Ó Conghaile (1-4) named on Micheál Breathnach Connacht Club JHC final XV, 2019. Distinct id from An Spidéal Ó Conghaile family.",
        "confidence": "unverified",
    },
    {
        "name": "Mícheál Ó Conghaile",
        "id": "player:micheal-o-conghaile-breathnach",
        "club": "club:micheal-breathnach",
        "source": "https://www.hoganstand.com/Article/Index/305723",
        "note": "HoganStand: M Ó Conghaile (0-4f) named on Micheál Breathnach Connacht Club JHC final XV, 2019.",
        "confidence": "unverified",
    },
    # --- An Spidéal orphan (Galway Bay FM 2024 Connacht Junior final) ---
    {
        "name": "Pádraig Ó Conghaile",
        "id": "player:padraig-o-conghaile-spideal",
        "club": "club:an-spideal",
        "source": "https://www.galwaybayfm.ie/sports/ballinasloe-3-14-an-spideal-3-10-connacht-junior-1-hurling-final-replay-reaction-with-derek-frehill-181304",
        "note": "Galway Bay FM: Pádraig Ó Conghaile scored a goal for An Spidéal in 2024 Connacht Junior 1 hurling final replay. Distinct id — HOLD cross-club Ó Conghaile surname collisions.",
        "confidence": "unverified",
    },
    {
        "name": "Cian Ó Conghaile",
        "id": "player:cian-o-conghaile-spideal",
        "club": "club:an-spideal",
        "source": "https://www.galwaybayfm.ie/sports/ballinasloe-3-14-an-spideal-3-10-connacht-junior-1-hurling-final-replay-reaction-with-derek-frehill-181304",
        "note": "Galway Bay FM: Cian Ó Conghaile scored a goal for An Spidéal in 2024 Connacht Junior 1 hurling final replay. Distinct id — HOLD cross-club Ó Conghaile surname collisions.",
        "confidence": "unverified",
    },
    # --- Peterswell historic shell (St Thomas' club history photo caption) ---
    {
        "name": "Pat Burke",
        "id": "player:pat-burke-peterswell",
        "club": "club:peterswell",
        "source": "https://stthomassgaaclub.com/the-club/",
        "note": "St Thomas' GAA club history: Pat Burke (Captain) named on historic Peterswell championship team photo caption.",
        "confidence": "medium",
    },
    {
        "name": "Tim Forde",
        "id": "player:tim-forde-peterswell",
        "club": "club:peterswell",
        "source": "https://stthomassgaaclub.com/the-club/",
        "note": "St Thomas' GAA club history: Tim Forde named on historic Peterswell championship team photo caption.",
        "confidence": "medium",
    },
    {
        "name": "Bartley Healy",
        "id": "player:bartley-healy-peterswell",
        "club": "club:peterswell",
        "source": "https://stthomassgaaclub.com/the-club/",
        "note": "St Thomas' GAA club history: Bartley Healy named on historic Peterswell championship team photo caption.",
        "confidence": "medium",
    },
    # --- Duniry historic (TAD club history) ---
    {
        "name": "Darby Gilchrist",
        "id": "player:darby-gilchrist-duniry",
        "club": "club:duniry-historic",
        "source": "https://tadhurlingclub.ie/history/",
        "note": "Tynagh-Abbey/Duniry club history: Darby Gilchrist on Duniry teams that reached Galway SHC finals 1906/1907; also Galway county player.",
        "confidence": "medium",
    },
    {
        "name": "John Smyth",
        "id": "player:john-smyth-duniry",
        "club": "club:duniry-historic",
        "source": "https://tadhurlingclub.ie/history/",
        "note": "Tynagh-Abbey/Duniry club history: John Smyth on Duniry teams that reached Galway SHC finals 1906/1907; also Galway county player.",
        "confidence": "medium",
    },
    # --- Tynagh historic additional named ---
    {
        "name": "Hubert Gordon",
        "id": "player:hubert-gordon-tynagh",
        "club": "club:tynagh-historic",
        "source": "https://tadhurlingclub.ie/history/",
        "note": "TAD club history: Hubert Gordon from Tynagh on 1920s unbeaten championship side alongside 1923 All-Ireland winners.",
        "confidence": "medium",
    },
    {
        "name": "Jack Dervan",
        "id": "player:jack-dervan-tynagh",
        "club": "club:tynagh-historic",
        "source": "https://tadhurlingclub.ie/history/",
        "note": "TAD club history: Jack Dervan from Tynagh on 1920s championship side (distinct from Mick Dervan).",
        "confidence": "medium",
    },
    # --- Abbeyknockmoy thin fill ---
    {
        "name": "Declan Molloy",
        "id": "player:declan-molloy-abbeyknockmoy",
        "club": "club:abbeyknockmoy",
        "source": "https://www.galwaybayfm.ie/podcasts/uncategorized/from-the-archives-abbeyknockmoy-hurlers-suffer-croke-park-heart-break-175550",
        "note": "Galway Bay FM archive: Declan Molloy named #1 on Abbeyknockmoy 2016 All-Ireland Intermediate Club final XV.",
        "confidence": "unverified",
    },
    # --- Club-less inter-county panel / wiki bio ---
    {
        "name": "Kevin Cooney",
        "club": "club:sarsfields",
        "source": "https://en.wikipedia.org/wiki/Kevin_Cooney_(hurler)",
        "note": "Wikipedia: Galway Senior Championship club Sarsfields; 2015 county championship-winning team.",
        "confidence": "high",
    },
]


# Explicit HOLDs (do not stamp / do not overwrite)
HOLD_PLAYERS = {
    "player:michael-healy",
    "player:michael-conneely",
    "player:kerrill-wade",
    "player:padraic-brehony",
    "player:padraig-breheny",
    "player:aonghus-dervan",
    "player:brendan-dervan",
    # modern Mullagh Dervans — do not stamp without person-page club cite
    "player:pakie-dervan",
    "player:patrick-dervan",
    "player:gordan-glynn",
    "player:john-ryan",
    "player:finnian-coone",
    # Era / club collisions
    "player:tom-monaghan",  # 1983/86 panels ≠ modern Thomas Monaghan (Craughwell)
    "player:tony-og-regan",  # already Clarinbridge; Wiki Rahoon-Newcastle — no overwrite
    "player:greg-thomas",  # already Ballygar; Wiki Castlegar — no overwrite
    "player:kevin-broderick",  # already Craughwell; TAD cites conflict — no overwrite
}


CLUB_META_UPDATES: list[dict] = [
    {
        "id": "club:peterswell",
        "cols": {
            "status": "historic predecessor",
            "successor": "club:st-thomas",
            "note": "Amalgamated with Kilchreest (1968) to form St Thomas'. Seven Galway SHC titles 1889–1907 (club / Wikipedia).",
            "source": "https://en.wikipedia.org/wiki/St_Thomas'_GAA",
        },
    },
    {
        "id": "club:woodford",
        "cols": {
            "status": "historic predecessor",
            "successor": "club:tommy-larkins",
            "note": "Amalgamated with Ballinakill (1968) to form Tommy Larkin's. Galway SHC titles 1913, 1917. Named 1914 poem surnames HOLD (incomplete first names).",
            "source": "https://en.wikipedia.org/wiki/Tommy_Larkin's_GAA",
        },
    },
    {
        "id": "club:army-galway",
        "cols": {
            "aka": "An Céad Cath Gaelach",
            "note": "Army / An Céad Cath Gaelach — Galway SHC winners 1947, 1948 (Galway GAA stats; Jim Brophy Wikipedia).",
            "source": "https://en.wikipedia.org/wiki/Jim_Brophy",
        },
    },
    {
        "id": "club:newcastle-galway",
        "cols": {
            "note": "HOLD orphan: modern club is Rahoon–Newcastle (seed club:rahoon holds John Hanbury). No distinct Newcastle-only named-player cite this run — do not invent links.",
            "source": "https://en.wikipedia.org/wiki/Rahoon-Newcastle_GAA",
        },
    },
    {
        "id": "club:claregalway",
        "cols": {
            "note": "HOLD orphan this run: modern Claregalway CLG is primarily football; parish hurling largely Carnmore (club history). No named Claregalway hurling player cite harvested.",
            "source": "https://en.wikipedia.org/wiki/Claregalway_CLG",
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
    if pid in HOLD_PLAYERS and pid != "player:mick-dervan":
        # mick-dervan is allowed for tynagh-historic cite; other HOLDs blocked
        stats["held"] += 1
        return False
    # Special-case: allow mick-dervan only when club is tynagh-historic
    if pid == "player:mick-dervan" and club != "club:tynagh-historic":
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
    # Clear prior Mullagh-family HOLD stigma when linking historic Mick Dervan to Tynagh
    if pid == "player:mick-dervan":
        set_or_add(seed, pair_index, by_row, pid, "hold", False, stats)
        set_or_add(seed, pair_index, by_row, pid, "status", "pending_archivist", stats)
    linked_ids.append(pid)
    stats["players_linked"] += 1

    if stamp_appearances:
        for row, a in list(by_row.items()):
            if not row.startswith("appearance:"):
                continue
            if a.get("player") != pid:
                continue
            if a.get("hold") is True and (
                "collision" in str(a.get("note") or "").lower()
                or "do not stamp" in str(a.get("note") or "").lower()
            ):
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


def main():
    seed = json.loads(SEED_PATH.read_text())
    by_row, pair_index = build_index(seed)
    before = count_stats(by_row)

    stats = defaultdict(int)
    linked_ids: list[str] = []
    created_ids: list[str] = []
    fohenagh_new: list[str] = []
    fohenagh_linked: list[str] = []

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

    for meta in CLUB_META_UPDATES:
        cid = meta["id"]
        if cid not in by_row or by_row[cid].get("type") != "club":
            stats["club_meta_missing"] += 1
            continue
        for col, val in meta["cols"].items():
            # append note rather than clobber rich notes
            if col == "note" and by_row[cid].get("note"):
                old = by_row[cid]["note"]
                if val not in old:
                    set_or_add(seed, pair_index, by_row, cid, "note", (old + " " + val).strip(), stats)
                continue
            set_or_add(seed, pair_index, by_row, cid, col, val, stats)
        stats["club_meta_touched"] += 1

    # HOLD notes on collision ids (preserve existing clubs — stamp hold flag only)
    hold_notes = {
        "player:tom-monaghan": "HOLD: 1983 minor / 1986 U-21 panel id — not the modern Craughwell Thomas Monaghan (player:thomas-monaghan). No club stamp.",
        "player:tony-og-regan": "HOLD overwrite: Wikipedia club Rahoon-Newcastle but seed already Clarinbridge — do not overwrite.",
        "player:greg-thomas": "HOLD overwrite: Wikipedia club Castlegar but seed already Ballygar — do not overwrite.",
        "player:kevin-broderick": "HOLD overwrite: Wikipedia/Craughwell stamp retained; Tynagh-Abbey/Duniry cites conflict — no overwrite.",
    }
    for pid, hnote in hold_notes.items():
        if pid not in by_row or by_row[pid].get("type") != "player":
            continue
        # Do not clear an existing club
        set_or_add(seed, pair_index, by_row, pid, "hold", True, stats)
        if not by_row[pid].get("club"):
            set_or_add(seed, pair_index, by_row, pid, "status", "hold", stats)
        note = by_row[pid].get("note") or ""
        if "HOLD" not in note:
            set_or_add(seed, pair_index, by_row, pid, "note", (note + " " + hnote).strip(), stats)

    after = count_stats(by_row)
    now = datetime.now(timezone.utc).isoformat()

    pack = {
        "pack": "galway-club-player-links",
        "round": "3",
        "generated_at": now,
        "sources": [
            "https://en.wikipedia.org/wiki/2025_Galway_Senior_Hurling_Championship",
            "https://en.wikipedia.org/wiki/2024_Galway_Senior_Hurling_Championship",
            "https://en.wikipedia.org/wiki/Damien_Comer",
            "https://en.wikipedia.org/wiki/Annaghdown_GAA",
            "https://en.wikipedia.org/wiki/Jim_Brophy",
            "https://en.wikipedia.org/wiki/Jim_Power_(hurler)",
            "https://en.wikipedia.org/wiki/Tynagh_GAA",
            "https://en.wikipedia.org/wiki/Liam_Hodgins",
            "https://en.wikipedia.org/wiki/Kevin_Cooney_(hurler)",
            "https://en.wikipedia.org/wiki/Category:Abbeyknockmoy_hurlers",
            "https://en.wikipedia.org/wiki/St_Thomas'_GAA",
            "https://en.wikipedia.org/wiki/Tommy_Larkin's_GAA",
            "https://stthomassgaaclub.com/the-club/",
            "https://tadhurlingclub.ie/history/",
            "https://www.tommylarkins.gaa.ie/roll-of-honour",
            "https://www.connachttribune.ie/sport/sylane-edge-past-padraig-pearses-in-thrilling-division-3-league-final-8791839",
            "https://www.tuamherald.ie/2025/08/27/martin-stars-in-crucial-sylanevictory/",
            "https://www.hoganstand.com/Article/Index/305723",
            "https://www.galwaybayfm.ie/sports/ballinasloe-3-14-an-spideal-3-10-connacht-junior-1-hurling-final-replay-reaction-with-derek-frehill-181304",
            "https://annaghdown.ie/2024/10/10/tommy-greaney-cup/",
            "https://www.galwaybayfm.ie/podcasts/uncategorized/from-the-archives-abbeyknockmoy-hurlers-suffer-croke-park-heart-break-175550",
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
        },
        "sample_linked_ids": linked_ids[:40],
        "sample_created_ids": created_ids[:40],
        "all_linked_ids": linked_ids,
        "all_created_ids": created_ids,
        "fohenagh_new_player_ids": fohenagh_new,
        "fohenagh_linked_existing_ids": fohenagh_linked,
        "holds": sorted(HOLD_PLAYERS),
        "stats": dict(stats),
        "priority_club_counts_after": {
            c: after["players_per_club"].get(c, 0)
            for c in [
                "club:fohenagh-historic",
                "club:ahascragh-fohenagh",
                "club:annaghdown",
                "club:claregalway",
                "club:an-spideal",
                "club:sylane",
                "club:peterswell",
                "club:woodford",
                "club:newcastle-galway",
                "club:abbeyknockmoy",
                "club:tynagh-abbey-duniry",
                "club:tynagh-historic",
                "club:duniry-historic",
                "club:abbey-duniry-historic",
                "club:micheal-breathnach",
                "club:army-galway",
                "club:tommy-larkins",
            ]
        },
        "still_orphan_priority": [
            c
            for c in [
                "club:annaghdown",
                "club:claregalway",
                "club:an-spideal",
                "club:sylane",
                "club:peterswell",
                "club:woodford",
                "club:newcastle-galway",
                "club:abbeyknockmoy",
                "club:tynagh-abbey-duniry",
                "club:micheal-breathnach",
                "club:army-galway",
                "club:tynagh-historic",
                "club:duniry-historic",
                "club:abbey-duniry-historic",
            ]
            if c in after["orphan_ids"]
        ],
    }

    SEED_PATH.write_text(json.dumps(seed, indent=2, ensure_ascii=False) + "\n")
    PACK_PATH.write_text(json.dumps(pack, indent=2, ensure_ascii=False) + "\n")

    log = {
        "url": "https://en.wikipedia.org/wiki/ + Connacht Tribune + HoganStand + Galway Bay FM + TAD / St Thomas' club histories",
        "date": "2026-09-06",
        "title": "Fill more Galway orphan clubs and player-club links",
        "publisher": "Wikipedia / Connacht Tribune / Tuam Herald / HoganStand / Galway Bay FM / club sites / HurlingWiki",
        "processed_at": now,
        "pack": "data/pack-galway-club-player-links.json",
        "queue": "data/ina-queue/archivist-fohenagh-club-links.json",
        "before_players_with_club": before["with_club"],
        "after_players_with_club": after["with_club"],
        "players_linked": stats["players_linked"],
        "players_created": stats["players_created"],
        "before_orphan_clubs": before["orphans"],
        "after_orphan_clubs": after["orphans"],
        "fohenagh_new": fohenagh_new,
        "fohenagh_linked": fohenagh_linked,
        "sample_linked": linked_ids[:15],
        "sample_created": created_ids[:15],
        "holds": sorted(HOLD_PLAYERS),
        "still_orphan_priority": pack["still_orphan_priority"],
        "priority_clubs": pack["priority_club_counts_after"],
    }
    with LOG_PATH.open("a") as f:
        f.write(json.dumps(log, ensure_ascii=False) + "\n")

    # Append a short archivist queue note for Fohenagh new unverified
    if fohenagh_new or fohenagh_linked:
        q = {
            "batch": "fohenagh-club-links-r3",
            "ruled_at": now,
            "clear_links": fohenagh_linked,
            "unverified_new": fohenagh_new,
            "note": "AF 2024/2025 Wikipedia SHC scorer names — confidence unverified pending Archivist dual-source.",
        }
        existing = []
        if QUEUE_PATH.exists():
            try:
                existing = json.loads(QUEUE_PATH.read_text())
                if not isinstance(existing, list):
                    existing = [existing]
            except Exception:
                existing = []
        existing.append(q)
        QUEUE_PATH.write_text(json.dumps(existing, indent=2, ensure_ascii=False) + "\n")

    summary = {
        "before_with_club": before["with_club"],
        "after_with_club": after["with_club"],
        "before_orphans": before["orphans"],
        "after_orphans": after["orphans"],
        "linked": stats["players_linked"],
        "created": stats["players_created"],
        "orphan_ids_after": after["orphan_ids"],
        "priority_clubs": pack["priority_club_counts_after"],
        "still_orphan_priority": pack["still_orphan_priority"],
        "fohenagh_new": fohenagh_new,
        "fohenagh_linked": fohenagh_linked,
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
