#!/usr/bin/env python3
"""Apply Fohenagh-first INA catalog cuttings pack r65.

Live INA login was blocked (VeridianSessionID empty / Sign in UI).
Uses already-queued data/ina-queue/fohenagh-catalog.* title+URL locators only.
Never dumps full article text; never invents scores; HOLD cuttings stay unverified.
"""
from __future__ import annotations

import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path("/workspace/hurlingwiki")
SEED_PATH = ROOT / "data" / "seed.json"
PACK_PATH = ROOT / "data" / "pack-galway-club-player-links.json"
DATA_PATH = ROOT / "data" / "r65" / "pack-data.json"
LOG_PATH = ROOT / "data" / "ingest-log.jsonl"
PENDING_PATH = ROOT / "data" / "ina-queue" / "pending.jsonl"
QUEUE_PATH = ROOT / "data" / "ina-queue" / "archivist-fohenagh-club-links.json"
PACKETS_PATH = ROOT / "data" / "ina-queue" / "archivist-packets.jsonl"

PROTECTED_SCORE_COLS = {
    "score",
    "winner",
    "result",
    "home",
    "away",
    "runner_up",
}


def triple(row: str, col: str, val) -> dict:
    return {"row": row, "col": col, "val": val}


def build_index(seed: list[dict]):
    by_row: dict[str, dict] = defaultdict(dict)
    pair_index: dict[tuple[str, str], int] = {}
    for i, t in enumerate(seed):
        by_row[t["row"]][t["col"]] = t["val"]
        pair_index[(t["row"], t["col"])] = i
    return by_row, pair_index


def set_or_add(seed, pair_index, by_row, row, col, val, stats, allow_overwrite=True):
    if val is None:
        return "skipped_none"
    key = (row, col)
    if key in pair_index:
        if not allow_overwrite:
            return "exists"
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


def count_stats(by_row):
    players = {r: a for r, a in by_row.items() if a.get("type") == "player"}
    matches = {r: a for r, a in by_row.items() if a.get("type") == "match"}
    articles = {
        r: a
        for r, a in by_row.items()
        if a.get("type") in ("article_upload", "article", "cutting")
    }
    with_club = [p for p, a in players.items() if a.get("club")]
    return {
        "players": len(players),
        "with_club": len(with_club),
        "matches": len(matches),
        "articles": len(articles),
    }


def append_pending(records: list[dict]) -> int:
    existing = PENDING_PATH.read_text(encoding="utf-8") if PENDING_PATH.exists() else ""
    added = 0
    with PENDING_PATH.open("a", encoding="utf-8") as fh:
        for rec in records:
            rec = dict(rec)
            rec["extracted_at"] = datetime.now(timezone.utc).isoformat()
            line = json.dumps(rec, ensure_ascii=False)
            # de-dupe on ina_doc_id if present
            doc = (rec.get("cite") or {}).get("ina_doc_id") or ""
            if doc and doc in existing:
                continue
            fh.write(line + "\n")
            existing += line
            added += 1
    return added


