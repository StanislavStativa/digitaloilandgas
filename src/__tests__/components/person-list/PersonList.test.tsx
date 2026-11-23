import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import { Default as PersonList } from '../../../components/person-list/PersonList';
import { makeForeignChild, makePerson, makePersonListProps } from './PersonList.mockProps';

jest.mock('@sitecore-content-sdk/nextjs', () => jest.requireActual('./PersonList.mockProps').contentSdkMock());
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children?: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const names = () => screen.queryAllByRole('heading', { level: 3 }).map((h) => h.textContent);
const cards = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>('.person-card'));

describe('PersonList', () => {
  it('renders every Person Item as a card in a list, in Sitecore order', () => {
    const { container } = render(<PersonList {...makePersonListProps({ count: 4 })} />);

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass('component', 'person-list-component', 'custom-style');
    expect(wrapper).toHaveAttribute('id', 'pl-1');

    const list = screen.getByRole('list');
    expect(list).toHaveClass('person-list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(4);
    items.forEach((item) => expect(item).toHaveClass('person-card'));
    expect(names()).toEqual(['Person 1', 'Person 2', 'Person 3', 'Person 4']);
  });

  it('renders photo, name, position, description and LinkedIn of a person', () => {
    const { container } = render(<PersonList {...makePersonListProps({ count: 1 })} />);
    const card = cards(container)[0];

    const photo = within(card).getByRole('img', { name: 'Photo of person 1' });
    expect(photo).toHaveAttribute('src', '/-/media/person-1.jpg');
    expect(photo).toHaveAttribute('width', '80');
    expect(photo.closest('.person-card__photo')).toBeInTheDocument();

    expect(within(card).getByRole('heading', { level: 3, name: 'Person 1' })).toHaveClass('person-card__name');
    expect(card.querySelector('p.person-card__position')).toHaveTextContent('Position 1');
    expect(card.querySelector('.person-card__description')).toContainHTML('<p>Description 1</p>');

    const link = within(card).getByRole('link', { name: 'Person 1 on LinkedIn (opens in a new tab)' });
    expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/person-1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps the datasource order when items are reordered, added or removed', () => {
    const { rerender } = render(<PersonList {...makePersonListProps({ items: [makePerson(3), makePerson(1), makePerson(2)] })} />);
    expect(names()).toEqual(['Person 3', 'Person 1', 'Person 2']);

    rerender(<PersonList {...makePersonListProps({ items: [makePerson(2), makePerson(5), makePerson(4), makePerson(1), makePerson(3)] })} />);
    expect(names()).toEqual(['Person 2', 'Person 5', 'Person 4', 'Person 1', 'Person 3']);
  });

  it('handles a single person and an odd number of people', () => {
    const { rerender } = render(<PersonList {...makePersonListProps({ count: 1 })} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);

    rerender(<PersonList {...makePersonListProps({ count: 5 })} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('leaves out an empty description and an empty LinkedIn link', () => {
    const items = [makePerson(1, { description: null }), makePerson(2, { linkedIn: null }), makePerson(3, { description: '   ' })];
    const { container } = render(<PersonList {...makePersonListProps({ items })} />);
    const [first, second, third] = cards(container);

    expect(first.querySelector('.person-card__description')).toBeNull();
    expect(within(first).getByRole('link')).toBeInTheDocument();
    expect(second.querySelector('.person-card__description')).toBeInTheDocument();
    expect(second.querySelector('.person-card__social')).toBeNull();
    expect(within(second).queryByRole('link')).toBeNull();
    expect(third.querySelector('.person-card__description')).toBeNull();
  });

  it('respects a LinkedIn link that opens in the same tab', () => {
    render(<PersonList {...makePersonListProps({ items: [makePerson(1, { target: '' })] })} />);
    const link = screen.getByRole('link', { name: 'Person 1 on LinkedIn' });
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
  });

  it('renders a card without a photo, and a decorative photo when the alt text is empty', () => {
    const { container } = render(
      <PersonList {...makePersonListProps({ items: [makePerson(1, { photo: null }), makePerson(2, { photoAlt: '' })] })} />,
    );
    const [noPhoto, noAlt] = cards(container);

    expect(noPhoto.querySelector('.person-card__photo')).toBeNull();
    expect(within(noPhoto).getByRole('heading', { name: 'Person 1' })).toBeInTheDocument();
    expect(noAlt.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('renders long names, positions and descriptions in full', () => {
    const longName = 'Maximiliana Alexandrina Featherstonehaugh-Montgomery';
    const longPosition = 'Senior Vice President of Digital Transformation, Upstream and Midstream Operations';
    const longDescription = `<p>${'Long description sentence. '.repeat(40)}</p><p>Second paragraph.</p>`;
    const { container } = render(
      <PersonList {...makePersonListProps({ items: [makePerson(1, { name: longName, position: longPosition, description: longDescription })] })} />,
    );

    expect(screen.getByRole('heading', { name: longName })).toBeInTheDocument();
    expect(screen.getByText(longPosition)).toBeInTheDocument();
    expect(container.querySelectorAll('.person-card__description p')).toHaveLength(2);
  });

  it('skips children of other templates and, on the live site, people without a name and photo', () => {
    const items = [
      makePerson(1),
      makeForeignChild('FOLDER'),
      makePerson(2, { name: null, photo: null }),
      makePerson(3, { name: null }),
      makePerson(4),
    ];
    const { container } = render(<PersonList {...makePersonListProps({ items })} />);

    expect(cards(container)).toHaveLength(3);
    expect(names()).toEqual(['Person 1', 'Person 4']);
  });

  it('tolerates null entries and items without fields', () => {
    const items = [null, { id: 'BARE' }, makePerson(1)] as unknown as ReturnType<typeof makePerson>[];
    render(<PersonList {...makePersonListProps({ items })} />);
    expect(names()).toEqual(['Person 1']);
  });

  it('renders nothing on the live site for an empty list or a missing datasource', () => {
    expect(render(<PersonList {...makePersonListProps({ count: 0 })} />).container).toBeEmptyDOMElement();
    expect(render(<PersonList {...makePersonListProps({ noDatasource: true })} />).container).toBeEmptyDOMElement();
  });

  it('shows editing hints in Pages for an empty list and a missing datasource', () => {
    const { rerender } = render(<PersonList {...makePersonListProps({ count: 0, isEditing: true })} />);
    expect(screen.getByText('Person List: insert Person Item children into the datasource')).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();

    rerender(<PersonList {...makePersonListProps({ noDatasource: true, isEditing: true })} />);
    expect(screen.getByText('Person List: select or create a datasource')).toBeInTheDocument();
  });

  it('keeps an empty Person Item (fresh from the branch) visible and editable in Pages', () => {
    const empty = makePerson(1, { name: null, position: null, description: null, photo: null, linkedIn: null });
    const { container } = render(<PersonList {...makePersonListProps({ items: [empty], isEditing: true })} />);

    expect(cards(container)).toHaveLength(1);
    // Pages renders empty fields so the editor can fill them inline (the real field components show placeholders)
    expect(container.querySelector('.person-card__photo')).toBeInTheDocument();
    expect(container.querySelector('.person-card__social')).toBeInTheDocument();
  });

  it('supports multiple instances on one page', () => {
    const { container } = render(
      <>
        <PersonList {...makePersonListProps({ count: 2, id: 'team-a' })} />
        <PersonList {...makePersonListProps({ count: 3, id: 'team-b' })} />
      </>,
    );
    expect(container.querySelectorAll('#team-a .person-card')).toHaveLength(2);
    expect(container.querySelectorAll('#team-b .person-card')).toHaveLength(3);
  });

  it('puts no background classes on the list wrapper; the card background lives in .person-card only', () => {
    const { container } = render(<PersonList {...makePersonListProps({ count: 2 })} />);
    const wrapper = container.firstElementChild as HTMLElement;
    [wrapper, wrapper.firstElementChild as HTMLElement, screen.getByRole('list')].forEach((el) => {
      expect(el.className).not.toMatch(/\bbg-/);
      expect(el).not.toHaveAttribute('style');
    });
  });
});
