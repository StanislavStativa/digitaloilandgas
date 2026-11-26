import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Default as Accordion, FAQ } from '../../../components/accordion/Accordion';
import { makeAccordionProps, makeForeignChild, makeItem } from './Accordion.mockProps';

jest.mock('@sitecore-content-sdk/nextjs', () => jest.requireActual('./Accordion.mockProps').contentSdkMock());

const buttons = () => screen.queryAllByRole('button');
const button = (name: string) => screen.getByRole('button', { name: new RegExp(name) });
const expanded = () =>
  buttons()
    .filter((b) => b.getAttribute('aria-expanded') === 'true')
    .map((b) => b.textContent);
const panelOf = (btn: HTMLElement) => document.getElementById(btn.getAttribute('aria-controls') as string) as HTMLElement;

describe('Accordion', () => {
  describe('structure', () => {
    it('renders every Accordion Item as a heading button, in Sitecore order, all collapsed', () => {
      const { container } = render(<Accordion {...makeAccordionProps({ count: 3 })} />);

      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper).toHaveClass('component', 'accordion-component', 'accordion-component--default', 'custom-style');
      expect(wrapper).toHaveAttribute('id', 'acc-1');
      expect(container.querySelector('.accordion')).toHaveClass('accordion--default');

      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings.map((h) => h.textContent)).toEqual(['Question 1', 'Question 2', 'Question 3']);
      headings.forEach((h) => expect(within(h).getByRole('button')).toHaveAttribute('type', 'button'));
      expect(expanded()).toEqual([]);
      container.querySelectorAll('.accordion__panel').forEach((panel) => expect(panel).toHaveAttribute('data-state', 'closed'));
    });

    it('links each button to its panel with aria-controls / aria-labelledby', () => {
      render(<Accordion {...makeAccordionProps({ count: 2 })} />);

      buttons().forEach((btn) => {
        const panel = panelOf(btn);
        expect(panel).toHaveClass('accordion__panel');
        expect(panel).toHaveAttribute('role', 'region');
        expect(panel).toHaveAttribute('aria-labelledby', btn.id);
      });
      expect(screen.getAllByRole('region', { hidden: true })).toHaveLength(2);
    });

    it('renders the description as rich text, lists and links included', () => {
      const description = '<p>Intro <a href="/x">link</a></p><ul><li>One<ul><li>Nested</li></ul></li><li>Two</li></ul>';
      const { container } = render(<Accordion {...makeAccordionProps({ items: [makeItem(1, { description })] })} />);

      const richText = container.querySelector('.accordion__description') as HTMLElement;
      expect(richText.innerHTML).toBe(description);
      expect(panelOf(button('Question 1'))).toContainElement(richText);
    });

    it('shows a check icon and a chevron in Default, no number', () => {
      const { container } = render(<Accordion {...makeAccordionProps({ count: 1 })} />);
      expect(container.querySelector('.accordion__check')).toHaveAttribute('aria-hidden', 'true');
      expect(container.querySelector('.accordion__chevron')).toHaveAttribute('aria-hidden', 'true');
      expect(container.querySelector('.accordion__number')).toBeNull();
      expect(container.querySelector('.accordion__plus-minus')).toBeNull();
    });
  });

  describe('single-open (AllowMultipleOpen unchecked, default)', () => {
    it('opens an item, closes it again, and opening another closes the previous one', () => {
      render(<Accordion {...makeAccordionProps({ count: 3 })} />);

      fireEvent.click(button('Question 1'));
      expect(expanded()).toEqual(['Question 1']);
      expect(panelOf(button('Question 1'))).toHaveAttribute('data-state', 'open');
      expect(button('Question 1').closest('.accordion__item')).toHaveClass('is-open');

      fireEvent.click(button('Question 2'));
      expect(expanded()).toEqual(['Question 2']);
      expect(panelOf(button('Question 1'))).toHaveAttribute('data-state', 'closed');

      fireEvent.click(button('Question 2'));
      expect(expanded()).toEqual([]);
    });

    it.each([[undefined], [''], ['0'], [false], ['false']])('treats AllowMultipleOpen=%p as single-open', (value) => {
      render(<Accordion {...makeAccordionProps({ count: 2, allowMultipleOpen: value })} />);
      fireEvent.click(button('Question 1'));
      fireEvent.click(button('Question 2'));
      expect(expanded()).toEqual(['Question 2']);
    });

    it('never has more than one item open across a rapid click sequence', () => {
      render(<Accordion {...makeAccordionProps({ count: 4 })} />);
      const sequence = [0, 0, 1, 3, 3, 2, 1, 1, 0, 2, 2, 2, 3];
      sequence.forEach((i) => {
        fireEvent.click(buttons()[i]);
        expect(expanded().length).toBeLessThanOrEqual(1);
      });
      // 13 clicks: the last one toggles item 4 open
      expect(expanded()).toEqual(['Question 4']);
    });
  });

  describe('multiple-open (AllowMultipleOpen checked)', () => {
    it.each([['1'], ['true'], [true]])('keeps other items open with AllowMultipleOpen=%p', (value) => {
      render(<Accordion {...makeAccordionProps({ count: 3, allowMultipleOpen: value })} />);

      fireEvent.click(button('Question 1'));
      fireEvent.click(button('Question 3'));
      expect(expanded()).toEqual(['Question 1', 'Question 3']);

      fireEvent.click(button('Question 1'));
      expect(expanded()).toEqual(['Question 3']);

      fireEvent.click(button('Question 1'));
      fireEvent.click(button('Question 2'));
      expect(expanded()).toEqual(['Question 1', 'Question 2', 'Question 3']);
    });

    it('keeps only the most recently opened item when switched to single-open, without remounting', () => {
      const { rerender } = render(<Accordion {...makeAccordionProps({ count: 3, allowMultipleOpen: '1' })} />);
      fireEvent.click(button('Question 3'));
      fireEvent.click(button('Question 1'));
      expect(expanded()).toEqual(['Question 1', 'Question 3']);

      rerender(<Accordion {...makeAccordionProps({ count: 3, allowMultipleOpen: '' })} />);
      expect(expanded()).toEqual(['Question 1']);

      fireEvent.click(button('Question 2'));
      expect(expanded()).toEqual(['Question 2']);

      // and back: the state carries on from the single open item
      rerender(<Accordion {...makeAccordionProps({ count: 3, allowMultipleOpen: '1' })} />);
      fireEvent.click(button('Question 3'));
      expect(expanded()).toEqual(['Question 2', 'Question 3']);
    });
  });

  describe('Open by default', () => {
    it('opens checked items on load, in the server HTML already', () => {
      const items = [makeItem(1), makeItem(2, { isOpenByDefault: true }), makeItem(3, { isOpenByDefault: false })];
      const { container } = render(<Accordion {...makeAccordionProps({ items })} />);

      expect(expanded()).toEqual(['Question 2']);
      expect(panelOf(button('Question 2'))).toHaveAttribute('data-state', 'open');
      expect(button('Question 2').closest('.accordion__item')).toHaveClass('is-open');
      expect(container.querySelectorAll('.is-open')).toHaveLength(1);
    });

    it.each([['1'], ['true'], [true]])('reads IsOpenByDefault=%p as checked', (value) => {
      render(<Accordion {...makeAccordionProps({ items: [makeItem(1, { isOpenByDefault: value })] })} />);
      expect(expanded()).toEqual(['Question 1']);
    });

    it.each([[''], ['0'], [false]])('reads IsOpenByDefault=%p as unchecked', (value) => {
      render(<Accordion {...makeAccordionProps({ items: [makeItem(1, { isOpenByDefault: value })] })} />);
      expect(expanded()).toEqual([]);
    });

    it('opens only the first checked item in single-open mode', () => {
      const items = [makeItem(1), makeItem(2, { isOpenByDefault: true }), makeItem(3, { isOpenByDefault: true })];
      render(<Accordion {...makeAccordionProps({ items })} />);
      expect(expanded()).toEqual(['Question 2']);

      fireEvent.click(button('Question 3'));
      expect(expanded()).toEqual(['Question 3']);
    });

    it('opens every checked item in multiple-open mode', () => {
      const items = [makeItem(1, { isOpenByDefault: '1' }), makeItem(2), makeItem(3, { isOpenByDefault: '1' })];
      render(<Accordion {...makeAccordionProps({ items, allowMultipleOpen: '1' })} />);
      expect(expanded()).toEqual(['Question 1', 'Question 3']);
    });

    it('lets the visitor close an item that was open by default', () => {
      render(<Accordion {...makeAccordionProps({ items: [makeItem(1, { isOpenByDefault: true })] })} />);
      fireEvent.click(button('Question 1'));
      expect(expanded()).toEqual([]);
    });

    it('skips checked items with nothing to expand, so the next checked one opens in single-open mode', () => {
      const items = [makeItem(1, { description: null, isOpenByDefault: true }), makeItem(2, { isOpenByDefault: true })];
      const { container } = render(<Accordion {...makeAccordionProps({ items })} />);
      expect(expanded()).toEqual(['Question 2']);
      expect(container.querySelectorAll('.is-open')).toHaveLength(1);
    });

    it('also works in the FAQ variant', () => {
      render(<FAQ {...makeAccordionProps({ items: [makeItem(1), makeItem(2, { isOpenByDefault: true })] })} />);
      expect(expanded()).toEqual(['2. Question 2']);
    });
  });

  describe('datasource changes', () => {
    it('keeps the open item by id when items are reordered, added or removed', () => {
      const { rerender } = render(<Accordion {...makeAccordionProps({ items: [makeItem(1), makeItem(2), makeItem(3)] })} />);
      fireEvent.click(button('Question 2'));

      rerender(<Accordion {...makeAccordionProps({ items: [makeItem(3), makeItem(4), makeItem(2), makeItem(1)] })} />);
      expect(screen.getAllByRole('heading').map((h) => h.textContent)).toEqual(['Question 3', 'Question 4', 'Question 2', 'Question 1']);
      expect(expanded()).toEqual(['Question 2']);

      rerender(<Accordion {...makeAccordionProps({ items: [makeItem(3), makeItem(1)] })} />);
      expect(expanded()).toEqual([]);
    });

    it('skips children of other templates', () => {
      render(<Accordion {...makeAccordionProps({ items: [makeItem(1), makeForeignChild('FOLDER'), makeItem(2)] })} />);
      expect(buttons()).toHaveLength(2);
    });
  });

  describe('empty and incomplete content', () => {
    it('leaves out items without a title on the live site', () => {
      render(<Accordion {...makeAccordionProps({ items: [makeItem(1, { title: null }), makeItem(2, { title: '   ' }), makeItem(3)] })} />);
      expect(screen.getAllByRole('heading').map((h) => h.textContent)).toEqual(['Question 3']);
    });

    it('renders an item without a description as a plain heading (nothing to expand)', () => {
      const { container } = render(<Accordion {...makeAccordionProps({ items: [makeItem(1, { description: null }), makeItem(2)] })} />);
      const [first] = screen.getAllByRole('heading');
      expect(within(first).queryByRole('button')).toBeNull();
      expect(first).toHaveTextContent('Question 1');
      expect(container.querySelectorAll('.accordion__panel')).toHaveLength(1);
      expect(buttons()).toHaveLength(1);
    });

    it('renders nothing on the live site without a datasource or without items', () => {
      const { container, rerender } = render(<Accordion {...makeAccordionProps({ noDatasource: true })} />);
      expect(container).toBeEmptyDOMElement();

      rerender(<Accordion {...makeAccordionProps({ items: [] })} />);
      expect(container).toBeEmptyDOMElement();

      rerender(<Accordion {...makeAccordionProps({ items: [makeItem(1, { title: null })] })} />);
      expect(container).toBeEmptyDOMElement();
    });

    it('survives fields missing entirely', () => {
      const props = { ...makeAccordionProps(), fields: undefined };
      const { container } = render(<Accordion {...props} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Pages editing', () => {
    it('expands every item and renders the headers without buttons so fields stay editable', () => {
      const items = [makeItem(1), makeItem(2, { title: null }), makeItem(3, { description: null })];
      const { container } = render(<Accordion {...makeAccordionProps({ items, isEditing: true })} />);

      expect(buttons()).toHaveLength(0);
      expect(container.querySelectorAll('.accordion__item')).toHaveLength(3);
      container.querySelectorAll('.accordion__item').forEach((item) => expect(item).toHaveClass('is-open'));
      container.querySelectorAll('.accordion__panel').forEach((panel) => {
        expect(panel).toHaveAttribute('data-state', 'open');
        expect(panel).not.toHaveAttribute('role');
      });
    });

    it('shows a hint when there is no datasource or no items', () => {
      const { rerender } = render(<Accordion {...makeAccordionProps({ noDatasource: true, isEditing: true })} />);
      expect(screen.getByText('Accordion: select or create a datasource')).toHaveClass('is-empty-hint');

      rerender(<Accordion {...makeAccordionProps({ items: [], isEditing: true })} />);
      expect(screen.getByText('Accordion: insert Accordion Item children into the datasource')).toBeInTheDocument();
    });
  });

  describe('FAQ variant', () => {
    it('numbers the questions from the item order and uses plus/minus controls', () => {
      const { container } = render(<FAQ {...makeAccordionProps({ count: 3 })} />);

      expect(container.firstElementChild).toHaveClass('accordion-component--faq');
      expect(container.querySelector('.accordion')).toHaveClass('accordion--faq');
      expect(buttons().map((b) => b.textContent)).toEqual(['1. Question 1', '2. Question 2', '3. Question 3']);
      expect(container.querySelectorAll('.accordion__plus-minus')).toHaveLength(3);
      expect(container.querySelector('.accordion__check')).toBeNull();
      expect(container.querySelector('.accordion__chevron')).toBeNull();
    });

    it('renumbers after a reorder, add or remove', () => {
      const { rerender } = render(<FAQ {...makeAccordionProps({ items: [makeItem(1), makeItem(2)] })} />);
      rerender(<FAQ {...makeAccordionProps({ items: [makeItem(3), makeItem(1), makeItem(2)] })} />);
      expect(buttons().map((b) => b.textContent)).toEqual(['1. Question 3', '2. Question 1', '3. Question 2']);

      rerender(<FAQ {...makeAccordionProps({ items: [makeItem(2)] })} />);
      expect(buttons().map((b) => b.textContent)).toEqual(['1. Question 2']);
    });

    it('uses the same AllowMultipleOpen behaviour as Default', () => {
      const { rerender } = render(<FAQ {...makeAccordionProps({ count: 2 })} />);
      fireEvent.click(button('Question 1'));
      fireEvent.click(button('Question 2'));
      expect(expanded()).toEqual(['2. Question 2']);

      rerender(<FAQ {...makeAccordionProps({ count: 2, allowMultipleOpen: '1' })} />);
      fireEvent.click(button('Question 1'));
      expect(expanded()).toEqual(['1. Question 1', '2. Question 2']);
    });

    it('renders the same datasource content as Default', () => {
      const props = makeAccordionProps({ count: 2 });
      const { container, rerender } = render(<Accordion {...props} />);
      const defaultDescriptions = Array.from(container.querySelectorAll('.accordion__description')).map((d) => d.innerHTML);

      rerender(<FAQ {...props} />);
      expect(Array.from(container.querySelectorAll('.accordion__description')).map((d) => d.innerHTML)).toEqual(defaultDescriptions);
      expect(screen.getAllByRole('heading')).toHaveLength(2);
    });
  });

  it('keeps several accordions on one page independent, with unique ids', () => {
    render(
      <>
        <Accordion {...makeAccordionProps({ count: 2, id: 'first' })} />
        <FAQ {...makeAccordionProps({ count: 2, id: 'second' })} />
      </>,
    );
    const [firstA, , secondA] = buttons();
    fireEvent.click(firstA);
    fireEvent.click(secondA);
    expect(expanded()).toEqual(['Question 1', '1. Question 1']);

    const ids = buttons().flatMap((b) => [b.id, b.getAttribute('aria-controls')]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
