#!/usr/bin/env python3
"""Link Galway club-less players to clubs + expand orphan club squads.

Sources (public cites only):
  - Wikipedia player infoboxes / club Notable players
  - Wikipedia / Irish Examiner / Galway Advertiser 2017 Liam Mellows SHC final XV
  - Tuam Herald 2026 Galway senior panel (clubs in parentheses)
  - INA contemporary reports for historic Fohenagh 1959–60 named players

Rules:
  - Never invent positions/scores/caps
  - HOLD ambiguous surname/era collisions (Michael Healy pattern)
  - Do not overwrite an existing player.club
  - confidence=unverified for new panel-only players
  - Historic Fohenagh → club:fohenagh-historic; amalgam Mannions already stamped
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
# Curated LINK packs: existing player_id → club_id + cite
# Only applied when player currently has no club.
# ---------------------------------------------------------------------------
WIKI_LINKS: list[dict] = [
    # Portumna / Clarinbridge / Athenry / St Thomas' / Castlegar / Turloughmore priority
    {
        "player": "player:ollie-canning",
        "club": "club:portumna",
        "source": "https://en.wikipedia.org/wiki/Ollie_Canning",
        "note": "Wikipedia infobox club Portumna; also listed on Portumna GAA Notable players.",
        "confidence": "high",
    },
    {
        "player": "player:james-skehill",
        "club": "club:cappataggle",
        "source": "https://en.wikipedia.org/wiki/James_Skehill",
        "note": "Wikipedia infobox club Cappataggle.",
        "confidence": "high",
    },
    {
        "player": "player:shane-moloney",
        "club": "club:tynagh-abbey-duniry",
        "source": "https://en.wikipedia.org/wiki/Shane_Moloney",
        "note": "Wikipedia infobox club Tynagh-Abbey/Duniry.",
        "confidence": "high",
    },
    {
        "player": "player:anthony-cunningham",
        "club": "club:st-thomas",
        "source": "https://en.wikipedia.org/wiki/Anthony_Cunningham",
        "note": "Wikipedia infobox club St Thomas' GAA.",
        "confidence": "high",
    },
    {
        "player": "player:martin-naughton",
        "club": "club:turloughmore",
        "source": "https://en.wikipedia.org/wiki/Martin_Naughton_(hurler)",
        "note": "Wikipedia infobox club Turloughmore.",
        "confidence": "high",
    },
    {
        "player": "player:cathal-moore",
        "club": "club:turloughmore",
        "source": "https://en.wikipedia.org/wiki/Cathal_Moore",
        "note": "Wikipedia infobox club Turloughmore.",
        "confidence": "high",
    },
    {
        "player": "player:liam-donoghue",
        "club": "club:clarinbridge",
        "source": "https://en.wikipedia.org/wiki/Liam_Donoghue",
        "note": "Wikipedia infobox club Clarinbridge.",
        "confidence": "high",
    },
    {
        "player": "player:p-j-molloy",
        "club": "club:athenry",
        "source": "https://en.wikipedia.org/wiki/P.J._Molloy",
        "note": "Wikipedia infobox club Athenry.",
        "confidence": "high",
    },
    {
        "player": "player:richard-murray",
        "club": "club:st-thomas",
        "source": "https://en.wikipedia.org/wiki/Richie_Murray",
        "note": "Wikipedia Richie Murray infobox club St Thomas'.",
        "confidence": "high",
    },
    # Sarsfields season→club promotion
    {
        "player": "player:michael-mcgrath",
        "club": "club:sarsfields",
        "source": "https://en.wikipedia.org/wiki/Michael_McGrath_(hurler)",
        "note": "Wikipedia infobox club Sarsfields; also Player×Season→Club in Archivist pack.",
        "confidence": "high",
    },
    {
        "player": "player:pakie-cooney",
        "club": "club:sarsfields",
        "source": "https://en.wikipedia.org/wiki/Sarsfields_GAA_(Galway)",
        "note": "Named on Sarsfields club Wikipedia / Player×Season→Club Archivist pack.",
        "confidence": "high",
    },
    # Orphan / under-filled clubs
    {
        "player": "player:niall-mcinerney",
        "club": "club:liam-mellows",
        "source": "https://en.wikipedia.org/wiki/Niall_McInerney",
        "note": "Wikipedia infobox club Liam Mellows (Galway side of dual club listing).",
        "confidence": "high",
    },
    {
        "player": "player:michael-coleman",
        "club": "club:abbeyknockmoy",
        "source": "https://en.wikipedia.org/wiki/Michael_Coleman_(hurler)",
        "note": "Wikipedia: Abbeyknockmoy club; 1988 Galway SHC winner at centre-back.",
        "confidence": "high",
    },
    {
        "player": "player:tadhg-haran",
        "club": "club:liam-mellows",
        "source": "https://en.wikipedia.org/wiki/Liam_Mellows_GAA",
        "note": "Listed under Liam Mellows GAA Notable players on Wikipedia.",
        "confidence": "high",
    },
    {
        "player": "player:david-collins",
        "club": "club:liam-mellows",
        "source": "https://en.wikipedia.org/wiki/Liam_Mellows_GAA",
        "note": "Listed under Liam Mellows GAA Notable players; 2017 Galway SHC joint-captain.",
        "confidence": "high",
    },
    {
        "player": "player:john-lee",
        "club": "club:liam-mellows",
        "source": "https://en.wikipedia.org/wiki/Liam_Mellows_GAA",
        "note": "Listed under Liam Mellows GAA Notable players on Wikipedia.",
        "confidence": "medium",
    },
    {
        "player": "player:adrian-tuohey",
        "club": "club:beagh",
        "source": "https://en.wikipedia.org/wiki/Adrian_Tuohy",
        "note": "Wikipedia infobox / Beagh GAA Notable players (Adrian Tuohy).",
        "confidence": "high",
    },
    {
        "player": "player:finbar-gantley",
        "club": "club:beagh",
        "source": "https://en.wikipedia.org/wiki/Beagh_GAA",
        "note": "Beagh GAA Wikipedia Notable players: Finbarr Gantley.",
        "confidence": "high",
    },
    {
        "player": "player:davy-glennon",
        "club": "club:mullagh",
        "source": "https://en.wikipedia.org/wiki/Davy_Glennon",
        "note": "Wikipedia infobox club Mullagh.",
        "confidence": "high",
    },
    {
        "player": "player:gerry-mcinerney",
        "club": "club:kinvara",
        "source": "https://en.wikipedia.org/wiki/Kinvara_GAA",
        "note": "Kinvara GAA Wikipedia Notable players: Gerry McInerney.",
        "confidence": "high",
    },
    {
        "player": "player:bernard-forde",
        "club": "club:ardrahan",
        "source": "https://en.wikipedia.org/wiki/Bernie_Forde",
        "note": "Wikipedia Bernie Forde infobox club Ardrahan (same person as seed Bernard Forde).",
        "confidence": "high",
    },
    {
        "player": "player:ollie-kilkenny",
        "club": "club:kiltormer",
        "source": "https://en.wikipedia.org/wiki/Ollie_Kilkenny",
        "note": "Wikipedia infobox club Kiltormer; also Kiltormer GAA Notable players.",
        "confidence": "high",
    },
    {
        "player": "player:andy-fenton",
        "club": "club:kiltormer",
        "source": "https://en.wikipedia.org/wiki/Kiltormer_GAA",
        "note": "Kiltormer GAA Wikipedia Notable players: Andy Fenton.",
        "confidence": "high",
    },
    {
        "player": "player:justin-campbell",
        "club": "club:kiltormer",
        "source": "https://en.wikipedia.org/wiki/Kiltormer_GAA",
        "note": "Kiltormer GAA Wikipedia Notable players: Justin Campbell.",
        "confidence": "high",
    },
    {
        "player": "player:brendan-lynskey",
        "club": "club:meelick-eyrecourt",
        "source": "https://en.wikipedia.org/wiki/Brendan_Lynskey",
        "note": "Wikipedia infobox club Meelick-Eyrecourt.",
        "confidence": "high",
    },
    {
        "player": "player:pat-malone",
        "club": "club:oranmore-maree",
        "source": "https://en.wikipedia.org/wiki/Pat_Malone_(hurler)",
        "note": "Wikipedia infobox club Oranmore-Maree.",
        "confidence": "high",
    },
    {
        "player": "player:steve-mahon",
        "club": "club:kilbeacanty",
        "source": "https://en.wikipedia.org/wiki/Steve_Mahon",
        "note": "Wikipedia infobox club Kilbeacanty.",
        "confidence": "high",
    },
    {
        "player": "player:eanna-ryan",
        "club": "club:killimordaly",
        "source": "https://en.wikipedia.org/wiki/%C3%89anna_Ryan",
        "note": "Wikipedia infobox club Killimordaly.",
        "confidence": "high",
    },

    {
        "player": "player:ger-farragher",
        "club": "club:castlegar",
        "source": "https://en.wikipedia.org/wiki/Ger_Farragher",
        "note": "Wikipedia: plays club hurling with Castlegar.",
        "confidence": "high",
    },
    {
        "player": "player:niall-healy",
        "club": "club:craughwell",
        "source": "https://en.wikipedia.org/wiki/Niall_Healy",
        "note": "Wikipedia: plays with local club Craughwell.",
        "confidence": "high",
    },
    {
        "player": "player:fergal-healy",
        "club": "club:craughwell",
        "source": "https://en.wikipedia.org/wiki/Fergal_Healy",
        "note": "Wikipedia: club hurler with Craughwell.",
        "confidence": "high",
    },
    {
        "player": "player:ollie-fahy",
        "club": "club:gort",
        "source": "https://en.wikipedia.org/wiki/Ollie_Fahy",
        "note": "Wikipedia infobox club Gort.",
        "confidence": "high",
    },
    {
        "player": "player:kevin-broderick",
        "club": "club:craughwell",
        "source": "https://en.wikipedia.org/wiki/Kevin_Broderick",
        "note": "Wikipedia / contemporary reports: Craughwell club hurler.",
        "confidence": "medium",
    },
]

# Tuam Herald 2026 Galway senior panel — clubs in parentheses
TUAM_2026 = "https://www.tuamherald.ie/2026/07/18/galways-sixth-or-limericks-13th/"
TUAM_LINKS: list[dict] = [
    {"player": "player:darren-morrissey", "club": "club:sarsfields", "name": "Darren Morrissey"},
    {"player": "player:darach-fahy", "club": "club:ardrahan", "name": "Darach Fahy"},
    {"player": "player:ronan-glennon", "club": "club:mullagh", "name": "Ronan Glennon"},
    {"player": "player:thomas-monaghan", "club": "club:craughwell", "name": "Tom Monaghan"},
    {"player": "player:darragh-neary", "club": "club:castlegar", "name": "Darragh Neary"},
    {"player": "player:john-fleming", "club": "club:meelick-eyrecourt", "name": "John Fleming"},
    {"player": "player:daniel-loftus", "club": "club:turloughmore", "name": "Dan Loftus"},
    {"player": "player:kieran-hanrahan", "club": "club:loughrea", "name": "Kieran Hanrahan"},
    {"player": "player:micheal-power", "club": "club:tynagh-abbey-duniry", "name": "Micheál Power"},
    {"player": "player:t-j-brennan", "club": "club:clarinbridge", "name": "TJ Brennan"},
]

# New players for orphan / priority clubs (name, club, source, note, confidence)
NEW_PLAYERS: list[dict] = [
    # --- Fohenagh historic (INA 1959–60) ---
    {
        "name": "Tony O'Gorman",
        "club": "club:fohenagh-historic",
        "source": "https://irishnewsarchive.com/?a=d&d=CTT19590919.1.30",
        "note": "Named in Connacht Tribune 1959 SHC replay report: Fohenagh goalscorer vs Castlegar.",
        "confidence": "high",
        "fohenagh": True,
    },
    {
        "name": "Tim Killalea",
        "club": "club:fohenagh-historic",
        "source": "https://irishnewsarchive.com/?a=d&d=CTT19590919.1.30",
        "note": "Named in Connacht Tribune / Tuam Herald 1959 SHC replay: Fohenagh winning point.",
        "confidence": "high",
        "fohenagh": True,
    },
    {
        "name": "Johnny Molloy",
        "club": "club:fohenagh-historic",
        "source": "https://irishnewsarchive.com/?a=d&d=TTH19590919.1.8",
        "note": "Named in Tuam Herald 1959 SHC replay report for Fohenagh.",
        "confidence": "high",
        "fohenagh": True,
    },
    {
        "name": "Padraic Nolan",
        "club": "club:fohenagh-historic",
        "source": "https://irishnewsarchive.com/?a=d&d=CTT19590905.1.12",
        "note": "Named in Connacht Tribune 1959 SHC drawn final report for Fohenagh.",
        "confidence": "high",
        "fohenagh": True,
    },
    {
        "name": "Nicholas Murray",
        "club": "club:fohenagh-historic",
        "source": "https://irishnewsarchive.com/?a=d&d=CTT19600903.1.14",
        "note": "Named in Connacht Tribune / Tuam Herald 1960 SHC final: Fohenagh midfield.",
        "confidence": "high",
        "fohenagh": True,
    },
    {
        "name": "Frank Madden",
        "club": "club:fohenagh-historic",
        "source": "https://irishnewsarchive.com/?a=d&d=CTT19600903.1.14",
        "note": "Named in Connacht Tribune 1960 SHC final: Fohenagh defence.",
        "confidence": "high",
        "fohenagh": True,
    },
    {
        "name": "Jim Sweeney",
        "club": "club:fohenagh-historic",
        "source": "https://irishnewsarchive.com/?a=d&d=TTH19600903.1.1",
        "note": "Named in Tuam Herald 1960 SHC final: Fohenagh goalscorer.",
        "confidence": "high",
        "fohenagh": True,
    },
    # --- Liam Mellows 2017 Galway SHC final XV (Wikipedia + Irish Examiner) ---
    {
        "name": "Kenneth Walsh",
        "club": "club:liam-mellows",
        "source": "https://en.wikipedia.org/wiki/2017_Galway_Senior_Hurling_Championship",
        "note": "Named on Liam Mellows starting XV, 2017 Galway SHC final (Wikipedia).",
        "confidence": "unverified",
    },
    {
        "name": "Mark Hughes",
        "club": "club:liam-mellows",
        "source": "https://en.wikipedia.org/wiki/2017_Galway_Senior_Hurling_Championship",
        "note": "Named on Liam Mellows starting XV, 2017 Galway SHC final (Wikipedia).",
        "confidence": "unverified",
    },
    {
        "name": "Sean Morrissey",
        "club": "club:liam-mellows",
        "source": "https://en.wikipedia.org/wiki/2017_Galway_Senior_Hurling_Championship",
        "note": "Named on Liam Mellows starting XV, 2017 Galway SHC final (Wikipedia).",
        "confidence": "unverified",
    },
    {
        "name": "Cathal Reilly",
        "club": "club:liam-mellows",
        "source": "https://en.wikipedia.org/wiki/2017_Galway_Senior_Hurling_Championship",
        "note": "Named on Liam Mellows starting XV, 2017 Galway SHC final (Wikipedia).",
        "confidence": "unverified",
    },
    {
        "name": "Jack Hastings",
        "club": "club:liam-mellows",
        "source": "https://en.wikipedia.org/wiki/2017_Galway_Senior_Hurling_Championship",
        "note": "Named on Liam Mellows starting XV, 2017 Galway SHC final (Wikipedia).",
        "confidence": "unverified",
    },
    {
        "name": "Kevin Lee",
        "club": "club:liam-mellows",
        "source": "https://en.wikipedia.org/wiki/2017_Galway_Senior_Hurling_Championship",
        "note": "Named on Liam Mellows starting XV, 2017 Galway SHC final (Wikipedia).",
        "confidence": "unverified",
    },
    {
        "name": "Stephen Barrett",
        "club": "club:liam-mellows",
        "source": "https://en.wikipedia.org/wiki/2017_Galway_Senior_Hurling_Championship",
        "note": "Named on Liam Mellows starting XV, 2017 Galway SHC final (Wikipedia).",
        "confidence": "unverified",
    },
    {
        "name": "Ronan Elwood",
        "club": "club:liam-mellows",
        "source": "https://en.wikipedia.org/wiki/2017_Galway_Senior_Hurling_Championship",
        "note": "Named on Liam Mellows starting XV, 2017 Galway SHC final (Wikipedia).",
        "confidence": "unverified",
    },
    {
        "name": "Aonghus Callanan",
        "club": "club:liam-mellows",
        "source": "https://en.wikipedia.org/wiki/2017_Galway_Senior_Hurling_Championship",
        "note": "Named on Liam Mellows starting XV / joint-captain, 2017 Galway SHC final (Wikipedia).",
        "confidence": "unverified",
    },
    {
        "name": "Adrian Morrissey",
        "club": "club:liam-mellows",
        "source": "https://en.wikipedia.org/wiki/2017_Galway_Senior_Hurling_Championship",
        "note": "Named on Liam Mellows starting XV, 2017 Galway SHC final (Wikipedia).",
        "confidence": "unverified",
    },
    {
        "name": "Conor Hynes",
        "club": "club:liam-mellows",
        "source": "https://en.wikipedia.org/wiki/2017_Galway_Senior_Hurling_Championship",
        "note": "Named on Liam Mellows starting XV, 2017 Galway SHC final (Wikipedia).",
        "confidence": "unverified",
    },
    {
        "name": "Jack Forde",
        "club": "club:liam-mellows",
        "source": "https://en.wikipedia.org/wiki/2017_Galway_Senior_Hurling_Championship",
        "note": "Named as Liam Mellows substitute used, 2017 Galway SHC final (Wikipedia).",
        "confidence": "unverified",
    },
    {
        "name": "David Fahy",
        "club": "club:liam-mellows",
        "source": "https://en.wikipedia.org/wiki/2017_Galway_Senior_Hurling_Championship",
        "note": "Named as Liam Mellows substitute used, 2017 Galway SHC final (Wikipedia).",
        "confidence": "unverified",
    },
    {
        "name": "Jimmy Hegarty",
        "club": "club:liam-mellows",
        "source": "https://en.wikipedia.org/wiki/Liam_Mellows_GAA",
        "note": "Listed under Liam Mellows GAA Notable players on Wikipedia.",
        "confidence": "unverified",
    },
    # club-suffixed for 2017 Mellows Michael Conneely (HOLD plain michael-conneely = 1980 panel)
    {
        "name": "Michael Conneely",
        "id": "player:michael-conneely-liam-mellows",
        "club": "club:liam-mellows",
        "source": "https://en.wikipedia.org/wiki/2017_Galway_Senior_Hurling_Championship",
        "note": "Named on Liam Mellows 2017 Galway SHC final XV (Wikipedia). Distinct id from 1980 panel Michael Conneely (HOLD collision).",
        "confidence": "unverified",
        "hold_note_on_existing": "player:michael-conneely",
    },
    # Link existing Conor Kavanagh / Conor Elwood to Liam Mellows via 2017 final cite
    # (handled in EXTRA_LINKS below)
    # --- Tuam Herald 2026 panel new players ---
    {
        "name": "Cillian Trayers",
        "club": "club:turloughmore",
        "source": TUAM_2026,
        "note": "Named on Galway 2026 senior panel with club Turloughmore (Tuam Herald).",
        "confidence": "unverified",
    },
    {
        "name": "Jason Rabbitte",
        "club": "club:athenry",
        "source": TUAM_2026,
        "note": "Named on Galway 2026 senior panel with club St. Mary's, Athenry (Tuam Herald).",
        "confidence": "unverified",
    },
    {
        "name": "Aaron Niland",
        "club": "club:clarinbridge",
        "source": TUAM_2026,
        "note": "Named on Galway 2026 senior panel with club Clarinbridge (Tuam Herald).",
        "confidence": "unverified",
    },
    {
        "name": "Cian Daniels",
        "club": "club:tommy-larkins",
        "source": TUAM_2026,
        "note": "Named on Galway 2026 senior panel with club Tommy Larkins (Tuam Herald).",
        "confidence": "unverified",
    },
    {
        "name": "Sean Linnane",
        "club": "club:turloughmore",
        "source": TUAM_2026,
        "note": "Named on Galway 2026 senior panel with club Turloughmore (Tuam Herald).",
        "confidence": "unverified",
    },
    {
        "name": "Fintan Burke",
        "club": "club:st-thomas",
        "source": TUAM_2026,
        "note": "Named on Galway 2026 senior panel with club St. Thomas' (Tuam Herald).",
        "confidence": "unverified",
    },
    {
        "name": "Cianan Fahy",
        "club": "club:ardrahan",
        "source": TUAM_2026,
        "note": "Named on Galway 2026 senior panel with club Ardrahan (Tuam Herald).",
        "confidence": "unverified",
    },
    {
        "name": "Cillian Whelan",
        "club": "club:turloughmore",
        "source": TUAM_2026,
        "note": "Named on Galway 2026 senior panel with club Turloughmore (Tuam Herald).",
        "confidence": "unverified",
    },
    {
        "name": "Rory Burke",
        "club": "club:oranmore-maree",
        "source": TUAM_2026,
        "note": "Named on Galway 2026 senior panel with club Oranmore-Maree (Tuam Herald).",
        "confidence": "unverified",
    },
    {
        "name": "Cullen Killeen",
        "club": "club:loughrea",
        "source": TUAM_2026,
        "note": "Named on Galway 2026 senior panel with club Loughrea (Tuam Herald).",
        "confidence": "unverified",
    },
    {
        "name": "Oisin Lohan",
        "club": "club:skehana-mountbellew-moylough",
        "source": TUAM_2026,
        "note": "Named on Galway 2026 senior panel with club Skehana-Mountbellew-Moylough (Tuam Herald).",
        "confidence": "unverified",
    },
    {
        "name": "Daniel Comar",
        "club": "club:kilnadeema-leitrim",
        "source": TUAM_2026,
        "note": "Named on Galway 2026 senior panel with club Kilnadeema-Leitrim (Tuam Herald).",
        "confidence": "unverified",
    },
    {
        "name": "Sean Murphy",
        "club": "club:clarinbridge",
        "source": TUAM_2026,
        "note": "Named on Galway 2026 senior panel with club Clarinbridge (Tuam Herald).",
        "confidence": "unverified",
    },
    {
        "name": "Eanna Murphy",
        "club": "club:tommy-larkins",
        "source": TUAM_2026,
        "note": "Named on Galway 2026 senior panel with club Tommy Larkins (Tuam Herald).",
        "confidence": "unverified",
    },
    {
        "name": "Joshua Ryan",
        "club": "club:clarinbridge",
        "source": TUAM_2026,
        "note": "Named on Galway 2026 senior panel with club Clarinbridge (Tuam Herald).",
        "confidence": "unverified",
    },
    {
        "name": "Stephen O'Halloran",
        "club": "club:craughwell",
        "source": TUAM_2026,
        "note": "Named on Galway 2026 senior panel with club Craughwell (Tuam Herald).",
        "confidence": "unverified",
    },
    # Portumna notable already mostly covered; add no duplicates
]

# Extra links for existing players via 2017 Mellows final cite
EXTRA_LINKS: list[dict] = [
    {
        "player": "player:conor-kavanagh",
        "club": "club:liam-mellows",
        "source": "https://en.wikipedia.org/wiki/2017_Galway_Senior_Hurling_Championship",
        "note": "Named on Liam Mellows starting XV, 2017 Galway SHC final (Wikipedia).",
        "confidence": "medium",
    },
    {
        "player": "player:conor-elwood",
        "club": "club:liam-mellows",
        "source": "https://en.wikipedia.org/wiki/2017_Galway_Senior_Hurling_Championship",
        "note": "Named as Liam Mellows substitute, 2017 Galway SHC final (Wikipedia).",
        "confidence": "medium",
    },
]

# HOLD forever (do not stamp)
HOLD_PLAYERS = {
    "player:michael-healy",
    "player:michael-conneely",  # 1980 panel vs 2017 Mellows collision
}


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
    # upgrade source/note/confidence carefully
    set_or_add(seed, pair_index, by_row, pid, "source", source, stats)
    conf = confidence
    if conf == "unverified" and attrs.get("confidence") in ("high", "medium", "verified"):
        conf = attrs.get("confidence")
    elif conf in ("high", "medium"):
        set_or_add(seed, pair_index, by_row, pid, "confidence", conf, stats)
    else:
        set_or_add(seed, pair_index, by_row, pid, "confidence", conf, stats)
    # append note
    old_note = attrs.get("note") or ""
    if note and note not in old_note:
        new_note = (old_note + " " + note).strip() if old_note else note
        set_or_add(seed, pair_index, by_row, pid, "note", new_note, stats)
    # clear hold on player if present and we're linking
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
            if a.get("hold") is True and "HOLD" in str(a.get("note") or ""):
                # keep explicit collision HOLDs
                if "collision" in str(a.get("note") or "").lower() or "do not stamp" in str(a.get("note") or "").lower():
                    continue
            # set club on appearance when player club now known from public cite
            if not a.get("club"):
                set_or_add(seed, pair_index, by_row, row, "club", club, stats)
                stats["appearances_clubbed"] += 1
            # release generic panel HOLDs (cite had no club; player cite now supports)
            if a.get("hold") is True and "collision" not in str(a.get("note") or "").lower():
                set_or_add(seed, pair_index, by_row, row, "hold", False, stats)
                if a.get("status") in ("hold", "pending_archivist"):
                    set_or_add(seed, pair_index, by_row, row, "status", "pending_archivist", stats)
    return True


def create_player(seed, pair_index, by_row, spec, stats, created_ids, fohenagh_new):
    pid = spec.get("id") or f"player:{slugify(spec['name'])}"
    if pid in by_row and by_row[pid].get("type") == "player":
        # already exists — try link instead
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

    # 1) Wikipedia + curated links
    for item in WIKI_LINKS + EXTRA_LINKS:
        ok = link_player(
            seed, pair_index, by_row,
            item["player"], item["club"], item["source"], item["note"],
            item.get("confidence", "high"), stats, linked_ids,
        )
        if ok and ("fohenagh" in item["club"] or "ahascragh" in item["club"]):
            fohenagh_linked.append(item["player"])

    # 2) Tuam Herald 2026 links for existing club-less
    for item in TUAM_LINKS:
        ok = link_player(
            seed, pair_index, by_row,
            item["player"], item["club"], TUAM_2026,
            f"Named on Galway 2026 senior panel with club ({item['name']}) — Tuam Herald.",
            "medium", stats, linked_ids,
        )
        if ok and ("fohenagh" in item["club"] or "ahascragh" in item["club"]):
            fohenagh_linked.append(item["player"])

    # 3) New players for orphan expansion
    for spec in NEW_PLAYERS:
        create_player(seed, pair_index, by_row, spec, stats, created_ids, fohenagh_new)

    # Mark HOLD note on 1980 Michael Conneely if not already
    if "player:michael-conneely" in by_row:
        note = by_row["player:michael-conneely"].get("note") or ""
        hold_note = "HOLD: possible 2017 Liam Mellows Michael Conneely collision — no club stamp; see player:michael-conneely-liam-mellows."
        if "collision" not in note.lower():
            set_or_add(
                seed, pair_index, by_row, "player:michael-conneely", "note",
                (note + " " + hold_note).strip(), stats,
            )
        set_or_add(seed, pair_index, by_row, "player:michael-conneely", "hold", True, stats)
        set_or_add(seed, pair_index, by_row, "player:michael-conneely", "status", "hold", stats)

    after = count_stats(by_row)

    now = datetime.now(timezone.utc).isoformat()
    pack = {
        "pack": "galway-club-player-links",
        "generated_at": now,
        "sources": [
            "https://en.wikipedia.org/wiki/ (player infoboxes + club Notable players)",
            "https://en.wikipedia.org/wiki/2017_Galway_Senior_Hurling_Championship",
            "https://en.wikipedia.org/wiki/Liam_Mellows_GAA",
            TUAM_2026,
            "https://irishnewsarchive.com/ (Fohenagh 1959–60 contemporary reports)",
        ],
        "before": {
            "players": before["players"],
            "players_with_club": before["with_club"],
            "players_without_club": before["without_club"],
            "orphan_clubs": before["orphans"],
            "orphan_club_ids": before["orphan_ids"],
        },
        "after": {
            "players": after["players"],
            "players_with_club": after["with_club"],
            "players_without_club": after["without_club"],
            "orphan_clubs": after["orphans"],
            "orphan_club_ids": after["orphan_ids"],
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
                "club:ahascragh-historic",
                "club:portumna",
                "club:clarinbridge",
                "club:athenry",
                "club:st-thomas",
                "club:castlegar",
                "club:turloughmore",
                "club:loughrea",
                "club:liam-mellows",
                "club:killimor",
                "club:abbeyknockmoy",
                "club:tynagh-abbey-duniry",
                "club:beagh",
                "club:kiltormer",
                "club:mullagh",
            ]
        },
    }
    PACK_PATH.write_text(json.dumps(pack, indent=2) + "\n")

    # INA / Archivist queue for noteworthy Fohenagh links
    queue = {
        "queue": "archivist-fohenagh-club-links",
        "generated_at": now,
        "note": "New historic Fohenagh players from INA 1959–60 reports; review for CLEAR.",
        "fohenagh_new_player_ids": fohenagh_new,
        "fohenagh_linked_existing_ids": fohenagh_linked,
        "pack": str(PACK_PATH.relative_to(ROOT)),
    }
    QUEUE_PATH.write_text(json.dumps(queue, indent=2) + "\n")

    log = {
        "url": "https://en.wikipedia.org/wiki/ + Tuam Herald 2026 panel + INA Fohenagh 1959-60",
        "date": "2026-09-04",
        "title": "Link Galway players to clubs and expand orphan club squads",
        "publisher": "Wikipedia / Tuam Herald / Irish Newspaper Archives / HurlingWiki",
        "processed_at": now,
        "pack": str(PACK_PATH.relative_to(ROOT)),
        "queue": str(QUEUE_PATH.relative_to(ROOT)),
        "before_players_with_club": before["with_club"],
        "after_players_with_club": after["with_club"],
        "players_linked": stats["players_linked"],
        "players_created": stats["players_created"],
        "before_orphan_clubs": before["orphans"],
        "after_orphan_clubs": after["orphans"],
        "fohenagh_new": fohenagh_new,
        "sample_linked": linked_ids[:15],
        "sample_created": created_ids[:15],
    }
    with LOG_PATH.open("a") as f:
        f.write(json.dumps(log) + "\n")

    SEED_PATH.write_text(json.dumps(seed, indent=2) + "\n")

    print(json.dumps({
        "before_with_club": before["with_club"],
        "after_with_club": after["with_club"],
        "linked": stats["players_linked"],
        "created": stats["players_created"],
        "before_orphans": before["orphans"],
        "after_orphans": after["orphans"],
        "appearances_clubbed": stats["appearances_clubbed"],
        "fohenagh_new": fohenagh_new,
        "target_ok": stats["players_linked"] >= 40 or stats["players_created"] >= 30
            or (stats["players_linked"] + stats["players_created"]) >= 40,
    }, indent=2))


if __name__ == "__main__":
    main()
