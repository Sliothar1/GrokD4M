"""Round 42: Pre-2000 Galway SHC knockout scored Match triples (1990 SF + 1991 QF/SF + 1995 QF/SF) + Connacht Intermediate Club HC scored finals 2011–2015/2017–2019/2021–2025 (IHC gaps); Tynagh-Abbey/Duniry dual-cite thin fills; club-less ~82 stay HOLD; skip HOLD orphans; new unverified HOLD collisions. Data in data/r42/pack-data.json."""
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
DATA_PATH = ROOT / "data" / "r42" / "pack-data.json"


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower().strip()
    s = s.replace("'", "").replace("'", "").replace("'", "").replace(".", "")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "unknown"


def triple(row: str, col: str, val) -> dict:
    return {"row": row, "col": col, "val": val}


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


def link_player(seed, pair_index, by_row, pid, club, source, note, confidence, stats, linked_ids, hold_players, stamp_appearances=True):
    if pid in hold_players:
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
    if attrs.get("hold") and pid not in hold_players:
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


def create_player(seed, pair_index, by_row, spec, stats, created_ids, fohenagh_new, hold_players):
    pid = spec.get("id") or f"player:{slugify(spec['name'])}"
    if pid in by_row and by_row[pid].get("type") == "player":
        if not by_row[pid].get("club"):
            link_player(
                seed, pair_index, by_row, pid, spec["club"], spec["source"],
                spec["note"], spec.get("confidence", "unverified"), stats, created_ids, hold_players,
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
    data = json.loads(DATA_PATH.read_text())
    WIKI_LINKS = data["wiki_links"]
    NEW_PLAYERS = data["new_players"]
    HOLD_PLAYERS = set(data["hold_players"])
    NEW_CLUBS = data["new_clubs"]
    CLUB_META_UPDATES = data["club_meta"]
    NEW_MATCHES = data["new_matches"]
    MATCH_UPDATES = data.get("match_updates", [])
    hold_notes = data["hold_notes"]

    seed = json.loads(SEED_PATH.read_text())
    by_row, pair_index = build_index(seed)
    before = count_stats(by_row)

    for need in [
        "club:turloughmore", "club:castlegar", "club:loughrea", "club:tynagh-abbey-duniry",
        "club:cappataggle", "club:athenry", "club:st-thomas", "club:beagh", "club:moycullen",
        "club:meelick-eyrecourt", "club:michael-cusacks", "club:tommy-larkins", "club:ahascragh-fohenagh", "club:ahascragh-historic",
        "club:killimordaly", "club:kilconieron", "club:skehana-mountbellew-moylough",
        "club:salthill-knocknacarra", "club:bearna-na-forbacha", "club:cussane-historic",
        "club:clarinbridge", "club:sarsfields", "club:annaghdown", "club:abbey-duniry-historic",
        "club:kinvara", "club:ballinderreen", "club:gort", "club:ardrahan", "club:tommy-larkins",
        "club:craughwell", "club:padraig-pearses", "club:liam-mellows", "club:kilnadeema-leitrim",
        "club:mullagh", "club:portumna", "club:killimor", "club:kiltormer", "club:sylane", "club:oranmore-maree", "club:carnmore", "club:ballygar", "club:liam-mellows", "club:abbeyknockmoy", "club:an-spideal", "club:micheal-breathnach", "club:michael-cusacks", "club:oranmore-maree",
        "club:skehana", "club:mountbellew-moylough", "club:leitrim-galway-historic", "club:ballinasloe", "club:fohenagh-historic", "club:ahascragh-historic",
    ]:
        if need not in by_row or by_row[need].get("type") != "club":
            raise SystemExit(f"missing club {need}")

    stats = defaultdict(int)
    linked_ids: list[str] = []
    created_ids: list[str] = []
    fohenagh_new: list[str] = []
    fohenagh_linked: list[str] = []
    matches_added: list[str] = []
    clubs_created: list[str] = []

    for club in NEW_CLUBS:
        cid = club["id"]
        if cid in by_row and by_row[cid].get("type") == "club":
            stats["club_exists"] += 1
            continue
        for col, val in club["cols"].items():
            set_or_add(seed, pair_index, by_row, cid, col, val, stats)
        clubs_created.append(cid)
        stats["clubs_created"] += 1

    for item in WIKI_LINKS:
        ok = link_player(
            seed, pair_index, by_row,
            item["player"], item["club"], item["source"], item["note"],
            item.get("confidence", "high"), stats, linked_ids, HOLD_PLAYERS,
        )
        if ok and ("fohenagh" in item["club"] or "ahascragh" in item["club"]):
            fohenagh_linked.append(item["player"])

    for spec in NEW_PLAYERS:
        create_player(seed, pair_index, by_row, spec, stats, created_ids, fohenagh_new, HOLD_PLAYERS)

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

    for mu in MATCH_UPDATES:
        mid = mu["id"]
        if mid not in by_row or by_row[mid].get("type") != "match":
            stats["match_update_missing"] += 1
            continue
        for col, val in mu["cols"].items():
            if col == "note" and by_row[mid].get("note"):
                oldn = by_row[mid]["note"]
                if val not in oldn:
                    set_or_add(seed, pair_index, by_row, mid, "note", (oldn + " " + val).strip(), stats)
                continue
            set_or_add(seed, pair_index, by_row, mid, col, val, stats)
        stats["matches_updated"] += 1

    for pid, hnote in hold_notes.items():
        if pid not in by_row or by_row[pid].get("type") != "player":
            continue
        set_or_add(seed, pair_index, by_row, pid, "hold", True, stats)
        if not by_row[pid].get("club"):
            set_or_add(seed, pair_index, by_row, pid, "status", "hold", stats)
        note = by_row[pid].get("note") or ""
        if hnote not in note and "HOLD r42" not in note:
            set_or_add(seed, pair_index, by_row, pid, "note", (note + " " + hnote).strip(), stats)

    if by_row.get("player:basil-larkin", {}).get("club") == "club:meelick-eyrecourt":
        set_or_add(seed, pair_index, by_row, "player:basil-larkin", "hold", False, stats)
        if by_row["player:basil-larkin"].get("status") == "hold":
            set_or_add(seed, pair_index, by_row, "player:basil-larkin", "status", "pending_archivist", stats)

    if by_row.get("player:gordan-glynn", {}).get("club") == "club:kiltormer":
        set_or_add(seed, pair_index, by_row, "player:gordan-glynn", "hold", False, stats)
        if by_row["player:gordan-glynn"].get("status") == "hold":
            set_or_add(seed, pair_index, by_row, "player:gordan-glynn", "status", "pending_archivist", stats)

    for clear_pid, clear_club in [
        ("player:shane-fitzpatrick-tynagh-abbey-duniry", "club:tynagh-abbey-duniry"),
        ("player:thomas-murphy-tynagh-abbey-duniry", "club:tynagh-abbey-duniry"),
    ]:
        if by_row.get(clear_pid, {}).get("club") == clear_club:
            set_or_add(seed, pair_index, by_row, clear_pid, "hold", False, stats)
            if by_row[clear_pid].get("status") == "hold":
                set_or_add(seed, pair_index, by_row, clear_pid, "status", "pending_archivist", stats)

    after = count_stats(by_row)
    now = datetime.now(timezone.utc).isoformat()

    pack = {
        "pack": "galway-club-player-links",
        "round": "42",
        "generated_at": now,
        "sources": [
            "https://en.wikipedia.org/wiki/1990_Galway_Senior_Hurling_Championship",
            "https://en.wikipedia.org/wiki/1991_Galway_Senior_Hurling_Championship",
            "https://en.wikipedia.org/wiki/1995_Galway_Senior_Hurling_Championship",
            "https://en.wikipedia.org/wiki/Connacht_Intermediate_Club_Hurling_Championship",
            "https://www.connachttribune.ie/sport/hurling/tynaghabbey-duniry-men-secure-provincial-title-glory-5589137",
            "https://www.galwaybayfm.ie/sports/tynagh-abbey-duniry-wins-connacht-intermediate-club-hurling-final-commentary-and-reaction-182531",
            "https://www.westernpeople.ie/sport/gaa/five-in-a-row-is-too-good-to-be-true_arid-39202.html",
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
            "clubs_created": stats["clubs_created"],
            "appearances_clubbed": stats["appearances_clubbed"],
            "matches_added": stats["matches_added"],
            "players_with_club": after["with_club"] - before["with_club"],
            "orphan_clubs": after["orphans"] - before["orphans"],
        },
        "sample_linked_ids": linked_ids[:40],
        "sample_created_ids": created_ids[:40],
        "all_linked_ids": linked_ids,
        "all_created_ids": created_ids,
        "clubs_created_ids": clubs_created,
        "matches_added_ids": matches_added,
        "fohenagh_new_player_ids": fohenagh_new,
        "fohenagh_linked_existing_ids": fohenagh_linked,
        "holds": sorted(HOLD_PLAYERS),
        "stats": dict(stats),
        "priority_club_counts_after": {
            c: after["players_per_club"].get(c, 0)
            for c in [
                "club:fohenagh-historic", "club:ahascragh-fohenagh", "club:claregalway", "club:skehana",
                "club:oranmore-historic", "club:eyrecourt-historic", "club:college-road",
                "club:kilrickle", "club:skehana", "club:st-colemans",
                "club:tynagh-abbey-duniry", "club:cappataggle", "club:athenry", "club:beagh",
                "club:moycullen", "club:turloughmore", "club:castlegar", "club:loughrea",
                "club:st-thomas", "club:meelick-eyrecourt", "club:michael-cusacks", "club:tommy-larkins",
                "club:salthill-knocknacarra", "club:bearna-na-forbacha", "club:cussane-historic",
                "club:kilconieron", "club:annaghdown", "club:clarinbridge", "club:sarsfields",
                "club:ballinasloe", "club:ballygar", "club:carnmore", "club:padraig-pearses", "club:gort", "club:killimordaly", "club:ballygar", "club:cappataggle",
                "club:portumna", "club:carnmore", "club:rahoon", "club:abbeyknockmoy", "club:kilnadeema-leitrim", "club:ballinderreen", "club:killimor", "club:mullagh", "club:an-spideal", "club:micheal-breathnach", "club:michael-cusacks", "club:oranmore-maree", "club:kinvara", "club:beagh", "club:kilnadeema-leitrim", "club:loughrea", "club:mountbellew-moylough", "club:moycullen", "club:ballinasloe", "club:leitrim-galway-historic", "club:ahascragh-historic",
            ]
        },
        "still_orphan_priority": [
            c for c in [
                "club:claregalway", "club:college-road", "club:eyrecourt-historic",
                "club:kilrickle", "club:oranmore-historic", "club:skehana", "club:st-colemans",
            ] if c in after["orphan_ids"]
        ],
        "orphan_note": "Remaining HOLD orphans: Claregalway/College Road/Eyrecourt/Kilrickle/St Coleman's (skipped; no first+last hurling cite). r42: pre-2000 Galway SHC knockout scored Match pack (1990 SF + 1991 QF/SF + 1995 QF/SF from Wikipedia year pages) + Connacht Intermediate Club HC finals 2011–2015/2017–2019/2021–2025 (IHC gaps); club-less ~82 stay HOLD (no new strong multi-source clears); AF/Fohenagh dense — skipped; Tynagh-Abbey/Duniry dual-cite thin fills (Shane Fitzpatrick / Thomas Murphy); new HOLD collision notes for Conroy/Keane/Lynch/Glynn/Coone.",
    }

    SEED_PATH.write_text(json.dumps(seed, indent=2, ensure_ascii=False) + "\n")
    PACK_PATH.write_text(json.dumps(pack, indent=2, ensure_ascii=False) + "\n")

    log = {
        "url": "Pre-2000 Galway SHC knockouts (1990/1991/1995) / Connacht Intermediate Club HC finals / TAD thin fills",
        "date": "2026-09-06",
        "title": "Galway club-player pack r42",
        "publisher": "Wikipedia / Connacht Tribune / Galway Bay FM / Western People / HurlingWiki",
        "processed_at": now,
        "pack": "data/pack-galway-club-player-links.json",
        "queue": "data/ina-queue/archivist-fohenagh-club-links.json",
        "before_players_with_club": before["with_club"],
        "after_players_with_club": after["with_club"],
        "players_linked": stats["players_linked"],
        "players_created": stats["players_created"],
        "clubs_created": clubs_created,
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
            "batch": "fohenagh-club-links-r42",
            "ruled_at": now,
            "clear_links": fohenagh_linked,
            "unverified_new": fohenagh_new,
            "note": "AF/Fohenagh r42: AF/Fohenagh panels dense — no weak AF fills. Pre-2000 SHC knockouts + Connacht IHC scored Matches; TAD thin fills. Club-less HOLD; orphans skipped.",
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
        "before_players": before["players"],
        "after_players": after["players"],
        "before_matches": before["matches"],
        "after_matches": after["matches"],
        "before_orphans": before["orphans"],
        "after_orphans": after["orphans"],
        "linked": stats["players_linked"],
        "created": stats["players_created"],
        "clubs_created": clubs_created,
        "matches_added_count": len(matches_added),
        "orphan_ids_after": after["orphan_ids"],
        "priority_clubs": pack["priority_club_counts_after"],
        "still_orphan_priority": pack["still_orphan_priority"],
        "fohenagh_new": fohenagh_new,
        "fohenagh_linked": fohenagh_linked,
        "stats": dict(stats),
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
