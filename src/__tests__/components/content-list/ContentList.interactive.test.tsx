import '@testing-library/jest-dom';
import { act, fireEvent, render, within } from '@testing-library/react';
import { Interactive as InteractiveContentList } from '../../../components/content-list/ContentList';
import { makeItem, makeProps } from './ContentList.mockProps';

type MockField = { value?: Record<string, string> | string };

jest.mock('@sitecore-content-sdk/nextjs', () => ({
  Image: ({ field, ...props }: { field?: { value?: { src?: string; alt?: string } } }) =>
    field?.value?.src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={field.value.src} alt={field.value.alt ?? ''} {...props} />
    ) : null,
  Text: ({ field }: { field?: MockField }) => <>{field?.value as string}</>,
  RichText: ({ field, className }: { field?: MockField; className?: string }) => (
    <div className={className} dangerouslySetInnerHTML={{ __html: (field?.value as string) ?? '' }} />
  ),
  Link: ({ field }: { field?: { value?: Record<string, string> } }) =>
    field?.value?.href ? (
      <a href={field.value.href} target={field.value.target}>
        {field.value.text}
      </a>
    ) : null,
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

const getCards = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>('.interactive-content-list__card'));
const getImages = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>('.interactive-content-list__image'));
const activeCardIndex = (container: HTMLElement) => getCards(container).findIndex((card) => card.classList.contains('is-active'));
const activeImageIndex = (container: HTMLElement) => getImages(container).findIndex((image) => image.classList.contains('is-active'));
const getDots = (container: HTMLElement) => within(container).queryAllByRole('button', { name: /^Show / });
const activeDotIndex = (container: HTMLElement) => getDots(container).findIndex((dot) => dot.getAttribute('aria-current') === 'true');

/** Card and image always point at the same item */
const expectActive = (container: HTMLElement, index: number) => {
  expect(activeCardIndex(container)).toBe(index);
  expect(activeImageIndex(container)).toBe(index);
  const dots = getDots(container);
  if (dots.length) expect(activeDotIndex(container)).toBe(index);
};

const swipe = (element: HTMLElement, dx: number, dy = 0) => {
  fireEvent.pointerDown(element, { pointerType: 'touch', isPrimary: true, clientX: 200, clientY: 200 });
  fireEvent.pointerUp(element, { pointerType: 'touch', isPrimary: true, clientX: 200 + dx, clientY: 200 + dy });
};

