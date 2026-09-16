"""Step 4: discography.json - every GUIMA release other than the Nova Era album, plus
'appears on' entries. Primary source: Apple Music artist page (serialized-server-data:
Albums / ArtistSingles / LatestRelease shelves) + the Nova Era page 'more-by-artist' shelf,
then each release page's ld+json (datePublished, byArtist, tracks). Spotify ids only where
the Spotify artist embed (top-10 tracks) exposes them. YouTube ids matched by normalised
title against youtube.json (Releases tab playlists + Videos tab).

Re-run:  python fetch_raw.py && python fetch_apple_releases.py && python fetch_youtube.py && python fetch_discography.py
"""
import json, re, sys, os, glob
from fetch_common import fetch, extract_script_json, save_json, HERE, RAW
from fetch_youtube import norm_title
from fetch_album import iso_to_ms, mmss, split_artists

SPOTIFY_ARTIST = "5A50LakS866v93RBazdFER"
APPLE_ARTIST = "1590217436"
APPLE_ALBUM_NOVA_ERA = "1838734207"


def root_of(ssd):
    return ssd["data"][0] if isinstance(ssd.get("data"), list) else ssd


def shelf_items(html):
    """Return {album_id: {url, artwork_template, title_text, year_text, shelf}} from an Apple page."""
    out = {}
    root = root_of(extract_script_json(html, "serialized-server-data"))
    for s in root["data"]["sections"]:
        sid = s["id"]
        if "SimilarArtists" in sid or "you-might-also-like" in sid:
            continue
        items = s.get("items", [])
        for it in items:
            top_songs = it.get("tracks") or []      # sits beside featuredContent in the LatestRelease block
            fc = it.get("featuredContent")  # LatestRelease block
            if fc:
                it = fc
            cd = it.get("contentDescriptor") or {}
            # Top songs list: songs whose album is not on any GUIMA shelf -> 'appears on' candidates
            for song in top_songs:
                surl = (song.get("contentDescriptor") or {}).get("url") or ""
                m = re.search(r"/album/([^/]+)/(\d+)\?i=", surl)
                if m:
                    said = m.group(2)
                    rec = out.setdefault(said, {"id": said, "url": f"https://music.apple.com/pt/album/{m.group(1)}/{said}", "shelves": []})
                    rec["shelves"].append("TopSongs")
            if cd.get("kind") != "album":
                continue
            aid = cd["identifiers"]["storeAdamID"]
            art = (it.get("artwork") or {}).get("dictionary", {}).get("url")
            title = (it.get("titleLinks") or [{}])[0].get("title") or (it.get("detailText") or {}).get("title")
            year = (it.get("subtitleLinks") or [{}])[0].get("title")
            rec = out.setdefault(aid, {"id": aid, "url": cd["url"], "shelves": []})
            rec["shelves"].append(sid.split(".")[-1].split(" - ")[0])
            if art:
                rec["artwork_template"] = art
            if title:
                rec["title_text"] = title
            if year:
                rec["year_text"] = year
    return out


