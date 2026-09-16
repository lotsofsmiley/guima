"""Step 2: youtube.json - every video on the channel's Videos tab (paginated via the
continuation token + INNERTUBE_API_KEY embedded in the public page, exactly what the web
client does), the Nova Era playlist, and the Releases tab (auto-generated album playlists).

Re-run:  python fetch_youtube.py [--force]
"""
import json, re, sys, os, gzip, urllib.request, unicodedata
from fetch_common import fetch, extract_yt_initial_data, walk, save_json, HEADERS, RAW

YT_CHANNEL = "UCBvDWmQcwseHN9JPHTHqhLw"
YT_PLAYLIST = "PLm7xguAI-cPFRf2KHWVnDG6ndz6Bv9iFh"


def norm_title(t):
    """Normalise a YouTube/track/release title for matching:
    strip 'GUIMA ~' prefix, (Prod./Video/...) tags, ft./feat. tails, '- Single' suffix, accents, case."""
    t = t or ""
    t = re.sub(r"^\s*GUIMA\s*[~\-:]\s*", "", t, flags=re.I)
    t = re.sub(r"\s*-\s*(Single|EP)\s*$", "", t, flags=re.I)
    t = re.sub(r"\((?:prod|video|official|oficial|audio|visualizer|lyric)[^)]*\)", "", t, flags=re.I)
    t = re.sub(r"\[[^\]]*\]", "", t)
    t = re.sub(r"(?i)(?:^|\s)(?:ft\.?|feat\.?|featuring)\s.*$", "", t)
    t = re.sub(r"\(.*?\)", "", t)
    t = unicodedata.normalize("NFKD", t)
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"[^a-z0-9 ]+", " ", t.lower())
    t = re.sub(r"(?:^|\s)pt\.?\s*(\d)(?=\s|$)", r" \1", t)
    t = re.sub(r"(?:^|\s)ii(?=\s|$)", " 2", t)
    t = re.sub(r"(?:^|\s)iii(?=\s|$)", " 3", t)
    return re.sub(r"\s+", " ", t).strip()


def parse_lockup(lk):
    md = lk.get("metadata", {}).get("lockupMetadataViewModel", {})
    rows = md.get("metadata", {}).get("contentMetadataViewModel", {}).get("metadataRows", [])
    parts = [p.get("text", {}).get("content") for r in rows for p in r.get("metadataParts", [])
             if p.get("text", {}).get("content")]
    img = lk.get("contentImage", {}).get("thumbnailViewModel", {})
    srcs = img.get("image", {}).get("sources", [])
    badge = None
    for ov in img.get("overlays", []):
        for b in ov.get("thumbnailBottomOverlayViewModel", {}).get("badges", []):
            badge = b.get("thumbnailBadgeViewModel", {}).get("text") or badge
    vid = lk.get("contentId")
    is_dur = bool(badge and re.match(r"^[\d:]+$", badge))
    views = next((p for p in parts if re.search(r"visualiza|views", p)), None)
    # metadata rows are [channel] then [views, published] (or [premiere text] for upcoming videos)
    published = next((p for p in parts[1:] if p != views), None)
    return {
        "videoId": vid,
        "title": md.get("title", {}).get("content"),
        "channel_text": parts[0] if parts else None,
        "published_text": published,
        "view_count_text": views,
        "duration_text": badge if is_dur else None,
        "badge_text": None if is_dur else badge,
        "thumbnail_url": f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg" if vid else None,
        "thumbnail_url_page": srcs[-1]["url"] if srcs else None,
        "url": f"https://www.youtube.com/watch?v={vid}" if vid else None,
    }


def innertube_browse(html, token):
    key = re.search(r'"INNERTUBE_API_KEY":"([^"]+)"', html).group(1)
    ver = re.search(r'"INNERTUBE_CLIENT_VERSION":"([^"]+)"', html).group(1)
    ctx = json.loads(re.search(r'"INNERTUBE_CONTEXT":({.*?}),"INNERTUBE_CONTEXT_CLIENT_NAME"', html, re.S).group(1))
    body = json.dumps({"context": ctx, "continuation": token}).encode()
    h = dict(HEADERS)
    h.update({"Content-Type": "application/json", "X-YouTube-Client-Name": "1",
              "X-YouTube-Client-Version": ver, "Origin": "https://www.youtube.com",
              "Referer": "https://www.youtube.com/"})
    req = urllib.request.Request(f"https://www.youtube.com/youtubei/v1/browse?key={key}&prettyPrint=false",
                                 data=body, headers=h, method="POST")
    with urllib.request.urlopen(req, timeout=40) as r:
        data = r.read()
        if r.headers.get("Content-Encoding") == "gzip":
            data = gzip.decompress(data)
    return json.loads(data.decode("utf-8"))


def browse_tokens(obj):
    """Only the 'load more' tokens (continuationItemRenderer), not the sort-chip reload tokens."""
    out = []
    for cir in walk(obj, "continuationItemRenderer"):
        for c in walk(cir, "continuationCommand"):
            if c.get("token"):
                out.append(c["token"])
    return out


