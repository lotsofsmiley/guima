import { useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import { siSpotify, siYoutube, siApplemusic } from 'simple-icons';
import { currentTrack, intent, playRequest, status, togglePlay, next, prev, close, isOpen } from '../../stores/player';
import { formatDuration } from '../../lib/format';

/**
 * Bottom player dock. Owns the audio engine; everything else only reads `status`.
 *
 * Engine per track:
 *   - track.audio     → <audio> element (our files) with our own transport + seek bar
 *   - track.spotifyId → Spotify embed via the iFrame API. The embed IS the transport in
 *                       that case (one set of controls, not two); we only add the title,
 *                       the platform links and a close button around it.
 */
type SpotifyController = {
  loadUri: (uri: string) => void;
  play: () => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seek: (s: number) => void;
  destroy: () => void;
  addListener: (ev: string, cb: (e: { data: any }) => void) => void;
};
declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: { createController: (el: HTMLElement, opts: Record<string, unknown>, cb: (c: SpotifyController) => void) => void }) => void;
  }
}

const SPOTIFY_API = 'https://open.spotify.com/embed/iframe-api/v1';

const Brand = ({ path }: { path: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={path} /></svg>
);

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

  // Reserve exactly the dock's height at the bottom of the page (footer stays reachable).
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const apply = () => document.documentElement.style.setProperty('--dock-h', open ? `${el.offsetHeight}px` : '0px');
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  // ---- Spotify engine bootstrap (script loaded once, on the first Spotify track)
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
            // The embed has its own play button: keep our intent in sync with what the user did there.
            if (!d.isPaused && intent.get() !== 'play') intent.set('play');
            if (d.isPaused && d.position > 0 && d.position < d.duration - 1500 && intent.get() !== 'pause') intent.set('pause');
            // End of track → next
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

  // ---- React to track / play request changes
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

  // ---- React to play/pause intent (audio engine; the Spotify embed handles its own button)
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

  // ---- <audio> events → status
  const onTime = () => {
    const a = audio.current!;
    status.set({ ...status.get(), engine: 'audio', positionMs: a.currentTime * 1000, durationMs: (a.duration || 0) * 1000 });
  };
  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audio.current) audio.current.currentTime = Number(e.target.value) / 1000;
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

      {/* progress hairline across the top (own-audio engine only) */}
      {!spotifyEngine && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-ink-700" aria-hidden="true">
          <div className="h-full bg-sky-400 transition-[width] duration-200" style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="wrap py-2.5">
        <div className="flex items-center gap-3">
          {/* now playing */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {track && <img src={track.cover} alt="" width={44} height={44} className="h-11 w-11 shrink-0 object-cover bg-ink-800" />}
            <div className="min-w-0">
              <p className="truncate text-[0.95rem] font-medium uppercase tracking-wide">{track?.title ?? ''}</p>
              <p className="truncate text-xs text-cream-500">{track?.artists.join(', ')}</p>
            </div>
          </div>

          {/* transport + seek — own-audio engine only */}
          {!spotifyEngine && (
            <>
              <div className="flex items-center gap-1">
                <button className="icon-btn hidden sm:inline-grid" type="button" onClick={prev} aria-label="Anterior"><SkipBack size={20} /></button>
                <button
                  className="icon-btn bg-cream-100 text-ink-950 hover:bg-sky-400"
                  type="button"
                  onClick={togglePlay}
                  aria-label={st.playing ? 'Pausar' : 'Reproduzir'}
                  aria-pressed={st.playing}
                >
                  {st.playing ? <Pause size={20} /> : <Play size={20} className="translate-x-px" />}
                </button>
                <button className="icon-btn" type="button" onClick={next} aria-label="Seguinte"><SkipForward size={20} /></button>
              </div>
              <div className="hidden items-center gap-3 md:flex">
                <span className="tabular text-xs text-cream-500">{formatDuration(st.positionMs)}</span>
                <input
                  type="range"
                  className="w-40 accent-sky-400"
                  min={0}
                  max={Math.max(1, st.durationMs)}
                  value={Math.min(st.positionMs, st.durationMs || 0)}
                  onChange={seek}
                  aria-label="Posição"
                />
                <span className="tabular text-xs text-cream-500">{formatDuration(st.durationMs)}</span>
              </div>
            </>
          )}

          {/* platform links + close */}
          <ul className="hidden items-center gap-0.5 text-buff-400 sm:flex" aria-label="Ouvir noutra plataforma">
            {track?.links?.spotify && <li><a className="icon-btn h-9 w-9" href={track.links.spotify} target="_blank" rel="noopener" aria-label="Abrir no Spotify"><Brand path={siSpotify.path} /></a></li>}
            {track?.links?.youtube && <li><a className="icon-btn h-9 w-9" href={track.links.youtube} target="_blank" rel="noopener" aria-label="Abrir no YouTube"><Brand path={siYoutube.path} /></a></li>}
            {track?.links?.apple && <li><a className="icon-btn h-9 w-9" href={track.links.apple} target="_blank" rel="noopener" aria-label="Abrir na Apple Music"><Brand path={siApplemusic.path} /></a></li>}
          </ul>
          {spotifyEngine && (
            <div className="flex items-center gap-1 sm:hidden">
              <button className="icon-btn" type="button" onClick={prev} aria-label="Anterior"><SkipBack size={18} /></button>
              <button className="icon-btn" type="button" onClick={next} aria-label="Seguinte"><SkipForward size={18} /></button>
            </div>
          )}
          <button className="icon-btn" type="button" onClick={close} aria-label="Fechar leitor"><X size={20} /></button>
        </div>

        {/* Spotify embed = the transport for Spotify-sourced tracks. Visible per Spotify's terms. */}
        <div className={spotifyEngine ? 'mt-2' : 'hidden'}>
          <div className="flex items-center gap-2">
            <button className="icon-btn hidden h-9 w-9 sm:inline-grid" type="button" onClick={prev} aria-label="Anterior"><SkipBack size={16} /></button>
            <div ref={spotifyHost} className="h-20 min-w-0 flex-1 overflow-hidden rounded-xl bg-ink-800" />
            <button className="icon-btn hidden h-9 w-9 sm:inline-grid" type="button" onClick={next} aria-label="Seguinte"><SkipForward size={16} /></button>
          </div>
          {st.error && <p className="mt-1 text-xs text-buff-300">{st.error}</p>}
          <p className="mt-1 text-[0.7rem] text-cream-500">Faixa completa com sessão iniciada no Spotify; sem sessão, pré-visualização de 30 s.</p>
        </div>
      </div>
    </div>
  );
}