def parse_release_page(aid):
    p = os.path.join(RAW, f"apple_release_{aid}.html")
    if not os.path.exists(p):
        return None
    html = open(p, encoding="utf-8").read()
    lds = [json.loads(b) for b in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S)]
    ld = next((j for j in lds if j.get("@type") == "MusicAlbum"), None)
    if not ld:
        return None
    root = root_of(extract_script_json(html, "serialized-server-data"))
    art = None
    track_items = []
    for s in root["data"]["sections"]:
        if s["id"].startswith("album-detail-header-section"):
            art = (s["items"][0].get("artwork") or {}).get("dictionary", {}).get("url")
        if s["id"].startswith("track-list -"):
            for it in s["items"]:
                cd = it["contentDescriptor"]
                track_items.append({"song_id": cd["identifiers"]["storeAdamID"], "title": it.get("title"),
                                    "artist_name": it.get("artistName"), "url": cd["url"]})
    by = ld.get("byArtist")
    artists = [a.get("name") for a in by] if isinstance(by, list) else ([by.get("name")] if isinstance(by, dict) else [])
    tracks = []
    for i, t in enumerate(ld.get("tracks", []), 1):
        ti = track_items[i - 1] if i - 1 < len(track_items) else {}
        feats = re.findall(r"\(feat\. ([^)]+)\)", t.get("name") or "")
        tracks.append({
            "number": i, "title": t.get("name"), "duration_ms": iso_to_ms(t.get("duration")),
            "duration_text": mmss(iso_to_ms(t.get("duration"))),
            "apple_music_song_id": ti.get("song_id") or (t.get("url") or "").rstrip("/").split("/")[-1],
            "apple_music_url": ti.get("url"), "apple_music_song_url": t.get("url"),
            "apple_music_artist_name": ti.get("artist_name"),
            "featured": [x.strip() for x in re.split(r",|&", feats[0])] if feats else [],
            "title_norm": norm_title(t.get("name")),
        })
    return {"ld_name": ld.get("name"), "release_date": ld.get("datePublished"), "artists": artists,
            "genre": ld.get("genre"), "ld_image": ld.get("image"), "artwork_template": art, "tracks": tracks,
            "description": ld.get("description")}


