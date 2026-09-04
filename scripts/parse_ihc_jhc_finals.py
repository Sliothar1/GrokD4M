from bs4 import BeautifulSoup
import re, json

def parse_finals(path, out):
    soup = BeautifulSoup(open(path), "lxml")
    tables = soup.find_all("table", class_=re.compile("wikitable"))
    # find Year / Winners table
    target = None
    for t in tables:
        first = t.find("tr")
        headers = [th.get_text(" ", strip=True).lower() for th in first.find_all(["th", "td"])] if first else []
        if headers and "year" in headers[0] and any("winner" in h for h in headers):
            target = t
            break
    rows = []
    if not target:
        print(path, "no finals table")
        return
    hdr = [c.get_text(" ", strip=True) for c in target.find("tr").find_all(["th", "td"])]
    print(path, "hdr", hdr)
    for tr in target.find_all("tr")[1:]:
        cells = tr.find_all(["td", "th"])
        texts = [c.get_text(" ", strip=True) for c in cells]
        if not texts:
            continue
        ym = re.match(r"(\d{4})", texts[0])
        if not ym:
            continue
        rows.append({"year": int(ym.group(1)), "raw": texts, "ncols": len(texts)})
    print("rows", len(rows), "sample", rows[:2], rows[-2:])
    open(out, "w").write(json.dumps(rows, indent=2))

parse_finals("/tmp/wiki-galway-ihc.html", "/tmp/wiki-ihc-finals.json")
parse_finals("/tmp/wiki-galway-jhc.html", "/tmp/wiki-jhc-finals.json")
