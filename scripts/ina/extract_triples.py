#!/usr/bin/env python3
"""INA excerpt → proposed Match/Club/Player triples (no invented scores).

Paste OCR / short fair-use excerpt text. Emits JSON lines matching
pending-triples.schema.json. Full article bodies must never be written to
the public seed or pending queue.

Usage:
  python3 scripts/ina/extract_triples.py --text "..." --paper "Tuam Herald" \\
    --date 1959-09-05 --url "https://..." --competition "Galway SHC" --season 1959

  python3 scripts/ina/extract_triples.py --text-file excerpt.txt ... --append data/ina-queue/pending.jsonl
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Goals-points: 2-8, 1-11, 0-22, etc.
SCORE_TOKEN = r"([0-9]{1,2}\s*-\s*[0-9]{1,3})"
# "Fohenagh 2-8 Castlegar 1-11" / "Fohenagh 2-8, Castlegar 1-11"
SCORE_PAIR = re.compile(
    rf"(?P<home_name>[A-Za-zÁÉÍÓÚáéíóú'’.\- ]{{2,40}}?)\s+"
    rf"(?P<home_score>{SCORE_TOKEN})"
    rf"\s*[,;]?\s+"
    rf"(?P<away_name>[A-Za-zÁÉÍÓÚáéíóú'’.\- ]{{2,40}}?)\s+"
    rf"(?P<away_score>{SCORE_TOKEN})",
    re.IGNORECASE,
)
# Results-line style: "Galway S.H. Fohenagh 2-8 Castlegar 1-11"
DRAW_HINT = re.compile(r"\bdraw(?:n)?\b|\bfitting result\b", re.IGNORECASE)

KNOWN_CLUBS: list[tuple[str, str]] = [
    # Longer / priority names first for matching
    ("Ahascragh-Fohenagh", "club:ahascragh-fohenagh"),
    ("Ahascragh Fohenagh", "club:ahascragh-fohenagh"),
    ("Kilnadeema-Leitrim", "club:kilnadeema-leitrim"),
    ("Meelick-Eyrecourt", "club:meelick-eyrecourt"),
    ("Oranmore-Maree", "club:oranmore-maree"),
    ("Tynagh-Abbey/Duniry", "club:tynagh-abbey-duniry"),
    ("Tynagh-Abbey Duniry", "club:tynagh-abbey-duniry"),
    ("Micheál Breathnach", "club:micheal-breathnach"),
    ("Micheal Breathnach", "club:micheal-breathnach"),
    ("Pádraig Pearses", "club:padraig-pearses"),
    ("Padraig Pearses", "club:padraig-pearses"),
    ("Tommy Larkins", "club:tommy-larkins"),
    ("Liam Mellows", "club:liam-mellows"),
    ("St Thomas'", "club:st-thomas"),
    ("St. Thomas'", "club:st-thomas"),
    ("St Thomas", "club:st-thomas"),
    ("Abbeyknockmoy", "club:abbeyknockmoy"),
    ("Ballinderreen", "club:ballinderreen"),
    ("Clarinbridge", "club:clarinbridge"),
    ("Killimordaly", "club:killimordaly"),
    ("Turloughmore", "club:turloughmore"),
    ("Cappataggle", "club:cappataggle"),
    ("Craughwell", "club:craughwell"),
    ("Castlegar", "club:castlegar"),
    ("Portumna", "club:portumna"),
    ("Sarsfields", "club:sarsfields"),
    ("Loughrea", "club:loughrea"),
    ("Killimor", "club:killimor"),
    ("Kiltormer", "club:kiltormer"),
    ("Ardrahan", "club:ardrahan"),
    ("Ahascragh", "club:ahascragh-historic"),
    ("Fohenagh", "club:fohenagh-historic"),
    ("Athenry", "club:athenry"),
    ("Kinvara", "club:kinvara"),
    ("Mullagh", "club:mullagh"),
    ("Beagh", "club:beagh"),
    ("Gort", "club:gort"),
]


def slugify(s: str) -> str:
    s = s.lower().strip()
    s = s.replace("'", "").replace("'", "").replace(".", "")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "unknown"


def norm_score(token: str) -> str:
    parts = re.split(r"\s*-\s*", token.strip())
    return f"{int(parts[0])}-{int(parts[1])}"


def resolve_club(name: str) -> dict[str, str]:
    cleaned = " ".join(name.split()).strip(" ,;")
    lower = cleaned.lower()
    for label, cid in KNOWN_CLUBS:
        if label.lower() == lower:
            return {"id": cid, "name": label}
    # substring / contains (prefer longest already ordered)
    for label, cid in KNOWN_CLUBS:
        if label.lower() in lower or lower in label.lower():
            return {"id": cid, "name": label}
    return {"id": f"club:{slugify(cleaned)}", "name": cleaned}


def find_clubs_mentioned(text: str) -> list[dict[str, str]]:
    found: list[dict[str, str]] = []
    seen: set[str] = set()
    for label, cid in KNOWN_CLUBS:
        if re.search(rf"\b{re.escape(label)}\b", text, re.IGNORECASE):
            if cid not in seen:
                seen.add(cid)
                found.append({"id": cid, "name": label, "role": "mentioned"})
    return found


def score_result(home: str, away: str, text: str) -> str:
    if DRAW_HINT.search(text):
        # only call draw if scores equal OR explicit draw language with equal scores
        if home == away:
            return "draw"
    hg, hp = map(int, home.split("-"))
    ag, ap = map(int, away.split("-"))
    ht, at = hg * 3 + hp, ag * 3 + ap
    if ht > at:
        return "home_win"
    if at > ht:
        return "away_win"
    return "draw"


def proposed_match_id(season: str | int, competition: str, clubs: list[dict[str, Any]]) -> str:
    grade = slugify(competition)[:48]
    club_part = "-".join(slugify(c["name"]) for c in clubs[:2]) or "unknown"
    return f"match:{season}-{grade}-{club_part}"


def extract(
    text: str,
    *,
    paper: str,
    date: str,
    url: str,
    competition: str,
    season: str | int,
    batch_id: str | None,
    snippet_note: str | None,
) -> list[dict[str, Any]]:
    text = text.strip()
    if not text:
        return []

    # Guard: refuse huge pastes that look like full articles
    if len(text) > 4000:
        raise SystemExit(
            "Refusing extract: pasted text > 4000 chars. Use a short excerpt / "
            "results line only — never full copyrighted article bodies."
        )

    now = datetime.now(timezone.utc).isoformat()
    note = snippet_note or (text[:240] + ("…" if len(text) > 240 else ""))
    cite = {"url": url, "snippet_note": note}
    m = re.search(r"[?&]d=([A-Za-z0-9.]+)", url)
    if m:
        cite["ina_doc_id"] = m.group(1)

    records: list[dict[str, Any]] = []
    used_spans: list[tuple[int, int]] = []

    for m in SCORE_PAIR.finditer(text):
        home_name = m.group("home_name").strip()
        away_name = m.group("away_name").strip()
        # skip if "home_name" looks like competition boilerplate
        if len(home_name) < 2 or len(away_name) < 2:
            continue
        if re.search(r"\b(galway|championship|hurling|league|senior|junior)\b", home_name, re.I) and len(home_name.split()) > 3:
            # likely captured too much; try last 1–3 tokens
            toks = home_name.split()
            home_name = " ".join(toks[-3:]) if len(toks) > 3 else home_name

        home_score = norm_score(m.group("home_score"))
        away_score = norm_score(m.group("away_score"))
        home = resolve_club(home_name)
        away = resolve_club(away_name)
        home["role"] = "home"
        away["role"] = "away"
        result = score_result(home_score, away_score, text)
        if result == "home_win":
            winner_role = "home"
        elif result == "away_win":
            winner_role = "away"
        else:
            winner_role = None
        clubs = [home, away]
        # annotate winner as extra role on winning club object (schema allows one role;
        # keep home/away and note winner in score.result)
        mid = proposed_match_id(season, competition, clubs)
        as_stated = f"{home['name']} {home_score} {away['name']} {away_score}"
        rec: dict[str, Any] = {
            "entity_kind": "match",
            "match_id": mid,
            "clubs": clubs,
            "score": {
                "home": home_score,
                "away": away_score,
                "as_stated": as_stated,
                "result": result,
            },
            "competition": competition,
            "season": int(season) if str(season).isdigit() else season,
            "paper": paper,
            "date": date,
            "cite": cite,
            "verification_status": "unverified",
            "extracted_at": now,
            "notes": "Score taken only from clearly stated excerpt; pending dual-source/Archivist.",
        }
        if batch_id:
            rec["batch_id"] = batch_id
        if winner_role:
            rec["notes"] += f" Provisional result={result} from stated scores."
        records.append(rec)
        used_spans.append(m.span())

    # If no score pair found: still emit a club/match mention stub WITHOUT score
    if not records:
        mentioned = find_clubs_mentioned(text)
        if len(mentioned) >= 1:
            clubs = mentioned[:2]
            mid = proposed_match_id(season, competition, clubs)
            rec = {
                "entity_kind": "match",
                "match_id": mid,
                "clubs": clubs,
                "score": None,
                "competition": competition,
                "season": int(season) if str(season).isdigit() else season,
                "paper": paper,
                "date": date,
                "cite": cite,
                "verification_status": "unverified",
                "extracted_at": now,
                "notes": "No clear score in excerpt — score omitted (not invented).",
            }
            if batch_id:
                rec["batch_id"] = batch_id
            records.append(rec)
        else:
            # nothing structured — still refuse to invent; return empty with stderr hint
            print(
                "No club names or clear score lines found; emitting nothing "
                "(refusing to invent).",
                file=sys.stderr,
            )

    return records


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument("--text", help="Pasted OCR / excerpt text")
    src.add_argument("--text-file", type=Path, help="File containing excerpt text")
    p.add_argument("--paper", required=True)
    p.add_argument("--date", required=True, help="Article date YYYY-MM-DD (or YYYY)")
    p.add_argument("--url", required=True, help="Cite URL (INA permalink)")
    p.add_argument("--competition", required=True)
    p.add_argument("--season", required=True)
    p.add_argument("--batch-id", default=None)
    p.add_argument("--snippet-note", default=None, help="Override short cite note")
    p.add_argument(
        "--append",
        type=Path,
        default=None,
        help="Append JSONL lines to this path (e.g. data/ina-queue/pending.jsonl)",
    )
    args = p.parse_args()

    text = args.text if args.text is not None else args.text_file.read_text(encoding="utf-8")
    records = extract(
        text,
        paper=args.paper,
        date=args.date,
        url=args.url,
        competition=args.competition,
        season=args.season,
        batch_id=args.batch_id,
        snippet_note=args.snippet_note,
    )

    out = "".join(json.dumps(r, ensure_ascii=False) + "\n" for r in records)
    if args.append:
        args.append.parent.mkdir(parents=True, exist_ok=True)
        with args.append.open("a", encoding="utf-8") as f:
            f.write(out)
        print(f"Appended {len(records)} record(s) to {args.append}", file=sys.stderr)
    sys.stdout.write(out)


if __name__ == "__main__":
    main()