def main():
    force = "--force" in sys.argv
    artist_html = fetch(f"https://music.apple.com/pt/artist/guima/{APPLE_ARTIST}", "apple_artist.html", force=force)
    album_html = fetch(f"https://music.apple.com/pt/album/nova-era/{APPLE_ALBUM_NOVA_ERA}", "apple_album.html", force=force)
    shelves = shelf_items(artist_html)
    for aid, rec in shelf_items(album_html).items():
        cur = shelves.setdefault(aid, rec)
        cur["shelves"] = sorted(set(cur["shelves"] + rec["shelves"]))
        cur.setdefault("artwork_template", rec.get("artwork_template"))

    # Spotify artist embed top tracks (only public Spotify id source without auth)
    sp_html = fetch(f"https://open.spotify.com/embed/artist/{SPOTIFY_ARTIST}", "spotify_embed_artist.html", force=force)
    sp_ent = extract_script_json(sp_html, "__NEXT_DATA__")["props"]["pageProps"]["state"]["data"]["entity"]
    top_tracks = [{"spotify_track_id": t["uri"].split(":")[-1], "spotify_uri": t["uri"], "title": t["title"],
                   "artists": split_artists(t.get("subtitle")), "duration_ms": t["duration"],
                   "title_norm": norm_title(t["title"])} for t in sp_ent.get("trackList", [])]
    album_json = json.load(open(os.path.join(HERE, "album.json"), encoding="utf-8"))
    album_track_ids = {t["spotify_track_id"] for t in album_json["tracks"]}

    yt = json.load(open(os.path.join(HERE, "youtube.json"), encoding="utf-8"))
    yt_releases = yt["releases_tab"]["releases"]
    yt_videos = yt["videos_tab"]["videos"]
    yt_home = yt.get("home_featured", {}).get("videos", [])

    releases, appears_on = [], []
    for aid, sh in shelves.items():
        if aid == APPLE_ALBUM_NOVA_ERA:
            continue
        pg = parse_release_page(aid)
        if not pg:
            releases.append({"apple_music_album_id": aid, "apple_music_url": sh["url"], "error": "release page not fetched"})
            continue
        name = pg["ld_name"] or sh.get("title_text") or ""
        m = re.search(r"\s*-\s*(Single|EP)\s*$", name, re.I)
        rtype = m.group(1).lower() if m else ("album" if len(pg["tracks"]) > 6 else "ep" if len(pg["tracks"]) > 1 else "single")
        title = re.sub(r"\s*-\s*(Single|EP)\s*$", "", name, flags=re.I)
        n = norm_title(title)
        art = pg.get("artwork_template") or sh.get("artwork_template")
        cover = {"apple_600": art.replace("{w}x{h}{c}.{f}", "600x600bb.jpg") if art else None,
                 "apple_3000": art.replace("{w}x{h}{c}.{f}", "3000x3000bb.jpg") if art else None,
                 "apple_template": art, "apple_ld_image": pg.get("ld_image")}
        # Spotify: top-track with same normalised title, and NOT the Nova Era album version
        sp = [t for t in top_tracks if t["title_norm"] == n]
        sp_single = [t for t in sp if t["spotify_track_id"] not in album_track_ids]
        sp_album_version = [t for t in sp if t["spotify_track_id"] in album_track_ids]
        # YouTube: releases-tab playlist by normalised title, tie-broken by track count
        # (e.g. 'Nova Era' single (1) vs 'Nova Era' album (13)); then Videos tab by title
        yr = (pg.get("release_date") or "")[:4]
        yrel = [r for r in yt_releases if r["title_norm"] == n]
        if len(yrel) > 1:
            same_count = [r for r in yrel if r.get("video_count") == len(pg["tracks"])]
            yrel = same_count or yrel
        yvid = [v for v in yt_videos if v["title_norm"] == n]
        video_id = (yrel[0]["videos"][0]["videoId"] if yrel and yrel[0]["videos"] else None) or (yvid[0]["videoId"] if yvid else None)
        on_album = n in {t["title_norm"] for t in album_json["tracks"]}
        on_channel = bool(yvid)  # an official-channel video with the same title exists
        genres = set(pg.get("genre") or [])
        br_signal = bool(genres & {"Brasileira", "Baile Funk", "Funk"})
        if on_album or on_channel:
            confidence, why = "high", "on the Nova Era album" if on_album else "official YouTube channel has a video with this title"
        elif br_signal:
            confidence, why = "low", "Brazilian genre tags and no official-channel video: likely a different artist named Guima merged into the same Apple entity"
        else:
            confidence, why = "medium", "Apple lists it under artist 1590217436 but no official-channel video confirms it"
        rec = {
            "title": title,
            "type": rtype,
            "attribution_confidence": confidence,
            "attribution_note": why,
            "release_date": pg.get("release_date"),
            "year": yr or None,
            "artists": pg["artists"],
            "featured": pg["tracks"][0]["featured"] if len(pg["tracks"]) == 1 else [],
            "on_nova_era_album": n in {t["title_norm"] for t in album_json["tracks"]},
            "genre_apple": pg.get("genre"),
            "cover_url": cover["apple_600"],
            "cover": cover,
            "apple_music_album_id": aid,
            "apple_music_url": sh["url"],
            "apple_music_shelves": sh["shelves"],
            "spotify_track_id": sp_single[0]["spotify_track_id"] if sp_single else None,
            "spotify_uri": sp_single[0]["spotify_uri"] if sp_single else None,
            "spotify_url": f"https://open.spotify.com/track/{sp_single[0]['spotify_track_id']}" if sp_single else None,
            "spotify_album_id": None,
            "spotify_note": ("track id from artist-embed top tracks (single release)" if sp_single else
                             ("only the Nova Era album version %s is exposed publicly; single's own id not found"
                              % sp_album_version[0]["spotify_track_id"] if sp_album_version else
                              "not exposed by any keyless public endpoint")),
            "youtube_video_id": video_id,
            "youtube_url": f"https://www.youtube.com/watch?v={video_id}" if video_id else None,
            "youtube_release_playlist_id": yrel[0]["playlistId"] if yrel else None,
            "youtube_release_playlist_listing_date_text": yrel[0].get("date_text") if yrel else None,
            "youtube_match": ("releases_tab" if yrel else "videos_tab" if yvid else None),
            "youtube_title": next((v["title"] for v in yt_videos if v["videoId"] == video_id), None) if video_id else None,
            "tracks": pg["tracks"],
            "title_norm": n,
        }
        if "GUIMA" in pg["artists"]:
            releases.append(rec)
        else:
            appears_on.append(rec)

    # 'appears on' via Apple top songs whose album is not a GUIMA release (e.g. No Mapa on Vilas Boas - Jab)
    for rec in appears_on:
        guima_tracks = []
        for t in rec["tracks"]:
            sp = [x for x in top_tracks if x["title_norm"] == t["title_norm"] and "GUIMA" in x["artists"]]
            if sp:
                yvid = [v for v in yt_videos + yt_home
                        if v["title_norm"] == t["title_norm"] or re.search(r"(^|\s)%s(\s|$)" % re.escape(t["title_norm"]), v["title_norm"])]
                guima_tracks.append({**t, "spotify_track_id": sp[0]["spotify_track_id"], "spotify_uri": sp[0]["spotify_uri"],
                                     "spotify_url": f"https://open.spotify.com/track/{sp[0]['spotify_track_id']}",
                                     "spotify_artists": sp[0]["artists"],
                                     "youtube_video_id": yvid[0]["videoId"] if yvid else None,
                                     "youtube_title": yvid[0]["title"] if yvid else None})
        rec["guima_tracks"] = guima_tracks
        rec["type"] = "appears_on"

    releases.sort(key=lambda r: r.get("release_date") or "", reverse=True)
    matched_pl = {r["youtube_release_playlist_id"] for r in releases if r.get("youtube_release_playlist_id")}
    matched_pl |= {(album_json["album"].get("youtube_release_playlist") or {}).get("playlistId")}
    unmatched = []
    for r in yt_releases:
        if r["playlistId"] in matched_pl:
            continue
        by = (r.get("byline") or "").strip()
        tab_ids = {v["videoId"] for v in yt_videos}
        on_tab = any(v["videoId"] in tab_ids for v in r["videos"])
        unmatched.append({
            "playlistId": r["playlistId"], "url": r["url"], "title": r["title"],
            "youtube_listing_date_text": r["date_text"], "video_count": r["video_count"],
            "byline": by, "videos": r["videos"], "video_on_official_videos_tab": on_tab,
            "classification": ("guima_bylined_release_not_on_apple_music; attribution UNVERIFIED (no official-channel video; "
                               "YouTube Music may merge same-name artists)" if by.lower() == "guima"
                               else "other_artist_release_listed_on_channel (possible feature; unverified)"),
        })

    out = {
        "artist": {
            "name": "GUIMA",
            "spotify_artist_id": SPOTIFY_ARTIST, "spotify_url": f"https://open.spotify.com/artist/{SPOTIFY_ARTIST}",
            "spotify_image": json.loads(open(os.path.join(RAW, "spotify_oembed_artist.json"), encoding="utf-8").read()).get("thumbnail_url"),
            "apple_music_artist_id": APPLE_ARTIST, "apple_music_url": f"https://music.apple.com/pt/artist/guima/{APPLE_ARTIST}",
            "youtube_channel_id": yt["channel"]["id"], "youtube_handle": yt["channel"]["handle"],
            "youtube_channel_url": yt["channel"]["url"],
        },
        "counts": {"releases": len(releases), "appears_on": len(appears_on), "youtube_releases_unmatched": len(unmatched)},
        "releases": releases,
        "appears_on": appears_on,
        "spotify_top_tracks": top_tracks,
        "youtube_releases_unmatched": unmatched,
        "notes": [
            "Apple Music shelves: ArtistSingles (12), Albums (Nova Era), LatestReleaseFallback (Som do Vinho), plus "
            "Nova Era page 'more-by-artist' (adds Montra 2022 and Au Revoir #3 2021, not on the artist page shelf).",
            "Apple exposes no 'Aparece em' shelf for this artist; 'No Mapa' (Vilas Boas - Jab, 2026) found via the Top songs list.",
            "Spotify: open.spotify.com artist/discography pages are client-rendered (no data); embed/artist only returns top 10 tracks; "
            "get_access_token -> 403 and song.link -> 401 without auth, so per-single Spotify ids are mostly unavailable.",
        ],
    }
    save_json("discography.json", out)
    print(f"[disc] releases={len(releases)} appears_on={len(appears_on)} yt_unmatched={len(unmatched)} "
          f"spotify_ids={sum(1 for r in releases if r['spotify_track_id'])}", file=sys.stderr)


if __name__ == "__main__":
    main()
