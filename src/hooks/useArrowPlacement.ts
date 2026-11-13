import { RefObject, useEffect, useRef } from 'react';

const readPx = (styles: CSSStyleDeclaration, name: string) => parseFloat(styles.getPropertyValue(name)) || 0;

/**
 * Image Slider arrows: measures the active image's rendered width and writes it to
 * `--image-slider-image-width` on the root; the CSS derives the arrow position from it
 * (outside with a gap when there is room, sliding gradually over the image otherwise).
 * `data-arrows` = "outside" | "inside" reports whether they currently fit fully outside.
 *
 * Uses real rendered sizes (no breakpoints): the viewport and every slide image are observed,
 * so container resizes without a window resize (column splitters, Pages editor panels) and
 * late image loads are caught. Writes go straight to the DOM to avoid re-renders; arrows are
 * absolutely positioned, so writing them can't resize anything observed (no observer loop).
 */
export const useArrowPlacement = (
  rootRef: RefObject<HTMLDivElement | null>,
  viewportRef: RefObject<HTMLDivElement | null>,
  activeIndex: number,
  enabled: boolean,
  slideCount: number,
) => {
  const activeIndexRef = useRef(activeIndex);
  const scheduleRef = useRef<() => void>(undefined);

  useEffect(() => {
    const root = rootRef.current;
    const viewport = viewportRef.current;
    if (!enabled || !root || !viewport) return;

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      const containerWidth = viewport.clientWidth;
      const slide = viewport.querySelectorAll<HTMLElement>('.image-slider__slide')[activeIndexRef.current];
      const imageWidth = slide?.querySelector('img')?.getBoundingClientRect().width || containerWidth;
      const renderedWidth = Math.min(imageWidth, containerWidth);

      const styles = getComputedStyle(root);
      const required = readPx(styles, '--image-slider-arrow-size') + readPx(styles, '--image-slider-arrow-gap');
      const placement = (containerWidth - renderedWidth) / 2 >= required ? 'outside' : 'inside';

      root.style.setProperty('--image-slider-image-width', `${renderedWidth}px`);
      if (root.dataset.arrows !== placement) root.dataset.arrows = placement;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    scheduleRef.current = schedule;
    measure();

    // ResizeObserver already runs once per frame after layout: measure right there, so the
    // arrows follow the container in the same frame (writing the variable can't resize observed nodes)
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : undefined;
    if (observer) {
      observer.observe(viewport);
      viewport.querySelectorAll('img').forEach((img) => observer.observe(img));
    } else {
      window.addEventListener('resize', schedule);
    }
    // load doesn't bubble; capture it to catch images that finish after mount
    root.addEventListener('load', schedule, true);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', schedule);
      root.removeEventListener('load', schedule, true);
      scheduleRef.current = undefined;
    };
  }, [rootRef, viewportRef, enabled, slideCount]);

  // The active image may have a different width: re-place the arrows for it
  useEffect(() => {
    activeIndexRef.current = activeIndex;
    scheduleRef.current?.();
  }, [activeIndex]);
};
