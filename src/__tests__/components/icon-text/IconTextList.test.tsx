import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import { Default, Feature } from '../../../components/icon-text/IconTextList';
import { makeListItem, makeListProps } from './IconText.mockProps';

jest.mock('@sitecore-content-sdk/nextjs', () => jest.requireActual('./IconText.mockProps').contentSdkMock());

const titles = () => screen.queryAllByRole('heading').map((h) => h.textContent);

describe('IconTextList', () => {
  it('renders every child item in Sitecore order as a list item', () => {
    const { container } = render(<Default {...makeListProps({ count: 3 })} />);

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass('component', 'icon-text-component', 'icon-text-component--default', 'custom-style');
    expect(wrapper).toHaveAttribute('id', 'itl-1');

    const list = screen.getByRole('list');
    expect(list).toHaveClass('icon-text-list', 'icon-text-list--default');
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(titles()).toEqual(['Title 1', 'Title 2', 'Title 3']);
  });

  it('keeps the datasource order when items are reordered, added or removed', () => {
    const items = [makeListItem(3), makeListItem(1), makeListItem(4), makeListItem(2)];
    const { rerender } = render(<Default {...makeListProps({ items })} />);
    expect(titles()).toEqual(['Title 3', 'Title 1', 'Title 4', 'Title 2']);

    rerender(<Default {...makeListProps({ items: [makeListItem(2), makeListItem(3)] })} />);
    expect(titles()).toEqual(['Title 2', 'Title 3']);
  });

  it('renders a single item', () => {
    render(<Feature {...makeListProps({ count: 1 })} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('applies the selected variant to every item', () => {
    const { container, rerender } = render(<Default {...makeListProps({ count: 4 })} />);
    expect(container.querySelectorAll('li.icon-text--default')).toHaveLength(4);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4);

    rerender(<Feature {...makeListProps({ count: 4 })} />);
    expect(screen.getByRole('list')).toHaveClass('icon-text-list--feature');
    expect(container.querySelectorAll('li.icon-text--feature')).toHaveLength(4);
    expect(container.querySelectorAll('.icon-text--default')).toHaveLength(0);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4);
  });

  it('handles items with an empty description', () => {
    const { container } = render(<Feature {...makeListProps({ items: [makeListItem(1, { description: null }), makeListItem(2)] })} />);
    const [first, second] = Array.from(container.querySelectorAll('.icon-text__content'));
    expect(first.querySelector('.icon-text__description')).toBeNull();
    expect(second.querySelector('.icon-text__description')).toBeInTheDocument();
  });

  it('skips children of other templates and, on the live site, items without title and icon', () => {
    const items = [
      makeListItem(1),
      makeListItem(2, { templateId: '{11111111-2222-3333-4444-555555555555}' }),
      makeListItem(3, { title: null, icon: null }),
      makeListItem(4, { templateId: '{F2D86F26-00F4-47F3-85AC-EFF5152EAB9D}' }),
    ];
    render(<Default {...makeListProps({ items })} />);
    expect(titles()).toEqual(['Title 1', 'Title 4']);
  });

  it('tolerates missing fields on an item', () => {
    const items = [{ id: 'bare' }, makeListItem(1)] as ReturnType<typeof makeListItem>[];
    render(<Default {...makeListProps({ items, isEditing: true })} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders nothing on the live site for an empty list or missing datasource', () => {
    expect(render(<Default {...makeListProps({ count: 0 })} />).container).toBeEmptyDOMElement();
    expect(render(<Feature {...makeListProps({ noDatasource: true })} />).container).toBeEmptyDOMElement();
  });

  it('shows editing hints in Pages for an empty list', () => {
    render(<Default {...makeListProps({ count: 0, isEditing: true })} />);
    expect(screen.getByText('Icon Text List: add Icon Text Item children to the datasource')).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('keeps empty items editable in Pages', () => {
    render(<Default {...makeListProps({ items: [makeListItem(1, { title: null, icon: null })], isEditing: true })} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('supports multiple instances on one page', () => {
    const { container } = render(
      <>
        <Default {...makeListProps({ count: 2 })} />
        <Feature {...makeListProps({ count: 3 })} />
      </>,
    );
    expect(container.querySelectorAll('.icon-text-list--default > li')).toHaveLength(2);
    expect(container.querySelectorAll('.icon-text-list--feature > li')).toHaveLength(3);
  });
});