def main():
    force = "--force" in sys.argv
    # --- channel Videos tab, paginated
    html = fetch(f"https://www.youtube.com/channel/{YT_CHANNEL}/videos", "yt_channel_videos.html", force=force)
    yd = extract_yt_initial_data(html)
    m = re.search(r'"canonicalBaseUrl":"(/@[^"]+)"', html)
    handle = m.group(1) if m else None
    header = {}
    for h in walk(yd, "pageHeaderViewModel"):
        rows = h.get("metadata", {}).get("contentMetadataViewModel", {}).get("metadataRows", [])
        header["rows"] = [[p.get("text", {}).get("content") for p in r.get("metadataParts", [])] for r in rows]
        header["title"] = h.get("title", {}).get("dynamicTextViewModel", {}).get("text", {}).get("content")
    videos, seen, pages = [], set(), 0

    def collect(obj):
        for ri in walk(obj, "richItemRenderer"):
            lk = ri.get("content", {}).get("lockupViewModel")
            if not lk:
                continue
            v = parse_lockup(lk)
            if v["videoId"] and v["videoId"] not in seen:
                seen.add(v["videoId"])
                videos.append(v)

    collect(yd)
    tokens = browse_tokens(yd)
    tried = set()
    while tokens and pages < 20:
        tok = tokens[0]
        if tok in tried:
            break
        tried.add(tok)
        pages += 1
        try:
            j = innertube_browse(html, tok)
        except Exception as e:
            print(f"[yt] continuation page {pages} failed: {e}", file=sys.stderr)
            break
        with open(os.path.join(RAW, f"yt_videos_cont_{pages}.json"), "w", encoding="utf-8") as f:
            json.dump(j, f, ensure_ascii=False)
        before = len(videos)
        collect(j)
        print(f"[yt] continuation page {pages}: +{len(videos) - before} videos", file=sys.stderr)
        tokens = [t for t in browse_tokens(j) if t not in tried]
    for v in videos:
        v["title_norm"] = norm_title(v["title"])

    # --- Nova Era playlist
    phtml = fetch(f"https://www.youtube.com/playlist?list={YT_PLAYLIST}", "yt_playlist.html", force=force)
    pyd = extract_yt_initial_data(phtml)
    ptitle = None
    for h in walk(pyd, "pageHeaderViewModel"):
        ptitle = h.get("title", {}).get("dynamicTextViewModel", {}).get("text", {}).get("content") or ptitle
    playlist_items = []
    for i, lk in enumerate(walk(pyd, "lockupViewModel"), 1):
        v = parse_lockup(lk)
        v["index"] = i
        v["title_norm"] = norm_title(v["title"])
        v.pop("published_text")
        v.pop("view_count_text")
        playlist_items.append(v)

    # --- Releases tab (auto-generated album playlists, OLAK5uy_)
    rhtml = fetch(f"https://www.youtube.com/channel/{YT_CHANNEL}/releases", "yt_channel_releases.html", force=force)
    ryd = extract_yt_initial_data(rhtml)
    releases = []
    for pr in walk(ryd, "playlistRenderer"):
        runs = [r.get("text") for r in pr.get("shortBylineText", {}).get("runs", [])]
        date = next((r for r in runs if re.match(r"^\d{1,2}/\d{1,2}/\d{4}$", r or "")), None)
        vids = [{"videoId": c["childVideoRenderer"]["navigationEndpoint"]["watchEndpoint"]["videoId"],
                 "title": c["childVideoRenderer"]["title"]["simpleText"]}
                for c in pr.get("videos", []) if "childVideoRenderer" in c]
        title = pr.get("title", {}).get("simpleText")
        vc = str(pr.get("videoCount", ""))
        releases.append({
            "playlistId": pr.get("playlistId"),
            "title": title,
            "title_norm": norm_title(title),
            "video_count": int(vc) if vc.isdigit() else pr.get("videoCount"),
            "byline": runs[0] if runs else None,
            "date_text": date,
            "url": f"https://www.youtube.com/playlist?list={pr.get('playlistId')}",
            "videos": vids,
        })

    # --- channel home shelves (may surface videos hosted on other channels, e.g. collaborations)
    hhtml = fetch(f"https://www.youtube.com/channel/{YT_CHANNEL}", "yt_channel_home.html", force=force)
    hyd = extract_yt_initial_data(hhtml)
    home_featured, hseen = [], set()
    for lk in walk(hyd, "lockupViewModel"):
        v = parse_lockup(lk)
        if v["videoId"] and v["videoId"] not in hseen:
            hseen.add(v["videoId"])
            v["title_norm"] = norm_title(v["title"])
            v["on_videos_tab"] = v["videoId"] in seen
            home_featured.append(v)

    out = {
        "channel": {"id": YT_CHANNEL, "url": f"https://www.youtube.com/channel/{YT_CHANNEL}", "handle": handle,
                    "handle_url": f"https://www.youtube.com{handle}" if handle else None,
                    "title": header.get("title"), "header_rows": header.get("rows")},
        "videos_tab": {"count": len(videos), "pages_fetched": 1 + pages, "videos": videos},
        "album_playlist": {"id": YT_PLAYLIST, "url": f"https://www.youtube.com/playlist?list={YT_PLAYLIST}",
                           "title": ptitle, "count": len(playlist_items), "items": playlist_items},
        "home_featured": {"count": len(home_featured), "note": "lockups on the channel home page (shelves); includes collaborations hosted elsewhere",
                          "videos": home_featured},
        "releases_tab": {"count": len(releases),
                         "note": "auto-generated YouTube Music album playlists (OLAK5uy_...); date_text is the YouTube listing date, NOT the release date",
                         "releases": releases},
        "source_notes": [
            "Videos tab: ytInitialData richItemRenderer->lockupViewModel; remaining pages via POST "
            "youtubei/v1/browse with the page's continuation token and INNERTUBE_API_KEY (both embedded in the public HTML).",
            "Playlist: ytInitialData lockupViewModel (playlistVideoRenderer is no longer emitted by YouTube as of 2026-09).",
            "Releases tab: richItemRenderer->playlistRenderer.",
        ],
    }
    save_json("youtube.json", out)
    print(f"[yt] videos={len(videos)} playlist={len(playlist_items)} releases={len(releases)} handle={handle}",
          file=sys.stderr)


if __name__ == "__main__":
    main()
