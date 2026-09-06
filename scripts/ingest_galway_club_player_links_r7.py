#!/usr/bin/env python3
"""Round 7: remaining Galway orphan fills + club-less links + cited matches.

Priority: Fohenagh/AF first (2026 Tuam Herald team sheet), then Oranmore-historic
(Joe Glynn Advertiser caption), club-less Wikipedia/club/press links, thin-club
expansion, Wikipedia IHC finals with clear scores.

Claregalway stays HOLD (Carnmore for hurling). Other orphans without named first+last
hurling cites stay HOLD. New players = unverified. HOLD collisions. No invented scores.
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
        "player": "player:barry-coen",
        "club": "club:ballinderreen",
        "source": "https://www.galwaybeo.ie/news/galway-news/galway-friends-beautiful-birthday-tribute-7442023",
        "note": "Galway Beo / RIP.ie: Barry Coen from Ballinderreen; funeral Mass St Colman\'s Church Ballinderreen. 2000 Galway minor All-Ireland panel.",
        "confidence": "high",
    },
    {
        "player": "player:adrian-cullinane",
        "club": "club:craughwell",
        "source": "https://www.irishexaminer.com/sport/gaa/arid-20117266.html",
        "note": "Irish Examiner: Adrian Cullinane described as Craughwell clubman returning to Galway senior panel; also named on Craughwell SHC line-ups (Wikipedia 2014 Galway SHC).",
        "confidence": "high",
    },
    {
        "player": "player:colm-flynn",
        "club": "club:tommy-larkins",
        "source": "https://www.gaa.ie/hurling/news/galway-shc-larkins-defeat-loughrea",
        "note": "GAA.ie Galway SHC report: Colm Flynn named midfield for Tommy Larkins vs Loughrea; also Galway U-21 2011 / Intermediate 2015 panels.",
        "confidence": "high",
    },
    {
        "player": "player:benny-kenny",
        "club": "club:kiltormer",
        "source": "https://www.galwaygaa.ie/history/2004-roll-of-honour-football-hurling/",
        "note": "Galway GAA 2004 roll: Benny Kenny named on Kiltormer Minor A Hurling Champions panel; later Galway U-21 All-Ireland 2007 panel.",
        "confidence": "high",
    },
    {
        "player": "player:brian-cloherty",
        "club": "club:rahoon",
        "source": "https://www.galwaygaa.ie/history/roll-of-honour-1980-1999-hurling-football/",
        "note": "Galway GAA roll: Brian Cloherty named on Rahoon–Newcastle Junior A Hurling Champions 1992; Galway Intermediate All-Ireland 2002 panel.",
        "confidence": "medium",
    },
]


NEW_PLAYERS: list[dict] = [
    # --- Fohenagh / AF first (Tuam Herald 2026 Senior B opener team sheet) ---
    {
        "name": "Andrew Moclair",
        "id": "player:andrew-moclair-ahascragh-fohenagh",
        "club": "club:ahascragh-fohenagh",
        "source": "https://www.tuamherald.ie/2026/08/13/ahascragh-fohenagh-defeat-kinvara-in-opener/",
        "note": "Tuam Herald 2026 Galway SHC opener: A. Moclair named starting for Ahascragh-Fohenagh vs Kinvara.",
        "confidence": "unverified",
        "fohenagh": True,
    },
    # --- Oranmore historic orphan fill ---
    {
        "name": "Joe Glynn",
        "id": "player:joe-glynn-oranmore",
        "club": "club:oranmore-historic",
        "source": "https://www.advertiser.ie/Galway/article/25582/galway-hurlers-1949",
        "note": "Galway Advertiser 1949 county panel caption: Dr Joe Glynn (Oranmore). Athenry GAA 1950–54 gallery repeats Joe Glynn on same Oireachtas/NHL era panel. Distinct historic id — Oranmore club stamp.",
        "confidence": "medium",
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
    "player:albert-moylan",
    "player:basil-larkin",
    "player:christy-helebert",
    "player:brendan-keogh",
    "player:conor-flaherty",  # HOLD: Claregalway football GK cite — not a Claregalway hurling stamp
    "player:cormac-diviney",  # HOLD: no clear public club cite (forum-only Cusacks mention)
    "player:benny-lawless",  # HOLD: public hits are soccer Athenry FC — not hurling club stamp
    "player:damien-fahy",  # HOLD: no clear club hurling cite this run
}


CLUB_META_UPDATES: list[dict] = [
    {
        "id": "club:oranmore-historic",
        "cols": {
            "note": "r7 fill: Dr Joe Glynn (Oranmore) on Galway Advertiser 1949 county panel caption; 1950 IHC winners (Wikipedia score Oranmore 3-5 Killimor 3-1). Modern players on club:oranmore-maree.",
            "source_advertiser_1949": "https://www.advertiser.ie/Galway/article/25582/galway-hurlers-1949",
        },
    },
    {
        "id": "club:ahascragh-fohenagh",
        "cols": {
            "note": "r7: added Andrew Moclair from Tuam Herald 2026 Senior opener team sheet (unverified pending Archivist).",
            "source_tuam_2026": "https://www.tuamherald.ie/2026/08/13/ahascragh-fohenagh-defeat-kinvara-in-opener/",
        },
    },
    {
        "id": "club:ballinderreen",
        "cols": {
            "note": "r7: Barry Coen linked (Galway Beo / RIP.ie Ballinderreen).",
        },
    },
    {
        "id": "club:craughwell",
        "cols": {
            "note": "r7: Adrian Cullinane linked (Irish Examiner Craughwell clubman).",
        },
    },
    {
        "id": "club:tommy-larkins",
        "cols": {
            "note": "r7: Colm Flynn linked (GAA.ie Tommy Larkins SHC team sheet).",
        },
    },
    {
        "id": "club:kiltormer",
        "cols": {
            "note": "r7: Benny Kenny linked (Galway GAA 2004 Kiltormer Minor A champions).",
        },
    },
    {
        "id": "club:rahoon",
        "cols": {
            "note": "r7: Brian Cloherty linked (Galway GAA Rahoon–Newcastle Junior A 1992 champions).",
        },
    },
    {
        "id": "club:claregalway",
        "cols": {
            "note": "HOLD orphan r7: no named Claregalway-only hurling player cite. Parish hurling → club:carnmore. Conor Flaherty is football club cite — do not stamp as Claregalway hurling.",
        },
    },
    {
        "id": "club:college-road",
        "cols": {
            "note": "HOLD orphan r7: 1892–1893 SHC winners; Duggan grand-uncles cited without first+last names. Do not invent College Road XV.",
        },
    },
    {
        "id": "club:eyrecourt-historic",
        "cols": {
            "note": "HOLD orphan r7: 1959 IHC winners (Wikipedia + Athenry score) but no named Eyrecourt-only XV. Joe Salmon remains club:meelick-eyrecourt.",
        },
    },
    {
        "id": "club:kilrickle",
        "cols": {
            "note": "HOLD orphan r7: 1949 first IHC title on Wikipedia roll — St Enda\'s (Bullaun/Kilrickle) essay names Mick Cooney as manager only. No invent.",
        },
    },
    {
        "id": "club:skehana",
        "cols": {
            "note": "HOLD orphan r7: 1952 IHC winners — no named historic Skehana XV. Modern amalgam club:skehana-mountbellew-moylough.",
        },
    },
    {
        "id": "club:st-colemans",
        "cols": {
            "note": "HOLD orphan r7: 1948 SHC finalist — Jim Brophy Wikipedia is Army captain who beat them, not St Coleman\'s. No named St Coleman\'s XV cite.",
        },
    },
]


NEW_MATCHES: list[dict] = [
    {
        "id": "match:galway-ihc-1951-final",
        "cols": {
            "type": "match",
            "name": "Killimordaly vs Clarinbridge (1951 Galway IHC Final)",
            "competition": "Galway Intermediate Hurling Championship",
            "round": "Final",
            "year": 1951,
            "home": "club:killimordaly",
            "away": "club:clarinbridge",
            "winner": "club:killimordaly",
            "runner_up": "club:clarinbridge",
            "score": "Killimordaly 6-07, Clarinbridge 3-02",
            "note": "Wikipedia Galway Intermediate Hurling Championship list of finals: Killimordaly 6-07 Clarinbridge 3-02.",
            "confidence": "medium",
            "source": "https://en.wikipedia.org/wiki/Galway_Intermediate_Hurling_Championship",
            "result": "win",
            "historic_club": "club:killimordaly",
        },
    },
    {
        "id": "match:galway-ihc-1961-final",
        "cols": {
            "type": "match",
            "name": "Carnmore vs Loughrea (1961 Galway IHC Final)",
            "competition": "Galway Intermediate Hurling Championship",
            "round": "Final",
            "year": 1961,
            "home": "club:carnmore",
            "away": "club:loughrea",
            "winner": "club:carnmore",
            "runner_up": "club:loughrea",
            "score": "Carnmore 4-05, Loughrea 4-01",
            "note": "Wikipedia Galway Intermediate Hurling Championship list of finals: Carnmore 4-05 Loughrea 4-01.",
            "confidence": "medium",
            "source": "https://en.wikipedia.org/wiki/Galway_Intermediate_Hurling_Championship",
            "result": "win",
            "historic_club": "club:carnmore",
        },
    },
    {
        "id": "match:galway-ihc-1962-final",
        "cols": {
            "type": "match",
            "name": "Cappataggle vs Ardrahan (1962 Galway IHC Final)",
            "competition": "Galway Intermediate Hurling Championship",
            "round": "Final",
            "year": 1962,
            "home": "club:cappataggle",
            "away": "club:ardrahan",
            "winner": "club:cappataggle",
            "runner_up": "club:ardrahan",
            "score": "Cappataggle 5-12, Ardrahan 4-05",
            "note": "Wikipedia Galway Intermediate Hurling Championship list of finals: Cappataggle 5-12 Ardrahan 4-05.",
            "confidence": "medium",
            "source": "https://en.wikipedia.org/wiki/Galway_Intermediate_Hurling_Championship",
            "result": "win",
            "historic_club": "club:cappataggle",
        },
    },
    {
        "id": "match:galway-ihc-1965-final",
        "cols": {
            "type": "match",
            "name": "Ardrahan vs Tynagh (1965 Galway IHC Final)",
            "competition": "Galway Intermediate Hurling Championship",
            "round": "Final",
            "year": 1965,
            "home": "club:ardrahan",
            "away": "club:tynagh-historic",
            "winner": "club:ardrahan",
            "runner_up": "club:tynagh-historic",
            "score": "Ardrahan 5-04, Tynagh 0-07",
            "note": "Wikipedia Galway Intermediate Hurling Championship list of finals: Ardrahan 5-04 Tynagh 0-07.",
            "confidence": "medium",
            "source": "https://en.wikipedia.org/wiki/Galway_Intermediate_Hurling_Championship",
            "result": "win",
            "historic_club": "club:ardrahan",
        },
    },
]


MATCH_META_UPDATES: list[dict] = [
    {
        "id": "match:galway-ihc-1960-final",
        "cols": {
            "score": "Newcastle 2-04, Ballinderreen 2-03",
            "note": "Score from Wikipedia Galway Intermediate Hurling Championship list of finals (Newcastle 2-04 Ballindereen 2-03). Athenry GAA history confirms Newcastle champions 1960.",
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

    # Sanity: tynagh-historic / loughrea / clarinbridge / killimordaly exist
    for need in [
        "club:tynagh-historic",
        "club:loughrea",
        "club:clarinbridge",
        "club:killimordaly",
        "club:cappataggle",
        "club:ardrahan",
        "club:carnmore",
        "club:ballinderreen",
    ]:
        if need not in by_row or by_row[need].get("type") != "club":
            raise SystemExit(f"missing club {need}")

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
        "player:albert-moylan": "HOLD r7: panel Albert Moylan — London St Gabriel\'s / Gort-region death notices; no clear Galway club stamp this run.",
        "player:basil-larkin": "HOLD r7: no clear club cite harvested.",
        "player:christy-helebert": "HOLD r7: former Galway senior / referee — no clear playing-club cite this run.",
        "player:brendan-keogh": "HOLD r7: Athenry club photos exist but defer distinct stamp pending Archivist (common surname).",
        "player:conor-flaherty": "HOLD r7: Claregalway football goalkeeper cites — not a Claregalway hurling club stamp (orphan Claregalway remains HOLD → Carnmore for parish hurling).",
        "player:cormac-diviney": "HOLD r7: 2011 minor panel — no clear public club cite (forum-only Cusacks mention ignored).",
        "player:benny-lawless": "HOLD r7: public name hits are soccer (Athenry FC) — no clear hurling club stamp.",
        "player:damien-fahy": "HOLD r7: 1994 minor panel — no clear club hurling cite this run.",
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
        "round": "7",
        "generated_at": now,
        "sources": [
            "https://www.advertiser.ie/Galway/article/25582/galway-hurlers-1949",
            "https://www.tuamherald.ie/2026/08/13/ahascragh-fohenagh-defeat-kinvara-in-opener/",
            "https://www.galwaybeo.ie/news/galway-news/galway-friends-beautiful-birthday-tribute-7442023",
            "https://www.irishexaminer.com/sport/gaa/arid-20117266.html",
            "https://www.gaa.ie/hurling/news/galway-shc-larkins-defeat-loughrea",
            "https://www.galwaygaa.ie/history/2004-roll-of-honour-football-hurling/",
            "https://www.galwaygaa.ie/history/roll-of-honour-1980-1999-hurling-football/",
            "https://en.wikipedia.org/wiki/Galway_Intermediate_Hurling_Championship",
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
                "club:oranmore-historic",
                "club:eyrecourt-historic",
                "club:college-road",
                "club:kilrickle",
                "club:skehana",
                "club:st-colemans",
                "club:ballinderreen",
                "club:craughwell",
                "club:tommy-larkins",
                "club:kiltormer",
                "club:rahoon",
                "club:carnmore",
                "club:cappataggle",
            ]
        },
        "still_orphan_priority": [
            c
            for c in [
                "club:claregalway",
                "club:college-road",
                "club:eyrecourt-historic",
                "club:kilrickle",
                "club:oranmore-historic",
                "club:skehana",
                "club:st-colemans",
            ]
            if c in after["orphan_ids"]
        ],
        "orphan_note": "Remaining orphans stuck without named first+last hurling cites; focused on club-less panel links + cited IHC matches.",
    }

    SEED_PATH.write_text(json.dumps(seed, indent=2, ensure_ascii=False) + "\n")
    PACK_PATH.write_text(json.dumps(pack, indent=2, ensure_ascii=False) + "\n")

    log = {
        "url": "Advertiser + Tuam Herald + Galway Beo + Irish Examiner + GAA.ie + Galway GAA rolls + Wikipedia IHC",
        "date": "2026-09-06",
        "title": "Galway club-player pack r7",
        "publisher": "Advertiser / Tuam Herald / Galway Beo / Irish Examiner / GAA.ie / Galway GAA / Wikipedia / HurlingWiki",
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
            "batch": "fohenagh-club-links-r7",
            "ruled_at": now,
            "clear_links": fohenagh_linked,
            "unverified_new": fohenagh_new,
            "note": "AF 2026 Tuam Herald Senior opener sheet — Andrew Moclair unverified pending Archivist.",
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
