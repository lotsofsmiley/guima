# GUIMA discography seed — report (2026-09-16)

## Outputs
- `album.json` — Nova Era, 13/13 tracks: Spotify track ids + previews, Apple song ids/URLs, YouTube ids (13/13 via playlist position + normalised title; track 5 by position only, video title lacks "Pt. 1"). Site listing vs sources: **0 discrepancies**.
- `discography.json` — 14 other releases (all singles, 2021–2026) + 1 "appears on" (*No Mapa*, Vilas Boas — *Jab*, 2026). 12/14 have a YouTube id (via Releases-tab playlists; the *Nova Era* single is tie-broken from the album by track count). Spotify id only for *Som do Vinho* (see limits).
- `youtube.json` — handle **@GUIMAVNG**; Videos tab = 24 long-form videos (continuation returns empty; the "81 vídeos" header includes Shorts); Nova Era playlist 13; Releases tab 29; home-page shelf 21.

## What worked / didn't
- Spotify: `embed/album` + `embed/artist` (`__NEXT_DATA__`) and `oembed` work. `open.spotify.com/artist/...` and `/discography/all` are client-rendered (no data). `get_access_token` -> 403; song.link -> 401. So per-single Spotify ids are unavailable; top-10 entries for album tracks point at album versions.
- Apple: artist page `serialized-server-data` (dict -> `data[0].data.sections`) + each release page's ld+json (dates, byArtist, tracks). `see-all?section=` URLs -> 404. No "Aparece em" shelf; *Jab* found via Top songs.
- YouTube: `ytInitialData` now uses `lockupViewModel` (not `playlistVideoRenderer`/`videoRenderer`); Releases tab uses `playlistRenderer`. Release-tab dates are YouTube listing dates, not release dates.

## Ambiguities
- Artist id 1590217436 **does** own Nova Era (album page links to it). But the same Apple entity lists *Aplicar* (Baile Funk, "e ai dj alan"), *Não Sou Só Mais Um* (Kalyelzin), *Magrela* — Brazilian collaborators, no official-channel video -> flagged `attribution_confidence` low/medium.
- YouTube Releases tab lists 10 "Guima"-bylined releases absent from Apple and from the official Videos tab (*Momentos Antes Da Erupção*, *notório*, *CHILL GUY*...) -> kept in `youtube_releases_unmatched`, unverified.
- YouTube-only content: *Au Revoir* #1/2/4/5/6, *ALIGNÉ*, Hard Club live set, *Nique Ta Mère* (premiere 2026-09-17).

## Re-run
```
python fetch_raw.py --force && python fetch_apple_releases.py --force
python fetch_youtube.py && python fetch_album.py && python fetch_discography.py
```
Raw pages cached in `raw/`; headers: desktop Chrome UA + `Accept-Language: pt-PT`.
