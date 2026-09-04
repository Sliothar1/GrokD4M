#!/usr/bin/env python3
"""Apply Ingest Lab Archivist batch-1 rulings for Fohenagh INA.

CLEAR (1959 draw/replay, 1960, 1963): attach secondary_cite ONLY to existing
seed matches. Never overwrite score / winner / result / home / away.

HOLD (1981 Junior A, 2016 Connacht IHC, 2000 Oranmore-Maree): index as
unverified dated article/cutting chips. No HOLD in verified (tier-1) matches.
Do not invent scores. Full article text stays out of public seed.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path("/workspace/hurlingwiki")
SEED_PATH = ROOT / "data" / "seed.json"
PACKETS_PATH = ROOT / "data" / "ina-queue" / "archivist-packets.jsonl"
LOG_PATH = ROOT / "data" / "ingest-log.jsonl"

# Lab pack ids → existing seed matches that already hold verified scores.
CLEAR_MAP = {
    "galway-shc-1959-final": "match:fohenagh-historic-1959-galway-shc-final-draw",
    "galway-shc-1959-final-replay": "match:fohenagh-historic-1959-galway-shc-final-replay",
    "galway-shc-1960-final": "match:fohenagh-historic-1960-galway-shc-final",
    "galway-shc-1963-final": "match:fohenagh-historic-1963-galway-shc-final",
}

SEASON_CHIP_1959 = "Fohenagh · 1959"

# Never write these cols onto an existing entity (Lab: never overwrite scores).
PROTECTED_COLS = {
    "score",
    "winner",
    "result",
    "home",
    "away",
    "runner_up",
    "name",
    "type",
    "confidence",
    "source",
    "source_wiki",
    "venue",
    "date",
    "year",
    "competition",
    "round",
    "note",
    "tag",
    "historic_club",
    "opponent",
}

HOLD_ARTICLES = {
    "match:1981-galway-junior-a-final-ahascragh-fohenagh": {
        "row": "article:ina-fohenagh-1981-junior-a",
        "title": "County Junior A Hurling Championship final",
        "excerpt": "County Junior A Hurling Championship final — Ahascragh beat Fohenagh that year. Printed tallies held for a second cite.",
        "hide_score": True,
        "score_disputed": False,
        "clubs": ["club:ahascragh-historic", "club:fohenagh-historic"],
        "linked_entity": "win:ahascragh-historic-1981-junior",
        "badge": "from link",
    },
    "match:2016-connacht-ihc-final-replay-ahascragh-fohenagh-ballyhaunis": {
        "row": "article:ina-fohenagh-2016-connacht-ihc",
        "title": "AIB Connacht Club Intermediate Hurling Championship final replay",
        "excerpt": "AIB Connacht Club IHC final replay (Athleague). INA cutting held — score disputed pending an agreeing re-cite.",
        "hide_score": True,
        "score_disputed": True,
        "clubs": ["club:ahascragh-fohenagh"],
        "linked_entity": "match:fohenagh-2016-11-13-final-replay",
        "badge": "from link",
    },
    "match:2000-fohenagh-oranmore-maree": {
        "row": "article:ina-fohenagh-2000-oranmore-maree",
        "title": "Fohenagh vs Oranmore-Maree",
        "excerpt": "Printed scoreline Fohenagh 1-7, Oranmore-Maree 2-3 — competition/grade not stated in pending extract.",
        "hide_score": True,
        "score_disputed": False,
        "clubs": ["club:fohenagh-historic", "club:oranmore-maree"],
        "linked_entity": None,
        "badge": "from link",
    },
}


def triple(row: str, col: str, val) -> dict:
    return {"row": row, "col": col, "val": val}


def load_packets() -> list[dict]:
    lines = []
    for raw in PACKETS_PATH.read_text(encoding="utf-8").splitlines():
        raw = raw.strip()
        if not raw:
            continue
        lines.append(json.loads(raw))
    return lines


def existing_pair_set(seed: list[dict]) -> set[tuple[str, str]]:
    return {(t["row"], t["col"]) for t in seed}


def append_if_new(seed: list[dict], pairs: set[tuple[str, str]], t: dict) -> bool:
    key = (t["row"], t["col"])
    if key in pairs:
        return False
    seed.append(t)
    pairs.add(key)
    return True


def attrs_for(seed: list[dict], row: str) -> dict:
    out = {}
    for t in seed:
        if t["row"] == row:
            out[t["col"]] = t["val"]
    return out


def apply() -> dict:
    seed: list[dict] = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    pairs = existing_pair_set(seed)
    packets = load_packets()
    added = []
    skipped_protected = []
    score_snapshot = {}

    def add(t: dict) -> None:
        if t["col"] in PROTECTED_COLS and (t["row"], t["col"]) in pairs:
            skipped_protected.append(t)
            return
        if append_if_new(seed, pairs, t):
            added.append(t)

    for pack_id, existing_id in CLEAR_MAP.items():
        before = attrs_for(seed, existing_id)
        if not before:
            raise SystemExit(f"Missing existing seed match {existing_id} for {pack_id}")
        score_snapshot[existing_id] = {
            "score": before.get("score"),
            "winner": before.get("winner"),
            "result": before.get("result"),
        }

    for pkt in packets:
        ruling = str(pkt.get("archivist_ruling") or "")
        pack_id = str(pkt.get("match_id") or "")
        paper = pkt.get("paper") or ""
        date = pkt.get("date") or ""
        url = (pkt.get("cite") or {}).get("url") or ""
        cite_chip = pkt.get("cite_chip") or (f"{date} · {paper}" if date and paper else paper)
        excerpt = (pkt.get("excerpt") or "").strip()
        # Public excerpt only — never dump full article text.
        if len(excerpt) > 240:
            excerpt = excerpt[:239].rstrip() + "…"

        if ruling == "CLEAR":
            if pack_id not in CLEAR_MAP:
                raise SystemExit(f"CLEAR packet match_id not in map: {pack_id}")
            existing_id = CLEAR_MAP[pack_id]
            alias_id = f"match:{pack_id}" if not pack_id.startswith("match:") else pack_id

            add(triple(existing_id, "secondary_cite", cite_chip))
            if paper:
                add(triple(existing_id, "secondary_cite_paper", paper))
            if date:
                add(triple(existing_id, "secondary_cite_date", date))
            if url:
                add(triple(existing_id, "secondary_cite_url", url))
            add(triple(existing_id, "pack_id", pack_id))
            add(triple(existing_id, "ingest_triage", "secondary_cite"))
            if pack_id in ("galway-shc-1959-final", "galway-shc-1959-final-replay"):
                add(triple(existing_id, "season_chip", SEASON_CHIP_1959))

            # Thin alias so Lab /match/galway-shc-YYYY-final URLs resolve.
            # No score cols on the alias.
            add(triple(alias_id, "type", "match"))
            add(triple(alias_id, "same_as", existing_id))
            add(triple(alias_id, "secondary_cite", cite_chip))
            if paper:
                add(triple(alias_id, "secondary_cite_paper", paper))
            if date:
                add(triple(alias_id, "secondary_cite_date", date))
            if url:
                add(triple(alias_id, "secondary_cite_url", url))
            if pack_id in ("galway-shc-1959-final", "galway-shc-1959-final-replay"):
                add(triple(alias_id, "season_chip", SEASON_CHIP_1959))
            continue

        if ruling == "HOLD":
            spec = HOLD_ARTICLES.get(pack_id)
            if not spec:
                raise SystemExit(f"HOLD packet match_id not mapped: {pack_id}")
            row = spec["row"]
            add(triple(row, "type", "article_upload"))
            add(triple(row, "kind", "url"))
            add(triple(row, "title", spec["title"]))
            add(triple(row, "name", spec["title"]))
            add(triple(row, "cite", cite_chip))
            add(triple(row, "badge", spec["badge"]))
            add(triple(row, "confidence", "unverified"))
            add(triple(row, "verification", "hold"))
            add(triple(row, "ingest_triage", pkt.get("ingest_triage") or "hold"))
            add(triple(row, "archivist_ruling", "HOLD"))
            if paper:
                add(triple(row, "paper", paper))
            if date:
                add(triple(row, "date", date))
                add(triple(row, "year", str(date)[:4]))
            if url:
                add(triple(row, "url", url))
            # HOLD public excerpt: 1981/2016 omit printed tallies on the card.
            add(triple(row, "excerpt", spec["excerpt"]))
            add(triple(row, "summary", spec["excerpt"]))
            if spec["hide_score"]:
                add(triple(row, "hide_score", True))
            if spec["score_disputed"]:
                add(triple(row, "score_disputed", True))
            for i, club_id in enumerate(spec["clubs"]):
                col = "club" if i == 0 else f"club_{i}"
                add(triple(row, col, club_id))
            if spec["linked_entity"]:
                add(triple(row, "linked_entity", spec["linked_entity"]))
            # Explicitly do not write a score col for HOLD packets.
            continue

        raise SystemExit(f"Unknown archivist_ruling on {pack_id}: {ruling}")

    # Verify scores unchanged on CLEAR targets.
    for existing_id, before in score_snapshot.items():
        after = attrs_for(seed, existing_id)
        for k, v in before.items():
            if after.get(k) != v:
                raise SystemExit(
                    f"PROTECTED overwrite on {existing_id}.{k}: {v!r} -> {after.get(k)!r}"
                )
        if "score" in after and after["score"] in (None, "", "null"):
            raise SystemExit(f"Score cleared on {existing_id}")

    # HOLD rows must not carry a score triple.
    for spec in HOLD_ARTICLES.values():
        after = attrs_for(seed, spec["row"])
        if "score" in after:
            raise SystemExit(f"HOLD {spec['row']} must not have a score col")
        if after.get("confidence") != "unverified":
            raise SystemExit(f"HOLD {spec['row']} must stay unverified")

    SEED_PATH.write_text(json.dumps(seed, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    log = {
        "url": "https://github.com/Sliothar1/GrokD4M",
        "date": "2026-09-04",
        "title": "Ingest Lab Archivist batch-1 Fohenagh INA rulings",
        "publisher": "HurlingWiki / Tribes Archivist",
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "triples_extracted": (
            f"CLEAR secondary_cite on {list(CLEAR_MAP.values())} "
            f"(no score overwrite); HOLD cuttings "
            f"{[s['row'] for s in HOLD_ARTICLES.values()]} unverified, no score cols; "
            f"added={len(added)}"
        ),
    }
    with LOG_PATH.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(log, ensure_ascii=False) + "\n")

    return {
        "added": len(added),
        "skipped_protected": len(skipped_protected),
        "score_snapshot": score_snapshot,
        "added_sample": added[:8],
    }


if __name__ == "__main__":
    result = apply()
    print(json.dumps(result, indent=2, default=str))
