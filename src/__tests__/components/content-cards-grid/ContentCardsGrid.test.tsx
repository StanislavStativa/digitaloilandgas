import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ContentCard } from '../../../components/content-cards-grid/ContentCard';
import { Default as ContentCardsGrid } from '../../../components/content-cards-grid/ContentCardsGrid';
import { ContentCardsGridProps, readCardHeight, readCardWidth } from '../../../components/content-cards-grid/ContentCardsGrid.props';
import { makeCard, makeForeignChild, makeGridProps } from './ContentCardsGrid.mockProps';

jest.mock('@sitecore-content-sdk/nextjs', () => jest.requireActual('./ContentCardsGrid.mockProps').contentSdkMock());

const cards = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>('.content-card'));
const titles = () => screen.queryAllByRole('heading', { level: 3 }).map((h) => h.textContent);

describe('ContentCardsGrid', () => {
  it('renders every Content Card Item as a list item, in Sitecore order', () => {
    const { container } = render(<ContentCardsGrid {...makeGridProps({ count: 5 })} />);

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass('component', 'content-cards-grid-component', 'custom-style');
    expect(wrapper).toHaveAttribute('id', 'ccg-1');

    const list = screen.getByRole('list');
    expect(list).toHaveClass('content-cards-grid');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(5);
    items.forEach((item) => expect(item).toHaveClass('content-card'));
    expect(titles()).toEqual(['Card 1', 'Card 2', 'Card 3', 'Card 4', 'Card 5']);
  });

  it('renders the title as an h3 with the accent class and the description as rich text', () => {
    const items = [makeCard(1, { description: '<p>One <strong>bold</strong> <a href="/x">link</a></p><ul><li>A</li><li>B</li></ul>' })];
    const { container } = render(<ContentCardsGrid {...makeGridProps({ items })} />);
    const card = cards(container)[0];

    expect(within(card).getByRole('heading', { level: 3, name: 'Card 1' })).toHaveClass('content-card__title');
    const description = card.querySelector('.content-card__description') as HTMLElement;
    expect(description.querySelector('strong')).toHaveTextContent('bold');
    expect(within(description).getByRole('link', { name: 'link' })).toHaveAttribute('href', '/x');
    expect(within(description).getAllByRole('listitem')).toHaveLength(2);
  });

  it('gives every card its own width and height classes', () => {
    const items = [
      makeCard(1, { width: '1-3', height: 'Tall' }),
      makeCard(2, { width: '1-3', height: 'Auto' }),
      makeCard(3, { width: '1-3', height: 'Compact' }),
      makeCard(4, { width: '1-2', height: 'Compact' }),
      makeCard(5, { width: '1-2', height: 'Medium' }),
    ];
    const { container } = render(<ContentCardsGrid {...makeGridProps({ items })} />);

    expect(cards(container).map((card) => card.className)).toEqual([
      'content-card content-card--width-third content-card--height-tall',
      'content-card content-card--width-third content-card--height-auto',
      'content-card content-card--width-third content-card--height-compact',
      'content-card content-card--width-half content-card--height-compact',
      'content-card content-card--width-half content-card--height-medium',
    ]);
  });

  it('falls back to 1/3 and Auto for missing, empty and invalid Width / Height values', () => {
    const items = [makeCard(1, { width: null, height: null }), makeCard(2, { width: '', height: '' }), makeCard(3, { width: '2/3', height: 'Huge' })];
    const { container } = render(<ContentCardsGrid {...makeGridProps({ items })} />);

    cards(container).forEach((card) => {
      expect(card).toHaveClass('content-card--width-third', 'content-card--height-auto');
    });
  });

  it('keeps the datasource order when cards are reordered, added or removed', () => {
    const { rerender } = render(<ContentCardsGrid {...makeGridProps({ items: [makeCard(3), makeCard(1), makeCard(2)] })} />);
    expect(titles()).toEqual(['Card 3', 'Card 1', 'Card 2']);

    rerender(<ContentCardsGrid {...makeGridProps({ items: [makeCard(2), makeCard(5), makeCard(4), makeCard(1)] })} />);
    expect(titles()).toEqual(['Card 2', 'Card 5', 'Card 4', 'Card 1']);
  });

  it('renders a single card', () => {
    render(<ContentCardsGrid {...makeGridProps({ count: 1 })} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('keeps long titles and long descriptions whole', () => {
    const longTitle = 'A very long title '.repeat(12).trim();
    const longText = `<p>${'Long description text. '.repeat(80)}</p><p>Second paragraph.</p>`;
    const { container } = render(<ContentCardsGrid {...makeGridProps({ items: [makeCard(1, { title: longTitle, description: longText })] })} />);

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(longTitle);
    expect(container.querySelectorAll('.content-card__description p')).toHaveLength(2);
  });

  it('leaves out an empty description and an empty title on the live site', () => {
    const items = [makeCard(1, { description: null }), makeCard(2, { title: null }), makeCard(3, { description: '   ' })];
    const { container } = render(<ContentCardsGrid {...makeGridProps({ items })} />);
    const [first, second, third] = cards(container);

    expect(first.querySelector('.content-card__description')).toBeNull();
    expect(second.querySelector('.content-card__title')).toBeNull();
    expect(second.querySelector('.content-card__description')).toHaveTextContent('Description 2');
    expect(third.querySelector('.content-card__description')).toBeNull();
  });

  it('skips cards without title and description, nulls and children of other templates on the live site', () => {
    const items = [makeCard(1), makeCard(2, { title: null, description: null }), null, makeForeignChild('FOREIGN'), makeCard(3)];
    render(<ContentCardsGrid {...makeGridProps({ items })} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(titles()).toEqual(['Card 1', 'Card 3']);
  });

  it('renders nothing on the live site without a datasource or without cards', () => {
    const { container, rerender } = render(<ContentCardsGrid {...makeGridProps({ noDatasource: true })} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<ContentCardsGrid {...makeGridProps({ noChildren: true })} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<ContentCardsGrid {...makeGridProps()} fields={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps empty cards in Pages so they stay editable', () => {
    const items = [makeCard(1, { title: null, description: null }), makeCard(2)];
    const { container } = render(<ContentCardsGrid {...makeGridProps({ items, isEditing: true })} />);

    expect(cards(container)).toHaveLength(2);
    expect(cards(container)[0]).toHaveClass('content-card--width-third', 'content-card--height-auto');
  });

  it('shows an editing hint in Pages when the datasource is missing or has no cards', () => {
    const { rerender } = render(<ContentCardsGrid {...makeGridProps({ noDatasource: true, isEditing: true })} />);
    expect(screen.getByText('Content Cards Grid: select or create a datasource')).toHaveClass('is-empty-hint');

    rerender(<ContentCardsGrid {...makeGridProps({ noChildren: true, isEditing: true })} />);
    expect(screen.getByText('Content Cards Grid: insert Content Card Item children into the datasource')).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('accepts plain (non-GraphQL) datasource fields', () => {
    const fields: ContentCardsGridProps['fields'] = { items: { results: [makeCard(7)] } };
    render(<ContentCardsGrid {...makeGridProps()} fields={fields} />);
    expect(titles()).toEqual(['Card 7']);
  });

  it('renders independent instances without shared ids', () => {
    const { container } = render(
      <>
        <ContentCardsGrid {...makeGridProps({ id: 'a', count: 2 })} />
        <ContentCardsGrid {...makeGridProps({ id: 'b', count: 3 })} />
      </>,
    );
    expect(container.querySelector('#a')?.querySelectorAll('.content-card')).toHaveLength(2);
    expect(container.querySelector('#b')?.querySelectorAll('.content-card')).toHaveLength(3);
  });

  it('omits the id attribute when RenderingIdentifier is not set', () => {
    const props = makeGridProps();
    const { container } = render(<ContentCardsGrid {...props} params={{ styles: 'custom-style' }} />);
    expect(container.firstElementChild).not.toHaveAttribute('id');
  });
});

describe('ContentCard', () => {
  it('renders as a div with default width and height', () => {
    const { container } = render(<ContentCard title={{ value: 'Solo' }} description={{ value: '<p>Text</p>' }} />);
    const card = container.firstElementChild as HTMLElement;
    expect(card.tagName).toBe('DIV');
    expect(card).toHaveClass('content-card', 'content-card--width-third', 'content-card--height-auto');
  });
});

describe('readCardWidth / readCardHeight', () => {
  it.each([
    ['1-3', 'third'],
    ['1/3', 'third'],
    [' 1 / 3 ', 'third'],
    ['1-2', 'half'],
    ['1/2', 'half'],
    ['1_2', 'half'],
    ['', 'third'],
    [undefined, 'third'],
    [null, 'third'],
    ['2/3', 'third'],
  ])('width %p → %p', (value, expected) => expect(readCardWidth(value)).toBe(expected));

  it.each([
    ['Auto', 'auto'],
    ['Compact', 'compact'],
    ['medium', 'medium'],
    [' TALL ', 'tall'],
    ['', 'auto'],
    [undefined, 'auto'],
    ['Huge', 'auto'],
  ])('height %p → %p', (value, expected) => expect(readCardHeight(value)).toBe(expected));
});

/** Static checks on the stylesheet: the layout rules the requirements forbid or demand */
describe('content-cards-grid.css', () => {
  const css = readFileSync(join(process.cwd(), 'src/assets/components/content-cards-grid.css'), 'utf8');
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '');

  it('uses a six-column desktop grid with 2- and 3-column spans', () => {
    expect(code).toMatch(/grid-cols-6/);
    expect(code).toMatch(/\.content-card--width-third\s*{\s*@apply col-span-2;/);
    expect(code).toMatch(/\.content-card--width-half\s*{\s*@apply col-span-3;/);
  });

  it('never reorders cards, never forces equal rows and never fixes heights', () => {
    expect(code).not.toMatch(/dense/);
    expect(code).not.toMatch(/grid-auto-rows|auto-rows/);
    expect(code).not.toMatch(/(^|[\s;{])(h-|height:)/m);
    expect(code).not.toMatch(/overflow/);
    expect(code).not.toMatch(/absolute/);
  });

  it('applies the Height options as min-height variables', () => {
    ['compact', 'medium', 'tall'].forEach((height) => {
      expect(code).toMatch(new RegExp(`\\.content-card--height-${height}\\s*{\\s*@apply min-h-\\(--content-cards-min-h-${height}\\);`));
    });
  });

  it('gives only the card a background', () => {
    const backgrounds = code.match(/[^{}]+{[^{}]*\bbg-[^{}]*}/g) ?? [];
    expect(backgrounds.map((rule) => rule.split('{')[0].trim())).toEqual(['.content-card']);
  });
});
