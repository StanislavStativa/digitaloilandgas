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
  // Server/no-JS render shows the final value; the client resets to 0 only once it can animate
  const [current, setCurrent] = useState(end);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      setCurrent(end);
      return;
    }

    setCurrent(0);
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          setCurrent(end * easeOutCubic(progress));
          if (progress < 1) frame = requestAnimationFrame(tick);
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
        {formatNumber(current, decimals)}
      </span>
    </span>
  );
};
