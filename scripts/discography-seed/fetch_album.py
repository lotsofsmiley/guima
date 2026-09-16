"""Step 3: album.json - Nova Era (2025-09-26) track seed.
Sources: Spotify album embed (__NEXT_DATA__ trackList), Spotify oEmbed (cover),
Apple Music album page (ld+json MusicAlbum + serialized-server-data track-list),
youtube.json (album playlist + Videos tab) for video ids.

Re-run:  python fetch_youtube.py && python fetch_album.py
"""
import json, re, sys, os
from fetch_common import fetch, extract_script_json, save_json, HERE
from fetch_youtube import norm_title

SPOTIFY_ALBUM = "6p09Uni78yGjaL6f4iKBy2"
SPOTIFY_ARTIST = "5A50LakS866v93RBazdFER"
APPLE_ALBUM = "1838734207"
APPLE_ARTIST = "1590217436"
YT_PLAYLIST = "PLm7xguAI-cPFRf2KHWVnDG6ndz6Bv9iFh"

# tracklist as currently shown on the site (task input) - used only for a consistency check
SITE_LISTING = [
    (1, "Nação", ["Vilas Boas", "DJ Suprhyme"], "1:26"), (2, "Cidade", ["Vilas Boas"], "2:44"),
    (3, "Vista", ["Vilas Boas", "CRAKiDD"], "2:26"), (4, "Fato de Treino", ["Vilas Boas", "QVXNO"], "4:11"),
    (5, "Terra do Bom Vinho, Pt. 1", ["Vilas Boas", "DJ Suprhyme"], "1:08"), (6, "Tripeiro", ["Vilas Boas"], "2:58"),
    (7, "Dinero", ["Vilas Boas"], "2:34"), (8, "Nova Era", ["Vilas Boas"], "3:18"),
    (9, "Faroeste", ["Vilas Boas", "Tostaz"], "3:10"), (10, "Terra do Bom Vinho, Pt. 2", ["Vilas Boas", "DJ Suprhyme"], "0:53"),
    (11, "Real", ["Vilas Boas", "DJ Score"], "3:38"), (12, "Até Sempre", ["Vilas Boas"], "3:46"),
    (13, "Mosaico", ["Vilas Boas", "Buster"], "2:08"),
]


def iso_to_ms(iso):
    m = re.match(r"^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$", iso or "")
    if not m:
        return None
    h, mi, s = (int(x) if x else 0 for x in m.groups())
    return (h * 3600 + mi * 60 + s) * 1000


def mmss(ms):
    return None if ms is None else f"{ms // 60000}:{(ms % 60000) // 1000:02d}"


def split_artists(subtitle):
    return [a.strip() for a in re.split(r",", (subtitle or "").replace("\xa0", " ")) if a.strip()]


