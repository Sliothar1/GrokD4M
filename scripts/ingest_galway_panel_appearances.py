#!/usr/bin/env python3
"""Emit one appearance:* packet per curated Galway GAA HURLING panel slot.

Reshape panel notes into Archivist appearance rows (not career cards).
Idempotent merge into data/seed.json.

Source: https://www.galwaygaa.ie/history/all-ireland-winning-teams/
Never invent caps, tallies, All-Stars, positions, or scores.
"""
from __future__ import annotations

import importlib.util
import json
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path("/workspace/hurlingwiki")
SEED_PATH = ROOT / "data" / "seed.json"
PACK_PATH = ROOT / "data" / "pack-galway-panel-appearances.json"
QUEUE_PATH = ROOT / "data" / "ina-queue" / "archivist-player-appearances-batch1.json"
LOG_PATH = ROOT / "data" / "ingest-log.jsonl"

SOURCE_URL = "https://www.galwaygaa.ie/history/all-ireland-winning-teams/"
PANEL_SOURCE_MARKER = "all-ireland-winning-teams"

FOHENAGH_CLUBS = {
    "club:ahascragh-fohenagh",
    "club:fohenagh-historic",
    "club:ahascragh-historic",
}

# Surname → club when historic/amalgam rule applies (Mannions / post-2002 amalgam).
# Appearance.club still comes from the cite when present; this fills player.club.
KNOWN_PLAYER_CLUBS = {
    "mannion": "club:ahascragh-fohenagh",
}

# Panel grade label → packet grade / slug / competition name
GRADE_META = {
    "Senior": {
        "grade": "SHC",
        "slug": "shc",
        "competition": "All-Ireland Senior Hurling Championship",
        "champions_label": "All-Ireland Senior Hurling Champions",
    },
    "Minor": {
        "grade": "Minor",
        "slug": "minor",
        "competition": "All-Ireland Minor Hurling Championship",
        "champions_label": "All-Ireland Minor Hurling Champions",
    },
    "U-21": {
        "grade": "U-21",
        "slug": "u-21",
        "competition": "All-Ireland U-21 Hurling Championship",
        "champions_label": "All-Ireland U-21 Hurling Champions",
    },
    "Intermediate": {
        "grade": "IHC",
        "slug": "ihc",
        "competition": "All-Ireland Intermediate Hurling Championship",
        "champions_label": "All-Ireland Intermediate Hurling Champions",
    },
}


def load_expand():
    spec = importlib.util.spec_from_file_location(
        "ingest_galway_players_expand",
        ROOT / "scripts" / "ingest_galway_players_expand.py",
    )
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod


def triple(row: str, col: str, val) -> dict:
    return {"row": row, "col": col, "val": val}


def index_seed(seed: list[dict]) -> tuple[dict[str, dict], dict[str, str], dict[tuple[str, str], int]]:
    by_row: dict[str, dict] = defaultdict(dict)
    pair_index: dict[tuple[str, str], int] = {}
    for i, t in enumerate(seed):
        by_row[t["row"]][t["col"]] = t["val"]
        pair_index[(t["row"], t["col"])] = i
    players = {r: attrs for r, attrs in by_row.items() if attrs.get("type") == "player"}
    norm_to_id: dict[str, str] = {}
    for pid, attrs in players.items():
        nn = exp.norm_name(attrs.get("name") or "")
        if nn and nn not in norm_to_id:
            norm_to_id[nn] = pid
    return players, norm_to_id, pair_index


def is_panel_only_source(src: str | None) -> bool:
    if not src:
        return False
    return PANEL_SOURCE_MARKER in str(src)


def resolve_player_id(
    name: str,
    nn: str,
    club_id: str | None,
    year: int,
    collision_keys: set[tuple[int, str]],
    existing_ids: set[str],
    norm_to_id: dict[str, str],
) -> str:
    """Match existing player by id / norm; club-suffixed when same-panel collision."""
    if (year, nn) in collision_keys and club_id:
        suffixed = f"player:{exp.slugify(name)}-{club_id.split(':', 1)[-1]}"
        if suffixed in existing_ids:
            return suffixed
        # also accept unsuffixed if somehow present
        plain = f"player:{exp.slugify(name)}"
        if plain in existing_ids and norm_to_id.get(nn) == plain:
            # Prefer distinct id for collision cases
            return suffixed
        return suffixed

    plain = f"player:{exp.slugify(name)}"
    if plain in existing_ids:
        return plain
    if nn in norm_to_id:
        return norm_to_id[nn]
    return plain


