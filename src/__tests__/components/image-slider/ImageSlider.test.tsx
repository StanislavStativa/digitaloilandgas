import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Default as ImageSlider } from '../../../components/image-slider/ImageSlider';
import { IMAGE_SLIDER_AUTOPLAY_INTERVAL as AUTOPLAY_INTERVAL } from '../../../components/image-slider/ImageSlider.props';
import { makeItem, makeProps } from './ImageSlider.mockProps';

jest.mock('@sitecore-content-sdk/nextjs', () => ({
  Image: ({ field, ...props }: { field?: { value?: { src?: string; alt?: string } } }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={field?.value?.src} alt={field?.value?.alt ?? ''} {...props} />
  ),
}));

// jsdom has no PointerEvent: a MouseEvent carrying pointerType/isPrimary is enough here
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    pointerType: string;
    isPrimary: boolean;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerType = init.pointerType ?? 'mouse';
      this.isPrimary = init.isPrimary ?? true;
    }
  }
  window.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}

const getTrack =(container: HTMLElement) => container.querySelector('.image-slider__track') as HTMLElement;
const translateFor = (index: number) => `translate3d(${-index * 100}%, 0, 0)`;
const getDots = () => screen.getAllByRole('button', { name: /Go to slide/ });
const activeDotIndex = () => getDots().findIndex((dot) => dot.getAttribute('aria-current') === 'true');

