import { faInstagram, faSpotify, faItunesNote, faYoutube } from '@fortawesome/free-brands-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
import type { Social } from '../data/site';

/** Brand glyphs for the social links — the 2025 site's exact set (Apple Music = itunes-note). */
export const brandIcons: Record<Social['id'], IconDefinition> = {
  instagram: faInstagram,
  spotify: faSpotify,
  applemusic: faItunesNote,
  youtube: faYoutube,
};
