import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import { Default as BlogList, Listing } from 'components/blog-list/BlogList';
import { BlogListParams, BlogListProps } from 'components/blog-list/blog-list.props';
import { getBlogIndex, getBlogIndexUrl } from 'components/blog-list/blog-list.queries';
import { getDictionaryLabels } from 'lib/dictionary';
import { makePost } from './blog-list.mockData';

jest.mock('components/blog-list/blog-list.queries', () => ({
  getBlogIndex: jest.fn(),
  getBlogIndexUrl: jest.fn(() => '/api/blog-index?sig=test'),
}));
// The real map imports every component; the source resolves '.sitecore/…' through tsconfig paths
jest.mock('../../../../.sitecore/component-map', () => ({ __esModule: true, default: {} }));
jest.mock('lib/dictionary', () => ({
  getDictionaryLabels: jest.fn(async (_site: string, defaults: Record<string, string>) => defaults),
}));
jest.mock('@sitecore-content-sdk/nextjs', () => ({
  AppPlaceholder: ({ name }: { name: string }) => <div data-testid="placeholder" data-name={name} />,
  Image: ({ field, ...props }: { field?: { value?: { src?: string; alt?: string } } }) =>
    field?.value?.src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={field.value.src} alt={field.value.alt ?? ''} {...props} />
    ) : null,
}));

const index = getBlogIndex as jest.Mock;
const ROOT = '{B9575255-3FCB-48BA-8743-8CB54187ADAE}';

const makeProps = (options: { isEditing?: boolean; dataSource?: string; params?: BlogListParams } = {}): BlogListProps =>
  ({
    rendering: { componentName: 'BlogList', dataSource: options.dataSource ?? ROOT },
    params: { RenderingIdentifier: 'insights', styles: 'text-text-white', Count: '3', ...options.params },
    page: { mode: { isEditing: Boolean(options.isEditing), isPreview: false }, siteName: 'site', locale: 'en' },
    fields: { Title: { value: 'Blog' } },
  }) as unknown as BlogListProps;

const renderList = async (props: BlogListProps) => render((await BlogList(props)) ?? <></>);

