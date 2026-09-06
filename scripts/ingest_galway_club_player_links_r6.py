#!/usr/bin/env python3
"""Round 6: remaining Galway orphan fills + club-less links + cited matches.

Priority: Fohenagh/AF first (2016 IHC panel), then Galway City historic (1923),
Leitrim-Galway historic (club history), club-less Wikipedia/club links.
Claregalway stays HOLD (Carnmore for hurling). Unverified for new; HOLD collisions.
Scores only from clear public cites (no invent).
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
# LINK existing club-less players (Wikipedia / club / press cites)
# Fohenagh / AF first where applicable
# ---------------------------------------------------------------------------
WIKI_LINKS: list[dict] = [
    {
        "player": "player:kenneth-burke",
        "club": "club:st-thomas",
        "source": "https://en.wikipedia.org/wiki/Kenneth_Burke_(hurler)",
        "note": "Wikipedia: club St Thomas'; Galway SHC titles as player; also Galway GAA 2016 SHC champions photo.",
        "confidence": "high",
    },
    {
        "player": "player:paul-hardiman",
        "club": "club:athenry",
        "source": "https://athenry.org/record/athenrys-hurling-day-of-glory-2767/",
        "note": "Athenry club history: Paul Hardiman started every Athenry Galway SHC final from 1987; All-Ireland club titles with Athenry.",
        "confidence": "high",
    },
    {
        "player": "player:cathal-moran",
        "club": "club:athenry",
        "source": "https://www.irishtimes.com/news/ireland/irish-news/kate-moran-was-endearing-and-very-easy-to-love-father-tells-funeral-1.4859246",
        "note": "Irish Times: Cathal Moran former Athenry and Galway hurler; mainstay of Athenry three All-Ireland club titles.",
        "confidence": "high",
    },
    {
        "player": "player:paddy-hurney",
        "club": "club:galway-city-historic",
        "source": "https://www.athenrygaa.ie/index.php/history-photo-gallery/1920-1929",
        "note": "Athenry GAA 1923 All-Ireland caption: Paddy Hurney (Galway City).",
        "confidence": "high",
    },
    {
        "player": "player:martin-king",
        "club": "club:galway-city-historic",
        "source": "https://www.athenrygaa.ie/index.php/history-photo-gallery/1920-1929",
        "note": "Athenry GAA 1923 All-Ireland caption: Martin King (Galway City).",
        "confidence": "high",
    },
    {
        "player": "player:damien-coleman",
        "club": "club:portumna",
        "source": "https://offaly.gaa.ie/damien-coleman-appointed-as-offaly-gaa-operations-manager/",
        "note": "Offaly GAA / ATU / Midlands103: Damien Coleman member of Portumna GAA; played hurling for club and county at all age grades.",
        "confidence": "medium",
    },
]


NEW_PLAYERS: list[dict] = [
    # --- Fohenagh / AF first (2016 Galway IHC champions — Galway GAA roll of honour) ---
    {
        "name": "Oisin Delaney",
        "id": "player:oisin-delaney-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.galwaygaa.ie/history/2016-football-hurling-roll-of-honour/",
        "note": "Galway GAA 2016 roll: named on Ahascragh-Fohenagh Intermediate Hurling Champions panel photo.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Cathal Cosgrove",
        "id": "player:cathal-cosgrove-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.galwaygaa.ie/history/2016-football-hurling-roll-of-honour/",
        "note": "Galway GAA 2016 roll: Ahascragh-Fohenagh IHC champions panel.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Stephen Kelly",
        "id": "player:stephen-kelly-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.galwaygaa.ie/history/2016-football-hurling-roll-of-honour/",
        "note": "Galway GAA 2016 roll + Independent Connacht IHC replay team sheet: S Kelly for Ahascragh-Fohenagh. Distinct id — Kelly surname common.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Stephen Smyth",
        "id": "player:stephen-smyth-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.independent.ie/sport/gaelic-games/hurling/mannion-helps-galway-champs-secure-crown/35212557.html",
        "note": "Irish Independent Connacht IHC replay: S Smyth named scorer/team sheet for Ahascragh-Fohenagh; Galway GAA 2016 roll photo.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "David Harney",
        "id": "player:david-harney-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.galwaygaa.ie/history/2016-football-hurling-roll-of-honour/",
        "note": "Galway GAA 2016 roll: Ahascragh-Fohenagh IHC champions panel.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Peter Birch",
        "id": "player:peter-birch-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.independent.ie/sport/gaelic-games/hurling/mannion-helps-galway-champs-secure-crown/35212557.html",
        "note": "Irish Independent Connacht IHC replay sub: P Birch for Ahascragh-Fohenagh; Galway GAA 2016 roll.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Eoin O'Ceallaigh",
        "id": "player:eoin-oceallaigh-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.galwaygaa.ie/history/2016-football-hurling-roll-of-honour/",
        "note": "Galway GAA 2016 roll: Eoin O 'Ceallaigh on Ahascragh-Fohenagh IHC champions panel.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Brian Kilroy",
        "id": "player:brian-kilroy-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.independent.ie/sport/gaelic-games/hurling/mannion-helps-galway-champs-secure-crown/35212557.html",
        "note": "Irish Independent Connacht IHC replay team sheet: B Kilroy; Galway GAA 2016 roll.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Trevor Barrett",
        "id": "player:trevor-barrett-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.galwaygaa.ie/history/2016-football-hurling-roll-of-honour/",
        "note": "Galway GAA 2016 roll: Ahascragh-Fohenagh IHC champions panel; Independent draw team sheet sub T Barrett.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Kevin Harney",
        "id": "player:kevin-harney-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.galwaygaa.ie/history/2016-football-hurling-roll-of-honour/",
        "note": "Galway GAA 2016 roll: Ahascragh-Fohenagh IHC champions panel.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Donal Kelly",
        "id": "player:donal-kelly-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.independent.ie/sport/gaelic-games/hurling/mannion-helps-galway-champs-secure-crown/35212557.html",
        "note": "Irish Independent Connacht IHC replay: D Kelly in goals for Ahascragh-Fohenagh; Galway GAA 2016 roll. Distinct id.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Francis Mitchell",
        "id": "player:francis-mitchell-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.galwaygaa.ie/history/2016-football-hurling-roll-of-honour/",
        "note": "Galway GAA 2016 roll: Ahascragh-Fohenagh IHC champions panel.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Alan Harney",
        "id": "player:alan-harney-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.galwaygaa.ie/history/2016-football-hurling-roll-of-honour/",
        "note": "Galway GAA 2016 roll: Ahascragh-Fohenagh IHC champions panel.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Darren Smyth",
        "id": "player:darren-smyth-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.independent.ie/sport/gaelic-games/hurling/mannion-helps-galway-champs-secure-crown/35212557.html",
        "note": "Irish Independent Connacht IHC replay sub: D Smyth; Galway GAA 2016 roll.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "JP Egan",
        "id": "player:jp-egan-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.independent.ie/sport/gaelic-games/hurling/mannion-helps-galway-champs-secure-crown/35212557.html",
        "note": "Irish Independent Connacht IHC replay team sheet: JP Egan; Galway GAA 2016 roll.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Shane Connelly",
        "id": "player:shane-connelly-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.independent.ie/sport/gaelic-games/hurling/mannion-helps-galway-champs-secure-crown/35212557.html",
        "note": "Irish Independent Connacht IHC replay: S. Conneely / S Connelly on team sheet; Galway GAA 2016 roll Shane Connelly.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Simon Doyle",
        "id": "player:simon-doyle-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.galwaygaa.ie/history/2016-football-hurling-roll-of-honour/",
        "note": "Galway GAA 2016 roll: Ahascragh-Fohenagh IHC champions panel.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Finbarr Donnellan",
        "id": "player:finbarr-donnellan-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.independent.ie/sport/gaelic-games/hurling/mannion-helps-galway-champs-secure-crown/35212557.html",
        "note": "Irish Independent Connacht IHC replay: F Donnellan scorer/team sheet; Galway GAA 2016 roll Finbarr Donnellan.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Fergal Mulryan",
        "id": "player:fergal-mulryan-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.galwaygaa.ie/history/2016-football-hurling-roll-of-honour/",
        "note": "Galway GAA 2016 roll: Ahascragh-Fohenagh IHC champions panel.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    {
        "name": "Cathal Delaney",
        "id": "player:cathal-delaney-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.independent.ie/sport/gaelic-games/hurling/mannion-helps-galway-champs-secure-crown/35212557.html",
        "note": "Irish Independent Connacht IHC replay sub: C Delaney; Galway GAA 2016 roll.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    # --- Galway City historic orphan (1923 All-Ireland caption — Athenry GAA + Wikipedia Tom Fleming) ---
    {
        "name": "Tom Fleming",
        "id": "player:tom-fleming-galway-city",
        "club": "club:galway-city-historic",
        "source": "https://en.wikipedia.org/wiki/Tom_Fleming_(hurler)",
        "note": "Wikipedia: club Galway City; 1923 All-Ireland SHC medal; Athenry GAA caption Tom Fleming (Galway City). Also 1922 SHC finalist vs Tynagh.",
        "confidence": "high",
    },
    {
        "name": "Mick King",
        "id": "player:mick-king-galway-city",
        "club": "club:galway-city-historic",
        "source": "https://www.athenrygaa.ie/index.php/history-photo-gallery/1920-1929",
        "note": "Athenry GAA 1923 All-Ireland panel caption: Mick King (Galway City). Distinct from Martin King / Michael King.",
        "confidence": "medium",
    },
    {
        "name": "Michael King",
        "id": "player:michael-king-galway-city",
        "club": "club:galway-city-historic",
        "source": "https://www.athenrygaa.ie/index.php/history-photo-gallery/1920-1929",
        "note": "Athenry GAA 1923 final-day caption: Michael King (Galway City). Distinct from Martin King / Mick King.",
        "confidence": "medium",
    },
    {
        "name": "Paddy O'Connor",
        "id": "player:paddy-oconnor-galway-city",
        "club": "club:galway-city-historic",
        "source": "https://www.athenrygaa.ie/index.php/history-photo-gallery/1920-1929",
        "note": "Athenry GAA 1923 All-Ireland panel caption: Paddy O'Connor (Galway City).",
        "confidence": "medium",
    },
    # --- Leitrim (Galway) historic orphan — Kilnadeema/Leitrim club history ---
    {
        "name": "Jack Fallon",
        "id": "player:jack-fallon-leitrim",
        "club": "club:leitrim-galway-historic",
        "source": "https://kilnadeemaleitrimgaa.com/about/",
        "note": "Kilnadeema/Leitrim club history: Jack Fallon of Leitrim lined out in 1925 All-Ireland SHC final vs Tipperary alongside Mick Connaire (Kilnadeema).",
        "confidence": "medium",
    },
    {
        "name": "Tom Cox Tierney",
        "id": "player:tom-cox-tierney-leitrim",
        "club": "club:leitrim-galway-historic",
        "source": "https://kilnadeemaleitrimgaa.com/about/",
        "note": "Kilnadeema/Leitrim club history: Tom (Cox) Tierney — Leitrim's most famous player of the era; captained Galway Junior 1928; also named on Leitrim Junior champions 1954–56 photo.",
        "confidence": "medium",
    },
    {
        "name": "JJ Darcy",
        "id": "player:jj-darcy-leitrim",
        "club": "club:leitrim-galway-historic",
        "source": "https://kilnadeemaleitrimgaa.com/about/",
        "note": "Kilnadeema/Leitrim club history: J.J. Darcy of Leitrim played in 1931 All-Ireland Minor final vs Kilkenny.",
        "confidence": "medium",
    },
    {
        "name": "Patrick Lyons",
        "id": "player:patrick-lyons-leitrim",
        "club": "club:leitrim-galway-historic",
        "source": "https://kilnadeemaleitrimgaa.com/about/",
        "note": "Kilnadeema/Leitrim club history photo caption: Patrick Lyons on Leitrim Junior champions 1954/55/56.",
        "confidence": "unverified",
    },
    {
        "name": "Mick Kenny",
        "id": "player:mick-kenny-leitrim",
        "club": "club:leitrim-galway-historic",
        "source": "https://kilnadeemaleitrimgaa.com/about/",
        "note": "Kilnadeema/Leitrim club history: Mick Kenny on Leitrim Junior champions 1954/55/56 caption. Distinct id — Kenny surname / other Mick Kenny (Tynagh 1923) already stamped elsewhere.",
        "confidence": "unverified",
    },
    {
        "name": "Sean Flannery",
        "id": "player:sean-flannery-leitrim",
        "club": "club:leitrim-galway-historic",
        "source": "https://kilnadeemaleitrimgaa.com/about/",
        "note": "Kilnadeema/Leitrim club history: Sean Flannery on Leitrim Junior champions 1954/55/56 caption.",
        "confidence": "unverified",
    },
]


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
    "player:sean-glynn",
    "player:brian-concannon",
    "player:kieran-finnerty",
    "player:albert-moylan",  # HOLD: London St Gabriel's / Gort region — no clear Galway club stamp
    "player:basil-larkin",  # HOLD: no clear club cite this run
    "player:christy-helebert",  # HOLD: referee career; no clear playing-club cite
    "player:brendan-keogh",  # HOLD: Athenry photos exist but common surname — defer distinct stamp
}


CLUB_META_UPDATES: list[dict] = [
    {
        "id": "club:galway-city-historic",
        "cols": {
            "note": "r6 fill: Tom Fleming (Wikipedia + Athenry caption), Martin King / Paddy Hurney / Mick King / Michael King / Paddy O'Connor cited Athenry GAA 1923 All-Ireland captions as Galway City. 1922 SHC finalist vs Tynagh.",
            "source_athenry_1923": "https://www.athenrygaa.ie/index.php/history-photo-gallery/1920-1929",
            "source_wiki_fleming": "https://en.wikipedia.org/wiki/Tom_Fleming_(hurler)",
        },
    },
    {
        "id": "club:leitrim-galway-historic",
        "cols": {
            "note": "r6 fill: Jack Fallon, Tom (Cox) Tierney, J.J. Darcy + 1950s Junior caption names from Kilnadeema/Leitrim club history. 1930 SHC finalist vs Craughwell (score 7-4 to 1-5 on club history). Successor club:kilnadeema-leitrim.",
            "source_club": "https://kilnadeemaleitrimgaa.com/about/",
        },
    },
    {
        "id": "club:ahascragh-fohenagh",
        "cols": {
            "note": "r6: expanded 2016 Galway IHC champions panel from Galway GAA roll + Independent Connacht IHC replay team sheets (unverified pending Archivist).",
            "source_roll_2016": "https://www.galwaygaa.ie/history/2016-football-hurling-roll-of-honour/",
        },
    },
    {
        "id": "club:claregalway",
        "cols": {
            "note": "HOLD orphan r6: no named Claregalway-only hurling player cite. Parish hurling → club:carnmore.",
        },
    },
    {
        "id": "club:college-road",
        "cols": {
            "note": "HOLD orphan r6: 1892–1893 SHC winners; Duggan grand-uncles cited without first+last names. Do not invent College Road XV.",
        },
    },
    {
        "id": "club:eyrecourt-historic",
        "cols": {
            "note": "HOLD orphan r6: 1959 IHC winners (Wikipedia + Athenry story score) but no named Eyrecourt-only XV. Joe Salmon remains club:meelick-eyrecourt.",
        },
    },
    {
        "id": "club:kilrickle",
        "cols": {
            "note": "HOLD orphan r6: 1949 first IHC title on Wikipedia roll — St Enda's (Bullaun/Kilrickle) essay names Mick Cooney as manager only, not a Kilrickle player stamp. No invent.",
        },
    },
    {
        "id": "club:oranmore-historic",
        "cols": {
            "note": "HOLD orphan r6: 1950 IHC winners — no clear first+last Oranmore-only adult XV cite (Joe Glynn county caption lacks Oranmore stamp on live Athenry page). Modern players on club:oranmore-maree.",
        },
    },
    {
        "id": "club:skehana",
        "cols": {
            "note": "HOLD orphan r6: 1952 IHC winners — no named historic Skehana XV. Modern amalgam club:skehana-mountbellew-moylough.",
        },
    },
    {
        "id": "club:st-colemans",
        "cols": {
            "note": "HOLD orphan r6: 1948 SHC finalist — Jim Brophy Wikipedia is Army captain who beat them, not St Coleman's. No named St Coleman's XV cite.",
        },
    },
]


NEW_MATCHES: list[dict] = [
    {
        "id": "match:galway-jhc-1923-leitrim-final",
        "cols": {
            "type": "match",
            "name": "Leitrim vs Kilmacdough (1923 Galway Junior Hurling Final)",
            "competition": "Galway Junior Hurling Championship",
            "round": "Final",
            "year": 1923,
            "home": "club:leitrim-galway-historic",
            "away": "Kilmacdough",
            "winner": "club:leitrim-galway-historic",
            "runner_up": "Kilmacdough",
            "score": "Leitrim 2-3, Kilmacdough 1-2",
            "note": "Kilnadeema/Leitrim club history: Leitrim won the junior championship of 1923 defeating Kilmacdough 2-3 to 1-2 (recorded as 1924 success for 1923 championship).",
            "confidence": "medium",
            "source": "https://kilnadeemaleitrimgaa.com/about/",
            "result": "win",
            "historic_club": "club:leitrim-galway-historic",
        },
    },
    {
        "id": "match:galway-ihc-1949-final",
        "cols": {
            "type": "match",
            "name": "Kilrickle Galway IHC Final (1949)",
            "competition": "Galway Intermediate Hurling Championship",
            "round": "Final",
            "year": 1949,
            "home": "club:kilrickle",
            "winner": "club:kilrickle",
            "note": "Wikipedia Galway Intermediate Hurling Championship: Kilrickle inaugural champions 1949. Final score line not listed on Wikipedia roll — omitted (no invent).",
            "confidence": "medium",
            "source": "https://en.wikipedia.org/wiki/Galway_Intermediate_Hurling_Championship",
            "result": "win",
            "historic_club": "club:kilrickle",
        },
    },
]


MATCH_META_UPDATES: list[dict] = [
    {
        "id": "match:galway-shc-1930-final",
        "cols": {
            "secondary_cite": "Kilnadeema/Leitrim club history · Craughwell beat Leitrim 7-4 to 1-5",
            "secondary_cite_url": "https://kilnadeemaleitrimgaa.com/about/",
            "score": "Craughwell 7-4, Leitrim 1-5",
            "ingest_triage": "secondary_cite",
            "note": "Score from Kilnadeema/Leitrim club history (Craughwell 7-4 to 1-5). Galway GAA / Wikipedia SHC pages omit score — secondary cite only; not double-sourced board/wiki.",
            "confidence": "medium",
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
            if col == "note" and by_row[mid].get("note"):
                old = by_row[mid]["note"]
                if val not in old:
                    set_or_add(seed, pair_index, by_row, mid, "note", (old + " " + val).strip(), stats)
                continue
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
        "player:albert-moylan": "HOLD r6: panel Albert Moylan — London St Gabriel's / Gort-region death notices; no clear Galway club stamp this run.",
        "player:basil-larkin": "HOLD r6: no clear club cite harvested.",
        "player:christy-helebert": "HOLD r6: former Galway senior / referee — no clear playing-club cite this run.",
        "player:brendan-keogh": "HOLD r6: Athenry club photos exist but defer distinct stamp pending Archivist (common surname).",
        "player:mick-kenny": "HOLD collision note: seed may have other Mick Kenny ids; Leitrim 1950s uses distinct player:mick-kenny-leitrim.",
    }
    for pid, hnote in hold_notes.items():
        if pid not in by_row or by_row[pid].get("type") != "player":
            continue
        if pid == "player:mick-kenny":
            note = by_row[pid].get("note") or ""
            if "HOLD" not in note and hnote not in note:
                set_or_add(seed, pair_index, by_row, pid, "note", (note + " " + hnote).strip(), stats)
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
        "round": "6",
        "generated_at": now,
        "sources": [
            "https://en.wikipedia.org/wiki/Kenneth_Burke_(hurler)",
            "https://en.wikipedia.org/wiki/Tom_Fleming_(hurler)",
            "https://en.wikipedia.org/wiki/Galway_Intermediate_Hurling_Championship",
            "https://www.athenrygaa.ie/index.php/history-photo-gallery/1920-1929",
            "https://athenry.org/record/athenrys-hurling-day-of-glory-2767/",
            "https://kilnadeemaleitrimgaa.com/about/",
            "https://www.galwaygaa.ie/history/2016-football-hurling-roll-of-honour/",
            "https://www.independent.ie/sport/gaelic-games/hurling/mannion-helps-galway-champs-secure-crown/35212557.html",
            "https://www.irishtimes.com/news/ireland/irish-news/kate-moran-was-endearing-and-very-easy-to-love-father-tells-funeral-1.4859246",
            "https://offaly.gaa.ie/damien-coleman-appointed-as-offaly-gaa-operations-manager/",
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
                "club:galway-city-historic",
                "club:leitrim-galway-historic",
                "club:eyrecourt-historic",
                "club:oranmore-historic",
                "club:college-road",
                "club:kilrickle",
                "club:skehana",
                "club:st-colemans",
                "club:st-thomas",
                "club:athenry",
                "club:portumna",
                "club:meelick-historic",
                "club:carnmore",
            ]
        },
        "still_orphan_priority": [
            c
            for c in [
                "club:claregalway",
                "club:college-road",
                "club:eyrecourt-historic",
                "club:galway-city-historic",
                "club:kilrickle",
                "club:leitrim-galway-historic",
                "club:oranmore-historic",
                "club:skehana",
                "club:st-colemans",
            ]
            if c in after["orphan_ids"]
        ],
    }

    SEED_PATH.write_text(json.dumps(seed, indent=2, ensure_ascii=False) + "\n")
    PACK_PATH.write_text(json.dumps(pack, indent=2, ensure_ascii=False) + "\n")

    log = {
        "url": "Wikipedia + Athenry GAA + Kilnadeema/Leitrim + Galway GAA 2016 roll + Independent + Irish Times + Offaly GAA",
        "date": "2026-09-06",
        "title": "Galway club-player pack r6",
        "publisher": "Wikipedia / Athenry / Kilnadeema-Leitrim / Galway GAA / Independent / Irish Times / HurlingWiki",
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
            "batch": "fohenagh-club-links-r6",
            "ruled_at": now,
            "clear_links": fohenagh_linked,
            "unverified_new": fohenagh_new,
            "note": "AF 2016 IHC panel from Galway GAA roll + Independent Connacht IHC sheets — confidence unverified pending Archivist dual-source.",
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
