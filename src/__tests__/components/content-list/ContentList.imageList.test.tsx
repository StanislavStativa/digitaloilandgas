import '@testing-library/jest-dom';
import { render, within } from '@testing-library/react';
import * as ContentListModule from '../../../components/content-list/ContentList';
import { ImageList as ContentList } from '../../../components/content-list/ContentList';
import { IMAGE_LIST_IMAGE_SIZES } from '../../../components/content-list/ImageListItem';
import { makeItem, makeProps } from './ContentList.mockProps';

type MockField = { value?: Record<string, string> | string };
type MockImageField = { value?: { src?: string; alt?: string } };

jest.mock('@sitecore-content-sdk/nextjs', () => ({
  // next/image wrapper: `fill` and `sizes` are what the variant relies on for responsive loading
  NextImage: ({ field, fill, sizes }: { field?: MockImageField; fill?: boolean; sizes?: string }) =>
    field?.value?.src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={field.value.src} alt={field.value.alt ?? ''} sizes={sizes} data-fill={fill ? 'true' : undefined} data-next-image="true" />
    ) : null,
  // Plain SDK image: only used for the empty, editable field in Pages
  Image: ({ field }: { field?: MockImageField }) =>
    field?.value?.src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={field.value.src} alt={field.value.alt ?? ''} />
    ) : (
      <span data-testid="empty-image-field" />
    ),
  Text: ({ field }: { field?: MockField }) => <>{field?.value as string}</>,
  RichText: ({ field, className }: { field?: MockField; className?: string }) => (
    <div className={className} dangerouslySetInnerHTML={{ __html: (field?.value as string) ?? '' }} />
  ),
  Link: ({ field }: { field?: { value?: Record<string, string> } }) =>
    field?.value?.href ? <a href={field.value.href}>{field.value.text}</a> : null,
}));

const getCards = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>('.image-content-list__card'));

