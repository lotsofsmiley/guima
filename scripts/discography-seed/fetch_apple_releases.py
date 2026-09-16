"""Step 1b: fetch every Apple Music album page referenced from the GUIMA artist page
(singles shelf + 'more by artist' shelf on the Nova Era page + albums the top songs come from),
so ld+json (datePublished, tracks, byArtist, image) can be parsed offline."""
import json, re, sys
from fetch_common import fetch, extract_script_json, RAW
import os

def root_of(ssd):
    return ssd["data"][0] if isinstance(ssd.get("data"), list) else ssd

urls = {}
for name in ("apple_artist.html", "apple_album.html"):
    html = open(os.path.join(RAW, name), encoding="utf-8").read()
    for m in re.finditer(r'https://music\.apple\.com/pt/album/([^/"?]+)/(\d{8,})', html):
        slug, aid = m.group(1), m.group(2)
        urls.setdefault(aid, f"https://music.apple.com/pt/album/{slug}/{aid}")

# only keep ids that are GUIMA releases or albums his top songs sit on (exclude 'you might also like')
html = open(os.path.join(RAW, "apple_album.html"), encoding="utf-8").read()
ssd = extract_script_json(html, "serialized-server-data")
exclude = set()
for s in root_of(ssd)["data"]["sections"]:
    if "you-might-also-like" in s["id"]:
        for it in s["items"]:
            exclude.add(it["contentDescriptor"]["identifiers"]["storeAdamID"])
ids = [i for i in urls if i not in exclude and i != "1838734207"]
print(f"[apple] {len(ids)} release pages to fetch: {ids}", file=sys.stderr)
for aid in ids:
    try:
        fetch(urls[aid], f"apple_release_{aid}.html", force="--force" in sys.argv)
    except Exception as e:
        print(f"[apple] FAILED {aid}: {e}", file=sys.stderr)
