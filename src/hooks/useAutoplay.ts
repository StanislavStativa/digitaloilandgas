import { RefObject, useEffect, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

interface UseAutoplayOptions {
  /** Element whose hover / focus / visibility pauses the autoplay */
  rootRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  /** Delay between ticks, ms */
  interval: number;
  /** Current position; any change restarts the countdown (e.g. after manual navigation) */
  position: number;
  /** Advances the content; keep it stable (useCallback) to avoid restarting the timer */
  onTick: () => void;
}

/**
 * Runs `onTick` every `interval` ms while enabled. Pauses while the root is hovered,
 * has keyboard focus inside, is scrolled off-screen, the tab is hidden, or the user
 * prefers reduced motion. Listeners exist only while enabled, so a disabled autoplay
 * causes no re-renders on hover/focus. Returns whether it is currently running.
 */
export const useAutoplay = ({ rootRef, enabled, interval, position, onTick }: UseAutoplayOptions) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root) return;

    let hovered = false;
    let focused = false;
    let offscreen = false;
    let hidden = false;
    const update = () => setIsPaused(hovered || focused || offscreen || hidden);

    const onMouseEnter = () => {
      hovered = true;
      update();
    };
    const onMouseLeave = () => {
      hovered = false;
      update();
    };
    const onFocusIn = () => {
      focused = true;
      update();
    };
    const onFocusOut = (event: FocusEvent) => {
      if (root.contains(event.relatedTarget as Node | null)) return;
      focused = false;
      update();
    };
    const onVisibilityChange = () => {
      hidden = document.visibilityState === 'hidden';
      update();
    };
    const observer =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(([entry]) => {
            offscreen = !entry.isIntersecting;
            update();
          })
        : undefined;

    root.addEventListener('mouseenter', onMouseEnter);
    root.addEventListener('mouseleave', onMouseLeave);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);
    document.addEventListener('visibilitychange', onVisibilityChange);
    observer?.observe(root);

    return () => {
      root.removeEventListener('mouseenter', onMouseEnter);
      root.removeEventListener('mouseleave', onMouseLeave);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      observer?.disconnect();
      setIsPaused(false);
    };
  }, [rootRef, enabled]);

  const isRunning = enabled && !prefersReducedMotion && !isPaused;

  // One timer at a time, re-armed on every position change
  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setTimeout(() => {
      // a tab opened in the background never fires visibilitychange: skip ticks while hidden
      if (document.visibilityState !== 'hidden') onTick();
    }, interval);
    return () => window.clearTimeout(timer);
  }, [isRunning, position, interval, onTick]);

  return isRunning;
};