describe('BlogList (Default variant)', () => {
  beforeEach(() => index.mockResolvedValue({ rootUrl: '/blog', posts: [1, 2, 3, 4].map((n) => makePost(n)) }));

  it('loads the posts of the datasource page, cached on the live site', async () => {
    await renderList(makeProps());
    expect(index).toHaveBeenCalledWith({ site: 'site', language: 'en', root: ROOT, cached: true });
  });

  it('renders the latest Count cards in a list, with wrapper id and styles', async () => {
    const { container } = await renderList(makeProps());

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(container.firstChild).toHaveClass('component', 'blog-list-component', 'text-text-white');
    expect(container.firstChild).toHaveAttribute('id', 'insights');
    // Section heading and intro are separate components; the datasource page's own fields are not rendered
    expect(screen.queryByText('Blog')).not.toBeInTheDocument();
  });

  it('renders each card as one link with title, summary, date and reading time', async () => {
    await renderList(makeProps());

    const link = within(screen.getAllByRole('listitem')[0]).getByRole('link');
    expect(link).toHaveAttribute('href', '/blog/post-1');
    expect(within(link).getByRole('heading', { level: 3, name: 'Post 1' })).toBeInTheDocument();
    expect(within(link).getByText('Summary 1')).toBeInTheDocument();
    expect(within(link).getByText('January 10, 2026')).toHaveAttribute('dateTime', '2026-01-10T00:00:00.000Z');
    expect(within(link).getByText('5 min')).toBeInTheDocument();
    expect(link.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('opens external CTA links in their own target', async () => {
    index.mockResolvedValue({ posts: [makePost(1, { href: 'https://example.com', target: '_blank' })] });
    await renderList(makeProps());

    const link = within(screen.getByRole('listitem')).getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('filters by the Categories parameter and shows all posts without a Count', async () => {
    const business = [{ id: 'bbbb0002', slug: 'business', title: 'Business' }];
    index.mockResolvedValue({ posts: [makePost(1), makePost(2, { categories: business }), makePost(3, { categories: business })] });

    await renderList(makeProps({ params: { Count: '', Categories: '{BBBB-0002}|{CCCC-0003}' } }));

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('links "View all" to the datasource page only when ShowViewAll is checked', async () => {
    const { unmount } = await renderList(makeProps());
    expect(screen.queryByRole('link', { name: 'View all' })).not.toBeInTheDocument();
    unmount();

    await renderList(makeProps({ params: { ShowViewAll: '1' } }));
    expect(screen.getByRole('link', { name: 'View all' })).toHaveAttribute('href', '/blog');
  });

  it('uses dictionary labels', async () => {
    (getDictionaryLabels as jest.Mock).mockResolvedValueOnce({ BlogReadingTime: '{minutes} Min.', BlogViewAll: 'Alle anzeigen' });
    await renderList(makeProps({ params: { ShowViewAll: '1' } }));
    expect(screen.getByText('5 Min.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Alle anzeigen' })).toBeInTheDocument();
  });

  it('renders nothing on the live site without posts or without a datasource', async () => {
    index.mockResolvedValue({ posts: [] });
    const { container, unmount } = await renderList(makeProps());
    expect(container).toBeEmptyDOMElement();
    unmount();

    const noDatasource = await renderList(makeProps({ dataSource: '' }));
    expect(noDatasource.container).toBeEmptyDOMElement();
    expect(index).toHaveBeenCalledTimes(1);
  });

  it('in Pages: skips the cache and shows a hint for each state', async () => {
    const first = await renderList(makeProps({ isEditing: true }));
    expect(index).toHaveBeenLastCalledWith(expect.objectContaining({ cached: false }));
    expect(screen.getByText(/edit them on each post/)).toBeInTheDocument();
    first.unmount();

    index.mockResolvedValue({ posts: [] });
    const second = await renderList(makeProps({ isEditing: true }));
    expect(screen.getByText(/no blog posts found/)).toBeInTheDocument();
    second.unmount();

    await renderList(makeProps({ isEditing: true, dataSource: '' }));
    expect(screen.getByText(/select the blog page as the datasource/)).toBeInTheDocument();
  });
});

describe('BlogList (Listing variant)', () => {
  const business = [{ id: 'bbbb0002', slug: 'business', title: 'Business' }];
  const human = [{ id: 'cccc0003', slug: 'human-capital', title: 'Human Capital' }];
  const posts = Array.from({ length: 12 }, (_, i) => makePost(i + 1, { categories: i % 2 ? business : human }));

  beforeEach(() => index.mockResolvedValue({ rootUrl: '/blog', posts }));

  const listingProps = (options: Parameters<typeof makeProps>[0] = {}) =>
    makeProps({ ...options, params: { Count: '', ...options.params } });
  const renderListing = async (props: BlogListProps) => render((await Listing(props)) ?? <></>);

  it('renders page 1 of All (9 cards), the category tabs A–Z and the pagination on the server', async () => {
    const { container } = await renderListing(listingProps());

    expect(container.firstChild).toHaveClass('blog-list-component--listing');
    expect(screen.getAllByRole('listitem').filter((li) => li.classList.contains('blog-list__item'))).toHaveLength(9);
    const tabs = within(screen.getByRole('navigation', { name: 'Categories' })).getAllByRole('link');
    expect(tabs.map((tab) => tab.textContent)).toEqual(['All', 'Business', 'Human Capital']);
    expect(tabs[0]).toHaveAttribute('aria-current', 'true');
    expect(within(screen.getByRole('navigation', { name: 'Pagination' })).getByRole('link', { name: 'Page 2' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument();
  });

  it('passes the signed endpoint on the live site instead of the posts', async () => {
    await renderListing(listingProps());
    expect(getBlogIndexUrl).toHaveBeenCalledWith({ site: 'site', locale: 'en', root: ROOT });
    expect(index).toHaveBeenCalledWith(expect.objectContaining({ cached: true }));
  });

  it('uses Count as the page size and Categories as the tab order', async () => {
    await renderListing(listingProps({ params: { Count: '4', Categories: '{CCCC-0003}|{BBBB-0002}' } }));

    expect(screen.getAllByRole('listitem').filter((li) => li.classList.contains('blog-list__item'))).toHaveLength(4);
    const tabs = within(screen.getByRole('navigation', { name: 'Categories' })).getAllByRole('link');
    expect(tabs.map((tab) => tab.textContent)).toEqual(['All', 'Human Capital', 'Business']);
    expect(screen.getByRole('link', { name: 'Page 3' })).toBeInTheDocument();
  });

  it('renders the sidebar placeholder below the tabs', async () => {
    await renderListing(listingProps({ params: { DynamicPlaceholderId: '7' } }));
    expect(screen.getByTestId('placeholder')).toHaveAttribute('data-name', 'blog-list-sidebar-7');
  });

  it('in Pages: uncached posts inline (no endpoint) and an editing hint', async () => {
    await renderListing(listingProps({ isEditing: true }));

    expect(getBlogIndexUrl).not.toHaveBeenCalled();
    expect(index).toHaveBeenCalledWith(expect.objectContaining({ cached: false }));
    expect(screen.getByText(/Cards per page \(Count\)/)).toBeInTheDocument();
  });

  it('renders nothing on the live site without a datasource, and the empty state without posts', async () => {
    const { container, unmount } = await renderListing(listingProps({ dataSource: '' }));
    expect(container).toBeEmptyDOMElement();
    unmount();

    index.mockResolvedValue({ posts: [] });
    await renderListing(listingProps());
    expect(screen.getByText('No posts match your search.')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });
});
