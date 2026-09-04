from bs4 import BeautifulSoup
import re, json
from collections import Counter

# --- Galway GAA SHC finals ---
soup = BeautifulSoup(open("/tmp/ggaa-shc-finals.html"), "lxml")
tables = soup.find_all("table")
print("GGAA tables", len(tables))
ggaa = []
for t in tables:
    for tr in t.find_all("tr"):
        cells = [c.get_text(" ", strip=True) for c in tr.find_all(["td", "th"])]
        if not cells:
            continue
        m = re.match(r"^(\d{4})$", cells[0].strip())
        if not m:
            continue
        y = int(m.group(1))
        # typical: year | winner | wscore | runner | rscore | venue
        # or year | winner | | runner | | 
        # or special notes
        ggaa.append({"year": y, "cells": cells})

print("GGAA rows", len(ggaa))
for y in (1887, 1933, 1956, 1959, 1967, 2020, 2021):
    print(y, [g for g in ggaa if g["year"] == y])

open("/tmp/ggaa-shc-finals.json", "w").write(json.dumps(ggaa, indent=2))

# --- Intermediate roll by club ---
soup = BeautifulSoup(open("/tmp/wiki-galway-ihc.html"), "lxml")
tables = soup.find_all("table", class_=re.compile("wikitable"))
print("\nIHC tables", len(tables))
for i, t in enumerate(tables):
    first = t.find("tr")
    headers = [th.get_text(" ", strip=True) for th in first.find_all(["th", "td"])] if first else []
    print(i, headers[:8], "rows", len(t.find_all("tr")))

# Find roll of honour with years won
ihc_titles = []
for t in tables:
    first = t.find("tr")
    headers = [th.get_text(" ", strip=True).lower() for th in first.find_all(["th", "td"])] if first else []
    if any("years" in h or "championships won" in h for h in headers):
        for tr in t.find_all("tr")[1:]:
            cells = [c.get_text(" ", strip=True) for c in tr.find_all(["td", "th"])]
            if len(cells) >= 3:
                # #, Club, Titles, years
                club = cells[1] if cells[0].isdigit() or cells[0] == "" else cells[0]
                # handle rowspan empties
                years_cell = cells[-1]
                titles_n = None
                for c in cells:
                    if c.isdigit() and len(c) <= 2:
                        titles_n = int(c)
                years = [int(x) for x in re.findall(r"\b(19\d{2}|20\d{2})\b", years_cell)]
                if years:
                    ihc_titles.append({"club": club, "years": years, "raw": cells})
        break

print("IHC clubs with years", len(ihc_titles))
for x in ihc_titles[:5]:
    print(x)
open("/tmp/wiki-ihc-titles.json", "w").write(json.dumps(ihc_titles, indent=2))

# Junior
soup = BeautifulSoup(open("/tmp/wiki-galway-jhc.html"), "lxml")
tables = soup.find_all("table", class_=re.compile("wikitable"))
print("\nJHC tables", len(tables))
for i, t in enumerate(tables):
    first = t.find("tr")
    headers = [th.get_text(" ", strip=True) for th in first.find_all(["th", "td"])] if first else []
    print(i, headers[:8], "rows", len(t.find_all("tr")))

jhc_titles = []
for t in tables:
    first = t.find("tr")
    headers = [th.get_text(" ", strip=True).lower() for th in first.find_all(["th", "td"])] if first else []
    if any("years" in h or "championships won" in h for h in headers):
        for tr in t.find_all("tr")[1:]:
            cells = [c.get_text(" ", strip=True) for c in tr.find_all(["td", "th"])]
            if len(cells) >= 2:
                years_cell = cells[-1]
                years = [int(x) for x in re.findall(r"\b(19\d{2}|20\d{2})\b", years_cell)]
                club = None
                for c in cells:
                    if c and not c.isdigit() and not re.fullmatch(r"[\d,\s]+", c) and "19" not in c[:2] and "20" not in c[:2]:
                        # pick first non-numeric looking as club - messy
                        if re.search(r"[A-Za-zÁÉÍÓÚáéíóú']", c) and not re.fullmatch(r"(\d{4}(, )?)+", c.replace(" ", "")):
                            club = c
                            break
                if club and years:
                    jhc_titles.append({"club": club, "years": years, "raw": cells})
        break

print("JHC clubs", len(jhc_titles))
for x in jhc_titles[:8]:
    print(x)
open("/tmp/wiki-jhc-titles.json", "w").write(json.dumps(jhc_titles, indent=2))