describe('ContentList (Interactive variant)', () => {
  it('renders every item in datasource order with an h4 title, description, CTA and image', () => {
    const { container } = render(<InteractiveContentList {...makeProps()} />);

    const titles = Array.from(container.querySelectorAll('h4')).map((h4) => h4.textContent);
    expect(titles).toEqual(['Item title 1', 'Item title 2', 'Item title 3']);
    expect(container.querySelectorAll('.interactive-content-list__description p')).toHaveLength(3);

    const images = container.querySelectorAll('img');
    expect(Array.from(images).map((img) => img.getAttribute('src'))).toEqual(['/item-1.jpg', '/item-2.jpg', '/item-3.jpg']);
    expect(images[0]).toHaveAttribute('alt', 'Image alt 1');
    expect(images[0]).toHaveAttribute('loading', 'eager');
    expect(images[1]).toHaveAttribute('loading', 'lazy');

    const wrapper = container.querySelector('.component') as HTMLElement;
    expect(wrapper).toHaveClass('content-list-component', 'content-list-component--interactive', 'custom-style');
    expect(wrapper).toHaveAttribute('id', 'icl-1');
  });

  it('activates the first item initially and hides inactive images from assistive tech', () => {
    const { container } = render(<InteractiveContentList {...makeProps()} />);

    expectActive(container, 0);
    const images = getImages(container);
    expect(images[0]).not.toHaveAttribute('aria-hidden');
    expect(images[1]).toHaveAttribute('aria-hidden', 'true');
    expect(within(getCards(container)[0]).getByRole('button')).toHaveAttribute('aria-current', 'true');
  });

  it('activates a card on hover and keeps the selection after the mouse leaves', () => {
    const { container } = render(<InteractiveContentList {...makeProps()} />);
    const cards = getCards(container);

    fireEvent.mouseEnter(cards[1]);
    expectActive(container, 1);
    fireEvent.mouseLeave(cards[1]);
    fireEvent.mouseLeave(container.querySelector('.interactive-content-list') as HTMLElement);
    expectActive(container, 1);

    fireEvent.mouseEnter(cards[2]);
    fireEvent.mouseLeave(cards[2]);
    expectActive(container, 2);
    expect(within(cards[2]).getByRole('button')).toHaveAttribute('aria-current', 'true');
    expect(within(cards[1]).getByRole('button')).not.toHaveAttribute('aria-current');
  });

  it('activates a card on keyboard focus (title button or CTA link) and keeps it on blur', () => {
    const { container } = render(<InteractiveContentList {...makeProps()} />);
    const cards = getCards(container);

    act(() => within(cards[2]).getByRole('button', { name: 'Item title 3' }).focus());
    expectActive(container, 2);

    act(() => within(cards[1]).getByRole('link', { name: 'Explore' }).focus());
    expectActive(container, 1);

    act(() => (document.activeElement as HTMLElement).blur());
    expectActive(container, 1);
  });

  it('renders CTA links as independent anchors with their href and target, never nested in the button', () => {
    const items = [makeItem(1), makeItem(2, { link: { href: 'https://example.com/fdca', text: 'Explore', target: '_blank' } })];
    const { container } = render(<InteractiveContentList {...makeProps({ items })} />);
    const links = within(container).getAllByRole('link', { name: 'Explore' });

    expect(links[0]).toHaveAttribute('href', '/solutions/item-1');
    expect(links[1]).toHaveAttribute('href', 'https://example.com/fdca');
    expect(links[1]).toHaveAttribute('target', '_blank');
    links.forEach((link) => expect(link.closest('button')).toBeNull());
    container.querySelectorAll('button').forEach((button) => expect(button.querySelector('a, button')).toBeNull());
  });

  it('omits empty optional fields: no empty anchor, no empty description', () => {
    const items = [makeItem(1, { link: null, description: null }), makeItem(2)];
    const { container } = render(<InteractiveContentList {...makeProps({ items })} />);
    const [first, second] = getCards(container);

    expect(within(first).queryByRole('link')).toBeNull();
    expect(first.querySelector('.interactive-content-list__cta')).toBeNull();
    expect(first.querySelector('.interactive-content-list__description')).toBeNull();
    expect(within(second).getByRole('link')).toBeInTheDocument();
  });

  it('renders one dot per item and a dot switches card and image together', () => {
    const { container } = render(<InteractiveContentList {...makeProps({ count: 4 })} />);
    const dots = getDots(container);

    expect(dots).toHaveLength(4);
    expect(dots[2]).toHaveAccessibleName('Show Item title 3 (3 of 4)');

    fireEvent.click(dots[2]);
    expectActive(container, 2);
    fireEvent.click(dots[0]);
    expectActive(container, 0);
  });

  it('keeps the selection made with dots when hovering logic is used again (one shared state)', () => {
    const { container } = render(<InteractiveContentList {...makeProps()} />);

    fireEvent.click(getDots(container)[2]);
    expectActive(container, 2);
    // e.g. the container got wider: hover works from the same state
    fireEvent.mouseEnter(getCards(container)[1]);
    expectActive(container, 1);
    expect(activeDotIndex(container)).toBe(1);
  });

  it('navigates with touch swipes and stops at the first and last item', () => {
    const { container } = render(<InteractiveContentList {...makeProps()} />);
    const root = container.querySelector('.interactive-content-list') as HTMLElement;

    swipe(root, 80);
    expectActive(container, 0);
    swipe(root, -80);
    expectActive(container, 1);
    swipe(root, -80);
    swipe(root, -80);
    expectActive(container, 2);
    swipe(root, 80);
    expectActive(container, 1);
  });

  it('ignores vertical gestures, short moves and mouse drags', () => {
    const { container } = render(<InteractiveContentList {...makeProps()} />);
    const root = container.querySelector('.interactive-content-list') as HTMLElement;

    swipe(root, -50, 120);
    swipe(root, -10);
    fireEvent.pointerDown(root, { pointerType: 'mouse', isPrimary: true, clientX: 200, clientY: 200 });
    fireEvent.pointerUp(root, { pointerType: 'mouse', isPrimary: true, clientX: 50, clientY: 200 });
    expectActive(container, 0);
  });

  it('does not swipe in the desktop layout (dots hidden by CSS)', () => {
    const { container } = render(<InteractiveContentList {...makeProps()} />);
    (container.querySelector('.interactive-content-list__dots') as HTMLElement).style.display = 'none';

    swipe(container.querySelector('.interactive-content-list') as HTMLElement, -80);
    expectActive(container, 0);
  });

  it('hides the dots for a single item', () => {
    const { container } = render(<InteractiveContentList {...makeProps({ count: 1 })} />);

    expect(getCards(container)).toHaveLength(1);
    expect(container.querySelector('.interactive-content-list__dots')).toBeNull();
    expectActive(container, 0);
  });

  it('supports two items', () => {
    const { container } = render(<InteractiveContentList {...makeProps({ count: 2 })} />);

    expect(getDots(container)).toHaveLength(2);
    fireEvent.click(getDots(container)[1]);
    expectActive(container, 1);
  });

  it('renders nothing on the live site without items, and skips items with neither title nor image', () => {
    const { container: empty } = render(<InteractiveContentList {...makeProps({ count: 0 })} />);
    expect(empty).toBeEmptyDOMElement();

    const items = [makeItem(1, { title: null, image: null }), makeItem(2), makeItem(3, { image: null })];
    const { container } = render(<InteractiveContentList {...makeProps({ items })} />);
    expect(Array.from(container.querySelectorAll('h4')).map((h4) => h4.textContent)).toEqual(['Item title 2', 'Item title 3']);
    // an item without an image still gets an (empty) image slot so indexes stay aligned
    expect(getImages(container)).toHaveLength(2);
  });

  it('shows editing placeholders in Pages for a missing datasource, no items and missing images', () => {
    const { container: noDs } = render(<InteractiveContentList {...makeProps({ isEditing: true, noDatasource: true })} />);
    expect(noDs).toHaveTextContent('select or create a datasource');

    const { container: noItems } = render(<InteractiveContentList {...makeProps({ isEditing: true, count: 0 })} />);
    expect(noItems).toHaveTextContent('add Content List Item children');

    const items = [makeItem(1, { image: null, title: null })];
    const { container } = render(<InteractiveContentList {...makeProps({ isEditing: true, items })} />);
    expect(getCards(container)).toHaveLength(1);
    expect(container).toHaveTextContent('Item 1: select an image');
  });

  it('in Pages, renders editable titles without the select button, ignores hover and selects on click', () => {
    const { container } = render(<InteractiveContentList {...makeProps({ isEditing: true })} />);
    const cards = getCards(container);

    expect(container.querySelector('.interactive-content-list__select')).toBeNull();
    fireEvent.mouseEnter(cards[1]);
    expectActive(container, 0);
    fireEvent.click(cards[2]);
    expectActive(container, 2);
  });

  describe('tablet/mobile slide transition', () => {
    type MockAnimation = { keyframes: Keyframe[]; target: Element; cancel: jest.Mock; onfinish: (() => void) | null };
    let animations: MockAnimation[];
    const originalAnimate = Element.prototype.animate;
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');

    beforeEach(() => {
      animations = [];
      // jsdom has no Web Animations API and no layout
      Element.prototype.animate = function (this: Element, keyframes: Keyframe[]) {
        const animation: MockAnimation = { keyframes, target: this, cancel: jest.fn(), onfinish: null };
        animations.push(animation);
        return animation as unknown as Animation;
      } as unknown as typeof Element.prototype.animate;
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 1000 });
    });

    afterEach(() => {
      Element.prototype.animate = originalAnimate;
      if (originalOffsetWidth) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
      window.matchMedia = undefined as unknown as typeof window.matchMedia;
    });

    const getGhost = (container: HTMLElement) => container.querySelector('.interactive-content-list__ghost') as HTMLElement;
    const getLayout = (container: HTMLElement) =>
      container.querySelector('.interactive-content-list__viewport > .interactive-content-list__layout') as HTMLElement;
    const translateOf = (animation: MockAnimation, frame: number) => animation.keyframes[frame].transform;

    it('slides the whole block (card + image) left when a dot to the right is clicked', () => {
      const { container } = render(<InteractiveContentList {...makeProps()} />);

      fireEvent.click(getDots(container)[2]);
      expectActive(container, 2);

      // the previous item is shown by a snapshot of the whole layout, both columns together
      const ghostLayout = getGhost(container).firstElementChild as HTMLElement;
      expect(ghostLayout).toHaveClass('interactive-content-list__layout');
      expect(ghostLayout.querySelector('.interactive-content-list__card.is-active h4')).toHaveTextContent('Item title 1');
      expect(ghostLayout.querySelector('.interactive-content-list__image.is-active img')).toHaveAttribute('src', '/item-1.jpg');

      const [outgoing, incoming] = animations;
      expect(outgoing.target).toBe(ghostLayout);
      expect(incoming.target).toBe(getLayout(container));
      expect([translateOf(outgoing, 0), translateOf(outgoing, 1)]).toEqual(['translateX(0)', 'translateX(-1000px)']);
      expect([translateOf(incoming, 0), translateOf(incoming, 1)]).toEqual(['translateX(1000px)', 'translateX(0)']);

      act(() => outgoing.onfinish?.());
      expect(getGhost(container)).toBeEmptyDOMElement();
    });

    it('slides right when a dot to the left is clicked, and swipes use the same slide', () => {
      const { container } = render(<InteractiveContentList {...makeProps()} />);
      fireEvent.click(getDots(container)[2]);
      animations = [];

      fireEvent.click(getDots(container)[0]);
      expectActive(container, 0);
      expect(translateOf(animations[0], 1)).toBe('translateX(1000px)');
      expect(translateOf(animations[1], 0)).toBe('translateX(-1000px)');

      animations = [];
      swipe(container.querySelector('.interactive-content-list') as HTMLElement, -80);
      expectActive(container, 1);
      expect(translateOf(animations[1], 0)).toBe('translateX(1000px)');
    });

    it('keeps the snapshot inert and free of duplicate ids', () => {
      const { container } = render(<InteractiveContentList {...makeProps()} />);
      fireEvent.click(getDots(container)[1]);

      const ghost = getGhost(container);
      expect(ghost).toHaveAttribute('aria-hidden', 'true');
      expect((ghost.firstElementChild as HTMLElement & { inert: boolean }).inert).toBe(true);
      expect(ghost.querySelector('[id]')).toBeNull();
    });

    it('cancels the running slide on rapid clicks and keeps a single snapshot', () => {
      const { container } = render(<InteractiveContentList {...makeProps({ count: 4 })} />);

      fireEvent.click(getDots(container)[1]);
      const first = [...animations];
      fireEvent.click(getDots(container)[3]);

      first.forEach((animation) => expect(animation.cancel).toHaveBeenCalled());
      expect(getGhost(container).children).toHaveLength(1);
      expectActive(container, 3);
    });

    it('does not animate the active dot, the desktop layout, Pages or reduced motion', () => {
      const { container } = render(<InteractiveContentList {...makeProps()} />);
      fireEvent.click(getDots(container)[0]);
      expect(animations).toHaveLength(0);

      // desktop: the dots are hidden by CSS
      (container.querySelector('.interactive-content-list__dots') as HTMLElement).style.display = 'none';
      fireEvent.click(container.querySelectorAll('.interactive-content-list__dot')[1]);
      expectActive(container, 1);
      expect(animations).toHaveLength(0);

      const { container: editing } = render(<InteractiveContentList {...makeProps({ isEditing: true, id: 'e' })} />);
      fireEvent.click(getDots(editing)[2]);
      expectActive(editing, 2);
      expect(animations).toHaveLength(0);

      window.matchMedia = jest.fn().mockReturnValue({ matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() });
      const { container: reduced } = render(<InteractiveContentList {...makeProps({ id: 'r' })} />);
      fireEvent.click(getDots(reduced)[2]);
      expectActive(reduced, 2);
      expect(animations).toHaveLength(0);
      expect(getGhost(reduced)).toBeEmptyDOMElement();
    });
  });

  it('keeps multiple instances independent', () => {
    const { container } = render(
      <>
        <InteractiveContentList {...makeProps({ id: 'a' })} />
        <InteractiveContentList {...makeProps({ id: 'b' })} />
      </>,
    );
    const [a, b] = Array.from(container.querySelectorAll<HTMLElement>('.content-list-component'));

    fireEvent.mouseEnter(getCards(a)[2]);
    expectActive(a, 2);
    expectActive(b, 0);
    expect(a.querySelector('.interactive-content-list__media')?.id).not.toBe(b.querySelector('.interactive-content-list__media')?.id);
  });
});

describe('InteractiveContentList (legacy rendering)', () => {
  it('renders the Content List Interactive variant', async () => {
    const { Default: LegacyInteractiveContentList } = await import('../../../components/interactive-content-list/InteractiveContentList');
    const { container } = render(<LegacyInteractiveContentList {...makeProps()} />);

    expect(container.querySelector('.component')).toHaveClass('content-list-component', 'content-list-component--interactive');
    expect(getCards(container)).toHaveLength(3);
    expectActive(container, 0);
  });
});