describe('ContentList (Image List variant)', () => {
  it('is exported as "ImageList", the Variant Definition item name that FieldNames resolves to', () => {
    expect(typeof ContentListModule.ImageList).toBe('function');
    // Existing variants stay exported under their names
    expect(typeof ContentListModule.Default).toBe('function');
    expect(typeof ContentListModule.Interactive).toBe('function');
  });

  it('renders every item as a card in datasource order: image, then h4 title + rich text description', () => {
    const { container } = render(<ContentList {...makeProps()} />);

    const list = within(container).getByRole('list');
    expect(list).toHaveClass('image-content-list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);

    const cards = getCards(container);
    expect(cards.map((card) => card.querySelector('h4')?.textContent)).toEqual(['Item title 1', 'Item title 2', 'Item title 3']);

    const [first] = cards;
    expect(Array.from(first.children).map((child) => child.className)).toEqual(['image-content-list__media', 'image-content-list__body']);
    const body = first.querySelector('.image-content-list__body') as HTMLElement;
    expect(Array.from(body.children).map((child) => child.className)).toEqual(['image-content-list__title', 'image-content-list__description']);

    const wrapper = container.querySelector('.component') as HTMLElement;
    expect(wrapper).toHaveClass('content-list-component', 'content-list-component--image-list', 'custom-style');
    expect(wrapper).toHaveAttribute('id', 'icl-1');
  });

  it('uses next/image in fill mode with responsive sizes', () => {
    const { container } = render(<ContentList {...makeProps({ count: 1 })} />);
    const img = container.querySelector('.image-content-list__media img') as HTMLElement;

    expect(img).toHaveAttribute('src', '/item-1.jpg');
    expect(img).toHaveAttribute('alt', 'Image alt 1');
    expect(img).toHaveAttribute('data-next-image', 'true');
    expect(img).toHaveAttribute('data-fill', 'true');
    expect(img).toHaveAttribute('sizes', IMAGE_LIST_IMAGE_SIZES);
  });

  it('keeps rich text formatting in the description', () => {
    const items = [makeItem(1, { description: '<p>First <strong>bold</strong></p><ul><li>One</li></ul>' })];
    const { container } = render(<ContentList {...makeProps({ items })} />);
    const description = container.querySelector('.image-content-list__description') as HTMLElement;

    expect(description.querySelector('strong')).toHaveTextContent('bold');
    expect(description.querySelector('ul li')).toHaveTextContent('One');
  });

  it('does not render the CTA link of the shared item template', () => {
    const { container } = render(<ContentList {...makeProps()} />);
    expect(within(container).queryAllByRole('link')).toHaveLength(0);
    expect(container.querySelector('[class*="__cta"]')).toBeNull();
  });

  it('renders long titles and descriptions in full (no truncation in markup)', () => {
    const longTitle = 'Cost-effective Well Manager Software for Oil and Gas Operators '.repeat(3).trim();
    const longText = `<p>${'Industrial IoT sensors accumulate and transmit data. '.repeat(20).trim()}</p>`;
    const { container } = render(<ContentList {...makeProps({ items: [makeItem(1, { title: longTitle, description: longText })] })} />);

    expect(container.querySelector('h4')).toHaveTextContent(longTitle);
    expect(container.querySelector('.image-content-list__description')?.innerHTML).toBe(longText);
  });

  it('supports many items', () => {
    const { container } = render(<ContentList {...makeProps({ count: 12 })} />);
    expect(getCards(container)).toHaveLength(12);
  });

  describe('live site, missing content', () => {
    it('renders a text-only card when the image is missing (no empty image box)', () => {
      const { container } = render(<ContentList {...makeProps({ items: [makeItem(1, { image: null })] })} />);
      const [card] = getCards(container);

      expect(card).toHaveClass('image-content-list__card--no-image');
      expect(card.querySelector('.image-content-list__media')).toBeNull();
      expect(card.querySelector('h4')).toHaveTextContent('Item title 1');
    });

    it('omits an empty description and an empty title', () => {
      const items = [makeItem(1, { description: null }), makeItem(2, { title: null })];
      const { container } = render(<ContentList {...makeProps({ items })} />);
      const [first, second] = getCards(container);

      expect(first.querySelector('.image-content-list__description')).toBeNull();
      expect(second.querySelector('h4')).toBeNull();
      expect(second.querySelector('img')).not.toBeNull();
    });

    it('skips items with neither a title nor an image', () => {
      const items = [makeItem(1), makeItem(2, { title: null, image: null }), makeItem(3)];
      const { container } = render(<ContentList {...makeProps({ items })} />);
      expect(getCards(container).map((card) => card.querySelector('h4')?.textContent)).toEqual(['Item title 1', 'Item title 3']);
    });

    it('renders nothing for an empty list or a missing datasource', () => {
      expect(render(<ContentList {...makeProps({ items: [] })} />).container).toBeEmptyDOMElement();
      expect(render(<ContentList {...makeProps({ noDatasource: true })} />).container).toBeEmptyDOMElement();
    });

    it('tolerates an item without image data at all', () => {
      const item = { ...makeItem(1), image: undefined };
      const { container } = render(<ContentList {...makeProps({ items: [item] })} />);
      expect(getCards(container)).toHaveLength(1);
      expect(container.querySelector('img')).toBeNull();
    });
  });

  describe('Pages (editing)', () => {
    it('keeps empty image, title and description editable with a hint for the image', () => {
      const items = [makeItem(1, { image: null, title: null, description: null })];
      const { container, getByTestId } = render(<ContentList {...makeProps({ items, isEditing: true })} />);
      const [card] = getCards(container);

      expect(container.querySelector('.component')).toHaveClass('is-editing');
      expect(card).not.toHaveClass('image-content-list__card--no-image');
      expect(getByTestId('empty-image-field')).toBeInTheDocument();
      expect(card.querySelector('.is-empty-hint')).toHaveTextContent('Item 1: select an image');
      expect(card.querySelector('h4')).not.toBeNull();
      expect(card.querySelector('.image-content-list__description')).not.toBeNull();
    });

    it('shows a hint for an empty datasource or a missing one', () => {
      const empty = render(<ContentList {...makeProps({ items: [], isEditing: true })} />);
      expect(empty.container).toHaveTextContent('Content List: add Content List Item children to the datasource');

      const missing = render(<ContentList {...makeProps({ noDatasource: true, isEditing: true })} />);
      expect(missing.container).toHaveTextContent('Content List: select or create a datasource');
    });
  });
});
