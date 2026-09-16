import { useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { faPause, faPlay, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FaIcon } from './FaIcon';
import { currentTrack, intent, playRequest, status, togglePlay, next, close, isOpen } from '../../stores/player';
import { formatDuration } from '../../lib/format';

/**
 * Bottom player dock — one strip, nothing else.
 *
 *   - track.audio     → <audio> element: cover · title · play/pause · time · close,
 *                       with a hairline progress bar along the top edge
 *   - track.spotifyId → the Spotify embed is the whole player (it has its own button);
 *                       we only add the close button
 *
 * Clicking a track anywhere on the page writes to the store; this island owns the engine.
 */
type SpotifyController = {
  loadUri: (uri: string) => void;
  play: () => void;
  pause: () => void;
  resume: () => void;
  destroy: () => void;
  addListener: (ev: string, cb: (e: { data: any }) => void) => void;
};
declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: { createController: (el: HTMLElement, opts: Record<string, unknown>, cb: (c: SpotifyController) => void) => void }) => void;
  }
}

const SPOTIFY_API = 'https://open.spotify.com/embed/iframe-api/v1';

export default function PlayerDock() {
  const track = useStore(currentTrack);
  const open = useStore(isOpen);
  const want = useStore(intent);
  const req = useStore(playRequest);
  const st = useStore(status);

  const root = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const spotifyHost = useRef<HTMLDivElement>(null);
  const spotify = useRef<SpotifyController | null>(null);
  const spotifyReady = useRef<Promise<void> | null>(null);
  const loadedUri = useRef<string | null>(null);

  // Reserve exactly the dock's height at the bottom of the page.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const apply = () => document.documentElement.style.setProperty('--dock-h', open ? `${el.offsetHeight}px` : '0px');
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const ensureSpotify = () => {
    if (spotifyReady.current) return spotifyReady.current;
    spotifyReady.current = new Promise<void>((resolve) => {
      window.onSpotifyIframeApiReady = (api) => {
        const mount = document.createElement('div');
        spotifyHost.current!.replaceChildren(mount);
        api.createController(mount, { width: '100%', height: 80, uri: 'spotify:track:' + (currentTrack.get()?.spotifyId ?? '') }, (c) => {
          spotify.current = c;
          c.addListener('ready', () => resolve());
          c.addListener('playback_update', (e) => {
            const d = e.data as { isPaused: boolean; isBuffering: boolean; duration: number; position: number };
            status.set({ ...status.get(), engine: 'spotify', playing: !d.isPaused, buffering: d.isBuffering, positionMs: d.position, durationMs: d.duration });
            if (!d.isPaused && intent.get() !== 'play') intent.set('play');
            if (d.isPaused && d.position > 0 && d.position < d.duration - 1500 && intent.get() !== 'pause') intent.set('pause');
            if (d.isPaused && d.duration > 0 && d.position >= d.duration - 1000) next();
          });
        });
      };
      const s = document.createElement('script');
      s.src = SPOTIFY_API;
      s.async = true;
      document.head.appendChild(s);
    });
    return spotifyReady.current;
  };

  useEffect(() => {
    if (!track) {
      audio.current?.pause();
      spotify.current?.pause();
      status.set({ playing: false, buffering: false, positionMs: 0, durationMs: 0, engine: 'none' });
      return;
    }
    if (track.audio) {
      spotify.current?.pause();
      const a = audio.current!;
      if (a.src !== new URL(track.audio, location.href).href) {
        a.src = track.audio;
        a.load();
      } else {
        a.currentTime = 0;
      }
      status.set({ ...status.get(), engine: 'audio', positionMs: 0, durationMs: track.durationMs ?? 0, error: undefined });
      if (intent.get() === 'play') a.play().catch((e) => status.set({ ...status.get(), playing: false, error: String(e) }));
      return;
    }
    if (track.spotifyId) {
      audio.current?.pause();
      const uri = 'spotify:track:' + track.spotifyId;
      status.set({ ...status.get(), engine: 'spotify', buffering: true, positionMs: 0, durationMs: track.durationMs ?? 0, error: undefined });
      ensureSpotify().then(() => {
        const c = spotify.current!;
        if (loadedUri.current !== uri) {
          c.loadUri(uri);
          loadedUri.current = uri;
        }
        if (intent.get() === 'play') c.play();
      });
      return;
    }
    status.set({ playing: false, buffering: false, positionMs: 0, durationMs: 0, engine: 'none', error: 'Sem fonte de áudio' });
  }, [track?.id, req]);

  useEffect(() => {
    if (!track) return;
    if (track.audio && audio.current) {
      if (want === 'play') audio.current.play().catch(() => undefined);
      else audio.current.pause();
    } else if (track.spotifyId && spotify.current) {
      if (want === 'play' && !status.get().playing) spotify.current.resume();
      if (want === 'pause' && status.get().playing) spotify.current.pause();
    }
  }, [want]);

  const onTime = () => {
    const a = audio.current!;
    status.set({ ...status.get(), engine: 'audio', positionMs: a.currentTime * 1000, durationMs: (a.duration || 0) * 1000 });
  };

  const spotifyEngine = Boolean(track?.spotifyId && !track?.audio);
  const pct = st.durationMs ? Math.min(100, (st.positionMs / st.durationMs) * 100) : 0;

  return (
    <div
      ref={root}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-buff-400/30 bg-ink-900/95 text-cream-100 backdrop-blur-md transition-transform duration-400 ease-[var(--ease-out-expo)] ${open ? 'translate-y-0' : 'translate-y-full'}`}
      role="region"
      aria-label="Leitor"
      aria-hidden={!open}
      inert={!open}
    >
      <audio
        ref={audio}
        preload="metadata"
        onPlay={() => status.set({ ...status.get(), playing: true, buffering: false })}
        onPause={() => status.set({ ...status.get(), playing: false })}
        onWaiting={() => status.set({ ...status.get(), buffering: true })}
        onPlaying={() => status.set({ ...status.get(), buffering: false })}
        onTimeUpdate={onTime}
        onDurationChange={onTime}
        onEnded={() => next()}
        onError={() => status.set({ ...status.get(), playing: false, error: 'Não foi possível reproduzir a faixa.' })}
      />

      {!spotifyEngine && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-ink-700" aria-hidden="true">
          <div className="h-full bg-sky-400 transition-[width] duration-200" style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="wrap flex items-center gap-3 py-2.5">
        {spotifyEngine ? (
          <div ref={spotifyHost} className="h-20 min-w-0 flex-1 overflow-hidden rounded-xl bg-ink-800" />
        ) : (
          <>
            {track && <img src={track.cover} alt="" width={48} height={48} className="h-12 w-12 shrink-0 object-cover bg-ink-800" />}
            <div className="min-w-0 flex-1">
              <p className="truncate uppercase tracking-wide">{track?.title ?? ''}</p>
              <p className="truncate text-base text-cream-500">{track?.artists.join(', ')}</p>
            </div>
            <button
              className="icon-btn bg-cream-100 text-ink-950 hover:bg-sky-400"
              type="button"
              onClick={togglePlay}
              aria-label={st.playing ? 'Pausar' : 'Reproduzir'}
              aria-pressed={st.playing}
            >
              {st.playing ? <FaIcon icon={faPause} size={18} /> : <FaIcon icon={faPlay} size={18} className="translate-x-px" />}
            </button>
            <span className="tabular hidden text-base text-cream-500 sm:inline">{formatDuration(st.positionMs)} / {formatDuration(st.durationMs)}</span>
          </>
        )}
        <button className="icon-btn" type="button" onClick={close} aria-label="Fechar leitor"><FaIcon icon={faXmark} size={24} /></button>
      </div>
      {st.error && <p className="wrap pb-2 text-base text-buff-300">{st.error}</p>}
    </div>
  );
}