describe('ImageSlider', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders datasource images in order with their alt text and the SXA wrapper', () => {
    const { container } = render(<ImageSlider {...makeProps()} />);
    const images = screen.getAllByRole('img', { hidden: true });

    expect(images.map((img) => img.getAttribute('src'))).toEqual(['/slide-1.jpg', '/slide-2.jpg', '/slide-3.jpg']);
    expect(images[0]).toHaveAttribute('alt', 'Slide image 1');
    expect(images[0]).toHaveAttribute('loading', 'eager');
    // slide 2 is preloaded as the neighbour; the rest stay lazy
    expect(images[1]).toHaveAttribute('loading', 'eager');
    expect(images[2]).toHaveAttribute('loading', 'lazy');

    const wrapper = container.querySelector('.component') as HTMLElement;
    expect(wrapper).toHaveClass('component', 'image-slider-component', 'custom-style');
    expect(wrapper).toHaveAttribute('id', 'image-slider-1');
    expect(screen.getByRole('region', { name: 'Image slider' })).toBeInTheDocument();
  });

  it('shows one slide at a time and hides the others from assistive tech', () => {
    const { container } = render(<ImageSlider {...makeProps()} />);
    const slides = container.querySelectorAll('.image-slider__slide');

    expect(slides[0]).not.toHaveAttribute('aria-hidden');
    expect(slides[1]).toHaveAttribute('aria-hidden', 'true');
    expect(slides[1]).toHaveAttribute('inert');
    expect(slides[0]).toHaveAttribute('aria-label', '1 of 3');
  });

  it('navigates with Previous/Next and disables them at the boundaries', () => {
    const { container } = render(<ImageSlider {...makeProps()} />);
    const prev = screen.getByRole('button', { name: 'Previous slide' });
    const next = screen.getByRole('button', { name: 'Next slide' });

    expect(prev).toBeDisabled();
    expect(next).toBeEnabled();

    fireEvent.click(next);
    expect(getTrack(container).style.transform).toBe(translateFor(1));
    expect(prev).toBeEnabled();
    expect(activeDotIndex()).toBe(1);

    fireEvent.click(next);
    expect(getTrack(container).style.transform).toBe(translateFor(2));
    expect(next).toBeDisabled();

    // rapid extra clicks at the boundary don't corrupt the state
    fireEvent.click(next);
    fireEvent.click(next);
    expect(getTrack(container).style.transform).toBe(translateFor(2));

    fireEvent.click(prev);
    fireEvent.click(prev);
    fireEvent.click(prev);
    expect(getTrack(container).style.transform).toBe(translateFor(0));
    expect(prev).toBeDisabled();
  });

  it('generates one dot per slide and navigates directly from a dot', () => {
    const { container } = render(<ImageSlider {...makeProps({ count: 5 })} />);

    expect(getDots()).toHaveLength(5);
    expect(activeDotIndex()).toBe(0);

    fireEvent.click(getDots()[3]);
    expect(getTrack(container).style.transform).toBe(translateFor(3));
    expect(activeDotIndex()).toBe(3);
  });

  it('supports keyboard arrows and touch swipes', () => {
    const { container } = render(<ImageSlider {...makeProps()} />);
    const region = screen.getByRole('region', { name: 'Image slider' });

    fireEvent.keyDown(region, { key: 'ArrowRight' });
    expect(activeDotIndex()).toBe(1);
    fireEvent.keyDown(region, { key: 'ArrowLeft' });
    expect(activeDotIndex()).toBe(0);

    const viewport = container.querySelector('.image-slider__viewport') as HTMLElement;
    fireEvent.pointerDown(viewport, { pointerType: 'touch', isPrimary: true, clientX: 200, clientY: 100 });
    fireEvent.pointerUp(viewport, { pointerType: 'touch', isPrimary: true, clientX: 100, clientY: 110 });
    expect(activeDotIndex()).toBe(1);

    // mostly vertical movement is page scrolling, not a swipe
    fireEvent.pointerDown(viewport, { pointerType: 'touch', isPrimary: true, clientX: 200, clientY: 100 });
    fireEvent.pointerUp(viewport, { pointerType: 'touch', isPrimary: true, clientX: 150, clientY: 300 });
    expect(activeDotIndex()).toBe(1);

    fireEvent.pointerDown(viewport, { pointerType: 'touch', isPrimary: true, clientX: 100, clientY: 100 });
    fireEvent.pointerUp(viewport, { pointerType: 'touch', isPrimary: true, clientX: 220, clientY: 100 });
    expect(activeDotIndex()).toBe(0);
  });

  describe('checkbox fields', () => {
    it('defaults to arrows + dots on and autoplay off when the fields are missing', () => {
      jest.useFakeTimers();
      render(<ImageSlider {...makeProps()} />);

      expect(screen.getByRole('button', { name: 'Next slide' })).toBeInTheDocument();
      expect(getDots()).toHaveLength(3);
      act(() => jest.advanceTimersByTime(AUTOPLAY_INTERVAL * 3));
      expect(activeDotIndex()).toBe(0);
    });

    it.each([false, '', '0'])('respects an explicit unchecked value (%p)', (value) => {
      render(<ImageSlider {...makeProps({ showArrows: value, showDots: value })} />);

      expect(screen.queryByRole('button', { name: 'Next slide' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Go to slide/ })).not.toBeInTheDocument();
    });

    it('hides only the arrows or only the dots', () => {
      const { unmount } = render(<ImageSlider {...makeProps({ showArrows: false, showDots: true })} />);
      expect(screen.queryByRole('button', { name: 'Previous slide' })).not.toBeInTheDocument();
      expect(getDots()).toHaveLength(3);
      unmount();

      render(<ImageSlider {...makeProps({ showArrows: '1', showDots: '' })} />);
      expect(screen.getByRole('button', { name: 'Previous slide' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Go to slide/ })).not.toBeInTheDocument();
    });
  });

  describe('autoplay', () => {
    beforeEach(() => jest.useFakeTimers());

    it('advances every 5 seconds and restarts from the first slide', () => {
      render(<ImageSlider {...makeProps({ isAutoplay: true })} />);

      act(() => jest.advanceTimersByTime(AUTOPLAY_INTERVAL - 1));
      expect(activeDotIndex()).toBe(0);
      act(() => jest.advanceTimersByTime(1));
      expect(activeDotIndex()).toBe(1);
      act(() => jest.advanceTimersByTime(AUTOPLAY_INTERVAL));
      expect(activeDotIndex()).toBe(2);
      act(() => jest.advanceTimersByTime(AUTOPLAY_INTERVAL));
      expect(activeDotIndex()).toBe(0);
    });

    it('accepts the "1" string form', () => {
      render(<ImageSlider {...makeProps({ isAutoplay: '1' })} />);
      act(() => jest.advanceTimersByTime(AUTOPLAY_INTERVAL));
      expect(activeDotIndex()).toBe(1);
    });

    it('pauses on hover and on keyboard focus, and resumes afterwards', () => {
      render(<ImageSlider {...makeProps({ isAutoplay: true })} />);
      const region = screen.getByRole('region', { name: 'Image slider' });

      fireEvent.mouseEnter(region);
      act(() => jest.advanceTimersByTime(AUTOPLAY_INTERVAL * 2));
      expect(activeDotIndex()).toBe(0);
      fireEvent.mouseLeave(region);
      act(() => jest.advanceTimersByTime(AUTOPLAY_INTERVAL));
      expect(activeDotIndex()).toBe(1);

      const dot = getDots()[0];
      act(() => dot.focus());
      act(() => jest.advanceTimersByTime(AUTOPLAY_INTERVAL * 2));
      expect(activeDotIndex()).toBe(1);
      // focus moving inside the slider keeps it paused
      act(() => getDots()[2].focus());
      act(() => jest.advanceTimersByTime(AUTOPLAY_INTERVAL * 2));
      expect(activeDotIndex()).toBe(1);
      act(() => getDots()[2].blur());
      act(() => jest.advanceTimersByTime(AUTOPLAY_INTERVAL));
      expect(activeDotIndex()).toBe(2);
    });

    it('keeps a single timer and restarts the countdown after manual navigation', () => {
      render(<ImageSlider {...makeProps({ isAutoplay: true, count: 4 })} />);

      act(() => jest.advanceTimersByTime(AUTOPLAY_INTERVAL - 1000));
      fireEvent.click(getDots()[2]);
      // the old countdown was dropped: nothing happens at its original deadline
      act(() => jest.advanceTimersByTime(1000));
      expect(activeDotIndex()).toBe(2);
      act(() => jest.advanceTimersByTime(AUTOPLAY_INTERVAL - 1001));
      expect(activeDotIndex()).toBe(2);
      act(() => jest.advanceTimersByTime(1));
      expect(activeDotIndex()).toBe(3);
    });

    it('cleans up its timer on unmount', () => {
      const { unmount } = render(<ImageSlider {...makeProps({ isAutoplay: true })} />);
      expect(jest.getTimerCount()).toBeGreaterThan(0);
      unmount();
      expect(jest.getTimerCount()).toBe(0);
    });

    it('does not run when reduced motion is preferred', () => {
      const original = window.matchMedia;
      window.matchMedia = jest.fn().mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });
      try {
        render(<ImageSlider {...makeProps({ isAutoplay: true })} />);
        act(() => jest.advanceTimersByTime(AUTOPLAY_INTERVAL * 2));
        expect(activeDotIndex()).toBe(0);
      } finally {
        window.matchMedia = original;
      }
    });

    it('is disabled in editing mode', () => {
      render(<ImageSlider {...makeProps({ isAutoplay: true, isEditing: true })} />);
      act(() => jest.advanceTimersByTime(AUTOPLAY_INTERVAL * 2));
      expect(activeDotIndex()).toBe(0);
    });

    it('pauses while scrolled off-screen and resumes when visible again', () => {
      let report: IntersectionObserverCallback = () => {};
      const original = global.IntersectionObserver;
      global.IntersectionObserver = class {
        constructor(callback: IntersectionObserverCallback) {
          report = callback;
        }
        observe() {}
        disconnect() {}
      } as unknown as typeof IntersectionObserver;
      const setVisible = (isIntersecting: boolean) =>
        act(() => report([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver));

      try {
        render(<ImageSlider {...makeProps({ isAutoplay: true })} />);
        setVisible(false);
        act(() => jest.advanceTimersByTime(AUTOPLAY_INTERVAL * 3));
        expect(activeDotIndex()).toBe(0);

        setVisible(true);
        act(() => jest.advanceTimersByTime(AUTOPLAY_INTERVAL));
        expect(activeDotIndex()).toBe(1);
      } finally {
        global.IntersectionObserver = original;
      }
    });

    it('pauses while the tab is hidden', () => {
      const visibility = jest.spyOn(document, 'visibilityState', 'get');
      try {
        render(<ImageSlider {...makeProps({ isAutoplay: true })} />);
        visibility.mockReturnValue('hidden');
        act(() => {
          document.dispatchEvent(new Event('visibilitychange'));
        });
        act(() => jest.advanceTimersByTime(AUTOPLAY_INTERVAL * 3));
        expect(activeDotIndex()).toBe(0);

        visibility.mockReturnValue('visible');
        act(() => {
          document.dispatchEvent(new Event('visibilitychange'));
        });
        act(() => jest.advanceTimersByTime(AUTOPLAY_INTERVAL));
        expect(activeDotIndex()).toBe(1);
      } finally {
        visibility.mockRestore();
      }
    });

    it('does not tick in a tab that was opened in the background', () => {
      const visibility = jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
      try {
        render(<ImageSlider {...makeProps({ isAutoplay: true })} />);
        act(() => jest.advanceTimersByTime(AUTOPLAY_INTERVAL * 2));
        expect(activeDotIndex()).toBe(0);
      } finally {
        visibility.mockRestore();
      }
    });
  });

  it('preloads the neighbours of the active slide and keeps the rest lazy', () => {
    render(<ImageSlider {...makeProps({ count: 5 })} />);
    const loading = () => screen.getAllByRole('img', { hidden: true }).map((img) => img.getAttribute('loading'));

    expect(loading()).toEqual(['eager', 'eager', 'lazy', 'lazy', 'lazy']);
    fireEvent.click(getDots()[2]);
    expect(loading()).toEqual(['eager', 'eager', 'eager', 'eager', 'lazy']);
  });

  it('keeps multiple instances independent', () => {
    render(
      <>
        <ImageSlider {...makeProps({ id: 'a' })} />
        <ImageSlider {...makeProps({ id: 'b' })} />
      </>
    );
    const [first, second] = screen.getAllByRole('region', { name: 'Image slider' });

    fireEvent.click(within(first).getByRole('button', { name: 'Next slide' }));
    fireEvent.click(within(first).getByRole('button', { name: 'Next slide' }));

    const current = (region: HTMLElement) =>
      within(region)
        .getAllByRole('button', { name: /Go to slide/ })
        .findIndex((dot) => dot.getAttribute('aria-current') === 'true');
    expect(current(first)).toBe(2);
    expect(current(second)).toBe(0);
  });

  describe('edge cases', () => {
    it('renders nothing on the live site without slides', () => {
      const { container } = render(<ImageSlider {...makeProps({ count: 0 })} />);
      expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing without a datasource', () => {
      const props = { ...makeProps(), fields: undefined };
      const { container } = render(<ImageSlider {...props} />);
      expect(container).toBeEmptyDOMElement();
    });

    it('shows an editing hint without slides in Pages', () => {
      render(<ImageSlider {...makeProps({ count: 0, isEditing: true })} />);
      expect(screen.getByText(/add Image Slider Item children/)).toBeInTheDocument();
    });

    it('hides navigation controls for a single image', () => {
      render(<ImageSlider {...makeProps({ count: 1, isAutoplay: true })} />);
      expect(screen.getByAltText('Slide image 1')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('skips slides without an image on the live site but keeps them editable in Pages', () => {
      const items = [makeItem(1), makeItem(2, null), makeItem(3)];

      const { unmount } = render(<ImageSlider {...makeProps({ items })} />);
      expect(getDots()).toHaveLength(2);
      unmount();

      render(<ImageSlider {...makeProps({ items, isEditing: true })} />);
      expect(getDots()).toHaveLength(3);
      expect(screen.getByText('Slide 2: select an image')).toBeInTheDocument();
    });
  });

  describe('arrow placement', () => {
    const observers: { callback: ResizeObserverCallback; targets: Element[] }[] = [];
    const originalRO = global.ResizeObserver;

    // The hook reads arrow size/gap from CSS once at mount, so they must exist before render
    let sheet: HTMLStyleElement;
    beforeAll(() => {
      sheet = document.createElement('style');
      sheet.textContent = '.image-slider { --image-slider-arrow-size: 44px; --image-slider-arrow-gap: 34px; }';
      document.head.appendChild(sheet);
    });
    afterAll(() => sheet.remove());

    beforeEach(() => {
      observers.length = 0;
      global.ResizeObserver = class {
        targets: Element[] = [];
        constructor(callback: ResizeObserverCallback) {
          observers.push({ callback, targets: this.targets });
        }
        observe(target: Element) {
          this.targets.push(target);
        }
        unobserve() {}
        disconnect() {}
      } as unknown as typeof ResizeObserver;
      jest.useFakeTimers();
    });

    afterEach(() => {
      global.ResizeObserver = originalRO;
    });

    const setup = (containerWidth: number, imageWidth: number) => {
      const { container } = render(<ImageSlider {...makeProps()} />);
      const root = container.querySelector('.image-slider') as HTMLElement;
      const viewport = container.querySelector('.image-slider__viewport') as HTMLElement;

      const resize = (cw: number, iw: number) => {
        Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: cw });
        viewport.querySelectorAll('img').forEach((img) => {
          img.getBoundingClientRect = () => ({ width: Math.min(iw, cw) }) as DOMRect;
        });
        act(() => {
          observers.forEach((o) => o.callback([], {} as ResizeObserver));
          jest.advanceTimersByTime(20);
        });
      };
      resize(containerWidth, imageWidth);
      return { root, resize };
    };

    it('observes the viewport and every slide image', () => {
      setup(1000, 400);
      expect(observers).toHaveLength(1);
      expect(observers[0].targets).toHaveLength(4);
    });

    it('places arrows outside when both sides fit an arrow + gap, inside otherwise', () => {
      const { root, resize } = setup(1000, 400);
      expect(root.dataset.arrows).toBe('outside');
      expect(root.style.getPropertyValue('--image-slider-image-width')).toBe('400px');

      // exactly enough room: (556 - 400) / 2 = 78 = 44 + 34
      resize(556, 400);
      expect(root.dataset.arrows).toBe('outside');

      resize(555, 400);
      expect(root.dataset.arrows).toBe('inside');

      // image shrinks with a narrow container
      resize(300, 400);
      expect(root.dataset.arrows).toBe('inside');
      expect(root.style.getPropertyValue('--image-slider-image-width')).toBe('300px');
    });

    it('switches back on container growth without remounting or losing the active slide', () => {
      const { root, resize } = setup(500, 400);
      fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
      expect(root.dataset.arrows).toBe('inside');

      resize(1200, 400);
      expect(root.dataset.arrows).toBe('outside');
      expect(activeDotIndex()).toBe(1);
      expect(root).toBe(document.querySelector('.image-slider'));
    });
  });
});
