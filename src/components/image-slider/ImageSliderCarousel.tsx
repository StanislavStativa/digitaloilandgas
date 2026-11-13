'use client';
import { FC, FocusEvent, KeyboardEvent, PointerEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeftIcon } from 'components/icons/ChevronLeftIcon';
import { useArrowPlacement } from 'hooks/useArrowPlacement';
import { usePrefersReducedMotion } from 'hooks/usePrefersReducedMotion';
import { ImageSliderCarouselProps } from './ImageSlider.props';

export const AUTOPLAY_INTERVAL = 5000;
/** Minimal horizontal travel (px) for a touch gesture to count as a swipe */
const SWIPE_THRESHOLD = 40;

export const ImageSliderCarousel: FC<ImageSliderCarouselProps> = ({ slides, showArrows, showDots, autoplay, isEditing = false }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  const slideCount = slides.length;
  const hasControls = slideCount > 1;
  const [index, setIndex] = useState(0);
  // Slides can be removed while editing: keep the index in range without an extra render
  const current = Math.min(index, Math.max(slideCount - 1, 0));

  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const isAutoplayActive = autoplay && hasControls && !isEditing && !prefersReducedMotion && !isHovered && !hasFocus;

  const goTo = useCallback((target: number) => setIndex(Math.min(Math.max(target, 0), slideCount - 1)), [slideCount]);
  const goPrev = () => goTo(current - 1);
  const goNext = () => goTo(current + 1);

  useArrowPlacement(rootRef, viewportRef, current, showArrows && hasControls, slideCount);

  // One timer at a time; re-armed on every slide change so manual navigation restarts the countdown
  useEffect(() => {
    if (!isAutoplayActive) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % slideCount), AUTOPLAY_INTERVAL);
    return () => window.clearTimeout(timer);
  }, [isAutoplayActive, current, slideCount]);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHasFocus(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!hasControls || isEditing) return;
    if (event.key === 'ArrowLeft') goPrev();
    else if (event.key === 'ArrowRight') goNext();
    else return;
    event.preventDefault();
  };

  // Touch/pen swipe; `touch-action: pan-y` keeps vertical page scrolling native
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!hasControls || isEditing || event.pointerType === 'mouse' || !event.isPrimary) return;
    swipeStart.current = { x: event.clientX, y: event.clientY };
  };
  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;
    if (dx < 0) goNext();
    else goPrev();
  };
  const handlePointerCancel = () => {
    swipeStart.current = null;
  };

  return (
    <div
      ref={rootRef}
      className="image-slider"
      role="region"
      aria-roledescription="carousel"
      aria-label="Image slider"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setHasFocus(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <div className="image-slider__stage">
        <div
          ref={viewportRef}
          className="image-slider__viewport"
          aria-live={isAutoplayActive ? 'off' : 'polite'}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <div className="image-slider__track" style={{ transform: `translate3d(${-current * 100}%, 0, 0)` }}>
            {slides.map((slide, i) => (
              <div
                key={slide.id}
                className="image-slider__slide"
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slideCount}`}
                aria-hidden={i !== current || undefined}
                // Off-screen slides stay editable in Pages; on the live site they leave the tab order
                inert={!isEditing && i !== current}
              >
                {slide.content}
              </div>
            ))}
          </div>
        </div>

        {showArrows && hasControls && (
          <>
            <button
              type="button"
              className="image-slider__arrow image-slider__arrow--prev"
              aria-label="Previous slide"
              disabled={current === 0}
              onClick={goPrev}
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              className="image-slider__arrow image-slider__arrow--next"
              aria-label="Next slide"
              disabled={current === slideCount - 1}
              onClick={goNext}
            >
              <ChevronLeftIcon />
            </button>
          </>
        )}
      </div>

      {showDots && hasControls && (
        <div className="image-slider__dots" role="group" aria-label="Choose slide">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              className="image-slider__dot"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === current || undefined}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
