import { RefObject, useEffect } from 'react';

/**
 * Lazy images in an `overflow: hidden` slide track only start loading once they slide into
 * view, so the next slide pops in mid-transition. Switching the given slides' images to
 * `loading="eager"` makes the browser fetch them now; the others stay lazy.
 *
 * @param trackRef element whose direct children are the slides
 * @param indexes slides to preload (out-of-range indexes are ignored)
 */
export const usePreloadSlideImages = (trackRef: RefObject<HTMLElement | null>, indexes: number[]) => {
  const key = indexes.join(',');

  useEffect(() => {
    const slides = trackRef.current?.children;
    if (!slides) return;

    for (const index of key.split(',').map(Number)) {
      slides[index]?.querySelectorAll('img[loading="lazy"]').forEach((img) => img.setAttribute('loading', 'eager'));
    }
  }, [trackRef, key]);
};
