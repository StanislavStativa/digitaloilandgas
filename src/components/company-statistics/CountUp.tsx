'use client';
import { FC, useEffect, useRef, useState } from 'react';

interface CountUpProps {
  /** Target number, e.g. 4.4 */
  end: number;
  /** Fraction digits to keep, e.g. 2 for "4.40" */
  decimals: number;
  /** Animation length in ms */
  duration?: number;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const formatNumber = (n: number, decimals: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);

/**
 * Counts from 0 to `end` once the element scrolls into view.
 * A hidden copy of the final value reserves the width so the layout doesn't shift while counting.
 */
export const CountUp: FC<CountUpProps> = ({ end, decimals, duration = 2000 }) => {
  const ref = useRef<HTMLSpanElement>(null);
  // Animation progress 0..1, not the value: the shown number always follows `end`.
  // Server/no-JS/reduced-motion render stays at 1 (the final value).
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Off-screen: wait at 0 so the count starts from 0 when it scrolls in
        if (!entry.isIntersecting) {
          setProgress(0);
          return;
        }
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const next = Math.min((now - start) / duration, 1);
          setProgress(next);
          if (next < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [end, duration]);

  const final = formatNumber(end, decimals);

  return (
    <span ref={ref} className="count-up" aria-label={final}>
      <span className="count-up__placeholder" aria-hidden="true">
        {final}
      </span>
      <span className="count-up__value" aria-hidden="true">
        {formatNumber(end * easeOutCubic(progress), decimals)}
      </span>
    </span>
  );
};
