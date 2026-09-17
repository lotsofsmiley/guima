/**
 * Everything the artist released besides the showcase album: singles, features,
 * and the YouTube-only freestyles (the "Au Revoir" series) and live sets.
 *
 * Source of truth is `discography.json`, seeded from public Spotify / Apple Music /
 * YouTube pages on 2026-09-16 with the scripts in scripts/discography-seed/ (no API keys;
 * re-run them and re-curate when a new single drops). Pre-album singles (Cidade,
 * Faroeste, …) are deliberately NOT here: they live in the album tracklist, each with
 * its own video link.
 *
 * Covers are committed to src/assets/singles/<id>.jpg (downloaded once from the URL kept
 * in `coverSource`) so the page makes no third-party request until someone presses play —
 * which is what the privacy and cookie pages promise.
 */
import type { ImageMetadata } from 'astro';
import raw from './discography.json';

export type ReleaseType = 'single' | 'ep' | 'album' | 'mixtape' | 'feature' | 'video' | 'live';

export interface Release {
  id: string;
  title: string;
  type: ReleaseType;
  /** YYYY-MM-DD, YYYY-MM or YYYY when only the year is known (YouTube relative dates) */
  releaseDate: string;
  artists: string[];
  /** Where the committed cover came from (provenance only; never rendered) */
  coverSource: string;
  /** Short context line shown under the title (e.g. "Prod. K1X") */
  note?: string;
  /** Own clip in public/audio/ → native player; otherwise the Spotify embed is used */
  audio?: string;
  spotifyId?: string;
  spotifyUrl?: string;
  appleUrl?: string;
  youtubeId?: string;
  /** First track's Spotify id, for the player (singles = same as the release) */
  playSpotifyId?: string;
}

const coverFiles = import.meta.glob<{ default: ImageMetadata }>('../assets/singles/*.jpg', { eager: true });
const coverById = new Map(
  Object.entries(coverFiles).map(([path, m]) => [path.split('/').pop()!.replace(/\.jpg$/, ''), m.default]),
);

export const releases: Release[] = (raw as Release[])
  .filter((r) => {
    if (coverById.has(r.id)) return true;
    console.warn(`[discography] no cover for "${r.id}" in src/assets/singles — release skipped`);
    return false;
  })
  .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));

export const coverOf = (r: Release): ImageMetadata => coverById.get(r.id)!;

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
