import type { ImageMetadata } from 'astro';
import cover from '../assets/album/cover.jpg';
import cidade from '../assets/album/cidade-cover.jpg';
import vista from '../assets/album/vista-cover.jpg';
import fatotreino from '../assets/album/fatotreino-cover.jpg';
import tripeiro from '../assets/album/tripeiro-cover.jpg';
import dinero from '../assets/album/dinero-cover.jpg';
import novaera from '../assets/album/novaera-cover.jpg';
import faroeste from '../assets/album/faroeste-cover.jpg';
import real from '../assets/album/real-cover.jpg';

/**
 * A track the player can handle. Playback engine is chosen per track:
 *   - `audio`      → our own file (public/audio/…) — full control, no third party
 *   - `spotifyId`  → Spotify embed (full track for logged-in Spotify users, 30 s preview otherwise)
 * Everything else only gets the "Ouvir em" links.
 */
export interface Track {
  id: string;
  n: number;
  /** Title with swap-letter markup: the letter between pipes is rendered in blackletter, e.g. "|N|AÇÃO" */
  title: string;
  artists: string[];
  durationMs: number;
  cover: ImageMetadata;
  audio?: string;
  spotifyId?: string;
  youtubeId?: string;
  appleUrl?: string;
}

export interface Album {
  id: string;
  title: string;
  releaseDate: string;
  cover: ImageMetadata;
  label: string;
  year: number;
  credits: { role: string; name: string }[];
  quote: string;
  links: { spotify: string; youtube: string; apple: string };
  tracks: Track[];
}

const ms = (m: number, s: number) => (m * 60 + s) * 1000;
const feat = (...others: string[]) => ['GUIMA', ...others];