def append_packet_notes(records: list[dict]) -> int:
    """Light Archivist queue note — catalog cites, not full CLEAR rulings."""
    existing = PACKETS_PATH.read_text(encoding="utf-8") if PACKETS_PATH.exists() else ""
    added = 0
    with PACKETS_PATH.open("a", encoding="utf-8") as fh:
        for rec in records:
            doc = (rec.get("cite") or {}).get("ina_doc_id") or ""
            if doc and doc in existing:
                continue
            pkt = dict(rec)
            pkt["archivist_ruling"] = "HOLD"
            pkt["archivist_ruled_at"] = datetime.now(timezone.utc).isoformat()
            pkt["notes"] = (
                (pkt.get("notes") or "")
                + " r65 catalog locator only — login blocked; pending dual-source/OCR."
            ).strip()
            fh.write(json.dumps(pkt, ensure_ascii=False) + "\n")
            added += 1
    return added


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    seed = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    by_row, pair_index = build_index(seed)
    before = count_stats(by_row)
    stats = defaultdict(int)
    cites_attached: list[str] = []
    articles_added: list[str] = []
    aliases_added: list[str] = []

    for item in data.get("match_cites", []):
        mid = item["id"]
        if mid not in by_row or by_row[mid].get("type") != "match":
            stats["match_missing"] += 1
            continue
        # Snapshot protected score cols
        before_score = {k: by_row[mid].get(k) for k in PROTECTED_SCORE_COLS if k in by_row[mid]}
        for col, val in item.get("cols", {}).items():
            if col in PROTECTED_SCORE_COLS:
                stats["skipped_protected"] += 1
                continue
            if col == "note" and by_row[mid].get("note"):
                old = by_row[mid]["note"]
                if val not in old:
                    set_or_add(
                        seed,
                        pair_index,
                        by_row,
                        mid,
                        "note",
                        (old + " " + val).strip(),
                        stats,
                    )
                continue
            # Don't overwrite an existing secondary_cite with a different paper
            if col == "secondary_cite" and by_row[mid].get("secondary_cite") and by_row[mid].get("secondary_cite") != val:
                set_or_add(
                    seed,
                    pair_index,
                    by_row,
                    mid,
                    "catalog_cite",
                    val,
                    stats,
                    allow_overwrite=False,
                )
                # also map companion fields if present in cols
                continue
            set_or_add(seed, pair_index, by_row, mid, col, val, stats)
        # verify scores untouched
        for k, v in before_score.items():
            if by_row[mid].get(k) != v:
                raise SystemExit(f"PROTECTED overwrite on {mid}.{k}: {v!r} -> {by_row[mid].get(k)!r}")
        cites_attached.append(mid)

        alias = item.get("alias")
        if alias:
            aid = alias["id"]
            for col, val in alias.get("cols", {}).items():
                if col in PROTECTED_SCORE_COLS:
                    continue
                set_or_add(seed, pair_index, by_row, aid, col, val, stats, allow_overwrite=False)
            aliases_added.append(aid)

    for art in data.get("articles", []):
        rid = art["id"]
        cols = art["cols"]
        if rid in by_row and by_row[rid].get("type"):
            stats["article_exists"] += 1
            continue
        for col, val in cols.items():
            if col == "score":
                raise SystemExit(f"HOLD article {rid} must not carry score")
            set_or_add(seed, pair_index, by_row, rid, col, val, stats)
        if by_row[rid].get("score") is not None:
            raise SystemExit(f"HOLD article {rid} unexpectedly has score")
        if by_row[rid].get("confidence") != "unverified":
            raise SystemExit(f"HOLD article {rid} must stay unverified")
        articles_added.append(rid)
        stats["articles_added"] += 1

    pending_added = append_pending(data.get("pending_records", []))
    packets_added = append_packet_notes(data.get("pending_records", []))

    after = count_stats(by_row)
    now = datetime.now(timezone.utc).isoformat()

    SEED_PATH.write_text(json.dumps(seed, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    pack = {
        "pack": "ina-galway-cuttings",
        "round": "65",
        "generated_at": now,
        "title": data.get("title"),
        "ina_status": data.get("ina_status"),
        "before": before,
        "after": after,
        "cites_attached": cites_attached,
        "aliases_added": aliases_added,
        "articles_added": articles_added,
        "pending_added": pending_added,
        "packets_added": packets_added,
        "stats": dict(stats),
        "public_fallback_note": data.get("public_fallback_note"),
    }
    PACK_PATH.write_text(json.dumps(pack, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # Archivist queue stamp
    queue = []
    if QUEUE_PATH.exists():
        try:
            queue = json.loads(QUEUE_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            queue = []
    if not isinstance(queue, list):
        queue = [queue]
    queue.append(
        {
            "batch": "fohenagh-ina-catalog-r65",
            "ruled_at": now,
            "ina_status": data.get("ina_status"),
            "clear_links": [],
            "unverified_new": [],
            "cites_attached": cites_attached,
            "articles_hold": articles_added,
            "note": "INA login blocked; catalog title/URL cite chips only. No full text. No invented scores. New cuttings HOLD pending Archivist.",
        }
    )
    QUEUE_PATH.write_text(json.dumps(queue, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    log = {
        "url": "data/ina-queue/fohenagh-catalog.json",
        "date": "2026-09-07",
        "title": data.get("title"),
        "publisher": "Irish Newspaper Archives catalog + HurlingWiki (login blocked)",
        "processed_at": now,
        "pack": "data/pack-galway-club-player-links.json",
        "queue": "data/ina-queue/archivist-fohenagh-club-links.json",
        "before_players": before["players"],
        "after_players": after["players"],
        "before_matches": before["matches"],
        "after_matches": after["matches"],
        "before_articles": before["articles"],
        "after_articles": after["articles"],
        "cites_attached": cites_attached,
        "articles_added": articles_added,
        "pending_added": pending_added,
        "ina_status": data.get("ina_status"),
        "public_fallback_note": data.get("public_fallback_note"),
    }
    with LOG_PATH.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(log, ensure_ascii=False) + "\n")

    print(json.dumps(pack, indent=2, default=str))


if __name__ == "__main__":
    main()