def main():
    force = "--force" in sys.argv
    # --- Spotify embed
    html = fetch(f"https://open.spotify.com/embed/album/{SPOTIFY_ALBUM}", "spotify_embed_album.html", force=force)
    ent = extract_script_json(html, "__NEXT_DATA__")["props"]["pageProps"]["state"]["data"]["entity"]
    sp_tracks = ent["trackList"]
    covers = {f"spotify_{i['maxWidth']}": i["url"] for i in ent.get("visualIdentity", {}).get("image", [])}
    oe = json.loads(fetch(f"https://open.spotify.com/oembed?url=https://open.spotify.com/album/{SPOTIFY_ALBUM}",
                          "spotify_oembed_album.json", force=force))
    covers["spotify_oembed_thumbnail"] = oe.get("thumbnail_url")

    # --- Apple album page
    ahtml = fetch(f"https://music.apple.com/pt/album/nova-era/{APPLE_ALBUM}", "apple_album.html", force=force)
    ld = [json.loads(b) for b in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', ahtml, re.S)]
    ld = next((j for j in ld if j.get("@type") == "MusicAlbum"), {})
    ssd = extract_script_json(ahtml, "serialized-server-data")
    root = ssd["data"][0] if isinstance(ssd.get("data"), list) else ssd
    apple_items = []
    for s in root["data"]["sections"]:
        if s["id"].startswith("track-list -"):
            for it in s["items"]:
                cd = it["contentDescriptor"]
                apple_items.append({"song_id": cd["identifiers"]["storeAdamID"], "title": it.get("title"),
                                    "artist_name": it.get("artistName"), "album_url": cd["url"]})
    ld_tracks = ld.get("tracks", [])
    apple_artwork_template = None
    for s in root["data"]["sections"]:
        if s["id"].startswith("album-detail-header-section"):
            art = s["items"][0].get("artwork", {}).get("dictionary", {})
            apple_artwork_template = art.get("url")
    if apple_artwork_template:
        covers["apple_600"] = apple_artwork_template.replace("{w}x{h}{c}.{f}", "600x600bb.jpg")
        covers["apple_3000"] = apple_artwork_template.replace("{w}x{h}{c}.{f}", "3000x3000bb.jpg")
    covers["apple_ld_image"] = ld.get("image")

    # --- YouTube
    yt = json.load(open(os.path.join(HERE, "youtube.json"), encoding="utf-8"))
    pl_items = yt["album_playlist"]["items"]
    tab_videos = yt["videos_tab"]["videos"]

    tracks, checks = [], []
    for i, t in enumerate(sp_tracks, 1):
        tid = t["uri"].split(":")[-1]
        artists = split_artists(t.get("subtitle"))
        n = norm_title(t["title"])
        ap = apple_items[i - 1] if i - 1 < len(apple_items) else {}
        ldt = ld_tracks[i - 1] if i - 1 < len(ld_tracks) else {}
        # YouTube: prefer playlist position, verify by normalised title; else search Videos tab
        pl = pl_items[i - 1] if i - 1 < len(pl_items) else None
        yt_id, yt_how = None, None
        if pl and pl["title_norm"] == n:
            yt_id, yt_how = pl["videoId"], "playlist_index+title"
        else:
            cand = [v for v in pl_items if v["title_norm"] == n] or [v for v in tab_videos if v["title_norm"] == n]
            if cand:
                yt_id, yt_how = cand[0]["videoId"], "title_match"
            elif pl:
                yt_id, yt_how = pl["videoId"], "playlist_index_only (title differs: %r)" % pl["title"]
        feats = re.findall(r"\(feat\. ([^)]+)\)", ap.get("title") or "")
        rec = {
            "number": i,
            "title": t["title"],
            "artists": artists,
            "duration_ms": t["duration"],
            "duration_text": mmss(t["duration"]),
            "explicit": t.get("isExplicit"),
            "spotify_track_id": tid,
            "spotify_uri": t["uri"],
            "spotify_url": f"https://open.spotify.com/track/{tid}",
            "spotify_preview_url": (t.get("audioPreview") or {}).get("url"),
            "apple_music_song_id": ap.get("song_id"),
            "apple_music_url": ap.get("album_url"),
            "apple_music_song_url": ldt.get("url"),
            "apple_music_title": ap.get("title"),
            "apple_music_artist_name": ap.get("artist_name"),
            "apple_music_featured": [x.strip() for x in re.split(r",|&", feats[0])] if feats else [],
            "apple_music_duration_ms": iso_to_ms(ldt.get("duration")),
            "youtube_video_id": yt_id,
            "youtube_url": f"https://www.youtube.com/watch?v={yt_id}" if yt_id else None,
            "youtube_match": yt_how,
            "youtube_title": next((v["title"] for v in pl_items + tab_videos if v["videoId"] == yt_id), None),
            "title_norm": n,
        }
        tracks.append(rec)
        # consistency vs site listing + Apple
        site = SITE_LISTING[i - 1]
        issues = []
        if norm_title(site[1]) != n:
            issues.append(f"title site={site[1]!r} spotify={t['title']!r}")
        if site[3] != rec["duration_text"]:
            issues.append(f"duration site={site[3]} spotify={rec['duration_text']}")
        if rec["apple_music_duration_ms"] is not None and abs(rec["apple_music_duration_ms"] - t["duration"]) > 1500:
            issues.append(f"duration apple={mmss(rec['apple_music_duration_ms'])} spotify={rec['duration_text']}")
        site_feats = [a for a in site[2] if a != "Vilas Boas"]
        if [f.lower() for f in site_feats] != [f.lower() for f in rec["apple_music_featured"]]:
            issues.append(f"feat site={site_feats} apple={rec['apple_music_featured']}")
        if set(a.lower() for a in site[2] + ["GUIMA"]) != set(a.lower() for a in artists):
            issues.append(f"artists site={site[2] + ['GUIMA']} spotify={artists}")
        if issues:
            checks.append({"number": i, "issues": issues})

    out = {
        "album": {
            "title": ent["name"],
            "primary_artist": ent.get("subtitle"),
            "artists_credited_apple": [a.get("name") for a in ld.get("byArtist", [])] if isinstance(ld.get("byArtist"), list) else ld.get("byArtist"),
            "release_date": ld.get("datePublished"),
            "total_tracks": len(tracks),
            "total_duration_ms": sum(t["duration_ms"] for t in tracks),
            "genre_apple": ld.get("genre"),
            "spotify_album_id": SPOTIFY_ALBUM,
            "spotify_uri": ent["uri"],
            "spotify_url": f"https://open.spotify.com/album/{SPOTIFY_ALBUM}",
            "spotify_artist_id": SPOTIFY_ARTIST,
            "spotify_artist_url": f"https://open.spotify.com/artist/{SPOTIFY_ARTIST}",
            "apple_music_album_id": APPLE_ALBUM,
            "apple_music_url": f"https://music.apple.com/pt/album/nova-era/{APPLE_ALBUM}",
            "apple_music_artist_id": APPLE_ARTIST,
            "apple_music_artist_url": f"https://music.apple.com/pt/artist/guima/{APPLE_ARTIST}",
            "youtube_playlist_id": YT_PLAYLIST,
            "youtube_playlist_url": f"https://www.youtube.com/playlist?list={YT_PLAYLIST}",
            "youtube_playlist_title": yt["album_playlist"]["title"],
            "youtube_release_playlist": next((r for r in yt["releases_tab"]["releases"]
                                              if r["title_norm"] == norm_title(ent["name"]) and (r["video_count"] or 0) > 1), None),
            "cover": covers,
            "spotify_visual_identity": {k: v for k, v in ent.get("visualIdentity", {}).items() if k != "image"},
        },
        "tracks": tracks,
        "consistency_checks": {"site_listing_vs_sources": checks or "all 13 tracks consistent (titles, durations, features)"},
        "sources": {
            "spotify_embed": f"https://open.spotify.com/embed/album/{SPOTIFY_ALBUM}",
            "spotify_oembed": f"https://open.spotify.com/oembed?url=https://open.spotify.com/album/{SPOTIFY_ALBUM}",
            "apple_album": f"https://music.apple.com/pt/album/nova-era/{APPLE_ALBUM}",
            "youtube": "youtube.json (fetch_youtube.py)",
        },
    }
    save_json("album.json", out)
    print(f"[album] {len(tracks)} tracks; yt matched={sum(1 for t in tracks if t['youtube_video_id'])}; "
          f"checks={len(checks)}", file=sys.stderr)


if __name__ == "__main__":
    main()