export const album: Album = {
  id: 'nova-era',
  title: '|N|OVA |E|RA',
  releaseDate: '2025-09-26',
  year: 2025,
  cover,
  label: '2ºPiso',
  quote:
    'Desde que começou a autodesenhar-se que a ideia sempre foi fazer um disco para conquistar a minha cidade e escrever o meu nome nela. Recebi todo o apoio de quem me ajudou a fazê-lo, "ganhei props lá da velha escola" e foi o meu big move para meter o pé na porta.',
  credits: [
    { role: 'Produção / Captação / Arranjos', name: 'Vilas Boas' },
    { role: 'Mix / Master', name: 'Pedro "Pi" Baptista' },
  ],
  links: {
    spotify: 'https://open.spotify.com/intl-pt/album/6p09Uni78yGjaL6f4iKBy2',
    youtube: 'https://www.youtube.com/playlist?list=PLm7xguAI-cPFRf2KHWVnDG6ndz6Bv9iFh',
    apple: 'https://music.apple.com/pt/album/nova-era/1838734207',
  },
  tracks: [
    { id: 'nacao', n: 1, title: '|N|AÇÃO', artists: feat('Vilas Boas', 'DJ Suprhyme'), durationMs: ms(1, 26), cover, spotifyId: '4LFCeT7agl0KwgIMzSGPUE', youtubeId: 'RQiltI08mL8', appleUrl: 'https://music.apple.com/pt/song/na%C3%A7%C3%A3o-feat-dj-suprhyme/1838734208' },
    { id: 'cidade', n: 2, title: '|C|IDADE', artists: feat('Vilas Boas'), durationMs: ms(2, 44), cover: cidade, spotifyId: '4OCculJ1NJhClQegSV5aDb', youtubeId: '3prVNdJc_nQ', appleUrl: 'https://music.apple.com/pt/song/cidade/1838734209' },
    { id: 'vista', n: 3, title: 'VI|S|TA', artists: feat('Vilas Boas', 'CRAKiDD'), durationMs: ms(2, 26), cover: vista, spotifyId: '6inHoMhU0im04A9xYw6fBW', youtubeId: 'IBiimSgOt4o', appleUrl: 'https://music.apple.com/pt/song/vista-feat-crakidd/1838734210' },
    { id: 'fato-de-treino', n: 4, title: 'FATO DE |T|REINO', artists: feat('Vilas Boas', 'QVXNO'), durationMs: ms(4, 11), cover: fatotreino, spotifyId: '5QdJNRcStWRegWBMDFdr1S', youtubeId: 'CH4PgS2IRzI', appleUrl: 'https://music.apple.com/pt/song/fato-de-treino-feat-qvxno/1838734362' },
    { id: 'terra-do-bom-vinho-pt-1', n: 5, title: 'TERRA DO |B|OM VINHO, PT. 1', artists: feat('Vilas Boas', 'DJ Suprhyme'), durationMs: ms(1, 8), cover, spotifyId: '747CB1qRL014Wz33IUzoLc', youtubeId: 'eVExfMcHLcc', appleUrl: 'https://music.apple.com/pt/song/terra-do-bom-vinho-pt-1-feat-dj-suprhyme/1838734363' },
    { id: 'tripeiro', n: 6, title: 'T|R|IPEIRO', artists: feat('Vilas Boas'), durationMs: ms(2, 58), cover: tripeiro, spotifyId: '3TyH1o7LLPPhN8DutjbZle', youtubeId: 'QlpkIzO9ApI', appleUrl: 'https://music.apple.com/pt/song/tripeiro/1838734364' },
    { id: 'dinero', n: 7, title: 'DIN|E|RO', artists: feat('Vilas Boas'), durationMs: ms(2, 34), cover: dinero, spotifyId: '2p5UqtLbhXBALiOA3qYPCM', youtubeId: 'ZzmFFRbmnm4', appleUrl: 'https://music.apple.com/pt/song/dinero/1838734365' },
    { id: 'nova-era', n: 8, title: '|N|OVA |E|RA', artists: feat('Vilas Boas'), durationMs: ms(3, 18), cover: novaera, spotifyId: '0cFv1CU1PvKUaCCDESnq57', youtubeId: 'KXUgdG57PZc', appleUrl: 'https://music.apple.com/pt/song/nova-era/1838734366' },
    { id: 'faroeste', n: 9, title: '|F|AROESTE', artists: feat('Vilas Boas', 'Tostaz'), durationMs: ms(3, 10), cover: faroeste, spotifyId: '0Exgh8GQuo280kR8GbdSfv', youtubeId: 'SvCkS2HRa4k', appleUrl: 'https://music.apple.com/pt/song/faroeste-feat-tostaz/1838734369' },
    { id: 'terra-do-bom-vinho-pt-2', n: 10, title: 'TERRA DO |B|OM VINHO, PT. 2', artists: feat('Vilas Boas', 'DJ Suprhyme'), durationMs: ms(0, 53), cover, spotifyId: '5lEcr9a2O6aTSpgeL3p4gr', youtubeId: 'NKKSt5GzdMo', appleUrl: 'https://music.apple.com/pt/song/terra-do-bom-vinho-pt-2-feat-dj-suprhyme/1838734370' },
    { id: 'real', n: 11, title: 'RE|A|L', artists: feat('Vilas Boas', 'DJ Score'), durationMs: ms(3, 38), cover: real, spotifyId: '2TGZCt3kzdnidGWCcf4Plm', youtubeId: 'YP-lrGLxLs0', appleUrl: 'https://music.apple.com/pt/song/real-feat-dj-score/1838734371' },
    { id: 'ate-sempre', n: 12, title: 'ATÉ SE|M|PRE', artists: feat('Vilas Boas'), durationMs: ms(3, 46), cover, spotifyId: '7cNePCnfzPARkAiFyoPZu9', youtubeId: 'DjjnOFDLkrQ', appleUrl: 'https://music.apple.com/pt/song/at%C3%A9-sempre/1838734373' },
    { id: 'mosaico', n: 13, title: 'MOSA|I|CO', artists: feat('Vilas Boas', 'Buster'), durationMs: ms(2, 8), cover, spotifyId: '2QIL7IAlAqu54ReGYoMvZW', youtubeId: 'cY4wRjR4ZT4', appleUrl: 'https://music.apple.com/pt/song/mosaico-feat-buster/1838734375' },
  ],
};

/** Plain-text title (no swap markup) for alt text, aria labels and the player. */
export const plainTitle = (t: string) => t.replace(/\|/g, '');
