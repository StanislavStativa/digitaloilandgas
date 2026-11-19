'use client';
import { FC, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { cn } from 'lib/utils';
import { useSwipe } from 'hooks/useSwipe';
import { usePrefersReducedMotion } from 'hooks/usePrefersReducedMotion';
import { INTERACTIVE_CONTENT_SLIDE_DURATION, InteractiveContentSwitcherProps } from './ContentList.props';

type Direction = 1 | -1;

/**
 * Client part of the Content List "Interactive" variant. One `activeIndex` drives every layout:
 * - desktop: all cards + the active image; hover / focus / click selects a card;
 * - tablet/mobile: only the active card + its image, dots and swipe to switch.
 * The layout is chosen in CSS with container queries on the component's own width,
 * so resizes (window, column splitter, Pages panels) never remount or reset the selection.
 * The selection only changes on user interaction: leaving a card or the component keeps it.
 *
 * Tablet/mobile transition: the whole block (card + image) slides as one piece. Before the
 * switch, a static snapshot of the current block is laid over it; after React renders the new
 * item, the snapshot slides out and the real block slides in from the opposite side
 * (a dot to the right of the active one moves the content to the left, and vice versa).
 */
export const InteractiveContentSwitcher: FC<InteractiveContentSwitcherProps> = ({ entries, isEditing = false }) => {
  const mediaId = useId();
  const dotsRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  // React renders this node empty and never touches its children: the slide snapshot lives here
  const ghostHostRef = useRef<HTMLDivElement>(null);
  const pendingSlideRef = useRef<{ direction: Direction; ghost: HTMLElement } | null>(null);
  const animationsRef = useRef<Animation[]>([]);
  const prefersReducedMotion = usePrefersReducedMotion();

  const count = entries.length;
  const [index, setIndex] = useState(0);
  // Items can be removed while editing: keep the index in range without an extra render
  const active = Math.min(index, Math.max(count - 1, 0));

  // The dots are only displayed in the tablet/mobile layout, so their computed display
  // tells which layout the CSS picked (no width bookkeeping in JS)
  const isCompactLayout = () => {
    const dots = dotsRef.current;
    return Boolean(dots) && getComputedStyle(dots as HTMLElement).display !== 'none';
  };

  // Stops a running slide right away: the real block snaps to its final place, the snapshot goes
  const stopSlide = useCallback(() => {
    animationsRef.current.forEach((animation) => animation.cancel());
    animationsRef.current = [];
    ghostHostRef.current?.replaceChildren();
  }, []);

  /** Dots and swipe: select an item, plus the slide in the tablet/mobile layout */
  const slideTo = (target: number) => {
    // Swipes can step past either end
    const next = Math.min(Math.max(target, 0), count - 1);
    if (next === active) return;

    const layout = layoutRef.current;
    const ghostHost = ghostHostRef.current;
    const canSlide = !isEditing && !prefersReducedMotion && layout && ghostHost && typeof layout.animate === 'function' && isCompactLayout();
    if (canSlide) {
      // Rapid clicks: finish the previous slide instantly and start from what is on screen now
      stopSlide();
      const ghost = layout.cloneNode(true) as HTMLElement;
      ghost.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
      ghost.inert = true;
      ghostHost.appendChild(ghost);
      pendingSlideRef.current = { direction: next > active ? 1 : -1, ghost };
    }
    setIndex(next);
  };

  // Runs after the new item is in the DOM, before paint: no frame shows the new item unmoved
  useLayoutEffect(() => {
    const slide = pendingSlideRef.current;
    pendingSlideRef.current = null;
    const layout = layoutRef.current;
    if (!slide || !layout) return;

    // Leave a gap between the outgoing and incoming block while they travel
    const gap = parseFloat(getComputedStyle(layout).columnGap) || 0;
    const distance = layout.offsetWidth + gap;
    const timing: KeyframeAnimationOptions = { duration: INTERACTIVE_CONTENT_SLIDE_DURATION, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' };

    // fill: the snapshot stays off-screen after the last frame until it is removed (no flash of the old item)
    const outgoing = slide.ghost.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${-slide.direction * distance}px)` }], {
      ...timing,
      fill: 'forwards',
    });
    const incoming = layout.animate([{ transform: `translateX(${slide.direction * distance}px)` }, { transform: 'translateX(0)' }], timing);
    animationsRef.current = [outgoing, incoming];
    outgoing.onfinish = () => slide.ghost.remove();
  }, [active]);

  // Unmount mid-slide: cancel the animations
  useEffect(() => stopSlide, [stopSlide]);

  const swipeHandlers = useSwipe({
    enabled: count > 1 && !isEditing,
    onSwipeLeft: () => isCompactLayout() && slideTo(active + 1),
    onSwipeRight: () => isCompactLayout() && slideTo(active - 1),
  });

  return (
    <div className="interactive-content-list" {...swipeHandlers}>
      <div className="interactive-content-list__viewport">
        <div ref={layoutRef} className="interactive-content-list__layout">
          <div className="interactive-content-list__cards" role="list">
            {entries.map((entry, i) => {
              const isActive = i === active;
              return (
                <div
                  key={entry.id}
                  role="listitem"
                  className={cn('interactive-content-list__card', isActive && 'is-active')}
                  // Pages: no hover switching under the editor's pointer; clicking / focusing a field selects the card
                  onMouseEnter={isEditing ? undefined : () => setIndex(i)}
                  onFocus={() => setIndex(i)}
                  onClick={isEditing ? () => setIndex(i) : undefined}
                >
                  <h4 className="interactive-content-list__title">
                    {isEditing ? (
                      entry.title
                    ) : (
                      // Stretched over the whole card (CSS); the CTA link sits above it, so they never nest
                      <button
                        type="button"
                        className="interactive-content-list__select"
                        aria-controls={mediaId}
                        aria-current={isActive || undefined}
                        onClick={() => setIndex(i)}
                      >
                        {entry.title}
                      </button>
                    )}
                  </h4>
                  {entry.body}
                </div>
              );
            })}
          </div>

          <div id={mediaId} className="interactive-content-list__media">
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className={cn('interactive-content-list__image', i === active && 'is-active')}
                aria-hidden={i !== active || undefined}
              >
                {entry.image}
              </div>
            ))}
          </div>
        </div>

        <div ref={ghostHostRef} className="interactive-content-list__ghost" aria-hidden="true" />
      </div>

      {count > 1 && (
        <div ref={dotsRef} className="interactive-content-list__dots" role="group" aria-label="Choose item">
          {entries.map((entry, i) => (
            <button
              key={entry.id}
              type="button"
              className="interactive-content-list__dot"
              aria-label={`Show ${entry.label} (${i + 1} of ${count})`}
              aria-current={i === active || undefined}
              onClick={() => slideTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
