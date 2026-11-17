'use client';
import { FC, useEffect, useRef, useState } from 'react';
import { VideoPlayerProps } from './Video.props';

type PlaybackStatus = 'loading' | 'playing' | 'failed';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Muted, looping, inline background video over its poster.
 * The poster stays until the video actually renders frames (`playing`), and for good when the
 * video can't load, decode or autoplay, or the visitor prefers reduced motion.
 */
export const VideoPlayer: FC<VideoPlayerProps> = ({ src, mimeType, poster }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<PlaybackStatus>('loading');
  // null until known on the client: SSR markup neither autoplays nor preloads
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);

  // Follow the reduced-motion preference live
  useEffect(() => {
    const query = typeof window.matchMedia === 'function' ? window.matchMedia(REDUCED_MOTION_QUERY) : null;
    const update = () => setReducedMotion(Boolean(query?.matches));
    update();
    query?.addEventListener('change', update);
    return () => query?.removeEventListener('change', update);
  }, []);

  // Start (or stop) playback once the preference is known; one attempt per source, no retries
  useEffect(() => {
    const video = videoRef.current;
    if (!video || reducedMotion === null) return;

    if (reducedMotion) {
      video.pause();
      return;
    }
    if (mimeType && !video.canPlayType(mimeType)) {
      setStatus('failed');
      return;
    }

    video.muted = true; // the property is what autoplay policies check
    video.play()?.catch((error: unknown) => {
      // NotAllowedError (autoplay blocked) / AbortError (paused meanwhile): keep the poster, the video may still start later.
      // NotSupportedError: the source can't be played at all.
      if (error instanceof DOMException && error.name === 'NotSupportedError') setStatus('failed');
    });
  }, [reducedMotion, src, mimeType]);

  // A failed video leaves no element behind: just the poster (or nothing)
  if (status === 'failed') {
    return poster ? (
      <div className="video" data-state="failed">
        <div className="video__poster">{poster}</div>
      </div>
    ) : null;
  }

  // Reduced motion and no poster: an unloaded video would only reserve an empty box
  if (reducedMotion && !poster) return null;

  const isPlaying = status === 'playing' && reducedMotion === false;
  const canAutoplay = reducedMotion === false;

  return (
    <div className="video" data-state={isPlaying ? 'playing' : 'loading'} data-has-poster={poster ? 'true' : undefined}>
      <video
        ref={videoRef}
        className="video__media"
        src={src}
        autoPlay={canAutoplay}
        muted
        loop
        playsInline
        preload={canAutoplay ? 'auto' : 'none'}
        disablePictureInPicture
        disableRemotePlayback
        aria-hidden="true"
        tabIndex={-1}
        onPlaying={() => setStatus('playing')}
        onError={() => setStatus('failed')}
      />
      {poster && <div className="video__poster">{poster}</div>}
    </div>
  );
};
