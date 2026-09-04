#!/usr/bin/env python3
"""Ingest Galway SHC club finals 1887-2021 + IHC/JHC title rolls into seed.json.

Scores only when Galway GAA stats page and Wikipedia agree (normalized).
No invented scores. Dedupes against existing seed matches.
"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path("/workspace/hurlingwiki")
SEED_PATH = ROOT / "data" / "seed.json"
LOG_PATH = ROOT / "data" / "ingest-log.jsonl"
PLAN_PATH = ROOT / "docs" / "galway-continuous-ingest.md"
PACK_PATH = ROOT / "data" / "pack-galway-shc-finals-1887-2021.json"

SOURCE_GGAA = "https://www.galwaygaa.ie/stats-galway-senior-hurling-club-finals-1887-2021/"
SOURCE_WIKI_SHC = "https://en.wikipedia.org/wiki/Galway_Senior_Hurling_Championship"
SOURCE_WIKI_IHC = "https://en.wikipedia.org/wiki/Galway_Intermediate_Hurling_Championship"
SOURCE_WIKI_JHC = "https://en.wikipedia.org/wiki/Galway_Junior_Hurling_Championship"

# Existing clubs we must not recreate
EXISTING_CLUB_IDS = {
    "club:abbeyknockmoy",
    "club:ahascragh-fohenagh",
    "club:ahascragh-historic",
    "club:ardrahan",
    "club:athenry",
    "club:ballinderreen",
    "club:beagh",
    "club:cappataggle",
    "club:castlegar",
    "club:clarinbridge",
    "club:craughwell",
    "club:fohenagh-historic",
    "club:gort",
    "club:killimor",
    "club:killimordaly",
    "club:kilnadeema-leitrim",
    "club:kiltormer",
    "club:kinvara",
    "club:liam-mellows",
    "club:loughrea",
    "club:meelick-eyrecourt",
    "club:micheal-breathnach",
    "club:mullagh",
    "club:oranmore-maree",
    "club:padraig-pearses",
    "club:portumna",
    "club:sarsfields",
    "club:st-thomas",
    "club:tommy-larkins",
    "club:turloughmore",
    "club:tynagh-abbey-duniry",
}

# Display names / aliases for NEW clubs only (created if referenced)
NEW_CLUBS = {
    "club:peterswell": {
        "name": "Peterswell",
        "alias": "Peterswell GAA, Peterswell no 2",
        "notable": "Historic Galway SHC winners (late 19th / early 20th century).",
    },
    "club:college-road": {
        "name": "College Road",
        "alias": "College Road Galway",
        "notable": "Early Galway city hurling club; SHC winners 1892–1893.",
    },
    "club:claregalway": {
        "name": "Claregalway",
        "alias": "Claregalway GAA, Baile Chláir",
        "notable": "Galway club; early SHC finalist.",
    },
    "club:kilconieron": {
        "name": "Kilconieron",
        "alias": "Killconieron, Kilconieron GAA",
        "notable": "Galway hurling club; multiple early SHC titles.",
    },
    "club:woodford": {
        "name": "Woodford",
        "alias": "Woodford GAA",
        "notable": "South Galway club; SHC winners 1913, 1917.",
    },
    "club:galway-city-historic": {
        "name": "Galway City",
        "alias": "Galway City 98's, Galway City 98s, Galway City '98s",
        "notable": "Historic city selection / club in early Galway SHC finals.",
        "status": "historic",
    },
    "club:duniry-historic": {
        "name": "Duniry",
        "alias": "Duinry, Duniry GAA",
        "notable": "Historic east Galway club; later linked with Abbey and Tynagh amalgamations.",
        "status": "historic predecessor",
        "successor": "club:tynagh-abbey-duniry",
    },
    "club:tynagh-historic": {
        "name": "Tynagh",
        "alias": "Tynagh GAA",
        "notable": "Historic east Galway SHC power (1920s); predecessor of Tynagh-Abbey/Duniry.",
        "status": "historic predecessor",
        "successor": "club:tynagh-abbey-duniry",
    },
    "club:abbey-duniry-historic": {
        "name": "Abbey-Duniry",
        "alias": "Abbey/Duniry, Abbey Duniry",
        "notable": "Pre-amalgam club; Galway SHC runners-up 1998–1999. Now Tynagh-Abbey/Duniry.",
        "status": "historic predecessor",
        "successor": "club:tynagh-abbey-duniry",
    },
    "club:maree-historic": {
        "name": "Maree",
        "alias": "Maree GAA",
        "notable": "Historic club; Galway SHC winners 1933. Later amalgamated into Oranmore-Maree.",
        "status": "historic predecessor",
        "successor": "club:oranmore-maree",
    },
    "club:oranmore-historic": {
        "name": "Oranmore",
        "alias": "Oranmore GAA",
        "notable": "Historic club before Oranmore-Maree amalgamation.",
        "status": "historic predecessor",
        "successor": "club:oranmore-maree",
    },
    "club:leitrim-galway-historic": {
        "name": "Leitrim (Galway)",
        "alias": "Leitrim Galway, Leitrim GAA Galway",
        "notable": "Historic Galway club (not Leitrim county); SHC finalist 1930. Later Kilnadeema-Leitrim lineage.",
        "status": "historic",
    },
    "club:army-galway": {
        "name": "Army (Galway)",
        "alias": "Army, Galway Army, Army hurling team",
        "notable": "Military selection in mid-20th century Galway SHC (winners 1947–1948).",
        "status": "historic",
    },
    "club:ballinasloe": {
        "name": "Ballinasloe",
        "alias": "Ballinasloe GAA",
        "notable": "Galway club; SHC winners 1951.",
    },
    "club:carnmore": {
        "name": "Carnmore",
        "alias": "Carnmore GAA",
        "notable": "Galway hurling club; multiple SHC final appearances.",
    },
    "club:st-colemans": {
        "name": "St Coleman's",
        "alias": "St Colemans, St. Coleman's, St Colemans GAA",
        "notable": "Historic Galway SHC finalist (1948).",
        "status": "historic",
    },
    "club:kilrickle": {
        "name": "Kilrickle",
        "alias": "Killrickle, Kilrickle GAA",
        "notable": "First Galway Intermediate champions (1949).",
    },
    "club:skehana": {
        "name": "Skehana",
        "alias": "Skehana GAA",
        "notable": "Galway Intermediate champions 1952.",
    },
    "club:newcastle-galway": {
        "name": "Newcastle (Galway)",
        "alias": "Newcastle, Newcastle Galway, Rahoon-Newcastle",
        "notable": "Galway Intermediate champions 1960.",
    },
    "club:rahoon": {
        "name": "Rahoon",
        "alias": "Rahoon GAA, Rahoon-Newcastle",
        "notable": "Galway Intermediate champions 1977.",
    },
    "club:kilbeacanty": {
        "name": "Kilbeacanty",
        "alias": "Kilbeacanty GAA",
        "notable": "Galway Intermediate champions 1978.",
    },
    "club:moycullen": {
        "name": "Moycullen",
        "alias": "Moycullen GAA, Maigh Cuilinn",
        "notable": "Galway Intermediate champions 1964, 2011, 2021.",
    },
    "club:eyrecourt-historic": {
        "name": "Eyrecourt",
        "alias": "Eyrecourt GAA",
        "notable": "Historic club; Intermediate champions 1959. Later Meelick-Eyrecourt.",
        "status": "historic predecessor",
        "successor": "club:meelick-eyrecourt",
    },
    "club:annaghdown": {
        "name": "Annaghdown",
        "alias": "Annaghdown GAA, Eanach Dhúin",
        "notable": "Galway club; Junior hurling title roll entrant.",
    },
    "club:an-spideal": {
        "name": "An Spidéal",
        "alias": "An Spideal, Spiddal, Spidéal",
        "notable": "Galway club; Junior hurling title roll entrant.",
    },
    "club:sylane": {
        "name": "Sylane",
        "alias": "Sylane GAA, Sylaun",
        "notable": "Galway club; Junior hurling title roll entrant.",
    },
    "club:skehana-mountbellew-moylough": {
        "name": "Skehana/Mountbellew–Moylough",
        "alias": "Skehana/Mountbellew-Moylough, Skehana Mountbellew Moylough",
        "notable": "Amalgam / joint entry on Galway Junior hurling title roll.",
    },
    "club:ballygar": {
        "name": "Ballygar",
        "alias": "Ballygar GAA",
        "notable": "Galway club; Junior hurling title roll entrant.",
    },
    "club:derrydonnell": {
        "name": "Derrydonnell",
        "alias": "Derrydonnell (Athenry), Derrydonnell GAA",
        "notable": "Historic Galway SHC winners 1911 (listed as Derrydonnell / Derrydonnell (Athenry)).",
    },
    "club:meelick-historic": {
        "name": "Meelick",
        "alias": "Meelick GAA, Meelick 1887",
        "notable": "First Galway SHC winners (1887). Historic forerunner linked with Meelick-Eyrecourt.",
        "status": "historic predecessor",
        "successor": "club:meelick-eyrecourt",
    },
}


def norm_score(s: str | None) -> str | None:
    if not s:
        return None
    s = s.strip()
    s = s.replace("–", "-").replace("—", "-")
    s = re.sub(r"\s+", "", s)
    # 0-09 -> 0-9 ; 5-06 -> 5-6
    m = re.match(r"^(\d+)-0*(\d+)$", s)
    if not m:
        return None
    return f"{int(m.group(1))}-{int(m.group(2))}"


def normalize_club_name(name: str) -> str:
    n = name.strip()
    n = n.replace("\xa0", " ")
    n = n.replace("–", "-").replace("—", "-")
    n = re.sub(r"\s+", " ", n)
    n = n.replace("’", "'").replace("‘", "'")
    return n


def club_id_for(name: str) -> str | None:
    if not name:
        return None
    n = normalize_club_name(name)
    key = n.lower().replace(".", "").replace("'", "")
    key = key.replace("–", "-").replace("—", "-")
    key = re.sub(r"\s+", " ", key).strip()

    aliases = {
        "meelick": "club:meelick-historic",
        "peterswell": "club:peterswell",
        "peterswell no 2": "club:peterswell",
        "college road": "club:college-road",
        "tynagh": "club:tynagh-historic",
        "ardrahan": "club:ardrahan",
        "claregalway": "club:claregalway",
        "killimor": "club:killimor",
        "craughwell": "club:craughwell",
        "turloughmore": "club:turloughmore",
        "mullagh": "club:mullagh",
        "duniry": "club:duniry-historic",
        "duinry": "club:duniry-historic",
        "kilconieron": "club:kilconieron",
        "killconieron": "club:kilconieron",
        "killnadeema": "club:kilnadeema-leitrim",
        "kilnadeema": "club:kilnadeema-leitrim",
        "kilnadeema-leitrim": "club:kilnadeema-leitrim",
        "kilnadeema/leitrim": "club:kilnadeema-leitrim",
        "loughrea": "club:loughrea",
        "derrydonnell": "club:derrydonnell",
        "derrydonnell (athenry)": "club:derrydonnell",
        "castlegar": "club:castlegar",
        "woodford": "club:woodford",
        "gort": "club:gort",
        "galway city 98s": "club:galway-city-historic",
        "galway city 98s": "club:galway-city-historic",
        "galway city 98's": "club:galway-city-historic",
        "galway city": "club:galway-city-historic",
        "clarinbridge": "club:clarinbridge",
        "clarenbridge": "club:clarinbridge",
        "leitrim": "club:leitrim-galway-historic",
        "maree": "club:maree-historic",
        "liam mellows": "club:liam-mellows",
        "ballindereen": "club:ballinderreen",
        "ballinderreen": "club:ballinderreen",
        "army": "club:army-galway",
        "ballinasloe": "club:ballinasloe",
        "carnmore": "club:carnmore",
        "st colemans": "club:st-colemans",
        "st coleman’s": "club:st-colemans",
        "st coleman's": "club:st-colemans",
        "fohenagh": "club:fohenagh-historic",
        "killimordaly": "club:killimordaly",
        "p pearses -oranmore m": "club:maree-historic",  # GAA page conflict; wiki says Maree
        "sarsfields": "club:sarsfields",
        "meelick-eyrecort": "club:meelick-eyrecourt",
        "meelick-eyrecourt": "club:meelick-eyrecourt",
        "meelick/eyrecourt": "club:meelick-eyrecourt",
        "kiltormer": "club:kiltormer",
        "athenry": "club:athenry",
        "kinvara": "club:kinvara",
        "abbeyknockmoy": "club:abbeyknockmoy",
        "portumna": "club:portumna",
        "abbey-duniry": "club:abbey-duniry-historic",
        "abbey/duniry": "club:abbey-duniry-historic",
        "abbey duniry": "club:abbey-duniry-historic",
        "st thomas": "club:st-thomas",
        "st thomas's": "club:st-thomas",
        "st thomas'": "club:st-thomas",
        "st. thomas'": "club:st-thomas",
        "st. thomas’s": "club:st-thomas",
        "tommy larkins": "club:tommy-larkins",
        "tommie larkins": "club:tommy-larkins",
        "oranmore-maree": "club:oranmore-maree",
        "oranmore/maree": "club:oranmore-maree",
        "oranmore maree": "club:oranmore-maree",
        "oranmore": "club:oranmore-historic",
        "padraig pearsés": "club:padraig-pearses",
        "pádraig pearsés": "club:padraig-pearses",
        "pádraig pearses": "club:padraig-pearses",
        "padraig pearses": "club:padraig-pearses",
        "pearses": "club:padraig-pearses",
        "pádraig pearse's": "club:padraig-pearses",
        "cappataggle": "club:cappataggle",
        "beagh": "club:beagh",
        "ahascragh-fohenagh": "club:ahascragh-fohenagh",
        "ahascragh/fohenagh": "club:ahascragh-fohenagh",
        "tynagh-abbey/duniry": "club:tynagh-abbey-duniry",
        "tynagh-abbey-duniry": "club:tynagh-abbey-duniry",
        "moycullen": "club:moycullen",
        "kilrickle": "club:kilrickle",
        "killrickle": "club:kilrickle",
        "skehana": "club:skehana",
        "newcastle": "club:newcastle-galway",
        "rahoon": "club:rahoon",
        "kilbeacanty": "club:kilbeacanty",
        "eyrecourt": "club:eyrecourt-historic",
        "annaghdown": "club:annaghdown",
        "an spideal": "club:an-spideal",
        "an spidéal": "club:an-spideal",
        "sylane": "club:sylane",
        "skehana/mountbellew–moylough": "club:skehana-mountbellew-moylough",
        "skehana/mountbellew-moylough": "club:skehana-mountbellew-moylough",
        "ballygar": "club:ballygar",

        "killimor ": "club:killimor",
    }
    # normalize key further
    k2 = key.replace("/", "-")
    k2 = re.sub(r"\s*-\s*", "-", k2)
    if k2 in aliases:
        return aliases[k2]
    # fuzzy: strip trailing spaces variants
    for a, cid in aliases.items():
        if k2 == a or k2.replace(" ", "") == a.replace(" ", "").replace("-", ""):
            return cid
    # St Thomas variants
    if "thomas" in k2:
        return "club:st-thomas"
    if "mellow" in k2:
        return "club:liam-mellows"
    if "pearse" in k2:
        return "club:padraig-pearses"
    if "sars" in k2:
        return "club:sarsfields"
    if "abbey" in k2 and "duniry" in k2:
        return "club:abbey-duniry-historic"
    if "tynagh" in k2 and "abbey" in k2:
        return "club:tynagh-abbey-duniry"
    if "meelick" in k2 and "eyre" in k2:
        return "club:meelick-eyrecourt"
    if "oranmore" in k2 and "maree" in k2:
        return "club:oranmore-maree"
    if "ahascragh" in k2:
        return "club:ahascragh-fohenagh"
    if "fohenagh" in k2:
        return "club:fohenagh-historic"
    if "skehana" in k2 and "mountbellew" in k2:
        return "club:skehana-mountbellew-moylough"
    if "spideal" in k2 or "spidéal" in k2:
        return "club:an-spideal"
    return None


def triple(row, col, val):
    return {"row": row, "col": col, "val": val}


def parse_ggaa():
    rows = json.load(open("/tmp/ggaa-shc-finals.json"))
    out = {}
    for r in rows:
        y = r["year"]
        cells = r["cells"]
        # cells: year, winner, wscore, runner, rscore, venue  OR special
        winner = cells[1].strip() if len(cells) > 1 else ""
        wscore = cells[2].strip() if len(cells) > 2 else ""
        runner = cells[3].strip() if len(cells) > 3 else ""
        rscore = cells[4].strip() if len(cells) > 4 else ""
        venue = cells[5].strip() if len(cells) > 5 else ""

        special = None
        # 1956 special packed into winner cell
        if y == 1956 or "Awarded" in winner or "None" in winner or "No Final" in winner or "Declared Void" in winner:
            special = winner
            # try extract from packed
            if y == 1956:
                winner = "Turloughmore"
                runner = "Ardrahan"
                wscore = "0-9"
                rscore = "2-3"
                special = "Awarded to Turloughmore (Galway GAA); Ardrahan scored 2-3 to Turloughmore 0-9 on the day."
            elif winner in ("None", "No Final", "Declared Void") or winner.startswith("No Final") or winner.startswith("Declared"):
                special = winner
                winner = ""
                runner = ""
            elif winner == "None":
                special = "No championship"
                winner = ""

        out[y] = {
            "winner_name": winner,
            "runner_name": runner,
            "wscore": norm_score(wscore) if wscore and not special or y == 1956 else (norm_score(wscore) if wscore else None),
            "rscore": norm_score(rscore) if rscore else None,
            "venue": venue or None,
            "special": special,
            "raw": cells,
        }
        # fix None years
        if cells[1].strip() in ("None",):
            out[y] = {
                "winner_name": "",
                "runner_name": "",
                "wscore": None,
                "rscore": None,
                "venue": None,
                "special": "No championship",
                "raw": cells,
            }
        if cells[1].strip() in ("No Final",):
            out[y] = {
                "winner_name": "",
                "runner_name": "",
                "wscore": None,
                "rscore": None,
                "venue": None,
                "special": "No final",
                "raw": cells,
            }
        if "Declared Void" in cells[1]:
            out[y] = {
                "winner_name": "",
                "runner_name": "",
                "wscore": None,
                "rscore": None,
                "venue": None,
                "special": "Declared void",
                "raw": cells,
            }
    return out


def parse_wiki_shc():
    rows = json.load(open("/tmp/wiki-shc-finals.json"))
    out = {}
    for r in rows:
        y = r["year"]
        raw = r["raw"]
        if r["ncols"] == 2:
            out[y] = {
                "winner_name": "",
                "runner_name": "",
                "wscore": None,
                "rscore": None,
                "special": raw[1],
                "raw": raw,
            }
            continue
        # Year, Winners, Wscore, Runners, Rscore
        wname = raw[1]
        wscore_raw = raw[2]
        rname = raw[3] if len(raw) > 3 else ""
        rscore_raw = raw[4] if len(raw) > 4 else ""
        # handle replay combined scores: take final/replay score when "(R)" present — store both
        def split_replay(s):
            if not s:
                return None, None
            if "(R)" in s or "(r)" in s:
                parts = [p.strip() for p in s.replace("(R)", "").replace("(r)", "").split(",")]
                draw = norm_score(parts[0]) if parts else None
                rep = norm_score(parts[1]) if len(parts) > 1 else None
                return draw, rep
            return None, norm_score(s)

        wd, wr = split_replay(wscore_raw)
        rd, rr = split_replay(rscore_raw)
        out[y] = {
            "winner_name": wname,
            "runner_name": rname,
            "wscore": wr,
            "rscore": rr,
            "wscore_draw": wd,
            "rscore_draw": rd,
            "has_replay": wd is not None or ("(R)" in wscore_raw),
            "special": None,
            "raw": raw,
        }
        if y == 1956:
            out[y]["special"] = "Awarded to Turloughmore (asterisk on Wikipedia list)."
    return out


def display_name(cid: str) -> str:
    if cid in NEW_CLUBS:
        return NEW_CLUBS[cid]["name"]
    # from existing seed later
    return cid.split(":", 1)[1].replace("-", " ").title()


def build_club_triples(needed_ids: set[str], existing_ids: set[str]) -> list[dict]:
    triples = []
    created = []
    for cid in sorted(needed_ids):
        if cid in existing_ids:
            continue
        meta = NEW_CLUBS.get(cid)
        if not meta:
            # auto stub
            meta = {"name": display_name(cid), "notable": "Galway hurling club referenced in county finals / title rolls."}
        created.append(cid)
        triples.append(triple(cid, "type", "club"))
        triples.append(triple(cid, "name", meta["name"]))
        triples.append(triple(cid, "county", "Galway"))
        triples.append(triple(cid, "province", "Connacht"))
        if meta.get("alias"):
            triples.append(triple(cid, "alias", meta["alias"]))
        if meta.get("status"):
            triples.append(triple(cid, "status", meta["status"]))
        if meta.get("successor"):
            triples.append(triple(cid, "successor", meta["successor"]))
        if meta.get("notable"):
            triples.append(triple(cid, "notable", meta["notable"]))
        triples.append(triple(cid, "confidence", "high"))
        triples.append(triple(cid, "source", SOURCE_GGAA))
        triples.append(triple(cid, "source_wiki", SOURCE_WIKI_SHC))
    return triples, created


def existing_shc_final_years(attrs) -> set[int]:
    years = set()
    for rid, a in attrs.items():
        if a.get("type") != "match":
            continue
        if a.get("competition") != "Galway Senior Hurling Championship":
            continue
        round_ = str(a.get("round", "")).lower()
        name = str(a.get("name", "")).lower()
        if "final" in round_ or "final" in name:
            y = a.get("year")
            if isinstance(y, int):
                # only count as covering the year if it's THE county final (not relegation)
                if "relegation" in round_ or "relegation" in name:
                    continue
                years.add(y)
    return years


def existing_match_ids(attrs) -> set[str]:
    return {r for r, a in attrs.items() if a.get("type") == "match"}


def score_string(wname, wscore, rname, rscore):
    if not wscore or not rscore:
        return None
    return f"{wname} {wscore}, {rname} {rscore}"


def main():
    seed = json.load(open(SEED_PATH))
    attrs = defaultdict(dict)
    for t in seed:
        attrs[t["row"]][t["col"]] = t["val"]
    existing_ids = set(attrs.keys())
    existing_clubs = {r for r, a in attrs.items() if a.get("type") == "club"}
    covered_years = existing_shc_final_years(attrs)
    match_ids = existing_match_ids(attrs)

    # Known detailed Fohenagh finals already in seed — skip adding duplicate year shells
    # but 1958-1963 already covered for Fohenagh involvement; still skip those years entirely
    # Also 2024/2025 already present
    skip_years = set(covered_years)

    ggaa = parse_ggaa()
    wiki = parse_wiki_shc()

    new_triples: list[dict] = []
    needed_clubs: set[str] = set()
    matches_added = []
    wins_added = []
    score_agreements = 0
    score_conflicts = 0
    score_omitted = 0

    # Source entity
    src_id = "source:galway-gaa-shc-finals-1887-2021"
    if src_id not in existing_ids:
        new_triples += [
            triple(src_id, "type", "source"),
            triple(src_id, "title", "Galway Senior Hurling Club Finals 1887–2021 (Galway GAA)"),
            triple(src_id, "url", SOURCE_GGAA),
            triple(src_id, "kind", "county_board_stats"),
            triple(src_id, "confidence", "high"),
        ]

    all_years = sorted(set(ggaa.keys()) | set(wiki.keys()))
    for y in all_years:
        if y in skip_years:
            continue
        g = ggaa.get(y, {})
        w = wiki.get(y, {})

        special = g.get("special") or w.get("special")
        # No championship / no final / void — optional season note only, skip match
        if special and not (g.get("winner_name") or w.get("winner_name")):
            # still record a lightweight season stub? skip to avoid noise
            continue

        # Prefer Galway GAA club names when present; Wikipedia fills gaps / score cross-check.
        winner_name = normalize_club_name(g.get("winner_name") or w.get("winner_name") or "")
        runner_name = normalize_club_name(g.get("runner_name") or w.get("runner_name") or "")
        name_note = None
        g_run = normalize_club_name(g.get("runner_name") or "")
        w_run = normalize_club_name(w.get("runner_name") or "")
        if g_run and w_run and g_run.lower() != w_run.lower():
            name_note = f"Runner-up name differs across sources: Galway GAA '{g_run}' vs Wikipedia '{w_run}' — seeded GAA name."
        # 1967: GAA page text is mangled ('P Pearses -Oranmore M'); Wikipedia lists Maree.
        if y == 1967:
            winner_name = "Castlegar"
            runner_name = "Maree"
            name_note = "Runner-up: Wikipedia lists Maree; Galway GAA page text reads 'P Pearses -Oranmore M' — seeded as Maree (club:maree-historic)."
        if y == 1956:
            winner_name = "Turloughmore"
            runner_name = "Ardrahan"
        # Strip parenthetical place hints for mapping, keep display
        if "(" in winner_name and ")" in winner_name:
            pass  # mapped via derrydonnell (athenry) alias

        if not winner_name:
            continue

        wid = club_id_for(winner_name)
        rid = club_id_for(runner_name) if runner_name else None
        if not wid:
            print("UNMAPPED WINNER", y, winner_name)
            continue
        needed_clubs.add(wid)
        if rid:
            needed_clubs.add(rid)

        wdisp = NEW_CLUBS.get(wid, {}).get("name") or attrs.get(wid, {}).get("name") or winner_name
        rdisp = (
            (NEW_CLUBS.get(rid, {}).get("name") if rid else None)
            or (attrs.get(rid, {}).get("name") if rid else None)
            or runner_name
            or "Unknown"
        )

        # Scores: double-source agreement on decisive score
        gw, gr = g.get("wscore"), g.get("rscore")
        ww, wr = w.get("wscore"), w.get("rscore")
        score = None
        score_note = None
        if w.get("has_replay"):
            # Don't invent single-line score for replay years from GAA alone;
            # only if wiki replay pair exists — still need GAA agreement on replay line
            if gw and gr and ww and wr and gw == ww and gr == wr:
                score = score_string(wdisp, ww, rdisp, wr)
                score_agreements += 1
                score_note = "Decisive score (replay where applicable) agrees on Galway GAA stats page and Wikipedia."
            else:
                score_omitted += 1
                if gw and ww and (gw != ww or gr != wr):
                    score_conflicts += 1
                    score_note = f"Score conflict or replay complexity — omitted. GAA {gw}-{gr} vs Wiki {ww}-{wr} (draw wiki {w.get('wscore_draw')}-{w.get('rscore_draw')})."
                else:
                    score_note = "Score not double-sourced for this final (replay/partial) — omitted."
        else:
            if gw and gr and ww and wr and gw == ww and gr == wr:
                score = score_string(wdisp, ww, rdisp, wr)
                score_agreements += 1
            elif gw and ww and (gw != ww or gr != wr):
                score_conflicts += 1
                score_omitted += 1
                score_note = f"Score conflict — omitted. GAA {gw}–{gr} vs Wiki {ww}–{wr}."
            else:
                score_omitted += 1
                if not (gw and gr and ww and wr):
                    score_note = "Score not present on both Galway GAA and Wikipedia — omitted."

        venue = g.get("venue")
        # normalize venue labels slightly
        if venue:
            venue = venue.replace("Kenny Park", "Kenny Park, Athenry") if venue == "Kenny Park" else venue

        mid = f"match:galway-shc-{y}-final"
        if mid in match_ids:
            continue

        wdisp = NEW_CLUBS.get(wid, {}).get("name") or attrs.get(wid, {}).get("name") or winner_name
        rdisp = (
            (NEW_CLUBS.get(rid, {}).get("name") if rid else None)
            or (attrs.get(rid, {}).get("name") if rid else None)
            or runner_name
            or "Unknown"
        )
        name = f"{wdisp} vs {rdisp} ({y} Galway SHC Final)" if rid else f"{wdisp} ({y} Galway SHC champions)"

        mt = [
            triple(mid, "type", "match"),
            triple(mid, "name", name),
            triple(mid, "competition", "Galway Senior Hurling Championship"),
            triple(mid, "round", "Final"),
            triple(mid, "year", y),
            triple(mid, "home", wid),
            triple(mid, "winner", wid),
        ]
        if rid:
            mt.append(triple(mid, "away", rid))
            mt.append(triple(mid, "runner_up", rid))
        if score:
            mt.append(triple(mid, "score", score))
        if venue:
            mt.append(triple(mid, "venue", venue))
        if special or score_note or name_note:
            note_parts = []
            if special:
                note_parts.append(str(special))
            if name_note:
                note_parts.append(name_note)
            if score_note:
                note_parts.append(score_note)
            mt.append(triple(mid, "note", " ".join(note_parts)))
        mt.append(triple(mid, "confidence", "high" if score else "medium"))
        mt.append(triple(mid, "source", SOURCE_GGAA))
        mt.append(triple(mid, "source_wiki", SOURCE_WIKI_SHC))
        new_triples.extend(mt)
        matches_added.append(mid)

        # Companion win entity (title roll) for winner
        win_id = f"win:galway-shc-{y}"
        if win_id not in existing_ids and win_id not in {t["row"] for t in new_triples}:
            # skip if a more specific win already exists for same club+year+title
            already = False
            for r, a in attrs.items():
                if a.get("type") == "win" and a.get("title") == "Galway Senior Hurling Championship" and a.get("year") == y:
                    already = True
                    break
            if not already:
                new_triples += [
                    triple(win_id, "type", "win"),
                    triple(win_id, "name", f"{wdisp} — Galway Senior Hurling Championship {y}"),
                    triple(win_id, "title", "Galway Senior Hurling Championship"),
                    triple(win_id, "year", y),
                    triple(win_id, "club", wid),
                    triple(win_id, "status", "winner"),
                    triple(win_id, "match", mid),
                    triple(win_id, "confidence", "high"),
                    triple(win_id, "source", SOURCE_GGAA),
                    triple(win_id, "source_wiki", SOURCE_WIKI_SHC),
                ]
                if rid:
                    new_triples.append(triple(win_id, "runner_up", rid))
                wins_added.append(win_id)

    # --- Intermediate title roll (wins only, no invented scores) ---
    ihc = json.load(open("/tmp/wiki-ihc-titles.json"))
    # Also finals table for runner-up when present (no scores)
    ihc_finals = {r["year"]: r for r in json.load(open("/tmp/wiki-ihc-finals.json"))}
    ihc_wins_added = []
    existing_ihc_years = set()
    for r, a in attrs.items():
        if a.get("type") == "win" and a.get("title") == "Galway Intermediate Hurling Championship":
            if isinstance(a.get("year"), int):
                existing_ihc_years.add(a["year"])
    # AF 2016 already has match — still add win if missing
    for club_entry in ihc:
        club_name = club_entry["club"]
        cid = club_id_for(club_name)
        if not cid:
            print("UNMAPPED IHC", club_name)
            continue
        needed_clubs.add(cid)
        for y in club_entry["years"]:
            if y in existing_ihc_years:
                continue
            # skip bogus early year on Kilconieron if 1911 (pre-competition) — Wikipedia lists it; keep with note
            wid = f"win:galway-ihc-{y}"
            if wid in existing_ids or wid in {t["row"] for t in new_triples}:
                continue
            cname = NEW_CLUBS.get(cid, {}).get("name") or attrs.get(cid, {}).get("name") or club_name
            nt = [
                triple(wid, "type", "win"),
                triple(wid, "name", f"{cname} — Galway Intermediate Hurling Championship {y}"),
                triple(wid, "title", "Galway Intermediate Hurling Championship"),
                triple(wid, "year", y),
                triple(wid, "club", cid),
                triple(wid, "status", "winner"),
                triple(wid, "confidence", "high"),
                triple(wid, "source", SOURCE_WIKI_IHC),
                triple(
                    wid,
                    "note",
                    "Title roll from Wikipedia Galway Intermediate Hurling Championship. Final score not seeded here (not double-sourced in this pack).",
                ),
            ]
            fin = ihc_finals.get(y)
            if fin and fin["ncols"] >= 5:
                # Year, Winners, score?, Runners, score?
                raw = fin["raw"]
                # detect if score columns
                if norm_score(raw[2] if len(raw) > 2 else ""):
                    rname = raw[3] if len(raw) > 3 else ""
                else:
                    rname = raw[2] if len(raw) > 2 else ""
                rid = club_id_for(rname) if rname else None
                if rid:
                    needed_clubs.add(rid)
                    nt.append(triple(wid, "runner_up", rid))
            new_triples.extend(nt)
            ihc_wins_added.append(wid)

    # --- Junior title roll ---
    jhc = json.load(open("/tmp/wiki-jhc-titles.json"))
    jhc_finals = {r["year"]: r for r in json.load(open("/tmp/wiki-jhc-finals.json"))}
    jhc_wins_added = []
    existing_jhc_years = set()
    for r, a in attrs.items():
        if a.get("type") == "win" and str(a.get("title", "")).startswith("Galway Junior"):
            if isinstance(a.get("year"), int):
                existing_jhc_years.add((a.get("title"), a["year"], a.get("club")))

    for club_entry in jhc:
        club_name = club_entry["club"]
        cid = club_id_for(club_name)
        if not cid:
            print("UNMAPPED JHC", club_name)
            continue
        needed_clubs.add(cid)
        for y in club_entry["years"]:
            # skip if we already have ahascragh historic junior wins etc. for same club+year
            skip = False
            for r, a in attrs.items():
                if (
                    a.get("type") == "win"
                    and a.get("year") == y
                    and a.get("club") == cid
                    and "Junior" in str(a.get("title", ""))
                ):
                    skip = True
                    break
            if skip:
                continue
            wid = f"win:galway-jhc-{y}"
            if wid in existing_ids or wid in {t["row"] for t in new_triples}:
                # allow only one county junior A roll entry per year
                continue
            cname = NEW_CLUBS.get(cid, {}).get("name") or attrs.get(cid, {}).get("name") or club_name
            nt = [
                triple(wid, "type", "win"),
                triple(wid, "name", f"{cname} — Galway Junior Hurling Championship {y}"),
                triple(wid, "title", "Galway Junior Hurling Championship"),
                triple(wid, "year", y),
                triple(wid, "club", cid),
                triple(wid, "status", "winner"),
                triple(wid, "confidence", "high"),
                triple(wid, "source", SOURCE_WIKI_JHC),
                triple(
                    wid,
                    "note",
                    "Title roll from Wikipedia Galway Junior Hurling Championship. Final score not seeded here (not double-sourced in this pack).",
                ),
            ]
            fin = jhc_finals.get(y)
            if fin and len(fin["raw"]) >= 4:
                raw = fin["raw"]
                # Year Winners Score Runners Score Venue OR Year Winners Runners Venue
                if fin["ncols"] >= 6 and norm_score(raw[2]):
                    rname = raw[3]
                    venue = raw[5] if len(raw) > 5 else None
                else:
                    rname = raw[2] if len(raw) > 2 and not norm_score(raw[2]) else (raw[3] if len(raw) > 3 else "")
                    venue = raw[-1] if fin["ncols"] >= 4 and not norm_score(raw[-1] or "") else None
                rid = club_id_for(rname) if rname and club_id_for(rname) else None
                if rid:
                    needed_clubs.add(rid)
                    nt.append(triple(wid, "runner_up", rid))
                if venue and isinstance(venue, str) and any(ch.isalpha() for ch in venue) and not venue.startswith("19") and not venue.startswith("20"):
                    if "Park" in venue or "Stadium" in venue or "Ground" in venue:
                        nt.append(triple(wid, "venue", venue))
            new_triples.extend(nt)
            jhc_wins_added.append(wid)

    club_triples, clubs_created = build_club_triples(needed_clubs, existing_clubs)
    # prepend clubs
    all_new = club_triples + new_triples

    # Merge into seed
    merged = seed + all_new
    SEED_PATH.write_text(json.dumps(merged, indent=2, ensure_ascii=False) + "\n")

    pack = {
        "pack": "galway-shc-finals-1887-2021",
        "sources": [SOURCE_GGAA, SOURCE_WIKI_SHC, SOURCE_WIKI_IHC, SOURCE_WIKI_JHC],
        "clubs_created": clubs_created,
        "matches_added": matches_added,
        "shc_wins_added": wins_added,
        "ihc_wins_added": ihc_wins_added,
        "jhc_wins_added": jhc_wins_added,
        "score_agreements": score_agreements,
        "score_conflicts": score_conflicts,
        "score_omitted": score_omitted,
        "skipped_existing_final_years": sorted(skip_years),
        "triples_added": len(all_new),
    }
    PACK_PATH.write_text(json.dumps(pack, indent=2) + "\n")

    now = datetime.now(timezone.utc).isoformat()
    log_entries = [
        {
            "url": SOURCE_GGAA,
            "date": "2021-12-31",
            "title": "Galway Senior Hurling Club Finals 1887–2021 (ingest pack)",
            "publisher": "Galway GAA",
            "processed_at": now,
            "triples_extracted": f"SHC finals matches={len(matches_added)}; clubs_created={len(clubs_created)}; shc_wins={len(wins_added)}; score_agreements={score_agreements}; score_omitted={score_omitted}; triples={len(all_new)}",
        },
        {
            "url": SOURCE_WIKI_SHC,
            "date": "2026-09-04",
            "title": "Wikipedia Galway SHC — double-source scores / names",
            "publisher": "Wikipedia",
            "processed_at": now,
            "triples_extracted": f"Cross-check for {len(matches_added)} finals; conflicts={score_conflicts}",
        },
        {
            "url": SOURCE_WIKI_IHC,
            "date": "2026-09-04",
            "title": "Galway Intermediate Hurling Championship title roll",
            "publisher": "Wikipedia",
            "processed_at": now,
            "triples_extracted": f"ihc_wins_added={len(ihc_wins_added)} (no invented scores)",
        },
        {
            "url": SOURCE_WIKI_JHC,
            "date": "2026-09-04",
            "title": "Galway Junior Hurling Championship title roll",
            "publisher": "Wikipedia",
            "processed_at": now,
            "triples_extracted": f"jhc_wins_added={len(jhc_wins_added)} (no invented scores)",
        },
    ]
    with LOG_PATH.open("a") as f:
        for e in log_entries:
            f.write(json.dumps(e, ensure_ascii=False) + "\n")

    PLAN_PATH.parent.mkdir(exist_ok=True)
    PLAN_PATH.write_text(
        """# Galway continuous ingest plan (widened)

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
"""
    )

    print(json.dumps(pack, indent=2))
    print("seed triples now", len(merged))


if __name__ == "__main__":
    main()
