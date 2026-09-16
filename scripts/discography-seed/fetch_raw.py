"""Step 0: download all public pages once into raw/ (re-run with --force to refresh)."""
import sys
from fetch_common import fetch

force = "--force" in sys.argv
SPOTIFY_ARTIST = "5A50LakS866v93RBazdFER"
SPOTIFY_ALBUM = "6p09Uni78yGjaL6f4iKBy2"
YT_CHANNEL = "UCBvDWmQcwseHN9JPHTHqhLw"
YT_PLAYLIST = "PLm7xguAI-cPFRf2KHWVnDG6ndz6Bv9iFh"

pages = [
    (f"https://open.spotify.com/embed/album/{SPOTIFY_ALBUM}", "spotify_embed_album.html"),
    (f"https://open.spotify.com/embed/artist/{SPOTIFY_ARTIST}", "spotify_embed_artist.html"),
    (f"https://open.spotify.com/oembed?url=https://open.spotify.com/album/{SPOTIFY_ALBUM}", "spotify_oembed_album.json"),
    (f"https://open.spotify.com/oembed?url=https://open.spotify.com/artist/{SPOTIFY_ARTIST}", "spotify_oembed_artist.json"),
    (f"https://open.spotify.com/artist/{SPOTIFY_ARTIST}", "spotify_artist.html"),
    (f"https://open.spotify.com/artist/{SPOTIFY_ARTIST}/discography/all", "spotify_artist_discography.html"),
    ("https://music.apple.com/pt/artist/guima/1590217436", "apple_artist.html"),
    ("https://music.apple.com/pt/album/nova-era/1838734207", "apple_album.html"),
    ("https://music.apple.com/pt/artist/guima/1590217436/see-all?section=singles", "apple_artist_singles.html"),
    ("https://music.apple.com/pt/artist/guima/1590217436/see-all?section=appears-on", "apple_artist_appears.html"),
    (f"https://www.youtube.com/playlist?list={YT_PLAYLIST}", "yt_playlist.html"),
    (f"https://www.youtube.com/channel/{YT_CHANNEL}/videos", "yt_channel_videos.html"),
    (f"https://www.youtube.com/channel/{YT_CHANNEL}", "yt_channel_home.html"),
    (f"https://www.youtube.com/channel/{YT_CHANNEL}/releases", "yt_channel_releases.html"),
]
for url, name in pages:
    try:
        fetch(url, name, force=force)
    except Exception as e:
        print(f"[fetch] FAILED {url}: {e}", file=sys.stderr)
