import { useEffect, useState } from 'react';

/** Live `prefers-reduced-motion: reduce` value; false on the server and where matchMedia is unavailable. */
export const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (!query) return;

    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return reduced;
};
