import '@testing-library/jest-dom';
import { fireEvent, render, within } from '@testing-library/react';
import { Default as ContentList } from '../../../components/content-list/ContentList';
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

const getCards = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>('.content-list__card'));

describe('ContentList (Default variant)', () => {
  it('renders every item as a card in datasource order: image, h4 title, description, CTA', () => {
    const { container } = render(<ContentList {...makeProps()} />);

    const list = within(container).getByRole('list');
    expect(list).toHaveClass('content-list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);

    const cards = getCards(container);
    expect(cards.map((card) => card.querySelector('h4')?.textContent)).toEqual(['Item title 1', 'Item title 2', 'Item title 3']);

    const [first] = cards;
    expect(Array.from(first.children).map((child) => child.className)).toEqual([
      'content-list__image',
      'content-list__title',
      'content-list__description',
      'content-list__cta',
    ]);
    expect(first.querySelector('img')).toHaveAttribute('src', '/item-1.jpg');
    expect(first.querySelector('img')).toHaveAttribute('alt', 'Image alt 1');
    expect(first.querySelector('img')).toHaveAttribute('loading', 'lazy');
    expect(within(first).getByRole('link', { name: 'Explore' })).toHaveAttribute('href', '/solutions/item-1');

    const wrapper = container.querySelector('.component') as HTMLElement;
    expect(wrapper).toHaveClass('content-list-component', 'content-list-component--default', 'custom-style');
    expect(wrapper).toHaveAttribute('id', 'icl-1');
  });

  it('is not interactive: no buttons, no dots, no active state', () => {
    const { container } = render(<ContentList {...makeProps()} />);

    expect(within(container).queryAllByRole('button')).toHaveLength(0);
    fireEvent.mouseEnter(getCards(container)[1]);
    expect(container.querySelector('.is-active')).toBeNull();
  });

  it('omits empty image, description and CTA on the live site', () => {
    const items = [makeItem(1, { image: null, description: null, link: null })];
    const { container } = render(<ContentList {...makeProps({ items })} />);
    const [card] = getCards(container);

    expect(card.querySelector('.content-list__image')).toBeNull();
    expect(card.querySelector('.content-list__description')).toBeNull();
    expect(card.querySelector('.content-list__cta')).toBeNull();
    expect(card.querySelector('h4')).toHaveTextContent('Item title 1');
  });

  it('renders no empty heading for an image-only item on the live site, but keeps it editable in Pages', () => {
    const items = [makeItem(1, { title: null })];

    const { container } = render(<ContentList {...makeProps({ items })} />);
    const [card] = getCards(container);
    expect(card.querySelector('img')).not.toBeNull();
    expect(card.querySelector('h4')).toBeNull();

    const { container: editing } = render(<ContentList {...makeProps({ isEditing: true, items })} />);
    expect(getCards(editing)[0].querySelector('h4.content-list__title')).not.toBeNull();
  });

  it('keeps a CTA slot with a hint in Pages when the query returns no ctaLink field', () => {
    const items = [{ ...makeItem(1), ctaLink: undefined }];

    const { container: live } = render(<ContentList {...makeProps({ items })} />);
    expect(getCards(live)[0].querySelector('.content-list__cta')).toBeNull();

    const { container } = render(<ContentList {...makeProps({ isEditing: true, items })} />);
    expect(getCards(container)[0].querySelector('.content-list__cta')).toHaveTextContent('CTA link: set it in the item fields');
  });

  it('renders nothing on the live site without items, and skips items with neither title nor image', () => {
    const { container: empty } = render(<ContentList {...makeProps({ count: 0 })} />);
    expect(empty).toBeEmptyDOMElement();

    const items = [makeItem(1, { title: null, image: null }), makeItem(2), makeItem(3, { image: null })];
    const { container } = render(<ContentList {...makeProps({ items })} />);
    expect(getCards(container).map((card) => card.querySelector('h4')?.textContent)).toEqual(['Item title 2', 'Item title 3']);
  });

  it('shows editing placeholders in Pages for a missing datasource, no items and missing images', () => {
    const { container: noDs } = render(<ContentList {...makeProps({ isEditing: true, noDatasource: true })} />);
    expect(noDs).toHaveTextContent('select or create a datasource');

    const { container: noItems } = render(<ContentList {...makeProps({ isEditing: true, count: 0 })} />);
    expect(noItems).toHaveTextContent('add Content List Item children');

    const items = [makeItem(1, { image: null, title: null, description: null, link: null })];
    const { container } = render(<ContentList {...makeProps({ isEditing: true, items })} />);
    const [card] = getCards(container);
    expect(card.querySelector('.content-list__image')).toHaveTextContent('Item 1: select an image');
    expect(card.querySelector('.content-list__description')).not.toBeNull();
    expect(container.querySelector('.component')).toHaveClass('is-editing');
  });
});
