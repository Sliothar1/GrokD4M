#!/usr/bin/env python3
"""Round 4: Galway orphan club fills + club-less player links (cited public sources only).

Priority: Fohenagh/AF first, then Abbey-Duniry historic, Newcastle (1960), Woodford,
Claregalway meta HOLD, club-less panel links when cites name club.
Unverified for new; HOLD collisions. Never invent scores. Match shells only when
public win is clear; scores only if already double-sourced elsewhere or skipped.
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
# LINK existing club-less players (Wikipedia / club history cites)
# Fohenagh / AF first where applicable — none club-less this round.
# ---------------------------------------------------------------------------
WIKI_LINKS: list[dict] = [
    {
        "player": "player:eanna-burke",
        "club": "club:st-thomas",
        "source": "https://en.wikipedia.org/wiki/%C3%89anna_Burke",
        "note": "Wikipedia: club St Thomas'; Galway SHC / All-Ireland club medallist; 2017 All-Ireland SHC panel.",
        "confidence": "high",
    },
    {
        "player": "player:eamon-brannigan",
        "club": "club:rahoon",
        "source": "https://rahoonnewcastle.ie/the-club/",
        "note": "Rahoon/Newcastle club history: Eamon Brannigan won All-Ireland Intermediate title with Galway (2015); club stamp Rahoon–Newcastle (seed club:rahoon).",
        "confidence": "medium",
    },
]


NEW_PLAYERS: list[dict] = [
    # --- Fohenagh / AF first (2023/2024 Galway SHC Wikipedia named scorers) ---
    {
        "name": "Fintan Glynn",
        "id": "player:fintan-glynn-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://en.wikipedia.org/wiki/2023_Galway_Senior_Hurling_Championship",
        "note": "Named among Ahascragh–Fohenagh scorers (0-1), 2023 Galway SHC vs Liam Mellows (Wikipedia). Distinct id — Glynn surname common.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Liam Warde",
        "id": "player:liam-warde-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://en.wikipedia.org/wiki/2024_Galway_Senior_Hurling_Championship",
        "note": "Named among Ahascragh–Fohenagh scorers (0-1), 2024 Galway SHC vs Athenry (Wikipedia). Distinct from Noel Warde.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    # --- Abbey-Duniry historic (1999 Galway SHC final XV — Irish Independent + Mattie Kenny wiki) ---
    {
        "name": "Mattie Kenny",
        "id": "player:mattie-kenny",
        "club": "club:abbey-duniry-historic",
        "source": "https://en.wikipedia.org/wiki/Mattie_Kenny",
        "note": "Wikipedia: lined out with Galway SHC club Abbey/Duniry; top scorer 0-7 (frees) in 1999 Galway SHC final vs Athenry (Irish Independent). Later managed Dublin / Tynagh-Abbey/Duniry.",
        "confidence": "high",
    },
    {
        "name": "P.J. Kenny",
        "id": "player:pj-kenny-abbey-duniry",
        "club": "club:abbey-duniry-historic",
        "source": "https://www.independent.ie/sport/athenry-delight-as-abbey-fail-to-spark/26136359.html",
        "note": "Irish Independent 1999 Galway SHC final: P J Kenny named on Abbey-Duniry XV / scorer (0-1).",
        "confidence": "unverified",
    },
    {
        "name": "Kevin Devine",
        "id": "player:kevin-devine-abbey-duniry",
        "club": "club:abbey-duniry-historic",
        "source": "https://www.independent.ie/sport/athenry-delight-as-abbey-fail-to-spark/26136359.html",
        "note": "Irish Independent 1999 Galway SHC final: K Devine named Abbey-Duniry goalkeeper.",
        "confidence": "unverified",
    },
    {
        "name": "Kieran Finnerty",
        "id": "player:kieran-finnerty-abbey-duniry",
        "club": "club:abbey-duniry-historic",
        "source": "https://www.independent.ie/sport/athenry-delight-as-abbey-fail-to-spark/26136359.html",
        "note": "Irish Independent 1999 Galway SHC final: K Finnerty named on Abbey-Duniry XV. Distinct id — do not collide with club-less panel Kieran Finnerty.",
        "confidence": "unverified",
    },
    {
        "name": "Noel Finnerty",
        "id": "player:noel-finnerty-abbey-duniry",
        "club": "club:abbey-duniry-historic",
        "source": "https://www.independent.ie/sport/athenry-delight-as-abbey-fail-to-spark/26136359.html",
        "note": "Irish Independent 1999 Galway SHC final: N Finnerty named on Abbey-Duniry XV.",
        "confidence": "unverified",
    },
    {
        "name": "Vincent Kavanagh",
        "id": "player:vincent-kavanagh-abbey-duniry",
        "club": "club:abbey-duniry-historic",
        "source": "https://www.independent.ie/sport/athenry-delight-as-abbey-fail-to-spark/26136359.html",
        "note": "Irish Independent 1999 Galway SHC final: V Kavanagh named on Abbey-Duniry XV.",
        "confidence": "unverified",
    },
    {
        "name": "Tom Kavanagh",
        "id": "player:tom-kavanagh-abbey-duniry",
        "club": "club:abbey-duniry-historic",
        "source": "https://www.independent.ie/sport/athenry-delight-as-abbey-fail-to-spark/26136359.html",
        "note": "Irish Independent 1999 Galway SHC final: T Kavanagh named on Abbey-Duniry XV.",
        "confidence": "unverified",
    },
    {
        "name": "Frank Flynn",
        "id": "player:frank-flynn-abbey-duniry",
        "club": "club:abbey-duniry-historic",
        "source": "https://www.independent.ie/sport/athenry-delight-as-abbey-fail-to-spark/26136359.html",
        "note": "Irish Independent 1999 Galway SHC final: F Flynn named on Abbey-Duniry XV. Distinct from historic Duniry Frank Flynn (NHL 1951) HOLD if other cites appear.",
        "confidence": "unverified",
    },
    {
        "name": "James Shiel",
        "id": "player:james-shiel-abbey-duniry",
        "club": "club:abbey-duniry-historic",
        "source": "https://www.independent.ie/sport/athenry-delight-as-abbey-fail-to-spark/26136359.html",
        "note": "Irish Independent 1999 Galway SHC final: J Shiel named on Abbey-Duniry XV.",
        "confidence": "unverified",
    },
    {
        "name": "Michael Shiel",
        "id": "player:michael-shiel-abbey-duniry",
        "club": "club:abbey-duniry-historic",
        "source": "https://www.independent.ie/sport/athenry-delight-as-abbey-fail-to-spark/26136359.html",
        "note": "Irish Independent 1999 Galway SHC final: M Shiel named on Abbey-Duniry XV.",
        "confidence": "unverified",
    },
    {
        "name": "Niall Shiel",
        "id": "player:niall-shiel-abbey-duniry",
        "club": "club:abbey-duniry-historic",
        "source": "https://www.independent.ie/sport/athenry-delight-as-abbey-fail-to-spark/26136359.html",
        "note": "Irish Independent / Athenry GAA 1998: Niall Shiel named Abbey-Duniry sub / scorer who levelled 1998 final.",
        "confidence": "unverified",
    },
    {
        "name": "Ger Lynch",
        "id": "player:ger-lynch-abbey-duniry",
        "club": "club:abbey-duniry-historic",
        "source": "https://www.independent.ie/sport/athenry-delight-as-abbey-fail-to-spark/26136359.html",
        "note": "Irish Independent 1999 Galway SHC final: G Lynch named on Abbey-Duniry XV.",
        "confidence": "unverified",
    },
    {
        "name": "Damien Donnelly",
        "id": "player:damien-donnelly-abbey-duniry",
        "club": "club:abbey-duniry-historic",
        "source": "https://www.independent.ie/sport/athenry-delight-as-abbey-fail-to-spark/26136359.html",
        "note": "Irish Independent 1999 Galway SHC final: D Donnelly named on Abbey-Duniry XV.",
        "confidence": "unverified",
    },
    {
        "name": "Declan Power",
        "id": "player:declan-power-abbey-duniry",
        "club": "club:abbey-duniry-historic",
        "source": "https://www.independent.ie/sport/athenry-delight-as-abbey-fail-to-spark/26136359.html",
        "note": "Irish Independent 1999 Galway SHC final: D Power (Red) named on Abbey-Duniry XV.",
        "confidence": "unverified",
    },
    # --- Newcastle (Galway) orphan — 1960 Intermediate champions photo caption (Athenry GAA) ---
    {
        "name": "George Moran",
        "id": "player:george-moran-newcastle",
        "club": "club:newcastle-galway",
        "source": "https://athenrygaa.ie/index.php/history-photo-gallery/1960-1963",
        "note": "Athenry GAA history photo caption: George Moran named on Newcastle County Intermediate Hurling Champions 1960.",
        "confidence": "medium",
    },
    {
        "name": "Bernie Rohan",
        "id": "player:bernie-rohan-newcastle",
        "club": "club:newcastle-galway",
        "source": "https://athenrygaa.ie/index.php/history-photo-gallery/1960-1963",
        "note": "Athenry GAA history: Bernie Rohan named on Newcastle Intermediate champions 1960.",
        "confidence": "medium",
    },
    {
        "name": "Sean Connors",
        "id": "player:sean-connors-newcastle",
        "club": "club:newcastle-galway",
        "source": "https://athenrygaa.ie/index.php/history-photo-gallery/1960-1963",
        "note": "Athenry GAA history: Sean Connors named on Newcastle Intermediate champions 1960.",
        "confidence": "medium",
    },
    {
        "name": "Bertie Burns",
        "id": "player:bertie-burns-newcastle",
        "club": "club:newcastle-galway",
        "source": "https://athenrygaa.ie/index.php/history-photo-gallery/1960-1963",
        "note": "Athenry GAA history: Bertie Burns named on Newcastle Intermediate champions 1960.",
        "confidence": "medium",
    },
    {
        "name": "Frank Burke",
        "id": "player:frank-burke-newcastle",
        "club": "club:newcastle-galway",
        "source": "https://athenrygaa.ie/index.php/history-photo-gallery/1960-1963",
        "note": "Athenry GAA history: Frank Burke named on Newcastle Intermediate champions 1960 (distinct id — Burke surname common).",
        "confidence": "medium",
    },
    {
        "name": "Paddy Joe Rabbitte",
        "id": "player:paddy-joe-rabbitte-newcastle",
        "club": "club:newcastle-galway",
        "source": "https://athenrygaa.ie/index.php/history-photo-gallery/1960-1963",
        "note": "Athenry GAA history: Paddy Joe Rabbitte named on Newcastle Intermediate champions 1960.",
        "confidence": "medium",
    },
    {
        "name": "Kerill Burke",
        "id": "player:kerill-burke-newcastle",
        "club": "club:newcastle-galway",
        "source": "https://athenrygaa.ie/index.php/history-photo-gallery/1960-1963",
        "note": "Athenry GAA history: Kerill Burke named on Newcastle Intermediate champions 1960.",
        "confidence": "medium",
    },
    {
        "name": "Christy Glynn",
        "id": "player:christy-glynn-newcastle",
        "club": "club:newcastle-galway",
        "source": "https://athenrygaa.ie/index.php/history-photo-gallery/1960-1963",
        "note": "Athenry GAA history: Christy Glynn named on Newcastle Intermediate champions 1960. Distinct from modern panel Sean Glynn (HOLD).",
        "confidence": "medium",
    },
    {
        "name": "Tony Morris",
        "id": "player:tony-morris-newcastle",
        "club": "club:newcastle-galway",
        "source": "https://athenrygaa.ie/index.php/history-photo-gallery/1960-1963",
        "note": "Athenry GAA history: Tony Morris named on Newcastle Intermediate champions 1960.",
        "confidence": "medium",
    },
    {
        "name": "Tommy Madden",
        "id": "player:tommy-madden-newcastle",
        "club": "club:newcastle-galway",
        "source": "https://athenrygaa.ie/index.php/history-photo-gallery/1960-1963",
        "note": "Athenry GAA history: Tommy Madden named on Newcastle Intermediate champions 1960.",
        "confidence": "medium",
    },
    # --- Woodford orphan — only clear first+last from club 1914 poem (surnames-only HOLD) ---
    {
        "name": "Jack Grady",
        "id": "player:jack-grady-woodford",
        "club": "club:woodford",
        "source": "https://www.tommylarkins.gaa.ie/history",
        "note": "Tommy Larkin's club history: 1914 Woodford poem by Michael Power names Jack Grady among Woodford fifteen. Other poem surnames HOLD (incomplete first names).",
        "confidence": "medium",
    },
    # --- Killimordaly thin fill / club-less panel ---
    {
        "name": "Tom Donoghue",
        "id": "player:tom-donoghue",
        "club": "club:killimordaly",
        "source": "https://en.wikipedia.org/wiki/Tom_Donoghue",
        "note": "Wikipedia: began club career with Killimordaly; later Ballinamere / Offaly. Listed Killimordaly GAA Notable players / Category:Killimordaly hurlers.",
        "confidence": "high",
    },
    {
        "name": "Jack Fitzpatrick",
        "id": "player:jack-fitzpatrick",
        "club": "club:killimordaly",
        "source": "https://en.wikipedia.org/wiki/Jack_Fitzpatrick_(hurler)",
        "note": "Wikipedia: Galway Senior Championship club Killimordaly; All-Ireland MHC 2015.",
        "confidence": "high",
    },
    # --- Carnmore thin (Claregalway parish hurling — not Claregalway CLG stamp) ---
    {
        "name": "Malachy Hanley",
        "id": "player:malachy-hanley-carnmore",
        "club": "club:carnmore",
        "source": "https://www.carnmoregaa.net/about",
        "note": "Carnmore GAA club history: Intermediate crown 1988 side captained by Malachy Hanley. Parish hurling club (Claregalway football club remains separate — HOLD Claregalway hurling player invent).",
        "confidence": "medium",
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
    "player:pakie-dervan",
    "player:patrick-dervan",
    "player:gordan-glynn",
    "player:john-ryan",
    "player:finnian-coone",
    "player:tom-monaghan",
    "player:tony-og-regan",
    "player:greg-thomas",
    "player:kevin-broderick",
    # Do not stamp modern panel Sean Glynn onto 1960 Newcastle
    "player:sean-glynn",
    # Brian Concannon already Loughrea — Wiki Killimordaly conflict
    "player:brian-concannon",
    # Existing club-less Kieran Finnerty — era unknown; Abbey-Duniry gets distinct id
    "player:kieran-finnerty",
}


CLUB_META_UPDATES: list[dict] = [
    {
        "id": "club:abbey-duniry-historic",
        "cols": {
            "note": "1999 Galway SHC final XV cited Irish Independent (scorers also on Wikipedia 1999 page). Kevin Broderick HOLD (seed Craughwell). Liam Hodgins already stamped club:tynagh-abbey-duniry — no overwrite.",
            "source_independent": "https://www.independent.ie/sport/athenry-delight-as-abbey-fail-to-spark/26136359.html",
            "source_wiki_mattie": "https://en.wikipedia.org/wiki/Mattie_Kenny",
        },
    },
    {
        "id": "club:newcastle-galway",
        "cols": {
            "status": "historic predecessor",
            "successor": "club:rahoon",
            "note": "Historic Newcastle won Galway IHC 1960 (Wikipedia roll). Amalgamated with Rahoon (1981) as Rahoon–Newcastle (seed club:rahoon). 1960 XV from Athenry GAA photo caption. Modern players (Hanbury, Brannigan) stamped on club:rahoon.",
            "Galway Intermediate Hurling Championship": "1960",
            "source": "https://en.wikipedia.org/wiki/Galway_Intermediate_Hurling_Championship",
            "source_caption": "https://athenrygaa.ie/index.php/history-photo-gallery/1960-1963",
            "source_club": "https://rahoonnewcastle.ie/the-club/",
        },
    },
    {
        "id": "club:woodford",
        "cols": {
            "note": "Jack Grady cited from 1914 Woodford poem (Tommy Larkin's club history). Remaining poem surnames (Fahys, Coens, Conroy, Burke, Kelly, Page, Gormans) HOLD — incomplete first names.",
            "source_history": "https://www.tommylarkins.gaa.ie/history",
        },
    },
    {
        "id": "club:claregalway",
        "cols": {
            "status": "football parish club; historic hurling predecessor",
            "hurling_successor": "club:carnmore",
            "note": "HOLD orphan for hurling players: modern Claregalway CLG is primarily football; parish hurling is Carnmore (Carnmore GAA about + Claregalway further-history). No named Claregalway-only hurling player cite this run — do not invent links. Carnmore thin fill separate.",
            "source": "https://www.claregalwaygaa.net/about-claregalway-gaa/club-history/further-history/",
            "source_carnmore": "https://www.carnmoregaa.net/about",
        },
    },
    {
        "id": "club:rahoon",
        "cols": {
            "alias": "Rahoon GAA, Rahoon-Newcastle, Rahoon/Newcastle",
            "note": "Modern amalgam includes historic Newcastle (club:newcastle-galway). John Hanbury + Eamon Brannigan stamped here.",
            "source_club": "https://rahoonnewcastle.ie/the-club/",
        },
    },
]


NEW_MATCHES: list[dict] = [
    # Easy public win — Wikipedia Intermediate roll; score omitted (single public score line, no second source yet)
    {
        "id": "match:galway-ihc-1960-final",
        "cols": {
            "type": "match",
            "name": "Newcastle vs Ballinderreen (1960 Galway IHC Final)",
            "competition": "Galway Intermediate Hurling Championship",
            "round": "Final",
            "year": 1960,
            "home": "club:newcastle-galway",
            "away": "club:ballinderreen",
            "winner": "club:newcastle-galway",
            "runner_up": "club:ballinderreen",
            "venue": None,
            "note": "Newcastle won Galway Intermediate Hurling Championship 1960 (Wikipedia Intermediate championship roll; Athenry GAA history names the champion side). Score withheld pending second public source (Wiki alone lists 2-04 to 2-03).",
            "confidence": "medium",
            "source": "https://en.wikipedia.org/wiki/Galway_Intermediate_Hurling_Championship",
            "source_caption": "https://athenrygaa.ie/index.php/history-photo-gallery/1960-1963",
            "result": "win",
            "historic_club": "club:newcastle-galway",
        },
    },
]


MATCH_META_UPDATES: list[dict] = [
    {
        "id": "match:galway-shc-1999-final",
        "cols": {
            "secondary_cite": "1999-10-25 · Irish Independent",
            "secondary_cite_paper": "Irish Independent",
            "secondary_cite_date": "1999-10-25",
            "secondary_cite_url": "https://www.independent.ie/sport/athenry-delight-as-abbey-fail-to-spark/26136359.html",
            "ingest_triage": "secondary_cite",
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
    if val is None:
        return "skipped_none"
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
    matches_added: list[str] = []

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
            if col == "note" and by_row[cid].get("note"):
                old = by_row[cid]["note"]
                if val not in old:
                    set_or_add(seed, pair_index, by_row, cid, "note", (old + " " + val).strip(), stats)
                continue
            if col == "alias" and by_row[cid].get("alias"):
                # merge aliases
                old = by_row[cid]["alias"]
                if val not in old:
                    set_or_add(seed, pair_index, by_row, cid, "alias", old + ", " + val if val not in old else old, stats)
                continue
            set_or_add(seed, pair_index, by_row, cid, col, val, stats)
        stats["club_meta_touched"] += 1

    for m in NEW_MATCHES:
        mid = m["id"]
        if mid in by_row and by_row[mid].get("type") == "match":
            stats["match_exists"] += 1
            continue
        for col, val in m["cols"].items():
            set_or_add(seed, pair_index, by_row, mid, col, val, stats)
        matches_added.append(mid)
        stats["matches_added"] += 1

    for meta in MATCH_META_UPDATES:
        mid = meta["id"]
        if mid not in by_row or by_row[mid].get("type") != "match":
            stats["match_meta_missing"] += 1
            continue
        for col, val in meta["cols"].items():
            set_or_add(seed, pair_index, by_row, mid, col, val, stats)
        stats["match_meta_touched"] += 1

    hold_notes = {
        "player:tom-monaghan": "HOLD: 1983 minor / 1986 U-21 panel id — not the modern Craughwell Thomas Monaghan. No club stamp.",
        "player:tony-og-regan": "HOLD overwrite: Wikipedia/Rahoon-Newcastle but seed already Clarinbridge — do not overwrite.",
        "player:greg-thomas": "HOLD overwrite: Wikipedia Castlegar but seed already Ballygar — do not overwrite.",
        "player:kevin-broderick": "HOLD overwrite: seed Craughwell retained; Abbey-Duniry/TAD cites conflict — no overwrite.",
        "player:brian-concannon": "HOLD overwrite: seed Loughrea retained; Wikipedia Killimordaly cites conflict — no overwrite.",
        "player:sean-glynn": "HOLD: modern 2005/2007 panel Sean Glynn — do not stamp onto 1960 Newcastle Christy/Sean Glynn caption ids.",
        "player:kieran-finnerty": "HOLD: club-less panel Kieran Finnerty — Abbey-Duniry 1999 K Finnerty uses distinct id player:kieran-finnerty-abbey-duniry.",
    }
    for pid, hnote in hold_notes.items():
        if pid not in by_row or by_row[pid].get("type") != "player":
            continue
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
        "round": "4",
        "generated_at": now,
        "sources": [
            "https://en.wikipedia.org/wiki/2023_Galway_Senior_Hurling_Championship",
            "https://en.wikipedia.org/wiki/2024_Galway_Senior_Hurling_Championship",
            "https://en.wikipedia.org/wiki/Mattie_Kenny",
            "https://en.wikipedia.org/wiki/%C3%89anna_Burke",
            "https://en.wikipedia.org/wiki/Tom_Donoghue",
            "https://en.wikipedia.org/wiki/Jack_Fitzpatrick_(hurler)",
            "https://en.wikipedia.org/wiki/Galway_Intermediate_Hurling_Championship",
            "https://www.independent.ie/sport/athenry-delight-as-abbey-fail-to-spark/26136359.html",
            "https://athenrygaa.ie/index.php/history-photo-gallery/1960-1963",
            "https://www.tommylarkins.gaa.ie/history",
            "https://rahoonnewcastle.ie/the-club/",
            "https://www.carnmoregaa.net/about",
            "https://www.claregalwaygaa.net/about-claregalway-gaa/club-history/further-history/",
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
            "matches_added": stats["matches_added"],
            "players_with_club": after["with_club"] - before["with_club"],
            "orphan_clubs": after["orphans"] - before["orphans"],
        },
        "sample_linked_ids": linked_ids[:40],
        "sample_created_ids": created_ids[:40],
        "all_linked_ids": linked_ids,
        "all_created_ids": created_ids,
        "matches_added_ids": matches_added,
        "fohenagh_new_player_ids": fohenagh_new,
        "fohenagh_linked_existing_ids": fohenagh_linked,
        "holds": sorted(HOLD_PLAYERS),
        "stats": dict(stats),
        "priority_club_counts_after": {
            c: after["players_per_club"].get(c, 0)
            for c in [
                "club:fohenagh-historic",
                "club:ahascragh-fohenagh",
                "club:claregalway",
                "club:woodford",
                "club:newcastle-galway",
                "club:abbey-duniry-historic",
                "club:rahoon",
                "club:carnmore",
                "club:killimordaly",
                "club:st-thomas",
                "club:tommy-larkins",
            ]
        },
        "still_orphan_priority": [
            c
            for c in [
                "club:claregalway",
                "club:woodford",
                "club:newcastle-galway",
                "club:abbey-duniry-historic",
            ]
            if c in after["orphan_ids"]
        ],
    }

    SEED_PATH.write_text(json.dumps(seed, indent=2, ensure_ascii=False) + "\n")
    PACK_PATH.write_text(json.dumps(pack, indent=2, ensure_ascii=False) + "\n")

    log = {
        "url": "Wikipedia + Irish Independent + Athenry GAA + Tommy Larkin's + Rahoon/Newcastle + Carnmore club histories",
        "date": "2026-09-06",
        "title": "Continue Galway orphan club fills and player links",
        "publisher": "Wikipedia / Irish Independent / Athenry GAA / club sites / HurlingWiki",
        "processed_at": now,
        "pack": "data/pack-galway-club-player-links.json",
        "queue": "data/ina-queue/archivist-fohenagh-club-links.json",
        "before_players_with_club": before["with_club"],
        "after_players_with_club": after["with_club"],
        "players_linked": stats["players_linked"],
        "players_created": stats["players_created"],
        "matches_added": stats["matches_added"],
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

    if fohenagh_new or fohenagh_linked:
        q = {
            "batch": "fohenagh-club-links-r4",
            "ruled_at": now,
            "clear_links": fohenagh_linked,
            "unverified_new": fohenagh_new,
            "note": "AF 2023/2024 Wikipedia SHC scorer names — confidence unverified pending Archivist dual-source.",
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
        "matches_added": matches_added,
        "orphan_ids_after": after["orphan_ids"],
        "priority_clubs": pack["priority_club_counts_after"],
        "still_orphan_priority": pack["still_orphan_priority"],
        "fohenagh_new": fohenagh_new,
        "fohenagh_linked": fohenagh_linked,
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
