/**
 * Everything the artist released besides the showcase album: singles, features,
 * and the YouTube-only freestyles (the "Au Revoir" series) and live sets.
 *
 * Source of truth is `discography.json`, seeded from public Spotify / Apple Music /
 * YouTube pages on 2026-09-16 (scripts kept in the vault project note). Pre-album
 * singles (Cidade, Faroeste, …) are deliberately NOT here: they live in the album
 * tracklist, each with its own video link. Covers are remote CDN URLs on purpose —
 * they belong to the platforms and change when the artist updates them.
 */
import raw from './discography.json';

export type ReleaseType = 'single' | 'ep' | 'album' | 'mixtape' | 'feature' | 'video' | 'live';

export interface Release {
  id: string;
  title: string;
  type: ReleaseType;
  /** YYYY-MM-DD, YYYY-MM or YYYY when only the year is known (YouTube relative dates) */
  releaseDate: string;
  artists: string[];
  cover: string;
  /** Short context line shown under the title (e.g. "Prod. K1X") */
  note?: string;
  spotifyId?: string;
  spotifyUrl?: string;
  appleUrl?: string;
  youtubeId?: string;
  /** First track's Spotify id, for the player (singles = same as the release) */
  playSpotifyId?: string;
}

export const releases: Release[] = (raw as Release[]).sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));

export const yearOf = (r: Release) => r.releaseDate.slice(0, 4);

export const typeLabel: Record<ReleaseType, string> = {
  single: 'Single',
  ep: 'EP',
  album: 'Álbum',
  mixtape: 'Mixtape',
  feature: 'Participação',
  video: 'Freestyle',
  live: 'Ao vivo',
};
