import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Default as Video } from '../../../components/video/Video';
import { makeProps, POSTER_SRC, VIDEO_SRC } from './Video.mockProps';

jest.mock('@sitecore-content-sdk/nextjs', () => ({
  Image: ({ field, ...props }: { field?: { value?: { src?: string; alt?: string } } }) =>
    field?.value?.src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={field.value.src} alt={field.value.alt ?? ''} {...props} />
    ) : (
      <span data-testid="empty-image-placeholder" />
    ),
}));

// jsdom implements neither media playback nor matchMedia
let reducedMotion = false;
const mediaListeners = new Set<() => void>();
const setReducedMotion = (value: boolean) => {
  reducedMotion = value;
  act(() => mediaListeners.forEach((listener) => listener()));
};

const play = jest.fn<Promise<void>, []>();
const pause = jest.fn();
const canPlayType = jest.fn<CanPlayTypeResult, [string]>();

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      get matches() {
        return query.includes('reduce') && reducedMotion;
      },
      media: query,
      addEventListener: (_: string, listener: () => void) => mediaListeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => mediaListeners.delete(listener),
    }),
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'play', { configurable: true, value: play });
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', { configurable: true, value: pause });
  Object.defineProperty(HTMLMediaElement.prototype, 'canPlayType', { configurable: true, value: canPlayType });
});

beforeEach(() => {
  reducedMotion = false;
  mediaListeners.clear();
  play.mockResolvedValue(undefined);
  canPlayType.mockReturnValue('maybe');
});

const getVideo = (container: HTMLElement) => container.querySelector('video');
const getFrame = (container: HTMLElement) => container.querySelector('.video') as HTMLElement;
const getPoster = () => screen.getByRole('img', { name: 'Offshore rig at dusk' });
/** Lets the rejected play() promise settle */
const flushPromises = () => act(() => Promise.resolve());

