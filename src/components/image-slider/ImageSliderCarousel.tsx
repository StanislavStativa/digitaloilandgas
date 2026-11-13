'use client';
import { FC, KeyboardEvent, useCallback, useRef, useState } from 'react';
import { ChevronLeftIcon } from 'components/icons/ChevronLeftIcon';
import { useAutoplay } from 'hooks/useAutoplay';
import { useImageSliderArrowPlacement } from 'hooks/useImageSliderArrowPlacement';
import { usePreloadSlideImages } from 'hooks/usePreloadSlideImages';
import { useSwipe } from 'hooks/useSwipe';
import { IMAGE_SLIDER_AUTOPLAY_INTERVAL, ImageSliderCarouselProps, ImageSliderSlide } from './ImageSlider.props';

// Local (unexported) parts: exported ones would be registered as Sitecore components by the map generator

const SliderArrows: FC<{ current: number; count: number; onPrev: () => void; onNext: () => void }> = ({
  current,
  count,
  onPrev,
  onNext,
}) => (
  <>
    <button
      type="button"
      className="image-slider__arrow image-slider__arrow--prev"
      aria-label="Previous slide"
      disabled={current === 0}
      onClick={onPrev}
    >
      <ChevronLeftIcon />
    </button>
    <button
      type="button"
      className="image-slider__arrow image-slider__arrow--next"
      aria-label="Next slide"
      disabled={current === count - 1}
      onClick={onNext}
    >
      <ChevronLeftIcon />
    </button>
  </>
);

const SliderDots: FC<{ slides: ImageSliderSlide[]; current: number; onSelect: (index: number) => void }> = ({
  slides,
  current,
  onSelect,
}) => (
  <div className="image-slider__dots" role="group" aria-label="Choose slide">
    {slides.map((slide, i) => (
      <button
        key={slide.id}
        type="button"
        className="image-slider__dot"
        aria-label={`Go to slide ${i + 1}`}
        aria-current={i === current || undefined}
        onClick={() => onSelect(i)}
      />
    ))}
  </div>
);

export const ImageSliderCarousel: FC<ImageSliderCarouselProps> = ({ slides, showArrows, showDots, autoplay, isEditing = false }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const slideCount = slides.length;
  const hasControls = slideCount > 1;
  const [index, setIndex] = useState(0);
  // Slides can be removed while editing: keep the index in range without an extra render
  const current = Math.min(index, Math.max(slideCount - 1, 0));

  const goTo = useCallback((target: number) => setIndex(Math.min(Math.max(target, 0), slideCount - 1)), [slideCount]);
  const goPrev = () => goTo(current - 1);
  const goNext = () => goTo(current + 1);
  const advance = useCallback(() => setIndex((i) => (i + 1) % slideCount), [slideCount]);

  const isAutoplayRunning = useAutoplay({
    rootRef,
    enabled: autoplay && hasControls && !isEditing,
    interval: IMAGE_SLIDER_AUTOPLAY_INTERVAL,
    position: current,
    onTick: advance,
  });
  const swipeHandlers = useSwipe({ enabled: hasControls && !isEditing, onSwipeLeft: goNext, onSwipeRight: goPrev });
  useImageSliderArrowPlacement(rootRef, viewportRef, trackRef, current, showArrows && hasControls, slideCount);
  // Neighbours load ahead so they don't pop in mid-transition; autoplay wraps to slide 1, which is already loaded
  usePreloadSlideImages(trackRef, [current - 1, current, current + 1]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!hasControls || isEditing) return;
    if (event.key === 'ArrowLeft') goPrev();
    else if (event.key === 'ArrowRight') goNext();
    else return;
    event.preventDefault();
  };

  return (
    <div
      ref={rootRef}
      className="image-slider"
      role="region"
      aria-roledescription="carousel"
      aria-label="Image slider"
      onKeyDown={handleKeyDown}
    >
      <div className="image-slider__stage">
        <div
          ref={viewportRef}
          className="image-slider__viewport"
          aria-live={isAutoplayRunning ? 'off' : 'polite'}
          {...swipeHandlers}
        >
          <div ref={trackRef} className="image-slider__track" style={{ transform: `translate3d(${-current * 100}%, 0, 0)` }}>
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

        {showArrows && hasControls && <SliderArrows current={current} count={slideCount} onPrev={goPrev} onNext={goNext} />}
      </div>

      {showDots && hasControls && <SliderDots slides={slides} current={current} onSelect={goTo} />}
    </div>
  );
};
