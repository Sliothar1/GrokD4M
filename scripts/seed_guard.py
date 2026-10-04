#!/usr/bin/env python3
"""Seed guard: stop a PR from wiping or shrinking the HurlingWiki data files.

Fails when:
  (a) data/seed.json or data/article-uploads.json (head) is not valid JSON;
  (b) distinct type=player rows in seed.json drop below the base count;
  (c) any article-uploads id present on base is missing on head (append-only).
(b) and (c) can be overridden with the PR label "seed-shrink-approved".

Stdlib only (no npm / pip). Usage, comparing two git revisions in a checkout:
  python3 scripts/seed_guard.py --base-rev BASE --head-rev HEAD [--labels '["x"]']
or comparing files directly:
  python3 scripts/seed_guard.py --base-seed A --head-seed B --base-uploads C --head-uploads D
Writes a markdown report to $GITHUB_STEP_SUMMARY when set.
"""
import argparse
import json
import os
import subprocess
import sys

SEED = "data/seed.json"
UPLOADS = "data/article-uploads.json"
OVERRIDE_LABEL = "seed-shrink-approved"


def read_rev(rev, path):
    """Return file text at a git revision, or None if the path doesn't exist there."""
    try:
        return subprocess.run(
            ["git", "show", f"{rev}:{path}"], check=True, capture_output=True
        ).stdout.decode("utf-8")
    except subprocess.CalledProcessError:
        return None


def read_file(path):
    if path is None or not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as f:
        return f.read()


def parse(text):
    """(data, error) — error is a short string when the text isn't valid JSON."""
    if text is None:
        return None, "file missing"
    try:
        return json.loads(text), None
    except json.JSONDecodeError as e:
        return None, f"invalid JSON: {e.msg} at line {e.lineno} col {e.colno}"


def seed_cells(seed):
    if isinstance(seed, list):
        return seed
    if isinstance(seed, dict):
        for key in ("cells", "rows", "data"):
            if isinstance(seed.get(key), list):
                return seed[key]
    return None


def player_ids(seed):
    """Distinct row ids that have a type=player cell."""
    cells = seed_cells(seed)
    if cells is None:
        return None
    return {
        c.get("row")
        for c in cells
        if isinstance(c, dict) and c.get("col") == "type" and c.get("val") == "player"
    }


def upload_ids(uploads):
    rows = uploads
    if isinstance(uploads, dict):
        rows = uploads.get("uploads") or uploads.get("items")
    if not isinstance(rows, list):
        return None
    return [r.get("id") for r in rows if isinstance(r, dict) and r.get("id")]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-rev")
    ap.add_argument("--head-rev")
    ap.add_argument("--base-seed")
    ap.add_argument("--head-seed")
    ap.add_argument("--base-uploads")
    ap.add_argument("--head-uploads")
    ap.add_argument("--labels", default=os.environ.get("PR_LABELS", "[]"),
                    help="JSON list of PR label names")
    a = ap.parse_args()

    if a.base_rev or a.head_rev:
        base_seed_t = read_rev(a.base_rev, SEED)
        base_up_t = read_rev(a.base_rev, UPLOADS)
        head_seed_t = read_rev(a.head_rev, SEED)
        head_up_t = read_rev(a.head_rev, UPLOADS)
    else:
        base_seed_t, base_up_t = read_file(a.base_seed), read_file(a.base_uploads)
        head_seed_t, head_up_t = read_file(a.head_seed), read_file(a.head_uploads)

    try:
        labels = json.loads(a.labels) if a.labels else []
    except json.JSONDecodeError:
        labels = [x.strip() for x in a.labels.split(",") if x.strip()]
    override = OVERRIDE_LABEL in labels

    failures, overridden, notes = [], [], []

    head_seed, e1 = parse(head_seed_t)
    head_up, e2 = parse(head_up_t)
    if e1:
        failures.append(f"`{SEED}` on head: {e1}")
    if e2:
        failures.append(f"`{UPLOADS}` on head: {e2}")

    base_seed, be1 = parse(base_seed_t)
    base_up, be2 = parse(base_up_t)
    if be1:
        notes.append(f"`{SEED}` on base: {be1} — player comparison skipped")
    if be2:
        notes.append(f"`{UPLOADS}` on base: {be2} — append-only comparison skipped")

    bp = player_ids(base_seed) if base_seed is not None else None
    hp = player_ids(head_seed) if head_seed is not None else None
    if head_seed is not None and hp is None:
        failures.append(f"`{SEED}` on head: unexpected shape (expected a list of row/col/val cells)")
    bu = upload_ids(base_up) if base_up is not None else None
    hu = upload_ids(head_up) if head_up is not None else None
    if head_up is not None and hu is None:
        failures.append(f"`{UPLOADS}` on head: unexpected shape (expected a list of rows with id)")

    lost_players = []
    if bp is not None and hp is not None:
        lost_players = sorted(bp - hp)
        if len(hp) < len(bp):
            msg = f"player count dropped {len(bp)} → {len(hp)} (−{len(bp) - len(hp)})"
            (overridden if override else failures).append(msg)
        elif lost_players:
            notes.append(f"{len(lost_players)} base player id(s) no longer typed player "
                         f"(count did not drop): {', '.join(lost_players[:10])}")

    missing_uploads = []
    if bu is not None and hu is not None:
        hs = set(hu)
        missing_uploads = [i for i in bu if i not in hs]
        if missing_uploads:
            msg = (f"{len(missing_uploads)} article-upload id(s) from base missing on head: "
                   + ", ".join(missing_uploads[:10]) + (" …" if len(missing_uploads) > 10 else ""))
            (overridden if override else failures).append(msg)
        dup = len(hu) - len(hs)
        if dup:
            notes.append(f"{dup} duplicate article-upload id(s) on head")

    def n(x):
        return "?" if x is None else str(len(x))

    lines = [
        "## Seed guard",
        "",
        "| | base | head |",
        "|---|---:|---:|",
        f"| players (distinct type=player) | {n(bp)} | {n(hp)} |",
        f"| article uploads | {n(bu)} | {n(hu)} |",
        f"| seed cells | {n(seed_cells(base_seed) if base_seed is not None else None)} "
        f"| {n(seed_cells(head_seed) if head_seed is not None else None)} |",
        "",
        f"Players {n(bp)} → {n(hp)} · Uploads {n(bu)} → {n(hu)}",
        "",
    ]
    if failures:
        lines.append("### ❌ Failed")
        lines += [f"- {f}" for f in failures]
        if any("dropped" in f or "missing on head" in f for f in failures):
            lines.append(f"\nIf this shrink is intended and Soft-PASSed, add the PR label "
                         f"`{OVERRIDE_LABEL}` and re-run.")
    if overridden:
        lines.append(f"### ⚠️ Allowed by label `{OVERRIDE_LABEL}`")
        lines += [f"- {f}" for f in overridden]
    if notes:
        lines.append("### Notes")
        lines += [f"- {x}" for x in notes]
    if not failures:
        lines.append("### ✅ Passed")
    report = "\n".join(lines) + "\n"

    print(report)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write(report)
    for f in failures:
        print(f"::error title=Seed guard::{f}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