describe('Video', () => {
  it('resolves the File field to the media URL and renders a muted, looping, inline video without controls', () => {
    const { container } = render(<Video {...makeProps()} />);
    const video = getVideo(container) as HTMLVideoElement;

    expect(video).toHaveAttribute('src', VIDEO_SRC);
    expect(video.muted).toBe(true);
    expect(video).toHaveAttribute('loop');
    expect(video).toHaveAttribute('playsinline');
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('preload', 'auto');
    expect(video).not.toHaveAttribute('controls');
    expect(video).toHaveAttribute('aria-hidden', 'true');
    expect(play).toHaveBeenCalledTimes(1);

    const wrapper = container.querySelector('.component') as HTMLElement;
    expect(wrapper).toHaveClass('component', 'video-component', 'custom-style');
    expect(wrapper).toHaveAttribute('id', 'video-1');
  });

  it('also reads the GraphQL { jsonValue } field shape', () => {
    const { container } = render(<Video {...makeProps({ graphQL: true })} />);
    expect(getVideo(container)).toHaveAttribute('src', VIDEO_SRC);
    expect(getPoster()).toHaveAttribute('src', POSTER_SRC);
  });

  it('keeps the poster visible while loading and hands over to the video only on "playing"', () => {
    const { container } = render(<Video {...makeProps()} />);
    const video = getVideo(container) as HTMLVideoElement;

    expect(getPoster()).toHaveAttribute('src', POSTER_SRC);
    expect(getFrame(container)).toHaveAttribute('data-state', 'loading');

    // Metadata / first data are not enough to drop the poster
    fireEvent(video, new Event('loadedmetadata'));
    fireEvent(video, new Event('canplay'));
    expect(getFrame(container)).toHaveAttribute('data-state', 'loading');

    fireEvent(video, new Event('playing'));
    expect(getFrame(container)).toHaveAttribute('data-state', 'playing');
    // The poster stays in the DOM for the cross-fade
    expect(getPoster()).toBeInTheDocument();
  });

  it('keeps the poster and removes the video when the video fails to load', () => {
    const { container } = render(<Video {...makeProps()} />);
    fireEvent.error(getVideo(container) as HTMLVideoElement);

    expect(getVideo(container)).toBeNull();
    expect(getFrame(container)).toHaveAttribute('data-state', 'failed');
    expect(getPoster()).toBeInTheDocument();
  });

  it('keeps the poster when autoplay is blocked, without retrying', async () => {
    play.mockRejectedValue(new DOMException('blocked', 'NotAllowedError'));
    const { container } = render(<Video {...makeProps()} />);
    await flushPromises();

    expect(play).toHaveBeenCalledTimes(1);
    expect(getFrame(container)).toHaveAttribute('data-state', 'loading');
    expect(getVideo(container)).toBeInTheDocument();
    expect(getPoster()).toBeInTheDocument();
  });

  it('falls back to the poster when the source is not supported', async () => {
    play.mockRejectedValue(new DOMException('unsupported', 'NotSupportedError'));
    const { container } = render(<Video {...makeProps()} />);
    await flushPromises();

    expect(getVideo(container)).toBeNull();
    expect(getPoster()).toBeInTheDocument();
  });

  it('does not try to play a format the browser cannot decode', () => {
    canPlayType.mockReturnValue('');
    const { container } = render(<Video {...makeProps({ mimeType: 'video/x-matroska' })} />);

    expect(play).not.toHaveBeenCalled();
    expect(getVideo(container)).toBeNull();
    expect(getPoster()).toBeInTheDocument();
  });

  it('shows the poster instead of autoplaying when reduced motion is preferred, and follows changes live', () => {
    reducedMotion = true;
    const { container } = render(<Video {...makeProps()} />);
    const video = getVideo(container) as HTMLVideoElement;

    expect(play).not.toHaveBeenCalled();
    expect(video).not.toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('preload', 'none');

    setReducedMotion(false);
    expect(play).toHaveBeenCalledTimes(1);
    fireEvent(video, new Event('playing'));
    expect(getFrame(container)).toHaveAttribute('data-state', 'playing');

    setReducedMotion(true);
    expect(pause).toHaveBeenCalled();
    expect(getFrame(container)).toHaveAttribute('data-state', 'loading');
  });

  it('renders only the poster when the video is missing or not a usable URL', () => {
    for (const video of [null, 'javascript:alert(1)', '//cdn.example.com/x.mp4']) {
      const { container, unmount } = render(<Video {...makeProps({ video })} />);
      expect(getVideo(container)).toBeNull();
      expect(getPoster()).toBeInTheDocument();
      unmount();
    }
  });

  it('ignores a non-video media item selected in VideoFile', () => {
    const { container } = render(<Video {...makeProps({ mimeType: 'application/pdf' })} />);
    expect(getVideo(container)).toBeNull();
    expect(getPoster()).toBeInTheDocument();
  });

  it('plays the video without a poster when PosterImage is empty', () => {
    const { container } = render(<Video {...makeProps({ poster: null })} />);
    expect(getVideo(container)).toBeInTheDocument();
    expect(getFrame(container)).not.toHaveAttribute('data-has-poster');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('reserves no empty box when reduced motion is preferred and there is no poster', () => {
    reducedMotion = true;
    const { container } = render(<Video {...makeProps({ poster: null })} />);
    expect(container.querySelector('.video')).toBeNull();
    expect(play).not.toHaveBeenCalled();

    setReducedMotion(false);
    expect(getVideo(container)).toBeInTheDocument();
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('renders no markup on the live site when both fields are empty or there is no datasource', () => {
    expect(render(<Video {...makeProps({ video: null, poster: null })} />).container).toBeEmptyDOMElement();
    expect(render(<Video {...makeProps({ noDatasource: true })} />).container).toBeEmptyDOMElement();
  });

  it('renders nothing when the video fails and there is no poster', () => {
    const { container } = render(<Video {...makeProps({ poster: null })} />);
    fireEvent.error(getVideo(container) as HTMLVideoElement);
    expect(container.querySelector('.video')).toBeNull();
  });

  it('runs each instance independently', () => {
    const { container } = render(
      <>
        <Video {...makeProps()} />
        <Video {...makeProps()} />
      </>,
    );
    const [first, second] = Array.from(container.querySelectorAll('video'));
    const [firstFrame, secondFrame] = Array.from(container.querySelectorAll('.video'));

    expect(play).toHaveBeenCalledTimes(2);
    fireEvent(first, new Event('playing'));
    fireEvent.error(second);

    expect(firstFrame).toHaveAttribute('data-state', 'playing');
    expect(container.querySelectorAll('video')).toHaveLength(1);
    expect(secondFrame).toHaveAttribute('data-state', 'failed');
  });

  describe('in Pages editing mode', () => {
    it('shows the editable poster and no playing video', () => {
      const { container } = render(<Video {...makeProps({ isEditing: true })} />);

      expect(getVideo(container)).toBeNull();
      expect(play).not.toHaveBeenCalled();
      expect(getPoster()).toBeInTheDocument();
      expect(container.querySelector('.component')).toHaveClass('is-editing');
      expect(screen.getByText(/Video: rig \(plays on the published page\)/)).toBeInTheDocument();
    });

    it('hints at missing fields', () => {
      render(<Video {...makeProps({ isEditing: true, video: null, poster: null })} />);
      expect(screen.getByText(/select an MP4 in the Video File field/)).toBeInTheDocument();
      expect(screen.getByTestId('empty-image-placeholder')).toBeInTheDocument();
    });

    it('hints at a missing datasource', () => {
      render(<Video {...makeProps({ isEditing: true, noDatasource: true })} />);
      expect(screen.getByText('Video: select or create a datasource')).toBeInTheDocument();
    });
  });
});
