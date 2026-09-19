#!/usr/bin/env python3
"""Stamp Garry Lohan's Fohenagh/Ahascragh parish roster as verified canonical pages.

Prefer existing ids. Alias Mockler↔Moclair. Merge Phillip→Philip and
cathal-lohan-fohenagh→cathal-lohan. No invented scores or caps.
"""
from __future__ import annotations

import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED_PATH = ROOT / "data" / "seed.json"
PACK_PATH = ROOT / "data" / "pack-fohenagh-village-roster.json"

FATHER = "player:jim-moclair-fohenagh"
CLUB_STAMP = "Club stamp — Fohenagh parish roster (Garry Lohan)"
CLUB_STAMP_STATUS = "club_stamp"

CANONICAL_IDS = [
    "player:jim-moclair-fohenagh",
    "player:sean-moclair",
    "player:seamus-moclair",
    "player:alan-moclair-ahascragh-fohenagh",
    "player:padraic-leonard",
    "player:niall-leonard",
    "player:garry-lohan",
    "player:philip-lohan",
    "player:cathal-lohan",
    "player:jason-lohan",
    "player:trevor-lohan",
]


def triple(row: str, col: str, val) -> dict:
    return {"row": row, "col": col, "val": val}


def build_index(seed: list[dict]):
    by_row: dict[str, dict] = defaultdict(dict)
    pair_index: dict[tuple[str, str], int] = {}
    for i, t in enumerate(seed):
        by_row[t["row"]][t["col"]] = t["val"]
        pair_index[(t["row"], t["col"])] = i
    return by_row, pair_index


def set_or_add(seed, pair_index, by_row, row, col, val, stats):
    key = (row, col)
    if key in pair_index:
        idx = pair_index[key]
        if seed[idx]["val"] != val:
            seed[idx]["val"] = val
            by_row[row][col] = val
            stats["updated"] += 1
            return "updated"
        return "same"
    seed.append(triple(row, col, val))
    pair_index[key] = len(seed) - 1
    by_row[row][col] = val
    stats["added"] += 1
    return "added"


def delete_pair(seed, pair_index, by_row, row, col, stats):
    key = (row, col)
    if key not in pair_index:
        return False
    idx = pair_index[key]
    seed.pop(idx)
    by_row[row].pop(col, None)
    pair_index.clear()
    by_row.clear()
    rebuilt_rows, rebuilt_pairs = build_index(seed)
    by_row.update(rebuilt_rows)
    pair_index.update(rebuilt_pairs)
    stats["deleted"] += 1
    return True


def stamp(seed, pair_index, by_row, pid, cols, stats, touched):
    for col, val in cols.items():
        set_or_add(seed, pair_index, by_row, pid, col, val, stats)
    touched.append(pid)


def alias_stub(seed, pair_index, by_row, aid, name, canonical, club, stats, aliases):
    cols = {
        "type": "player",
        "name": name,
        "same_as": canonical,
        "club": club,
        "confidence": "verified",
        "note": f"Spelling alias of {canonical}.",
        "status": "alias",
    }
    for col, val in cols.items():
        set_or_add(seed, pair_index, by_row, aid, col, val, stats)
    aliases.append(aid)


