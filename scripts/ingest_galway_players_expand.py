#!/usr/bin/env python3
"""Ingest Galway All-Ireland HURLING panel players + club player_links into seed.

Source of truth for panels:
  https://www.galwaygaa.ie/history/all-ireland-winning-teams/
Hurling sections only (SHC / Minor / U-21 / Intermediate). No football.
Never invent scores/medals/positions. Skip mascots and labeled managers/coaches.
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
PACK_PATH = ROOT / "data" / "pack-galway-players-expand.json"
LOG_PATH = ROOT / "data" / "ingest-log.jsonl"

SOURCE_URL = "https://www.galwaygaa.ie/history/all-ireland-winning-teams/"

CLUB_FILES = [
    ROOT / "data" / "club-fohenagh.json",
    ROOT / "data" / "club-ahascragh.json",
    ROOT / "data" / "club-portumna.json",
    ROOT / "data" / "club-sarsfields.json",
    ROOT / "data" / "club-ballymacward.json",
]

# Club display name (as on 2019 minor captions) → club id
CLUB_NAME_TO_ID = {
    "Clarinbridge": "club:clarinbridge",
    "Athenry": "club:athenry",
    "Ahascragh-Fohenagh": "club:ahascragh-fohenagh",
    "Loughrea": "club:loughrea",
    "Tommy Larkins": "club:tommy-larkins",
    "Ballygar": "club:ballygar",
    "Carnmore": "club:carnmore",
    "Craughwell": "club:craughwell",
    "Ardrahan": "club:ardrahan",
    "Portumna": "club:portumna",
    "Castlegar": "club:castlegar",
    "Gort": "club:gort",
    "Turloughmore": "club:turloughmore",
    "Kilnadeema-Leitrim": "club:kilnadeema-leitrim",
    "Moycullen": "club:moycullen",
    "Oranmore-Maree": "club:oranmore-maree",
    "Cappataggle": "club:cappataggle",
    "Ballinderreen": "club:ballinderreen",
    "Michael Cusacks": "club:michael-cusacks",
    "Mountbellew-Moylough": "club:mountbellew-moylough",
    "Sarsfields": "club:sarsfields",
    "Kilconieron": "club:kilconieron",
    "St Thomas'": "club:st-thomas",
    "St Thomas": "club:st-thomas",
    "Pádraig Pearses": "club:padraig-pearses",
    "Padraig Pearses": "club:padraig-pearses",
    "Ahascragh": "club:ahascragh-historic",
    "Fohenagh": "club:fohenagh-historic",
}

# Minimal new clubs only when a panel/club-link needs an id not already in seed
NEW_CLUBS = {
    "club:michael-cusacks": {
        "name": "Michael Cusacks",
        "alias": "Michael Cusack's, Michael Cusacks Galway",
        "notable": "Galway hurling club; named on Galway GAA All-Ireland Minor Hurling Champions 2019 panel captions.",
    },
    "club:mountbellew-moylough": {
        "name": "Mountbellew-Moylough",
        "alias": "Mountbellew/Moylough, Mountbellew Moylough",
        "notable": "Galway club; named on Galway GAA All-Ireland Minor Hurling Champions 2019 panel captions.",
    },
}

# Matching-only token aliases (do not invent merges beyond known spelling variants)
TOKEN_ALIASES = {
    "padraig": "padraic",
    "padraic": "padraic",
    "fearghal": "fergal",
    "fergal": "fergal",
    "tuohey": "tuohy",
    "tuohy": "tuohy",
    "seán": "sean",
    "sean": "sean",
}

SKIP_NAME_PATTERNS = [
    re.compile(r"^mascot\b", re.I),
    re.compile(r"\bmascot\b", re.I),
]

SKIP_EXACT_NORM = {
    "nigel murray",
    "niger murray",
}


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower().strip()
    s = s.replace("'", "").replace("'", "").replace("'", "").replace(".", "")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "unknown"


def accent_fold(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    return "".join(c for c in s if not unicodedata.combining(c))


def norm_name(s: str) -> str:
    s = accent_fold(s).lower()
    s = s.replace("'", "").replace("'", "").replace("'", "")
    s = re.sub(r"[^a-z0-9\s]+", " ", s)
    tokens = [TOKEN_ALIASES.get(t, t) for t in s.split() if t]
    return " ".join(tokens)


def triple(row: str, col: str, val) -> dict:
    return {"row": row, "col": col, "val": val}


def p(name: str, club_name: str | None = None, club_id: str | None = None) -> dict:
    d: dict = {"name": name}
    if club_id:
        d["club_id"] = club_id
    elif club_name:
        d["club_name"] = club_name
    return d


# ---------------------------------------------------------------------------
# Curated HURLING panels (Galway GAA All-Ireland winning teams page)
# Each entry: name, optional club_name / club_id
# ---------------------------------------------------------------------------
PANELS: list[dict] = [
    {
        "year": 1923,
        "grade": "Senior",
        "label": "All-Ireland Senior Hurling Champions 1923",
        "players": [
            p("Fr Larkin"), p("Tom Kenny"),
            p("Jack Berry"), p("Paddy Hurney"), p("Berne Gibbs"), p("Mick Dervan"),
            p("Dick Morrissey"), p("Staff Garvey"), p("Jim Power"),
            p("Andy Kelly"), p("Jim Morris"), p("Mick Kenny"), p("Martin King"),
            p("Tom Flemming"),
            p("Leonard Martin"), p("Ignatius Harney"),
            p("N Gilmartin"), p("Mick Gill"), p("Junior Mahoney"),
        ],
    },
    {
        "year": 1980,
        "grade": "Senior",
        "label": "All-Ireland Senior Hurling Champions 1980",
        "players": [
            p("Conor Hayes"), p("Steve Mahon"), p("John Connolly"), p("Michael Connolly"),
            p("Michael Conneely"), p("Frank Burke"), p("Noel Lane"), p("Sean Silke"),
            p("Niall McInerney"), p("Seamus Coen"), p("Jimmy Cooney"), p("Joe Connolly"),
            p("Sylvie Linnane"), p("P J Molloy"), p("Bernie Forde"),
        ],
    },
    {
        "year": 1987,
        "grade": "Senior",
        "label": "All-Ireland Senior Hurling Champions 1987",
        "players": [
            p("Brendan Lynskey"), p("Pete Finnerty"), p("Steve Mahon"), p("John Commins"),
            p("Tony Keady"), p("Martin Naughton"), p("Ollie Kilkenny"),
            p("Joe Cooney"), p("Pat Malone"), p("Michael McGrath"), p("Sylvie Linnane"),
            p("Conor Hayes"), p("Anthony Cunningham"), p("Gerry McInerney"), p("Eanna Ryan"),
            # skip mascot Nigel Murray
        ],
    },
    {
        "year": 1988,
        "grade": "Senior",
        "label": "All-Ireland Senior Hurling Champions 1988",
        "players": [
            p("Brendan Lynskey"), p("Pete Finnerty"), p("Michael Coleman"),
            p("Anthony Cunningham"), p("John Commins"), p("Tony Keady"),
            p("Martin Naughton"), p("Pat Malone"),
            p("Michael McGrath"), p("Joe Cooney"), p("Conor Hayes"), p("Sylvie Linnane"),
            p("Gerry McInerney"), p("Ollie Kilkenny"), p("Eanna Ryan"),
            # skip mascot Niger Murray
        ],
    },
    {
        "year": 2017,
        "grade": "Senior",
        "label": "All-Ireland Senior Hurling Champions 2017",
        "players": [
            p("Paul Flaherty"), p("Padraig Breheny"), p("Davy Glennon"), p("Daithi Burke"),
            p("Jason Flynn"), p("Joseph Cooney"), p("Eanna Burke"), p("Conor Whelan"),
            p("Colm Callanan"), p("Conor Cooney"), p("Niall Burke"), p("James Skehill"),
            p("Shane Moloney"), p("Greg Lally"), p("Gearóid McInerney"), p("Joe Canning"),
            p("Matt Donohue"), p("Brian Molloy"),
            p("Gavin Lally"), p("Cyril Donnellan"), p("Jonathan Glynn"), p("Ronán Burke"),
            p("Aidan Harte"), p("Sean Loftus"), p("David Burke"), p("Cathal Mannion"),
            p("John Hanbury"), p("Adrian Tuohey"), p("Padraic Mannion"), p("Johnny Coen"),
            p("Thomas Monaghan"), p("Jack Grealish"), p("Brian Flaherty"), p("Martin Dolphin"),
        ],
    },
    # --- Minor ---
    {
        "year": 1983,
        "grade": "Minor",
        "label": "All-Ireland Minor Hurling Champions 1983",
        "players": [
            p("Declan Jenning"), p("Sean Keane"), p("Tom Monaghan"), p("John Commins"),
            p("Tom Maloney"), p("Pakie Dervan"), p("John Joe Broderick"), p("Sean Treacy"),
            p("Pat Higgins"), p("Gerry McInerney"), p("Pat Malone"), p("Anthony Cunningham"),
            p("Martin Killeen"), p("Padraig Brehony"), p("Joe Cooney"),
        ],
    },
    {
        "year": 1992,
        "grade": "Minor",
        "label": "All-Ireland Minor Hurling Champions 1992",
        "players": [
            p("Sean Corcoran"), p("Colm O'Doherty"), p("Michael Spellman"), p("Liam Donoghue"),
            p("Cathal Moore"), p("Shane Walsh"), p("Kevin Donoghue"),
            p("Declan Walsh"), p("Michael Lynskey"), p("Nigel Shaughnessy"), p("Peter Kelly"),
            p("Conor O'Donovan"), p("Tom Healy"), p("Michael Donoghue"), p("Francis Forde"),
            p("Dara Coen"),
        ],
    },
    {
        "year": 1994,
        "grade": "Minor",
        "label": "All-Ireland Minor Hurling Champions 1994",
        "players": [
            p("Finbar Gantley"), p("Ollie Canning"), p("Peter Huban"), p("Liam Hogan"),
            p("Michael Healy"), p("Alan Kerins"), p("Ronan Farrell"), p("Gordon Glynn"),
            p("Kevin Broderick"), p("Fergal Healy"), p("Eddie Brady"), p("Gregory Kennedy"),
            p("Damien Fahy"), p("Liam Madden"), p("Rory Gantley"),
        ],
    },
    {
        "year": 1999,
        "grade": "Minor",
        "label": "All-Ireland Minor Hurling Champions 1999",
        "players": [
            p("Brian O'Mahony"), p("Damien Hayes"), p("Hugh Whirskey"), p("Fergal Moore"),
            p("Conor Dervan"), p("Michael John Quinn"), p("Ger Farragher"), p("Michael Coughlan"),
            p("Kevin Brady"), p("David Forde"), p("Richard Murray"), p("Ronan Reilly"),
            p("John Culkin"), p("Johnny O'Loughlin"), p("Cathal Coen"),
        ],
    },
    {
        "year": 2000,
        "grade": "Minor",
        "label": "All-Ireland Minor Hurling Champions 2000",
        "players": [
            p("Brian Mahoney"), p("Damien Hayes"), p("Niall Corcoran"), p("Aidan Diviney"),
            p("Adrian Diviney"), p("Barry Coen"), p("Peter Garvey"), p("Ger Farragher"),
            p("Shane Kavanagh"), p("Adrian Cullinane"), p("Trevor Kavanagh"), p("Richard Murray"),
            p("David Greene"), p("Kevin Brady"), p("Tony Óg Regan"),
        ],
    },
    {
        "year": 2004,
        "grade": "Minor",
        "label": "All-Ireland Minor Hurling Champions 2004",
        "players": [
            p("Martin Ryan"), p("Paul Loughnane"), p("Ger Mahon"), p("Mark Herlihy"),
            p("John Lee"), p("Ciarán O'Donovan"), p("Joe Canning"), p("Andrew Keary"),
            p("John Hughes"), p("Kevin Joyce"), p("Kerril Wade"), p("David Kennedy"),
            p("Finian Coone"), p("Keith Kilkenny"), p("Barry Hanley"),
        ],
    },
    {
        "year": 2005,
        "grade": "Minor",
        "label": "All-Ireland Minor Hurling Champions 2005",
        "players": [
            p("Joe Canning"), p("Keith Kilkenny"), p("Sean Glynn"), p("Ciarán O'Donovan"),
            p("James Skehill"), p("John Greene"), p("Andrew Keary"),
            p("John Hughes"), p("Conor Kavanagh"), p("Brian Murphy"), p("Alan Callanan"),
            p("Alan Leech"), p("Paul Callanan"), p("Paul Loughnane"), p("Kevin Coen"),
        ],
    },
    {
        "year": 2009,
        "grade": "Minor",
        "label": "All-Ireland Minor Hurling Champions 2009",
        "players": [
            p("Shane Maloney"), p("Niall Burke"), p("Johnny Coen"), p("Fergal Flannery"),
            p("Joseph Cooney"), p("Ronan Badger"), p("Daithi Burke"),
            p("Brian Flaherty"), p("Matthew Keating"), p("Davy Glennon"), p("Conor Burke"),
            p("Richie Cummins"), p("Jason Grealish"), p("Donie Fox"), p("James Regan"),
        ],
    },
    {
        "year": 2011,
        "grade": "Minor",
        "label": "All-Ireland Minor Hurling Champions 2011",
        "players": [
            p("Darragh Cooney"), p("Darragh Dolan"), p("Sean Collins"), p("John O'Halloran"),
            p("Paul Flaherty"), p("Michael Mullins"), p("Killian Howe"), p("Cathal Mannion"),
            p("Sean Sweeney"), p("Barry Keane"), p("Jason Flynn"), p("John Hanbury"),
            p("Shane Lawless"), p("Padraic Mannion"), p("Jack Carr"), p("Jonathan Glynn"),
            p("Padraic Brehony"), p("Keelan Cullinane"),
            p("Darragh Burke"), p("Sean Hickey"), p("Kieran Morrissey"), p("Shane Caulfield"),
            p("Owen Teagle"), p("Michael Kelly"), p("Adrian Tuohy"), p("Shane Maloney"),
            p("Gerard O'Donoghue"), p("Billy Lane"), p("Paul Killeen"), p("Cormac Diviney"),
            p("Brian Molloy"),
        ],
    },
    {
        "year": 2015,
        "grade": "Minor",
        "label": "All-Ireland Minor Hurling Champions 2015",
        "players": [
            p("Conor Walsh"), p("Sean Bleahene"), p("Enda Fahey"), p("Donal Mannion"),
            p("Dylan Shaughnessy"), p("Martin McManus"), p("Brendan Lynch"), p("Darach Fahy"),
            p("Mark Gill"), p("Simon Thomas"), p("Diarmuid O'Brien"), p("Ronan Glennon"),
            p("John Fleming"), p("Conor Elwood"), p("T J Brennan"), p("Jack Canning"),
            p("Conor Lee"), p("Eamon Hickey"),
            p("Niall Coen"), p("Conor Molloy"), p("Sean McArdle"), p("Conor Caulfield"),
            p("Mark Kennedy"), p("Darren Morrissey"), p("Ben Moran"), p("Daniel Loftus"),
            p("Conor Fahy"), p("Caimin Killeen"), p("Shane Ryan"), p("David Jordan"),
            p("Daragh Conneely"), p("Enda Egan"), p("Evan Hunt"),
        ],
    },
    {
        # Page lists an identical 2017 minor caption to 2015; keep as curated source data.
        "year": 2017,
        "grade": "Minor",
        "label": "All-Ireland Minor Hurling Champions 2017",
        "players": [
            p("Conor Walsh"), p("Sean Bleahene"), p("Enda Fahey"), p("Donal Mannion"),
            p("Dylan Shaughnessy"), p("Martin McManus"), p("Brendan Lynch"), p("Darach Fahy"),
            p("Mark Gill"), p("Simon Thomas"), p("Diarmuid O'Brien"), p("Ronan Glennon"),
            p("John Fleming"), p("Conor Elwood"), p("T J Brennan"), p("Jack Canning"),
            p("Conor Lee"), p("Eamon Hickey"),
            p("Niall Coen"), p("Conor Molloy"), p("Sean McArdle"), p("Conor Caulfield"),
            p("Mark Kennedy"), p("Darren Morrissey"), p("Ben Moran"), p("Daniel Loftus"),
            p("Conor Fahy"), p("Caimin Killeen"), p("Shane Ryan"), p("David Jordan"),
            p("Daragh Conneely"), p("Enda Egan"), p("Evan Hunt"),
        ],
    },
    {
        "year": 2018,
        "grade": "Minor",
        "label": "All-Ireland Minor Hurling Champions 2018",
        "players": [
            p("Thomas Hayes"), p("Christy Brennan"), p("Liam O'Reilly"), p("Sean Neary"),
            p("Conor Flaherty"), p("Donal O'Shea"), p("Diarmuid Kilcommins"),
            p("Patrick Rabbitte"), p("Eoghan Geraghty"), p("Eoin Lawless"), p("Shane Morgan"),
            p("Shane Quirke"), p("Michael Flynn"), p("Connell Keane"), p("Adam Brett"),
            p("Niall Collins"), p("Sean Gardiner"), p("Jack Barrett"), p("John Cooney"),
            p("Darren Duggan"),
            p("Alex Conaire"),
            p("Oisin Flannery", club_name="St Thomas'"),
            p("Oisin Flannery", club_name="Pádraig Pearses"),
            p("Evan Duggan"), p("Keelan Creaven"), p("James O'Donoghue"), p("Dean Reilly"),
            p("Ian McGlynn"), p("Conor Cunningham"), p("Sean McDonagh"), p("Shane Jennings"),
            p("Oisin Salmon"), p("Mike Egan"), p("Enda Collins"), p("Cillian Callaghan"),
            p("Niall Flemming"),
        ],
    },
    {
        "year": 2019,
        "grade": "Minor",
        "label": "All-Ireland Minor Hurling Champions 2019",
        "players": [
            p("Gavin Lee", "Clarinbridge"), p("Mark Hardiman", "Athenry"),
            p("Niall Glynn", "Ahascragh-Fohenagh"), p("Christy Brennan", "Clarinbridge"),
            p("Shane Morgan", "Loughrea"), p("Conor Slattery", "Tommy Larkins"),
            p("Greg Thomas", "Ballygar"), p("Enda Collins", "Carnmore"),
            p("Eoin Lawless", "Athenry"), p("Ryan Howley", "Craughwell"),
            p("Ben O'Connor", "Ardrahan"), p("Declan McLoughlin", "Portumna"),
            p("Cillian Callaghan", "Castlegar"), p("Eoin Killeen", "Gort"),
            p("Sean O'Hanlon", "Turloughmore"), p("Colm Molloy", "Kilnadeema-Leitrim"),
            p("Éanna Davoren", "Moycullen"),
            p("Jack Linnane", "Gort"), p("Ruben Davitt", "Oranmore-Maree"),
            p("Liam Leen", "Clarinbridge"), p("Adam Nolan", "Kilnadeema-Leitrim"),
            p("Paddy Commins", "Gort"), p("Tiernan Killeen", "Loughrea"),
            p("Ian McGlynn", "Kilconieron"), p("Michael Egan", "Cappataggle"),
            p("Colm Cunningham", "Moycullen"), p("Oisín Slevin", "Ardrahan"),
            p("Luke Prendergast", "Ballinderreen"), p("Matthew Rosengrave", "Michael Cusacks"),
            p("Sean McDonagh", "Mountbellew-Moylough"), p("Alex Connaire", "Sarsfields"),
            p("John Cooney", "Sarsfields"),
        ],
    },
    {
        "year": 2020,
        "grade": "Minor",
        "label": "All-Ireland Minor Hurling Champions 2020",
        "players": [
            p("Daniel O'Flaherty"), p("Michael Walsh"), p("Nathan Gill"), p("Keith Burke"),
            p("Darragh Neary"), p("Michéal Power"), p("Darragh Walsh"), p("Adam Nolan"),
            p("Seán O'Hanlon"), p("Ronal Killilea"), p("Greg Thomas"), p("Liam Collins"),
            p("Patrick Burke"), p("Darren Shaughnessy"), p("Darragh Helebert"),
            p("Tiernan Killeen"), p("Adam Coyne"),
            p("Gavin Lee"), p("Lewis Coughlan"), p("Shane Morgan"), p("Matthew Tarpey"),
            p("Conor Slattery"), p("Seán Fox"), p("Liam Leen"), p("Diarmuid Davoren"),
            p("Tiernan Leen"), p("Colm Molloy"), p("Cian Regan"), p("Ruben Davitt"),
            p("Kieran Hanrahan"), p("Matthew O'Connor"),
        ],
    },
    # --- U-21 ---
    {
        "year": 1972,
        "grade": "U-21",
        "label": "All-Ireland U-21 Hurling Champions 1972",
        "players": [
            p("Gerry Kelly"), p("Gerry Glynn"), p("Gerry Holland"), p("Frank Donohue"),
            p("Andy Fenton"), p("Micheál Donohue"), p("Frank Burke"),
            p("Luke Glynn"), p("Liam Shiels"), p("Ned Campbell"), p("Michael Coen"),
            p("Iggy Clarke"), p("Tom Donohue"), p("Tony Brehony"), p("Marty Barrett"),
        ],
    },
    {
        "year": 1978,
        "grade": "U-21",
        "label": "All-Ireland U-21 Hurling Champions 1978",
        "players": [
            p("Conor Hayes"), p("Michael Headd"), p("Steve Mahon"), p("Gerry Kennedy"),
            p("Gerry Smith"), p("Mattie Conneely"), p("John Goode"), p("Seamus Coen"),
            p("John Ryan"), p("Fr Michael Kilkenny"), p("Michael Earls"), p("Pascal Ryan"),
            p("Bernard Forde"), p("Joe Greaney"), p("P J Burke"),
        ],
    },
    {
        "year": 1983,
        "grade": "U-21",
        "label": "All-Ireland U-21 Hurling Champions 1983",
        "players": [
            p("Brendan Dervan"), p("Pascal Healy"), p("Aidan Staunton"), p("Ollie Kilkenny"),
            p("Martin Donoghue"), p("Michael Costello"), p("Tony Keady"), p("Pete Finnerty"),
            p("Michael Coleman"), p("Gerry Burke"), p("John Murphy"), p("Tommy Coen"),
            p("Michael McGrath"), p("Peter Casserly"), p("Albert Moylan"),
        ],
    },
    {
        "year": 1986,
        "grade": "U-21",
        "label": "All-Ireland U-21 Hurling Champions 1986",
        "players": [
            p("Pat Higgins"), p("Michael Helebert"), p("Patrick Dervan"), p("Michael Connolly"),
            p("John Commins"), p("Martin Kelly"), p("Declan Jennings"), p("Pat Nolan"),
            p("Aodh Davoren"), p("Michael Flaherty"), p("Joe Cooney"), p("Pat Malone"),
            p("Anthony Cunningham"), p("Gerry McInerney"), p("Tom Monaghan"),
        ],
    },
    {
        "year": 1991,
        "grade": "U-21",
        "label": "All-Ireland U-21 Hurling Champions 1991",
        "players": [
            p("Justin Campbell"), p("Liam Burke"), p("Christy Helebert"), p("Richard Burke"),
            p("Joe Rabbitte"), p("Paul Hardiman"), p("Francis O'Brien"),
            p("Noel Power"), p("Basil Larkin"), p("Murty Killilea"), p("Noel Larkin"),
            p("Brendan Keogh"), p("Brian Feeney"), p("Gerry McGrath"), p("Cathal Moran"),
        ],
    },
    {
        "year": 1993,
        "grade": "U-21",
        "label": "All-Ireland U-21 Hurling Champions 1993",
        "players": [
            p("William Burke"), p("David Canning"), p("Tony Headd"), p("Joe McGrath"),
            p("Damien Coleman"), p("Morgan Darcy"), p("Michael Kerins"), p("Ronan Walsh"),
            p("Tony Kirwan"), p("Micheál Donoghue"), p("Maurice Headd"), p("Liam Burke"),
            p("Nigel Shaughnessy"), p("Francis Forde"), p("Peter Kelly"),
        ],
    },
    {
        "year": 1996,
        "grade": "U-21",
        "label": "All-Ireland U-21 Hurling Champions 1996",
        "players": [
            p("Gregory Kennedy"), p("Gordan Glynn"), p("Eugene Cloonan"), p("Vinny Maher"),
            p("Cathal Moore"), p("Peter Huban"), p("Liam Hodgins"), p("Fergal Healy"),
            p("Ollie Canning"), p("Donal Moran"), p("Kevin Broderick"), p("Michael Healy"),
            p("Ollie Fahy"), p("Alan Kerins"), p("Darragh Coen"),
        ],
    },
    {
        "year": 2005,
        "grade": "U-21",
        "label": "All-Ireland U-21 Hurling Champions 2005",
        "players": [
            p("Kevin Hynes"), p("Brian Costello"), p("Paul Flynn"), p("Kevin Briscoe"),
            p("Niall Healy"), p("Kerrill Wade"), p("Kenneth Burke"), p("Eanna Ryan"),
            p("Damien Kelly"), p("Mark Herlihy"),
            p("Aidan Ryan"), p("Cathal Dervan"), p("Aonghus Dervan"), p("Thomas Mannion"),
            p("Joe Gantley"), p("David Collins"), p("Alan Garvey"), p("Ger Mahon"),
            p("Barry Cullinane"), p("Brendan Lucas"), p("John Lee"), p("Paul Madden"),
            p("Mark Lane"),
            p("Martin Nestor"), p("Alan Gaynor"), p("Roderick Whyte"), p("Kevin Huban"),
            p("Finian Coone"), p("Don Reilly"), p("Niall Earls"),
        ],
    },
    {
        "year": 2007,
        "grade": "U-21",
        "label": "All-Ireland U-21 Hurling Champions 2007",
        "players": [
            p("Paul Loughnane"), p("Paul Callanan"), p("Enda Collins"), p("John Lee"),
            p("Sean Glynn"), p("James Skehill"), p("Martin Ryan"), p("Ciaran O'Connor"),
            p("Joe Canning"), p("Ger Mahon"), p("Andrew Keary"), p("Kevin Keane"),
            p("Paddy Cormican"), p("John Greene"), p("Enda Concannon"),
            p("Niall Forde"), p("Paul Madden"), p("Aidan Harte"), p("David Kennedy"),
            p("Keith Kilkenny"), p("Kerrill Wade"), p("Kevin Hynes"), p("Conor Kavanagh"),
            p("Finnian Coone"), p("Alan Leech"), p("Barry Hanley"), p("Noel Kelly"),
            p("Danny Whyte"), p("Benny Kenny"), p("Mark Herlihy"), p("Vinny Faherty"),
        ],
    },
    {
        "year": 2011,
        "grade": "U-21",
        "label": "All-Ireland U-21 Hurling Champions 2011",
        "players": [
            p("Conor McDonagh"), p("Gearoid McInerney"), p("Robert Mitchell"), p("Eoin Fahy"),
            p("Niall Quinn"), p("Colm Flynn"), p("Rory Foy"), p("Niall Donoghue"),
            p("Niall Burke"), p("Jamie Ryan"), p("Conor Cooney"), p("Jason Grealish"),
            p("Donal Cooney"), p("Paul Gordon"), p("Donal Fox"), p("Ronan Burke"),
            p("Stephen Page"), p("Martin Dolphin"), p("Richie Cummins"),
            p("Alan Armstrong"), p("David Burke"), p("Bernard Burke"), p("Tadgh Haran"),
            p("Declan Connolly"), p("Barry Daly"), p("Johnny Coen"), p("Fergal Flannery"),
            p("James Regan"), p("Ger O'Halloran"), p("John Brehony"), p("Davy Glennon"),
        ],
    },
    # --- Intermediate ---
    {
        "year": 1999,
        "grade": "Intermediate",
        "label": "All-Ireland Intermediate Hurling Champions 1999",
        "players": [
            # skip Michael Linnane (manager), Sean Silke (coach)
            p("Noel Murphy"), p("Noel Larkin"), p("Dermot Turley"), p("William Burke"),
            p("Michael Connolly"), p("Liam Hogan"), p("Gordon Glynn"), p("Declan O'Brien"),
            p("Pat Diviney"), p("Noel Power"), p("Justin Donnelly"), p("Endas Linnane"),
            p("Damien Joyce"), p("Niall Kelly"), p("Fergal Healy"),
        ],
    },
    {
        "year": 2002,
        "grade": "Intermediate",
        "label": "All-Ireland Intermediate Hurling Champions 2002",
        "players": [
            p("Brian Cloherty"), p("Paul Douraghan"), p("Eugene Gorman"), p("Richie Devaney"),
            p("Conor Dervan"), p("David Hayes"), p("Justin Donnelly"), p("Noel Murphy"),
            p("Gordon Glynn"), p("John Conroy"), p("Enda Tannian"), p("Justin Campbell"),
            p("Stephen Creaven"), p("Shane Tierney"), p("Trevor Cavanagh"), p("Aidan Diviney"),
            p("Joe Gantley"),
            p("Kenneth Burke"), p("Jason Lohan"), p("Martin Kelly"), p("Kieran Finnerty"),
            p("Benny Lawless"), p("Tony Óg Regan"), p("Brian Cunningham"), p("Shane McClaran"),
            p("Kevin Brady"), p("Roger Fahy"), p("Conor Ryan"), p("Ronan Reilly"),
            p("Brian Holland"), p("Cathal Dervan"), p("Adrian Diviney"),
        ],
    },
    {
        "year": 2015,
        "grade": "Intermediate",
        "label": "All-Ireland Intermediate Hurling Champions 2015",
        "players": [
            p("Tadhg Haran"), p("Paddy Hannon"), p("Paul Flaherty"), p("Jason Kennedy"),
            p("Shane Maloney"), p("Shane Cooney"), p("Darragh O'Donoghue"), p("Dean Higgins"),
            p("Adrian Tuohy"), p("David Concannon"), p("Ronan O'Meara"), p("Gearoid Loughnane"),
            p("Barry Keane"), p("Eamon Brannigan"), p("Brian Molloy"),
            p("Shane Caulfield"), p("Joe Keane"), p("Colm Flynn"), p("Darragh Burke"),
            p("Kevin McHugo"), p("James Skehill"), p("Daniel Nevin"), p("Eanna Burke"),
            p("Kevin Lane"), p("Declan Cronin"), p("Noel McDonagh"), p("Barry Daly"),
        ],
    },
]


def resolve_club_id(club_name: str | None, club_id: str | None) -> str | None:
    if club_id:
        return club_id
    if not club_name:
        return None
    if club_name in CLUB_NAME_TO_ID:
        return CLUB_NAME_TO_ID[club_name]
    # try accent-folded exact
    folded = {accent_fold(k): v for k, v in CLUB_NAME_TO_ID.items()}
    key = accent_fold(club_name)
    if key in folded:
        return folded[key]
    return f"club:{slugify(club_name)}"


def panel_note(label: str, year: int) -> str:
    return f"Named on Galway GAA {label} panel ({year})."


def should_skip_name(name: str) -> bool:
    cleaned = name.strip()
    if not cleaned or set(cleaned) <= set("-—–_ "):
        return True
    if norm_name(cleaned) in SKIP_EXACT_NORM:
        return True
    for pat in SKIP_NAME_PATTERNS:
        if pat.search(cleaned):
            return True
    low = cleaned.lower()
    if "(manager)" in low or "(coach)" in low or "(selector)" in low:
        return True
    return False


def clean_display_name(name: str) -> str:
    # strip trailing role tags already handled; keep Fr / initials
    name = re.sub(r"\s+", " ", name).strip(" ,;")
    name = re.sub(r"\s*\((?:captain|inset)[^)]*\)\s*", " ", name, flags=re.I)
    return re.sub(r"\s+", " ", name).strip()


def collect_panel_appearances() -> dict[str, dict]:
    """Group panel rows by a stable key.

    Same normalized name merges across panels unless two entries in the SAME
    panel carry different clubs (e.g. two Oisin Flannerys in 2018) — then
    club-suffixed keys keep them distinct.
    """
    # First pass: detect same-panel name collisions with differing clubs
    collision_keys: set[tuple[int, str]] = set()
    for panel in PANELS:
        by_norm: dict[str, set[str | None]] = defaultdict(set)
        for pl in panel["players"]:
            name = clean_display_name(pl["name"])
            if should_skip_name(name):
                continue
            cid = resolve_club_id(pl.get("club_name"), pl.get("club_id"))
            by_norm[norm_name(name)].add(cid)
        for nn, clubs in by_norm.items():
            nonempty = {c for c in clubs if c}
            if len(nonempty) >= 2:
                collision_keys.add((panel["year"], nn))

    grouped: dict[str, dict] = {}
    for panel in PANELS:
        label = panel["label"]
        year = panel["year"]
        grade = panel["grade"]
        for pl in panel["players"]:
            name = clean_display_name(pl["name"])
            if should_skip_name(name):
                continue
            cid = resolve_club_id(pl.get("club_name"), pl.get("club_id"))
            nn = norm_name(name)
            if (year, nn) in collision_keys and cid:
                key = f"{nn}||{cid}"
                pid = f"player:{slugify(name)}-{cid.split(':', 1)[-1]}"
            else:
                key = nn
                pid = f"player:{slugify(name)}"
            rec = grouped.get(key)
            note_bit = panel_note(label, year)
            if not rec:
                grouped[key] = {
                    "id": pid,
                    "name": name,
                    "norm": nn,
                    "club": cid,
                    "notes": [note_bit],
                    "years": [year],
                    "grades": [grade],
                    "source": SOURCE_URL,
                    "origin": "panel",
                }
            else:
                if note_bit not in rec["notes"]:
                    rec["notes"].append(note_bit)
                if year not in rec["years"]:
                    rec["years"].append(year)
                if grade not in rec["grades"]:
                    rec["grades"].append(grade)
                # Prefer an explicit club if we lacked one
                if not rec["club"] and cid:
                    rec["club"] = cid
    return grouped


def load_club_link_players() -> list[dict]:
    out: list[dict] = []
    for path in CLUB_FILES:
        data = json.loads(path.read_text(encoding="utf-8"))
        club_meta = data.get("club") or {}
        default_club = club_meta.get("id")
        # Ballymacward pack is Pádraig Pearses
        if path.name == "club-ballymacward.json":
            default_club = default_club or "club:padraig-pearses"
        if path.name == "club-fohenagh.json":
            default_club = default_club or "club:ahascragh-fohenagh"
        if path.name == "club-ahascragh.json":
            default_club = default_club or "club:ahascragh-historic"
        sources = data.get("sources") or {}

        links = data.get("player_links") or []
        # sarsfields uses player_season_club
        if not links and data.get("player_season_club"):
            links = [
                {
                    "name": x["name"],
                    "id": x.get("id"),
                    "role_or_link": x.get("note") or "Listed in Sarsfields club pack Player×Season→Club.",
                    "source_ids": ["archivist_pack", "wiki_sarsfields"],
                }
                for x in data["player_season_club"]
            ]
            sources = data.get("sources") or sources

        for link in links:
            raw_name = link.get("name") or ""
            # "Frank Nolan / Frankie Nolan" → primary before slash
            name = clean_display_name(raw_name.split("/")[0].strip())
            if should_skip_name(name):
                continue
            pid = link.get("id") or f"player:{slugify(name)}"
            club = default_club
            note = link.get("role_or_link") or link.get("note") or f"Listed in {path.name} player_links."
            # pick first source with a url
            src_url = None
            for sid in link.get("source_ids") or []:
                s = sources.get(sid) or {}
                if s.get("url"):
                    src_url = s["url"]
                    break
            if not src_url:
                # any source url
                for s in sources.values():
                    if isinstance(s, dict) and s.get("url"):
                        src_url = s["url"]
                        break
            if not src_url:
                src_url = SOURCE_URL
            out.append(
                {
                    "id": pid,
                    "name": name,
                    "norm": norm_name(name),
                    "club": club,
                    "notes": [note],
                    "source": src_url,
                    "origin": "club_link",
                    "pack_file": path.name,
                }
            )
    return out


def index_seed(seed: list[dict]) -> tuple[dict[str, dict], dict[str, str], set[str]]:
    by_row: dict[str, dict] = defaultdict(dict)
    for t in seed:
        by_row[t["row"]][t["col"]] = t["val"]
    players = {r: attrs for r, attrs in by_row.items() if attrs.get("type") == "player"}
    norm_to_id: dict[str, str] = {}
    for pid, attrs in players.items():
        nn = norm_name(attrs.get("name") or "")
        if nn and nn not in norm_to_id:
            norm_to_id[nn] = pid
    club_ids = {r for r, attrs in by_row.items() if attrs.get("type") == "club"}
    return players, norm_to_id, club_ids


def merge_note(existing_notes: list[str]) -> str:
    # Keep concise; join unique panel notes
    return " ".join(existing_notes)


def main() -> None:
    seed: list[dict] = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    before_players, norm_to_id, club_ids = index_seed(seed)
    before_count = len(before_players)
    existing_ids = set(before_players.keys())
    existing_pairs = {(t["row"], t["col"]) for t in seed}

    panel_map = collect_panel_appearances()
    club_links = load_club_link_players()

    # Merge club links into candidates: panels take precedence for note/source;
    # club links fill club when missing and add players not on panels.
    candidates: dict[str, dict] = dict(panel_map)

    for link in club_links:
        nn = link["norm"]
        # Prefer matching an existing panel candidate by norm (unless club-disambiguated id)
        matched_key = None
        if link["id"] in {c["id"] for c in candidates.values()}:
            matched_key = next(k for k, c in candidates.items() if c["id"] == link["id"])
        elif nn in candidates:
            matched_key = nn
        else:
            # match disambiguated keys that share norm and club
            for k, c in candidates.items():
                if c["norm"] == nn and (not link["club"] or not c["club"] or c["club"] == link["club"]):
                    matched_key = k
                    break

        if matched_key is not None:
            rec = candidates[matched_key]
            if not rec.get("club") and link.get("club"):
                rec["club"] = link["club"]
            # do not overwrite All-Ireland source/notes with club blurbs
            continue

        # New from club links only
        candidates[f"clublink::{nn}::{link['id']}"] = link

    new_player_ids: list[str] = []
    skipped_existing: list[str] = []
    clubs_created: list[str] = []
    triples_added = 0
    fohenagh_related_new: list[str] = []

    def append_triple(row: str, col: str, val) -> bool:
        nonlocal triples_added
        key = (row, col)
        if key in existing_pairs:
            return False
        seed.append(triple(row, col, val))
        existing_pairs.add(key)
        triples_added += 1
        return True

    # Create minimal clubs first if needed
    needed_clubs = {c.get("club") for c in candidates.values() if c.get("club")}
    for cid in sorted(x for x in needed_clubs if x):
        if cid in club_ids:
            continue
        meta = NEW_CLUBS.get(cid)
        if not meta:
            # auto-minimal from id
            meta = {
                "name": cid.split(":", 1)[-1].replace("-", " ").title(),
                "alias": "",
                "notable": "Galway hurling club referenced on Galway GAA All-Ireland winning teams page.",
            }
        append_triple(cid, "type", "club")
        append_triple(cid, "name", meta["name"])
        append_triple(cid, "county", "Galway")
        append_triple(cid, "province", "Connacht")
        if meta.get("alias"):
            append_triple(cid, "alias", meta["alias"])
        if meta.get("notable"):
            append_triple(cid, "notable", meta["notable"])
        append_triple(cid, "confidence", "high")
        append_triple(cid, "source", SOURCE_URL)
        club_ids.add(cid)
        clubs_created.append(cid)

    # Sort for deterministic output: panels first (by id), then club links
    ordered = sorted(
        candidates.values(),
        key=lambda c: (0 if c.get("origin") == "panel" else 1, c["id"], c["name"]),
    )

    for rec in ordered:
        pid = rec["id"]
        nn = rec["norm"]

        # Idempotent: existing slug OR normalized name
        if pid in existing_ids:
            skipped_existing.append(pid)
            continue
        if nn in norm_to_id:
            skipped_existing.append(norm_to_id[nn])
            continue

        note = merge_note(rec["notes"])
        append_triple(pid, "type", "player")
        append_triple(pid, "name", rec["name"])
        if rec.get("club"):
            append_triple(pid, "club", rec["club"])
        append_triple(pid, "note", note)
        append_triple(pid, "confidence", "high")
        append_triple(pid, "source", rec["source"])

        existing_ids.add(pid)
        norm_to_id[nn] = pid
        new_player_ids.append(pid)

        club = rec.get("club") or ""
        if club in {"club:ahascragh-fohenagh", "club:fohenagh-historic", "club:ahascragh-historic"}:
            fohenagh_related_new.append(pid)
        elif "fohenagh" in pid or "ahascragh" in pid:
            fohenagh_related_new.append(pid)
        elif any("fohenagh" in (n.lower()) or "ahascragh" in (n.lower()) for n in rec["notes"]):
            fohenagh_related_new.append(pid)

    # Re-count players
    after_players = {t["row"] for t in seed if t["col"] == "type" and t["val"] == "player"}
    after_count = len(after_players)

    pack = {
        "pack": "galway-players-expand",
        "source": SOURCE_URL,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "before_players": before_count,
        "after_players": after_count,
        "players_added": new_player_ids,
        "players_added_count": len(new_player_ids),
        "skipped_existing_count": len(set(skipped_existing)),
        "clubs_created": clubs_created,
        "fohenagh_related_new": sorted(set(fohenagh_related_new)),
        "panels_curated": [
            {"year": p["year"], "grade": p["grade"], "label": p["label"], "n": len(p["players"])}
            for p in PANELS
        ],
        "triples_added": triples_added,
    }
    PACK_PATH.write_text(json.dumps(pack, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    SEED_PATH.write_text(json.dumps(seed, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    log_entry = {
        "url": SOURCE_URL,
        "date": "2026-09-04",
        "title": "Galway All-Ireland hurling panel player pack",
        "publisher": "Galway GAA",
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "triples_extracted": triples_added,
        "players_added": len(new_player_ids),
        "before_players": before_count,
        "after_players": after_count,
        "clubs_created": clubs_created,
        "pack": str(PACK_PATH.relative_to(ROOT)),
    }
    with LOG_PATH.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(log_entry, ensure_ascii=False) + "\n")

    print(json.dumps({
        "before_players": before_count,
        "after_players": after_count,
        "added": len(new_player_ids),
        "clubs_created": clubs_created,
        "fohenagh_related_new": sorted(set(fohenagh_related_new)),
        "triples_added": triples_added,
        "pack": str(PACK_PATH),
    }, indent=2))


if __name__ == "__main__":
    main()
