import { atom, computed } from 'nanostores';

/**
 * Player state. Two halves:
 *   - what the user WANTS (queue, index, intent)  → written by track rows / dock buttons
 *   - what the engine REPORTS (status)           → written only by the PlayerDock island
 *
 * The dock owns the audio engine (HTMLAudioElement or Spotify embed) and reacts to
 * `intent`; everything else only reads `status`. No component talks to the engine directly.
 */
export interface PlayableTrack {
  id: string;
  title: string; // plain text, no swap markup
  artists: string[];
  cover: string; // resolved image URL
  durationMs?: number;
  audio?: string;
  spotifyId?: string;
  youtubeId?: string;
  /** Where to send people who want the full track elsewhere */
  links?: { spotify?: string; youtube?: string; apple?: string };
}

export type Intent = 'play' | 'pause';

export interface Status {
  playing: boolean;
  buffering: boolean;
  positionMs: number;
  durationMs: number;
  engine: 'audio' | 'spotify' | 'none';
  error?: string;
}

export const queue = atom<PlayableTrack[]>([]);
export const currentIndex = atom(-1);
export const intent = atom<Intent>('pause');
/** Monotonic counter so pressing "play" on the already-current track restarts it. */
export const playRequest = atom(0);
export const status = atom<Status>({
  playing: false,
  buffering: false,
  positionMs: 0,
  durationMs: 0,
  engine: 'none',
});

export const currentTrack = computed([queue, currentIndex], (q, i) => q[i] ?? null);
export const isOpen = computed(currentTrack, (t) => t !== null);

export function playTrack(track: PlayableTrack, list: PlayableTrack[] = [track]) {
  const i = Math.max(0, list.findIndex((t) => t.id === track.id));
  queue.set(list);
  currentIndex.set(i);
  intent.set('play');
  playRequest.set(playRequest.get() + 1);
}

export function togglePlay() {
  if (currentTrack.get() === null) return;
  intent.set(intent.get() === 'play' ? 'pause' : 'play');
}

export function next() {
  const q = queue.get();
  if (!q.length) return;
  currentIndex.set((currentIndex.get() + 1) % q.length);
  intent.set('play');
  playRequest.set(playRequest.get() + 1);
}

export function prev() {
  const q = queue.get();
  if (!q.length) return;
  // Standard behaviour: after 3 s, "prev" restarts the current track.
  if (status.get().positionMs > 3000) {
    playRequest.set(playRequest.get() + 1);
    intent.set('play');
    return;
  }
  currentIndex.set((currentIndex.get() - 1 + q.length) % q.length);
  intent.set('play');
  playRequest.set(playRequest.get() + 1);
}

export function close() {
  intent.set('pause');
  currentIndex.set(-1);
  queue.set([]);
}

/** Helper used by track rows to know if THEY are the active one. */
export const isCurrent = (id: string) => currentTrack.get()?.id === id;
