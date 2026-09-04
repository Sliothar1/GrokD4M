from bs4 import BeautifulSoup
import re, json
from collections import Counter

soup = BeautifulSoup(open("/tmp/wiki-galway-shc.html"), "lxml")
tables = soup.find_all("table", class_=re.compile("wikitable"))
t = tables[3]
rows = t.find_all("tr")[1:]
parsed = []
for tr in rows:
    cells = tr.find_all(["td", "th"])
    texts = [c.get_text(" ", strip=True) for c in cells]
    if len(texts) < 2:
        continue
    year = re.match(r"(\d{4})", texts[0])
    if not year:
        print("skip", texts[:4])
        continue
    y = int(year.group(1))
    winners = texts[1] if len(texts) > 1 else ""
    runners = texts[2] if len(texts) > 2 else ""
    extra = texts[3:] if len(texts) > 3 else []
    parsed.append(
        {
            "year": y,
            "winners": winners,
            "runners": runners,
            "extra": extra,
            "ncols": len(texts),
            "raw": texts,
        }
    )

print("count", len(parsed))
print("sample early", parsed[0])
print("sample 1933", [p for p in parsed if p["year"] == 1933])
print("sample 1959", [p for p in parsed if p["year"] == 1959])
print("sample 1980", [p for p in parsed if p["year"] == 1980])
print("sample 2021", [p for p in parsed if p["year"] == 2021])
print(Counter(p["ncols"] for p in parsed))
open("/tmp/wiki-shc-finals.json", "w").write(json.dumps(parsed, indent=2))
print("written")