def main():
    seed = json.loads(SEED_PATH.read_text())
    by_row, pair_index = build_index(seed)
    stats = defaultdict(int)
    updated: list[str] = []
    aliases: list[str] = []
    now = datetime.now(timezone.utc).isoformat()

    for need in CANONICAL_IDS:
        if need == "player:philip-lohan":
            continue
        if need not in by_row or by_row[need].get("type") != "player":
            raise SystemExit(f"missing canonical player {need}")

    # Flip Phillip → Philip so player:philip-lohan is the canonical id.
    delete_pair(seed, pair_index, by_row, "player:philip-lohan", "same_as", stats)
    stamp(
        seed,
        pair_index,
        by_row,
        "player:philip-lohan",
        {
            "type": "player",
            "name": "Philip Lohan",
            "club": "club:ahascragh-fohenagh",
            "confidence": "verified",
            "status": CLUB_STAMP_STATUS,
            "notable": "A Fohenagh parish hurler with Ahascragh-Fohenagh.",
            "note": "Parish roster club stamp. Same person as the older Phillip Lohan spelling alias.",
            "also_known_as": "Phillip Lohan",
            "kid_chip": "Verified parish hurler",
            "cutting_cite": CLUB_STAMP,
            "verification": CLUB_STAMP,
        },
        stats,
        updated,
    )
    alias_stub(
        seed,
        pair_index,
        by_row,
        "player:phillip-lohan",
        "Phillip Lohan",
        "player:philip-lohan",
        "club:ahascragh-fohenagh",
        stats,
        aliases,
    )
    # Drop leftover stub-only cols that would fight the alias overlay.
    for col in ("also_known_as", "kid_chip", "cutting_cite", "verification"):
        if by_row.get("player:phillip-lohan", {}).get(col) and col not in (
            "type",
            "name",
            "same_as",
            "club",
            "confidence",
            "note",
            "status",
        ):
            delete_pair(seed, pair_index, by_row, "player:phillip-lohan", col, stats)

    stamp(
        seed,
        pair_index,
        by_row,
        "player:jim-moclair-fohenagh",
        {
            "name": "Jimmy Moclair",
            "also_known_as": "Jim Moclair; Jimmy Mockler; J. Moclair",
            "club": "club:fohenagh-historic",
            "confidence": "verified",
            "status": "verified_from_cutting",
            "notable": "First great Fohenagh hurler of the 1950s and 1960s. Started the 1963 Galway senior county final.",
            "kid_chip": "Verified Fohenagh hurler",
            "source": "https://turloughmoregaa.ie/1963/09/22/county-final-1963/",
        },
        stats,
        updated,
    )

    stamp(
        seed,
        pair_index,
        by_row,
        "player:sean-moclair",
        {
            "name": "Seán Moclair",
            "club": "club:ahascragh-fohenagh",
            "confidence": "verified",
            "status": CLUB_STAMP_STATUS,
            "notable": "A Fohenagh parish hurler. Son of Jimmy Moclair.",
            "note": "Parish roster club stamp. Spelling also seen as Sean Mockler.",
            "also_known_as": "Sean Moclair; Sean Mockler; Seán Mockler",
            "kid_chip": "Verified parish hurler",
            "cutting_cite": CLUB_STAMP,
            "verification": CLUB_STAMP,
            "father": FATHER,
        },
        stats,
        updated,
    )

    stamp(
        seed,
        pair_index,
        by_row,
        "player:seamus-moclair",
        {
            "name": "Séamus Moclair",
            "club": "club:fohenagh-historic",
            "confidence": "verified",
            "status": "verified_from_cutting",
            "notable": "A standout Fohenagh hurler named in the Sadie Kilcommons final report. Son of Jimmy Moclair.",
            "also_known_as": "Seamus Moclair; Seamus Mockler; Séamus Mockler",
            "kid_chip": "Mentioned in match report",
            "cutting_cite": "Connacht Tribune · Sadie Kilcommons final · Fohenagh 1-12 Ahascragh 0-9",
            "verification": "Named in newspaper cutting — auto-verified",
            "father": FATHER,
        },
        stats,
        updated,
    )

    stamp(
        seed,
        pair_index,
        by_row,
        "player:alan-moclair-ahascragh-fohenagh",
        {
            "name": "Alan Moclair",
            "club": "club:ahascragh-fohenagh",
            "confidence": "verified",
            "status": "verified_from_cutting",
            "notable": "An Ahascragh-Fohenagh hurler who started at half-back in the 2026 parish championship opener. Son of Jimmy Moclair.",
            "note": "Tuam Herald 2026 PIC opener: A. Moclair started half-back for Ahascragh-Fohenagh vs Kinvara.",
            "also_known_as": "Alan Mockler; A. Moclair",
            "kid_chip": "Verified AF hurler",
            "cutting_cite": "Tuam Herald · 2026 PIC opener",
            "verification": "Named in newspaper report",
            "source": "https://www.tuamherald.ie/2026/08/13/ahascragh-fohenagh-defeat-kinvara-in-opener/",
            "father": FATHER,
        },
        stats,
        updated,
    )

    stamp(
        seed,
        pair_index,
        by_row,
        "player:padraic-leonard",
        {
            "name": "Pádraic Leonard",
            "club": "club:fohenagh-historic",
            "confidence": "verified",
            "status": "verified_from_cutting",
            "notable": "A standout Fohenagh hurler named in the Sadie Kilcommons final report.",
            "also_known_as": "Padraig Leonard; Padraic Leonard",
            "kid_chip": "Mentioned in match report",
            "cutting_cite": "Connacht Tribune · Sadie Kilcommons final · Fohenagh 1-12 Ahascragh 0-9",
            "verification": "Named in newspaper cutting — auto-verified",
        },
        stats,
        updated,
    )

    stamp(
        seed,
        pair_index,
        by_row,
        "player:niall-leonard",
        {
            "name": "Niall Leonard",
            "club": "club:ahascragh-fohenagh",
            "confidence": "verified",
            "status": "archivist_approved",
            "notable": "A powerful and stylish defender",
            "position": "Defender",
            "kid_chip": "Verified Fohenagh defender",
            "cutting_cite": CLUB_STAMP,
            "verification": CLUB_STAMP,
        },
        stats,
        updated,
    )

    stamp(
        seed,
        pair_index,
        by_row,
        "player:garry-lohan",
        {
            "name": "Garry Lohan",
            "club": "club:fohenagh-historic",
            "confidence": "verified",
            "status": "verified_from_cutting",
            "notable": "A standout Fohenagh hurler named in the Sadie Kilcommons final report.",
            "also_known_as": "Gary Lohan",
            "kid_chip": "Mentioned in match report",
            "cutting_cite": "Connacht Tribune · Sadie Kilcommons final · Fohenagh 1-12 Ahascragh 0-9",
            "verification": "Named in newspaper cutting — auto-verified",
        },
        stats,
        updated,
    )

    stamp(
        seed,
        pair_index,
        by_row,
        "player:cathal-lohan",
        {
            "name": "Cathal Lohan",
            "club": "club:ahascragh-fohenagh",
            "confidence": "verified",
            "status": "verified_from_cutting",
            "notable": "A Fohenagh parish hurler, named on the 1996 Fohenagh Minor C honour roll.",
            "note": "Named on Fohenagh Minor C 1996 Galway GAA roll of honour panel. Historic id player:cathal-lohan-fohenagh is the same person.",
            "kid_chip": "Verified parish hurler",
            "cutting_cite": "Galway GAA · Roll of Honour 1980–1999 · Fohenagh Minor C 1996",
            "verification": "Named on Galway GAA roll of honour",
            "source": "https://www.galwaygaa.ie/history/roll-of-honour-1980-1999-hurling-football/",
        },
        stats,
        updated,
    )
    # Keep historic scoped id as alias of the canonical Cathal page.
    set_or_add(
        seed,
        pair_index,
        by_row,
        "player:cathal-lohan-fohenagh",
        "same_as",
        "player:cathal-lohan",
        stats,
    )
    set_or_add(
        seed,
        pair_index,
        by_row,
        "player:cathal-lohan-fohenagh",
        "status",
        "alias",
        stats,
    )
    aliases.append("player:cathal-lohan-fohenagh")

    stamp(
        seed,
        pair_index,
        by_row,
        "player:jason-lohan",
        {
            "name": "Jason Lohan",
            "club": "club:ahascragh-fohenagh",
            "also_club": "club:ahascragh-historic",
            "confidence": "verified",
            "status": "archivist_approved",
            "kid_chip": "Verified AF hurler",
            "cutting_cite": "Connacht Tribune · 12 Dec 2003 · p.10 · INA",
        },
        stats,
        updated,
    )

    stamp(
        seed,
        pair_index,
        by_row,
        "player:trevor-lohan",
        {
            "name": "Trevor Lohan",
            "club": "club:ahascragh-fohenagh",
            "confidence": "verified",
            "status": CLUB_STAMP_STATUS,
            "notable": "A Fohenagh parish hurler with Ahascragh-Fohenagh.",
            "note": "Parish roster club stamp.",
            "kid_chip": "Verified parish hurler",
            "cutting_cite": CLUB_STAMP,
            "verification": CLUB_STAMP,
        },
        stats,
        updated,
    )

    # Mockler ↔ Moclair spelling aliases (no new people).
    alias_stub(
        seed, pair_index, by_row,
        "player:jimmy-mockler", "Jimmy Mockler", FATHER, "club:fohenagh-historic",
        stats, aliases,
    )
    alias_stub(
        seed, pair_index, by_row,
        "player:jim-mockler", "Jim Mockler", FATHER, "club:fohenagh-historic",
        stats, aliases,
    )
    alias_stub(
        seed, pair_index, by_row,
        "player:sean-mockler", "Seán Mockler", "player:sean-moclair",
        "club:ahascragh-fohenagh", stats, aliases,
    )
    alias_stub(
        seed, pair_index, by_row,
        "player:seamus-mockler", "Séamus Mockler", "player:seamus-moclair",
        "club:fohenagh-historic", stats, aliases,
    )
    alias_stub(
        seed, pair_index, by_row,
        "player:alan-mockler", "Alan Mockler",
        "player:alan-moclair-ahascragh-fohenagh",
        "club:ahascragh-fohenagh", stats, aliases,
    )

    # Existing Gary / Pádraig spelling aliases stay pointed at canonical pages.
    set_or_add(seed, pair_index, by_row, "player:gary-lohan", "same_as", "player:garry-lohan", stats)
    set_or_add(seed, pair_index, by_row, "player:gary-lohan", "status", "alias", stats)
    set_or_add(seed, pair_index, by_row, "player:padraig-leonard", "same_as", "player:padraic-leonard", stats)
    set_or_add(seed, pair_index, by_row, "player:padraig-leonard", "status", "alias", stats)
    aliases.extend(["player:gary-lohan", "player:padraig-leonard"])

    # Deduplicate updated list while keeping order.
    seen = set()
    upgraded = []
    for pid in CANONICAL_IDS + updated:
        if pid not in seen:
            seen.add(pid)
            upgraded.append(pid)

    pack = {
        "pack": "fohenagh-village-roster",
        "at": now,
        "scope": "Garry Lohan Fohenagh/Ahascragh parish roster — upgrade existing ids",
        "upgraded": CANONICAL_IDS,
        "aliases": sorted(set(aliases)),
        "merges": {
            "player:phillip-lohan": "player:philip-lohan",
            "player:cathal-lohan-fohenagh": "player:cathal-lohan",
            "player:sean-mockler": "player:sean-moclair",
            "player:seamus-mockler": "player:seamus-moclair",
            "player:alan-mockler": "player:alan-moclair-ahascragh-fohenagh",
            "player:jimmy-mockler": "player:jim-moclair-fohenagh",
            "player:jim-mockler": "player:jim-moclair-fohenagh",
        },
        "family": {
            "father": FATHER,
            "sons": [
                "player:sean-moclair",
                "player:seamus-moclair",
                "player:alan-moclair-ahascragh-fohenagh",
            ],
        },
        "dual_clubs": {
            "player:jason-lohan": [
                "club:ahascragh-historic",
                "club:ahascragh-fohenagh",
            ]
        },
        "notes": [
            "confidence=verified on every canonical parish page.",
            "Paper cites kept where we have them (1963 SHC final, 1959 CT, Sadie Kilcommons, Tuam Herald 2026, Galway GAA RoH 1996, CT 2003/2005).",
            "Club-stamp cite used only where there is no paper: Seán, Philip, Trevor, Niall.",
            "No invented scores, caps, or match minutes.",
            "AssocArray allows one club col; Jason also_club holds historic Ahascragh.",
        ],
        "stats": dict(stats),
    }

    SEED_PATH.write_text(json.dumps(seed, indent=2, ensure_ascii=False) + "\n")
    PACK_PATH.write_text(json.dumps(pack, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({"upgraded": CANONICAL_IDS, "aliases": pack["aliases"], "stats": dict(stats)}, indent=2))


if __name__ == "__main__":
    main()
