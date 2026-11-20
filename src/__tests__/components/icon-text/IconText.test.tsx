import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Default, Feature } from '../../../components/icon-text/IconText';
import { makeIconTextProps } from './IconText.mockProps';

jest.mock('@sitecore-content-sdk/nextjs', () => jest.requireActual('./IconText.mockProps').contentSdkMock());

const childClasses = (el: Element | null) => Array.from(el?.children ?? []).map((child) => child.className);

describe('IconText (Default variant)', () => {
  it('renders an [icon + h2 title] row with the description below the whole row', () => {
    const { container } = render(<Default {...makeIconTextProps()} />);

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass('component', 'icon-text-component', 'icon-text-component--default', 'custom-style');
    expect(wrapper).toHaveAttribute('id', 'it-1');

    const item = container.querySelector('.icon-text');
    expect(item).toHaveClass('icon-text--default');
    // description is a sibling of the heading row, not inside it
    expect(childClasses(item)).toEqual(['icon-text__heading', 'icon-text__description']);
    expect(childClasses(item?.querySelector('.icon-text__heading') ?? null)).toEqual(['icon-text__icon', 'icon-text__title']);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Title 1');
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Icon alt 1');
    expect(container.querySelector('.icon-text__description p')).toHaveTextContent('Description 1');
  });

  it('renders only the heading row when the description is empty', () => {
    const { container } = render(<Default {...makeIconTextProps({ description: null })} />);
    expect(childClasses(container.querySelector('.icon-text'))).toEqual(['icon-text__heading']);
  });

  it('renders the title without an empty icon wrapper when the icon is missing', () => {
    const { container } = render(<Default {...makeIconTextProps({ icon: null })} />);
    expect(container.querySelector('.icon-text__icon')).toBeNull();
    expect(screen.getByRole('heading')).toHaveTextContent('Title 1');
  });

  it('renders nothing on the live site without a datasource or without title and icon', () => {
    expect(render(<Default {...makeIconTextProps({ noDatasource: true })} />).container).toBeEmptyDOMElement();
    expect(render(<Default {...makeIconTextProps({ title: null, icon: null })} />).container).toBeEmptyDOMElement();
  });

  it('shows a datasource hint in Pages editing mode and keeps empty fields editable', () => {
    render(<Default {...makeIconTextProps({ noDatasource: true, isEditing: true })} />);
    expect(screen.getByText('Icon Text: select or create a datasource')).toBeInTheDocument();

    const { container } = render(<Default {...makeIconTextProps({ icon: null, description: null, isEditing: true })} />);
    expect(container.querySelector('.icon-text__icon')).toBeInTheDocument();
  });
});

describe('IconText (Feature variant)', () => {
  it('renders the icon on the left and the h3 title + description stacked on the right', () => {
    const { container } = render(<Feature {...makeIconTextProps()} />);

    expect(container.firstElementChild).toHaveClass('icon-text-component--feature');
    const item = container.querySelector('.icon-text');
    expect(item).toHaveClass('icon-text--feature');
    expect(childClasses(item)).toEqual(['icon-text__icon', 'icon-text__content']);
    expect(childClasses(item?.querySelector('.icon-text__content') ?? null)).toEqual(['icon-text__title', 'icon-text__description']);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Title 1');
  });

  it('renders only the title in the content block when the description is empty', () => {
    const { container } = render(<Feature {...makeIconTextProps({ description: null })} />);
    expect(childClasses(container.querySelector('.icon-text__content'))).toEqual(['icon-text__title']);
  });

  it('uses the same datasource for both variants (switching only changes the layout)', () => {
    const props = makeIconTextProps();
    const { container, rerender } = render(<Default {...props} />);
    const defaultText = container.textContent;

    rerender(<Feature {...props} />);
    expect(container.querySelector('.icon-text')).toHaveClass('icon-text--feature');
    expect(container.textContent).toBe(defaultText);
  });
});