def appearance_id(player_id: str, grade_slug: str, year: int) -> str:
    player_slug = player_id.split(":", 1)[-1]
    return f"appearance:{player_slug}-{grade_slug}-{year}"



def known_club_for_name(name: str) -> str | None:
    tokens = exp.norm_name(name).split()
    if not tokens:
        return None
    return KNOWN_PLAYER_CLUBS.get(tokens[-1])


def main() -> None:
    global exp
    exp = load_expand()

    seed: list[dict] = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    players, norm_to_id, pair_index = index_seed(seed)
    existing_ids = set(players.keys())
    existing_pairs = set(pair_index.keys())

    # Detect same-panel name collisions with differing clubs (Oisin Flannery ×2)
    collision_keys: set[tuple[int, str]] = set()
    for panel in exp.PANELS:
        by_norm: dict[str, set[str | None]] = defaultdict(set)
        for pl in panel["players"]:
            name = exp.clean_display_name(pl["name"])
            if exp.should_skip_name(name):
                continue
            cid = exp.resolve_club_id(pl.get("club_name"), pl.get("club_id"))
            by_norm[exp.norm_name(name)].add(cid)
        for nn, clubs in by_norm.items():
            nonempty = {c for c in clubs if c}
            if len(nonempty) >= 2:
                collision_keys.add((panel["year"], nn))

    def set_or_add(row: str, col: str, val) -> str:
        """Insert or update a triple. Returns 'add' | 'update' | 'skip'."""
        key = (row, col)
        if key in pair_index:
            idx = pair_index[key]
            if seed[idx]["val"] == val:
                return "skip"
            seed[idx]["val"] = val
            return "update"
        seed.append(triple(row, col, val))
        pair_index[key] = len(seed) - 1
        existing_pairs.add(key)
        return "add"

    appearances_added: list[str] = []
    appearances_skipped: list[str] = []
    players_created: list[str] = []
    players_downgraded: list[str] = []
    fohenagh_appearance_ids: list[str] = []
    hold_appearance_ids: list[str] = []
    triples_added = 0
    triples_updated = 0

    # --- Pass 1: emit appearances + ensure player stubs ---
    for panel in exp.PANELS:
        year = panel["year"]
        grade_label = panel["grade"]
        meta = GRADE_META[grade_label]
        grade = meta["grade"]
        grade_slug = meta["slug"]
        competition = meta["competition"]
        excerpt = f"Named on Galway {meta['champions_label']} {year} panel."
        cite_chip = f"{year} · Galway GAA"

        for pl in panel["players"]:
            name = exp.clean_display_name(pl["name"])
            if exp.should_skip_name(name):
                continue
            nn = exp.norm_name(name)
            club_from_cite = exp.resolve_club_id(pl.get("club_name"), pl.get("club_id"))
            pid = resolve_player_id(
                name, nn, club_from_cite, year, collision_keys, existing_ids, norm_to_id
            )
            aid = appearance_id(pid, grade_slug, year)

            # Ensure player exists
            if pid not in existing_ids:
                for col, val in (
                    ("type", "player"),
                    ("name", name),
                    ("confidence", "unverified"),
                    ("source", SOURCE_URL),
                    ("status", "pending_archivist"),
                ):
                    r = set_or_add(pid, col, val)
                    if r == "add":
                        triples_added += 1
                    elif r == "update":
                        triples_updated += 1
                club_for_player = club_from_cite or known_club_for_name(name)
                if club_for_player:
                    r = set_or_add(pid, "club", club_for_player)
                    if r == "add":
                        triples_added += 1
                    elif r == "update":
                        triples_updated += 1
                else:
                    r = set_or_add(pid, "hold", True)
                    if r == "add":
                        triples_added += 1
                existing_ids.add(pid)
                if nn not in norm_to_id:
                    norm_to_id[nn] = pid
                players_created.append(pid)

            # Appearance packet
            already = (aid, "type") in existing_pairs
            if already and seed[pair_index[(aid, "type")]]["val"] == "appearance":
                appearances_skipped.append(aid)
            else:
                appearances_added.append(aid)

            hold = False
            club_val = club_from_cite
            if not club_from_cite:
                # HOLD when cite has no club and player×club not already verified elsewhere
                existing_club = None
                if pid in players:
                    existing_club = players[pid].get("club")
                player_src = (players.get(pid) or {}).get("source") or SOURCE_URL
                verified_elsewhere = (
                    existing_club
                    and not is_panel_only_source(str(player_src))
                    and str((players.get(pid) or {}).get("confidence") or "").lower()
                    in {"high", "verified"}
                )
                if not verified_elsewhere:
                    hold = True
                    club_val = None

            cols = {
                "type": "appearance",
                "player": pid,
                "name": name,
                "competition": competition,
                "grade": grade,
                "year": year,
                "cite_chip": cite_chip,
                "excerpt": excerpt,
                "source": SOURCE_URL,
                "confidence": "unverified",
                "status": "pending_archivist",
            }
            if club_val:
                cols["club"] = club_val
            if hold:
                cols["hold"] = True

            for col, val in cols.items():
                r = set_or_add(aid, col, val)
                if r == "add":
                    triples_added += 1
                elif r == "update":
                    triples_updated += 1

            # Clear stale club on appearance if HOLD (idempotent reshape)
            if hold and (aid, "club") in pair_index:
                # remove club triple when hold
                idx = pair_index[(aid, "club")]
                # mark for deletion by setting a tombstone — better to rebuild without it
                seed[idx] = None  # type: ignore
                del pair_index[(aid, "club")]
                existing_pairs.discard((aid, "club"))

            if club_val in FOHENAGH_CLUBS or (
                club_val and any(x in club_val for x in ("fohenagh", "ahascragh"))
            ):
                fohenagh_appearance_ids.append(aid)
            if hold:
                hold_appearance_ids.append(aid)

    # Compact None tombstones
    if any(t is None for t in seed):
        seed = [t for t in seed if t is not None]
        # rebuild pair_index
        pair_index = {(t["row"], t["col"]): i for i, t in enumerate(seed)}
        existing_pairs = set(pair_index.keys())

    # --- Pass 2: downgrade panel-only players to unverified (never touch wiki/club verified) ---
    # Re-index players after creates
    by_row: dict[str, dict] = defaultdict(dict)
    for t in seed:
        by_row[t["row"]][t["col"]] = t["val"]

    for pid, attrs in list(by_row.items()):
        if attrs.get("type") != "player":
            continue
        src = str(attrs.get("source") or "")
        if not is_panel_only_source(src):
            continue
        conf = str(attrs.get("confidence") or "").lower()
        if conf in {"unverified", "hold", "low"}:
            continue
        # Panel-only evidence → unverified (reshape lab requirement)
        r = set_or_add(pid, "confidence", "unverified")
        if r != "skip":
            players_downgraded.append(pid)
            if r == "add":
                triples_added += 1
            else:
                triples_updated += 1
        # Ensure status for archivist queue
        if "status" not in attrs:
            r = set_or_add(pid, "status", "pending_archivist")
            if r == "add":
                triples_added += 1

    # Apply amalgam/historic club hints (Mannions → ahascragh-fohenagh) when club missing
    by_row = defaultdict(dict)
    for t in seed:
        if t is None:
            continue
        by_row[t["row"]][t["col"]] = t["val"]
    for pid, attrs in list(by_row.items()):
        if attrs.get("type") != "player":
            continue
        if attrs.get("club"):
            continue
        hint = known_club_for_name(str(attrs.get("name") or ""))
        if not hint:
            continue
        r = set_or_add(pid, "club", hint)
        if r == "add":
            triples_added += 1
        elif r == "update":
            triples_updated += 1

    # Collect all appearance ids after merge
    by_row = defaultdict(dict)
    for t in seed:
        by_row[t["row"]][t["col"]] = t["val"]
    all_appearance_ids = sorted(
        r for r, a in by_row.items() if a.get("type") == "appearance"
    )
    unverified_players = sorted(
        r
        for r, a in by_row.items()
        if a.get("type") == "player"
        and str(a.get("confidence") or "").lower() == "unverified"
    )
    # Fohenagh-linked appearances (club on appearance OR player club in family)
    fohenagh_set: list[str] = []
    for aid in all_appearance_ids:
        a = by_row[aid]
        club = str(a.get("club") or "")
        if club in FOHENAGH_CLUBS or "fohenagh" in club or "ahascragh" in club:
            fohenagh_set.append(aid)
            continue
        pid = str(a.get("player") or "")
        pclub = str((by_row.get(pid) or {}).get("club") or "")
        if pclub in FOHENAGH_CLUBS or "fohenagh" in pclub or "ahascragh" in pclub:
            fohenagh_set.append(aid)

    # Prefer Fohenagh-linked first in archivist queue
    fohenagh_ordered = sorted(set(fohenagh_set))
    rest = [a for a in all_appearance_ids if a not in set(fohenagh_ordered)]
    queue_ids = fohenagh_ordered + rest

    pack = {
        "pack": "galway-panel-appearances",
        "source": SOURCE_URL,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "appearance_count": len(all_appearance_ids),
        "appearances_added_this_run": len(set(appearances_added) - set(appearances_skipped)),
        "appearances_already_present": len(set(appearances_skipped)),
        "unverified_player_count": len(unverified_players),
        "fohenagh_linked_appearance_count": len(fohenagh_ordered),
        "hold_appearance_count": len(set(hold_appearance_ids)),
        "players_created": players_created,
        "players_downgraded_count": len(players_downgraded),
        "players_downgraded_sample": players_downgraded[:20],
        "sample_appearance_ids": [
            "appearance:niall-glynn-minor-2019",
            *[
                x
                for x in fohenagh_ordered[:8]
                if x != "appearance:niall-glynn-minor-2019"
            ],
            *[x for x in all_appearance_ids if "niall-glynn" in x or "mannion" in x][:5],
        ],
        "triples_added": triples_added,
        "triples_updated": triples_updated,
        "panels_curated": [
            {
                "year": p["year"],
                "grade": p["grade"],
                "label": p["label"],
                "n": len(p["players"]),
            }
            for p in exp.PANELS
        ],
    }
    # Dedupe sample list preserving order
    seen_s = set()
    sample = []
    for x in pack["sample_appearance_ids"]:
        if x in seen_s:
            continue
        if x in all_appearance_ids or x == "appearance:niall-glynn-minor-2019":
            seen_s.add(x)
            sample.append(x)
    pack["sample_appearance_ids"] = sample[:12]

    queue = {
        "queue": "archivist-player-appearances-batch1",
        "source": SOURCE_URL,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "note": "Fohenagh-linked appearances listed first for Archivist review.",
        "appearance_ids": queue_ids,
        "fohenagh_linked_first": fohenagh_ordered,
        "counts": {
            "total": len(queue_ids),
            "fohenagh_linked": len(fohenagh_ordered),
            "hold": len(set(hold_appearance_ids)),
        },
    }

    PACK_PATH.write_text(json.dumps(pack, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    QUEUE_PATH.parent.mkdir(parents=True, exist_ok=True)
    QUEUE_PATH.write_text(json.dumps(queue, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    SEED_PATH.write_text(json.dumps(seed, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    log_entry = {
        "url": SOURCE_URL,
        "date": "2026-09-04",
        "title": "Galway All-Ireland hurling panel appearance packets",
        "publisher": "Galway GAA",
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "appearance_count": len(all_appearance_ids),
        "unverified_player_count": len(unverified_players),
        "fohenagh_linked_appearance_count": len(fohenagh_ordered),
        "triples_added": triples_added,
        "triples_updated": triples_updated,
        "pack": str(PACK_PATH.relative_to(ROOT)),
        "queue": str(QUEUE_PATH.relative_to(ROOT)),
    }
    with LOG_PATH.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(log_entry, ensure_ascii=False) + "\n")

    print(json.dumps({
        "appearance_count": len(all_appearance_ids),
        "unverified_player_count": len(unverified_players),
        "fohenagh_linked_appearance_count": len(fohenagh_ordered),
        "players_created": len(players_created),
        "players_downgraded": len(players_downgraded),
        "hold_appearances": len(set(hold_appearance_ids)),
        "triples_added": triples_added,
        "triples_updated": triples_updated,
        "sample_appearance_ids": pack["sample_appearance_ids"],
        "niall_glynn": by_row.get("appearance:niall-glynn-minor-2019"),
        "joe_canning_conf": by_row.get("player:joe-canning", {}).get("confidence"),
        "cathal_mannion_conf": by_row.get("player:cathal-mannion", {}).get("confidence"),
        "niall_glynn_player_conf": by_row.get("player:niall-glynn", {}).get("confidence"),
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
