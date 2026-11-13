import { PointerEvent, useRef } from 'react';

interface UseSwipeOptions {
  enabled: boolean;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  /** Minimal horizontal travel (px) for a gesture to count as a swipe */
  threshold?: number;
}

/**
 * Horizontal touch/pen swipe; returns pointer handlers to spread on the swipe area.
 * Mouse is ignored (drag would fight text/image selection). Pair it with
 * `touch-action: pan-y` on that element so vertical page scrolling stays native.
 */
export const useSwipe = ({ enabled, onSwipeLeft, onSwipeRight, threshold = 40 }: UseSwipeOptions) => {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (!enabled || event.pointerType === 'mouse' || !event.isPrimary) return;
      start.current = { x: event.clientX, y: event.clientY };
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      const from = start.current;
      start.current = null;
      if (!from) return;

      const dx = event.clientX - from.x;
      const dy = event.clientY - from.y;
      if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy)) return;
      if (dx < 0) onSwipeLeft();
      else onSwipeRight();
    },
    onPointerCancel: () => {
      start.current = null;
    },
  };
};
