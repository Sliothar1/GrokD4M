#!/usr/bin/env python3
"""Round 5: remaining Galway orphan fills + club-less panel links + cited matches.

Priority: Fohenagh/AF first, then Meelick historic (1887), Derrydonnell (1911),
Maree historic (1930s), club-less Wikipedia/club links. Claregalway HOLD (Carnmore).
Unverified for new; HOLD collisions. Scores only from clear public cites (no invent).
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
        "player": "player:sean-loftus",
        "club": "club:turloughmore",
        "source": "https://en.wikipedia.org/wiki/Se%C3%A1n_Loftus_(hurler)",
        "note": "Wikipedia: Galway SHC club Turloughmore; 2017 All-Ireland SHC panel.",
        "confidence": "high",
    },
    {
        "player": "player:niall-corcoran",
        "club": "club:meelick-eyrecourt",
        "source": "https://en.wikipedia.org/wiki/Niall_Corcoran",
        "note": "Wikipedia: clubs Meelick–Eyrecourt and Kilmacud Crokes; Galway MHC 2000; later Dublin senior.",
        "confidence": "high",
    },
    {
        "player": "player:darragh-burke",
        "club": "club:st-thomas",
        "source": "https://www.gaa.ie/hurling/news/galway-shc-final-six-in-a-row-for-st-thomas",
        "note": "GAA.ie Galway SHC final report/photo: Darragh Burke, St Thomas'; also RTE 2018 final scorer line.",
        "confidence": "high",
    },
    {
        "player": "player:adrian-diviney",
        "club": "club:oranmore-maree",
        "source": "https://www.irishexaminer.com/sport/gaa/arid-10096043.html",
        "note": "Irish Examiner Galway U-21 team sheet: Adrian Diviney (Oranmore-Maree). Distinct from Aidan Diviney (Beagh).",
        "confidence": "medium",
    },
    {
        "player": "player:aidan-diviney",
        "club": "club:beagh",
        "source": "https://www.irishexaminer.com/sport/gaa/arid-10096043.html",
        "note": "Irish Examiner Galway U-21 team sheet: Aidan Diviney (Beagh). HOLD Wikipedia Oranmore 'Aidan Divney' spelling collision — Examiner Beagh stamp retained.",
        "confidence": "medium",
    },
    {
        "player": "player:richard-burke",
        "club": "club:oranmore-maree",
        "source": "https://en.wikipedia.org/wiki/Oranmore%E2%80%93Maree_GAA",
        "note": "Wikipedia Oranmore–Maree: Richard Burke among clubmen who lined out for Galway senior; club-less U-21 1991 panel id.",
        "confidence": "medium",
    },
    {
        "player": "player:william-burke",
        "club": "club:oranmore-maree",
        "source": "https://en.wikipedia.org/wiki/Oranmore%E2%80%93Maree_GAA",
        "note": "Wikipedia Oranmore–Maree: William Burke among clubmen who lined out for Galway senior; club-less U-21/IHC panel id.",
        "confidence": "medium",
    },
]


NEW_PLAYERS: list[dict] = [
    # --- Fohenagh / AF first ---
    {
        "name": "John Finnerty",
        "id": "player:john-finnerty-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.advertiser.ie/galway/article/88712/title-for-ahascraghfohenagh",
        "note": "Galway Advertiser: named scorer for Ahascragh/Fohenagh in 2016 Connacht Intermediate club final replay vs Ballyhaunis. Distinct id — Finnerty surname common.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    # --- Meelick historic orphan (1887 All-Ireland final XV — Seamus J King; Meelick men only) ---
    {
        "name": "Pat Madden",
        "id": "player:pat-madden-meelick",
        "club": "club:meelick-historic",
        "source": "https://en.wikipedia.org/wiki/1887_All-Ireland_Senior_Hurling_Championship_final",
        "note": "Wikipedia 1887 AI final + Seamus J King: Pat Madden captained Meelick/Galway; hurley in GAA Museum. Meelick contingent (not Killimor).",
        "confidence": "high",
    },
    {
        "name": "Patrick Cullen",
        "id": "player:patrick-cullen-meelick",
        "club": "club:meelick-historic",
        "source": "https://www.seamusjking.com/sjk-articles/2014/11/1/span-classposttitlehurling-south-east-galway-and-the-first-all-irelandspan-talk-given-to-history-society-eyrecourt-circa-1991",
        "note": "Seamus J King: named among Meelick twelve on 1887 All-Ireland final side.",
        "confidence": "medium",
    },
    {
        "name": "Mike Manning",
        "id": "player:mike-manning-meelick",
        "club": "club:meelick-historic",
        "source": "https://www.seamusjking.com/sjk-articles/2014/11/1/span-classposttitlehurling-south-east-galway-and-the-first-all-irelandspan-talk-given-to-history-society-eyrecourt-circa-1991",
        "note": "Seamus J King: named among Meelick twelve on 1887 All-Ireland final side.",
        "confidence": "medium",
    },
    {
        "name": "John Colohan",
        "id": "player:john-colohan-meelick",
        "club": "club:meelick-historic",
        "source": "https://www.seamusjking.com/sjk-articles/2014/11/1/span-classposttitlehurling-south-east-galway-and-the-first-all-irelandspan-talk-given-to-history-society-eyrecourt-circa-1991",
        "note": "Seamus J King: named among Meelick twelve on 1887 All-Ireland final side.",
        "confidence": "medium",
    },
    {
        "name": "John Scally",
        "id": "player:john-scally-meelick",
        "club": "club:meelick-historic",
        "source": "https://www.seamusjking.com/sjk-articles/2014/11/1/span-classposttitlehurling-south-east-galway-and-the-first-all-irelandspan-talk-given-to-history-society-eyrecourt-circa-1991",
        "note": "Seamus J King: named among Meelick twelve on 1887 All-Ireland final side.",
        "confidence": "medium",
    },
    {
        "name": "Willie Madden",
        "id": "player:willie-madden-meelick",
        "club": "club:meelick-historic",
        "source": "https://www.seamusjking.com/sjk-articles/2014/11/1/span-classposttitlehurling-south-east-galway-and-the-first-all-irelandspan-talk-given-to-history-society-eyrecourt-circa-1991",
        "note": "Seamus J King: named among Meelick twelve on 1887 All-Ireland final side.",
        "confidence": "medium",
    },
    {
        "name": "Tom Hanley",
        "id": "player:tom-hanley-meelick",
        "club": "club:meelick-historic",
        "source": "https://www.seamusjking.com/sjk-articles/2014/11/1/span-classposttitlehurling-south-east-galway-and-the-first-all-irelandspan-talk-given-to-history-society-eyrecourt-circa-1991",
        "note": "Seamus J King: named among Meelick twelve on 1887 All-Ireland final side.",
        "confidence": "medium",
    },
    {
        "name": "James Kelly",
        "id": "player:james-kelly-meelick",
        "club": "club:meelick-historic",
        "source": "https://www.seamusjking.com/sjk-articles/2014/11/1/span-classposttitlehurling-south-east-galway-and-the-first-all-irelandspan-talk-given-to-history-society-eyrecourt-circa-1991",
        "note": "Seamus J King: named among Meelick twelve on 1887 All-Ireland final side. Distinct id — Kelly surname common.",
        "confidence": "unverified",
    },
    {
        "name": "Pat Manning",
        "id": "player:pat-manning-meelick",
        "club": "club:meelick-historic",
        "source": "https://www.seamusjking.com/sjk-articles/2014/11/1/span-classposttitlehurling-south-east-galway-and-the-first-all-irelandspan-talk-given-to-history-society-eyrecourt-circa-1991",
        "note": "Seamus J King: named among Meelick twelve on 1887 All-Ireland final side.",
        "confidence": "medium",
    },
    {
        "name": "Jim Connolly",
        "id": "player:jim-connolly-meelick",
        "club": "club:meelick-historic",
        "source": "https://www.seamusjking.com/sjk-articles/2014/11/1/span-classposttitlehurling-south-east-galway-and-the-first-all-irelandspan-talk-given-to-history-society-eyrecourt-circa-1991",
        "note": "Seamus J King: named among Meelick twelve on 1887 All-Ireland final side.",
        "confidence": "medium",
    },
    {
        "name": "John Cosgrove",
        "id": "player:john-cosgrove-meelick",
        "club": "club:meelick-historic",
        "source": "https://www.seamusjking.com/sjk-articles/2014/11/1/span-classposttitlehurling-south-east-galway-and-the-first-all-irelandspan-talk-given-to-history-society-eyrecourt-circa-1991",
        "note": "Seamus J King: named among Meelick twelve on 1887 All-Ireland final side.",
        "confidence": "medium",
    },
    {
        "name": "Arthur Cosgrove",
        "id": "player:arthur-cosgrove-meelick",
        "club": "club:meelick-historic",
        "source": "https://www.seamusjking.com/sjk-articles/2014/11/1/span-classposttitlehurling-south-east-galway-and-the-first-all-irelandspan-talk-given-to-history-society-eyrecourt-circa-1991",
        "note": "Seamus J King: named among Meelick twelve on 1887 All-Ireland final side.",
        "confidence": "medium",
    },
    # Killimor contingent on same 1887 side (not orphan fill — thin Killimor)
    {
        "name": "John Lowry",
        "id": "player:john-lowry-killimor",
        "club": "club:killimor",
        "source": "https://www.seamusjking.com/sjk-articles/2014/11/1/span-classposttitlehurling-south-east-galway-and-the-first-all-irelandspan-talk-given-to-history-society-eyrecourt-circa-1991",
        "note": "Seamus J King: Killimor contingent on 1887 Meelick/Galway All-Ireland final side; walked Killimor to Birr.",
        "confidence": "medium",
    },
    # --- Derrydonnell orphan (1911 Galway SHC champions — Athenry parish / club history) ---
    {
        "name": "Patrick Keane",
        "id": "player:patrick-keane-derrydonnell",
        "club": "club:derrydonnell",
        "source": "https://athenryparishheritage.com/the-county-hurling-final-of-1911/",
        "note": "Athenry Parish Heritage / Connacht Tribune: team captain Patrick Keane of Derrydonnell 1911 Galway SHC champions.",
        "confidence": "high",
    },
    {
        "name": "Jack Ruane",
        "id": "player:jack-ruane-derrydonnell",
        "club": "club:derrydonnell",
        "source": "https://athenryparishheritage.com/the-county-hurling-final-of-1911/",
        "note": "Athenry Parish Heritage: Jack Ruane named on Derrydonnell 1911 SHC champions (injured early in final).",
        "confidence": "medium",
    },
    {
        "name": "Andy Keane",
        "id": "player:andy-keane-derrydonnell",
        "club": "club:derrydonnell",
        "source": "https://athenryparishheritage.com/the-athenry-gaa-story-1885-1987/",
        "note": "Athenry GAA Story: Andy Keane on Derrydonnell 1911 SHC champions; drowned Titanic 1912 with county medal aboard.",
        "confidence": "high",
    },
    {
        "name": "Mike Keane",
        "id": "player:mike-keane-derrydonnell",
        "club": "club:derrydonnell",
        "source": "https://athenryparishheritage.com/the-county-hurling-final-of-1911/",
        "note": "Athenry Parish Heritage (Tom Keane): Mike Keane Tobberoe named on Derrydonnell 1911 XV.",
        "confidence": "medium",
    },
    {
        "name": "Mike Freeney",
        "id": "player:mike-freeney-derrydonnell",
        "club": "club:derrydonnell",
        "source": "https://athenryparishheritage.com/the-county-hurling-final-of-1911/",
        "note": "Athenry Parish Heritage: Mike Freeney Derrydonnell named on 1911 SHC champions.",
        "confidence": "medium",
    },
    {
        "name": "Pat Heneghan",
        "id": "player:pat-heneghan-derrydonnell",
        "club": "club:derrydonnell",
        "source": "https://athenryparishheritage.com/the-county-hurling-final-of-1911/",
        "note": "Athenry Parish Heritage: Pat Heneghan Derrydonnell More named on 1911 SHC champions.",
        "confidence": "medium",
    },
    {
        "name": "Willie Higgins",
        "id": "player:willie-higgins-derrydonnell",
        "club": "club:derrydonnell",
        "source": "https://athenryparishheritage.com/the-county-hurling-final-of-1911/",
        "note": "Athenry Parish Heritage: Willie Higgins Coshla named on Derrydonnell 1911 SHC champions.",
        "confidence": "medium",
    },
    {
        "name": "Martin Kennedy",
        "id": "player:martin-kennedy-derrydonnell",
        "club": "club:derrydonnell",
        "source": "https://athenryparishheritage.com/the-county-hurling-final-of-1911/",
        "note": "Athenry Parish Heritage: Martin Kennedy Carnaun named on Derrydonnell 1911 SHC champions.",
        "confidence": "medium",
    },
    {
        "name": "Mick Fahy",
        "id": "player:mick-fahy-derrydonnell",
        "club": "club:derrydonnell",
        "source": "https://athenryparishheritage.com/the-county-hurling-final-of-1911/",
        "note": "Athenry Parish Heritage: Mick Fahy named on Derrydonnell 1911 SHC champions.",
        "confidence": "medium",
    },
    {
        "name": "Jack Costello",
        "id": "player:jack-costello-derrydonnell",
        "club": "club:derrydonnell",
        "source": "https://athenryparishheritage.com/the-county-hurling-final-of-1911/",
        "note": "Athenry Parish Heritage: Jack Costello Gortroe named on Derrydonnell 1911 SHC champions.",
        "confidence": "medium",
    },
    # --- Maree historic orphan (Athenry GAA 1939 Junior caption names Maree clubmen) ---
    {
        "name": "Joe Hanniffy",
        "id": "player:joe-hanniffy-maree",
        "club": "club:maree-historic",
        "source": "https://www.athenrygaa.ie/index.php/history-photo-gallery/1930-1943",
        "note": "Athenry GAA history photo caption: Joe Hanniffy (Maree) on Galway All-Ireland Junior Hurling Champions 1939. Historic Maree stamp (pre Oranmore–Maree 1967).",
        "confidence": "medium",
    },
    {
        "name": "Malachy Donnellan",
        "id": "player:malachy-donnellan-maree",
        "club": "club:maree-historic",
        "source": "https://www.athenrygaa.ie/index.php/history-photo-gallery/1930-1943",
        "note": "Athenry GAA history: Malachy Donnellan (Maree) on Galway AJHC champions 1939.",
        "confidence": "medium",
    },
    {
        "name": "Willie Donnellan",
        "id": "player:willie-donnellan-maree",
        "club": "club:maree-historic",
        "source": "https://www.athenrygaa.ie/index.php/history-photo-gallery/1930-1943",
        "note": "Athenry GAA history: Willie Donnellan (Maree) on Galway AJHC champions 1939.",
        "confidence": "medium",
    },
    # --- Meelick-Eyrecourt thin (Joe Salmon wiki) — not Eyrecourt-historic alone ---
    {
        "name": "Joe Salmon",
        "id": "player:joe-salmon",
        "club": "club:meelick-eyrecourt",
        "source": "https://en.wikipedia.org/wiki/Joe_Salmon",
        "note": "Wikipedia: club Meelick-Eyrecourt (also brief Liam Mellows / Glen Rovers); Galway senior 1949–1964; Galway Team of the Millennium midfield. HOLD stamp onto club:eyrecourt-historic alone.",
        "confidence": "high",
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
}


CLUB_META_UPDATES: list[dict] = [
    {
        "id": "club:meelick-historic",
        "cols": {
            "note": "1887 All-Ireland final Meelick XV cited Seamus J King (Meelick twelve) + Wikipedia (captain Pat Madden). Killimor nine stamped on club:killimor. Successor club:meelick-eyrecourt.",
            "source_king": "https://www.seamusjking.com/sjk-articles/2014/11/1/span-classposttitlehurling-south-east-galway-and-the-first-all-irelandspan-talk-given-to-history-society-eyrecourt-circa-1991",
            "source_wiki_1887": "https://en.wikipedia.org/wiki/1887_All-Ireland_Senior_Hurling_Championship_final",
        },
    },
    {
        "id": "club:derrydonnell",
        "cols": {
            "note": "1911 Galway SHC champions XV cited Athenry Parish Heritage (Tom Keane / Connacht Tribune) and Athenry GAA Story. Final vs Claregalway (parish hurling now Carnmore — HOLD Claregalway player invent).",
            "Galway Senior Hurling Championship": "1911",
            "source_heritage": "https://athenryparishheritage.com/the-county-hurling-final-of-1911/",
            "source_story": "https://athenryparishheritage.com/the-athenry-gaa-story-1885-1987/",
        },
    },
    {
        "id": "club:maree-historic",
        "cols": {
            "note": "Joe / Malachy / Willie Donnellan–Hanniffy cited Athenry GAA 1939 Junior caption as Maree. 1933 SHC win vs Castlegar already on match:galway-shc-1933-final. Successor club:oranmore-maree (1967).",
            "source_caption": "https://www.athenrygaa.ie/index.php/history-photo-gallery/1930-1943",
        },
    },
    {
        "id": "club:claregalway",
        "cols": {
            "note": "HOLD orphan r5: no named Claregalway-only hurling player cite. Parish hurling → club:carnmore. 1911 SHC finalist vs Derrydonnell noted on Derrydonnell pack only.",
        },
    },
    {
        "id": "club:eyrecourt-historic",
        "cols": {
            "note": "HOLD orphan r5: 1959 Galway IHC winners (Wikipedia roll) but no named Eyrecourt-only XV cite harvested. Joe Salmon stamped club:meelick-eyrecourt (Wikipedia), not this historic stamp.",
            "Galway Intermediate Hurling Championship": "1959",
            "source": "https://en.wikipedia.org/wiki/Galway_Intermediate_Hurling_Championship",
        },
    },
    {
        "id": "club:oranmore-historic",
        "cols": {
            "note": "HOLD orphan r5: 1950 Galway IHC winners (Wikipedia roll) — no named Oranmore-only adult XV cite. 1963 MHC listed as Oranmore on Oranmore–Maree wiki. Modern players on club:oranmore-maree.",
            "Galway Intermediate Hurling Championship": "1950",
            "source": "https://en.wikipedia.org/wiki/Galway_Intermediate_Hurling_Championship",
        },
    },
    {
        "id": "club:college-road",
        "cols": {
            "note": "HOLD orphan r5: 1892–1893 SHC winners; Duggan family grand-uncles cited without first+last names (Advertiser / Hogan Stand). Do not invent College Road XV; modern Duggans are Liam Mellows.",
            "source_advertiser": "https://www.advertiser.ie/Galway/article/138445/club-pays-tribute-to-best-pound-for-pound-hurler-in-ireland",
        },
    },
    {
        "id": "club:galway-city-historic",
        "cols": {
            "note": "HOLD orphan r5: early SHC finalist/city selection — no clear first+last player cite harvested this run.",
        },
    },
    {
        "id": "club:kilrickle",
        "cols": {
            "note": "HOLD orphan r5: first Galway IHC champions 1949 (Wikipedia roll) — no named Kilrickle XV cite. Modern Kilrickle NS linked to Cappataggle juveniles (not a player stamp).",
            "Galway Intermediate Hurling Championship": "1949",
            "source": "https://en.wikipedia.org/wiki/Galway_Intermediate_Hurling_Championship",
        },
    },
    {
        "id": "club:leitrim-galway-historic",
        "cols": {
            "note": "HOLD orphan r5: 1930 SHC finalist — no named Leitrim (Galway) XV cite. Modern lineage club:kilnadeema-leitrim.",
        },
    },
    {
        "id": "club:skehana",
        "cols": {
            "note": "HOLD orphan r5: 1952 Galway IHC winners (Wikipedia roll) — no named historic Skehana XV. Modern amalgam club:skehana-mountbellew-moylough (Oisín Lohan etc.).",
            "Galway Intermediate Hurling Championship": "1952",
            "source": "https://en.wikipedia.org/wiki/Galway_Intermediate_Hurling_Championship",
        },
    },
    {
        "id": "club:st-colemans",
        "cols": {
            "note": "HOLD orphan r5: 1948 SHC finalist — no named St Coleman's hurling XV cite. Name today mainly camogie / Gort St Colman's Park — do not invent.",
        },
    },
]


NEW_MATCHES: list[dict] = [
    {
        "id": "match:all-ireland-shc-1887-final",
        "cols": {
            "type": "match",
            "name": "Tipperary (Thurles) vs Galway (Meelick) (1887 All-Ireland SHC Final)",
            "competition": "All-Ireland Senior Hurling Championship",
            "round": "Final",
            "year": 1887,
            "date": "1888-04-01",
            "home": "Tipperary (Thurles Blues)",
            "away": "team:galway",
            "winner": "Tipperary (Thurles Blues)",
            "runner_up": "team:galway",
            "club_representative_home": "Thurles Blues",
            "club_representative_away": "club:meelick-historic",
            "venue": "Birr Sportsfield, Birr",
            "score": "Tipperary 1-1, Galway 0-0",
            "note": "First All-Ireland SHC final. Wikipedia score Tipperary 1–1 (and a forfeit point) to Galway 0–00. Meelick represented Galway (captain Pat Madden).",
            "confidence": "high",
            "source": "https://en.wikipedia.org/wiki/1887_All-Ireland_Senior_Hurling_Championship_final",
            "source_wiki_championship": "https://en.wikipedia.org/wiki/1887_All-Ireland_Senior_Hurling_Championship",
            "result": "win",
            "historic_club": "club:meelick-historic",
        },
    },
    {
        "id": "match:galway-ihc-1959-final",
        "cols": {
            "type": "match",
            "name": "Eyrecourt vs Newcastle (1959 Galway IHC Final)",
            "competition": "Galway Intermediate Hurling Championship",
            "round": "Final",
            "year": 1959,
            "home": "club:eyrecourt-historic",
            "away": "club:newcastle-galway",
            "winner": "club:eyrecourt-historic",
            "runner_up": "club:newcastle-galway",
            "score": "Eyrecourt 1-05, Newcastle 0-04",
            "note": "Wikipedia Galway Intermediate Hurling Championship roll: Eyrecourt 1-05 Newcastle 0-04. Athenry GAA Story confirms Newcastle lost that final by the same margin. Scores cited public roll + parish history.",
            "confidence": "medium",
            "source": "https://en.wikipedia.org/wiki/Galway_Intermediate_Hurling_Championship",
            "source_athenry": "https://athenryparishheritage.com/the-athenry-gaa-story-1885-1987/",
            "result": "win",
            "historic_club": "club:eyrecourt-historic",
        },
    },
    {
        "id": "match:galway-ihc-1952-final",
        "cols": {
            "type": "match",
            "name": "Skehana vs Craughwell (1952 Galway IHC Final)",
            "competition": "Galway Intermediate Hurling Championship",
            "round": "Final",
            "year": 1952,
            "home": "club:skehana",
            "away": "club:craughwell",
            "winner": "club:skehana",
            "runner_up": "club:craughwell",
            "score": "Skehana 3-05, Craughwell 3-03",
            "note": "Wikipedia Intermediate championship finals table: Skehana 3-05 Craughwell 3-03. No named Skehana XV this run — club remains orphan for players.",
            "confidence": "medium",
            "source": "https://en.wikipedia.org/wiki/Galway_Intermediate_Hurling_Championship",
            "result": "win",
            "historic_club": "club:skehana",
        },
    },
    {
        "id": "match:galway-ihc-1950-final",
        "cols": {
            "type": "match",
            "name": "Oranmore vs Killimor (1950 Galway IHC Final)",
            "competition": "Galway Intermediate Hurling Championship",
            "round": "Final",
            "year": 1950,
            "home": "club:oranmore-historic",
            "away": "club:killimor",
            "winner": "club:oranmore-historic",
            "runner_up": "club:killimor",
            "score": "Oranmore 3-05, Killimor 3-01",
            "note": "Wikipedia Intermediate finals table: Oranmore 3-05 Killimor 3-01. ClubInfo Oranmore–Maree history echoes same margin (after a replay noted on club pages — score line from Wiki roll).",
            "confidence": "medium",
            "source": "https://en.wikipedia.org/wiki/Galway_Intermediate_Hurling_Championship",
            "source_clubinfo": "https://www.clubinfo.ie/club/oranmore-maree-hc/",
            "result": "win",
            "historic_club": "club:oranmore-historic",
        },
    },
    {
        "id": "match:galway-ihc-1953-final",
        "cols": {
            "type": "match",
            "name": "Maree vs Craughwell (1953 Galway IHC Final)",
            "competition": "Galway Intermediate Hurling Championship",
            "round": "Final",
            "year": 1953,
            "home": "club:maree-historic",
            "away": "club:craughwell",
            "winner": "club:maree-historic",
            "runner_up": "club:craughwell",
            "score": "Maree 6-01, Craughwell 4-01",
            "note": "Wikipedia Intermediate finals table: Maree 6-01 Craughwell 4-01. ClubInfo Oranmore–Maree history agrees.",
            "confidence": "medium",
            "source": "https://en.wikipedia.org/wiki/Galway_Intermediate_Hurling_Championship",
            "source_clubinfo": "https://www.clubinfo.ie/club/oranmore-maree-hc/",
            "result": "win",
            "historic_club": "club:maree-historic",
        },
    },
]


MATCH_META_UPDATES: list[dict] = [
    {
        "id": "match:galway-shc-1887-final",
        "cols": {
            "secondary_cite": "Seamus J King · Galway SHC final Meelick beat Ardrahan 2-6 to 2-3",
            "secondary_cite_paper": "Seamus J King (Eyrecourt History Society talk)",
            "secondary_cite_url": "https://www.seamusjking.com/sjk-articles/2014/11/1/span-classposttitlehurling-south-east-galway-and-the-first-all-irelandspan-talk-given-to-history-society-eyrecourt-circa-1991",
            "score": "Meelick 2-6, Ardrahan 2-3",
            "away": "club:ardrahan",
            "runner_up": "club:ardrahan",
            "ingest_triage": "secondary_cite",
            "note": "Galway SHC 1887 champions Meelick (seed). Score from Seamus J King talk (Meelick beat Ardrahan 2-6 to 2-3 in county final). Distinct from All-Ireland final match:all-ireland-shc-1887-final.",
        },
    },
    {
        "id": "match:galway-shc-1911-final",
        "cols": {
            "secondary_cite": "Athenry Parish Heritage / Connacht Tribune · Derrydonnell beat Claregalway",
            "secondary_cite_url": "https://athenryparishheritage.com/the-county-hurling-final-of-1911/",
            "ingest_triage": "secondary_cite",
            "note": "Derrydonnell beat Claregalway in Tuam (26 Nov 1911 per Athenry GAA centenary). Final score line not double-sourced this run — omitted. Captain Patrick Keane.",
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
        "player:aidan-diviney": "HOLD collision note: Wikipedia Oranmore lists Aidan Divney; Examiner U-21 sheet stamps Aidan Diviney Beagh — Beagh retained.",
    }
    for pid, hnote in hold_notes.items():
        if pid not in by_row or by_row[pid].get("type") != "player":
            continue
        if pid in ("player:aidan-diviney",):
            # linked this round — append collision note only, do not set hold blocking club
            note = by_row[pid].get("note") or ""
            if "HOLD collision" not in note and hnote not in note:
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
        "round": "5",
        "generated_at": now,
        "sources": [
            "https://en.wikipedia.org/wiki/Se%C3%A1n_Loftus_(hurler)",
            "https://en.wikipedia.org/wiki/Niall_Corcoran",
            "https://en.wikipedia.org/wiki/Joe_Salmon",
            "https://en.wikipedia.org/wiki/Oranmore%E2%80%93Maree_GAA",
            "https://en.wikipedia.org/wiki/1887_All-Ireland_Senior_Hurling_Championship_final",
            "https://en.wikipedia.org/wiki/Galway_Intermediate_Hurling_Championship",
            "https://www.gaa.ie/hurling/news/galway-shc-final-six-in-a-row-for-st-thomas",
            "https://www.irishexaminer.com/sport/gaa/arid-10096043.html",
            "https://www.advertiser.ie/galway/article/88712/title-for-ahascraghfohenagh",
            "https://www.seamusjking.com/sjk-articles/2014/11/1/span-classposttitlehurling-south-east-galway-and-the-first-all-irelandspan-talk-given-to-history-society-eyrecourt-circa-1991",
            "https://athenryparishheritage.com/the-county-hurling-final-of-1911/",
            "https://athenryparishheritage.com/the-athenry-gaa-story-1885-1987/",
            "https://www.athenrygaa.ie/index.php/history-photo-gallery/1930-1943",
            "https://www.clubinfo.ie/club/oranmore-maree-hc/",
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
                "club:meelick-historic",
                "club:derrydonnell",
                "club:maree-historic",
                "club:eyrecourt-historic",
                "club:oranmore-historic",
                "club:meelick-eyrecourt",
                "club:oranmore-maree",
                "club:st-thomas",
                "club:turloughmore",
                "club:beagh",
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
        "url": "Wikipedia + Seamus J King + Athenry heritage/GAA + GAA.ie + Irish Examiner + Advertiser + ClubInfo",
        "date": "2026-09-06",
        "title": "Galway club-player pack r5",
        "publisher": "Wikipedia / Seamus J King / Athenry / GAA.ie / Examiner / Advertiser / HurlingWiki",
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
            "batch": "fohenagh-club-links-r5",
            "ruled_at": now,
            "clear_links": fohenagh_linked,
            "unverified_new": fohenagh_new,
            "note": "AF John Finnerty from Advertiser 2016 Connacht IHC — confidence unverified pending Archivist dual-source.",
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
