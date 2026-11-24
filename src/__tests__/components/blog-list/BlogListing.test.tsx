import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BlogListing } from 'components/blog-list/BlogListing';
import { BlogListingLabels, BlogListingProps, BlogPostTeaser } from 'components/blog-list/blog-list.props';
import { makePost } from './blog-list.mockData';

jest.mock('@sitecore-content-sdk/nextjs', () => ({
  Image: () => null,
}));

const LABELS: BlogListingLabels = {
  readingTime: '{minutes} min',
  search: 'Search',
  all: 'All',
  noResults: 'No posts found',
  categories: 'Categories',
  pagination: 'Pagination',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  pageN: 'Page {page}',
  resultCount: '{count} posts',
};

const business = { id: 'bbbb0002', slug: 'business', title: 'Business' };
const human = { id: 'cccc0003', slug: 'human-capital', title: 'Human Capital' };
/** 20 posts: even numbers are Business, odd are Human Capital; post 7 mentions pumps */
const POSTS: BlogPostTeaser[] = Array.from({ length: 20 }, (_, i) =>
  makePost(i + 1, {
    title: i + 1 === 7 ? 'Pump control' : `Post ${i + 1}`,
    categories: [(i + 1) % 2 ? human : business],
  }),
);

const makeProps = (overrides: Partial<BlogListingProps> = {}): BlogListingProps => ({
  locale: 'en',
  labels: LABELS,
  categories: [business, human],
  pageSize: 9,
  firstPage: POSTS.slice(0, 9),
  total: POSTS.length,
  indexUrl: '/api/blog-index?sig=test',
  ...overrides,
});

const fetchMock = jest.fn();
const cardTitles = () => screen.queryAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
const pagination = () => screen.getByRole('navigation', { name: 'Pagination' });
const tab = (name: string) => within(screen.getByRole('navigation', { name: 'Categories' })).getByRole('link', { name });

beforeEach(() => {
  jest.useFakeTimers();
  window.history.replaceState(null, '', '/blog');
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ posts: POSTS }) });
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  jest.useRealTimers();
});

/** Lets the index request resolve and React re-render */
const flush = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('BlogListing', () => {
  it('shows the server page first and loads the index once, in idle time', async () => {
    render(<BlogListing {...makeProps()} />);

    expect(cardTitles()).toHaveLength(9);
    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/blog-index?sig=test', { credentials: 'omit' });
  });

  it('opens a shared URL (category and page) and loads the index right away', async () => {
    window.history.replaceState(null, '', '/blog?category=business&page=2');
    render(<BlogListing {...makeProps()} />);
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    // Business = posts 2, 4, … 20 (10 posts): page 2 holds the 10th one
    await waitFor(() => expect(cardTitles()).toEqual(['Post 20']));
    expect(tab('Business')).toHaveAttribute('aria-current', 'true');
    expect(within(pagination()).getByRole('link', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('10 posts')).toBeInTheDocument();
  });

  it('switches category with a plain click: URL pushed, page 1, focus on the results', async () => {
    render(<BlogListing {...makeProps()} />);
    const push = jest.spyOn(window.history, 'pushState');

    fireEvent.click(tab('Human Capital'));
    await flush();

    expect(push).toHaveBeenCalledWith(null, '', '/blog?category=human-capital');
    expect(window.location.search).toBe('?category=human-capital');
    await waitFor(() => expect(cardTitles()).toHaveLength(9));
    expect(cardTitles()[0]).toBe('Post 1');
    expect(tab('Human Capital')).toHaveAttribute('aria-current', 'true');
    expect(document.activeElement).toHaveClass('blog-listing__results');
    push.mockRestore();
  });

  it('leaves modified clicks (new tab) to the browser', () => {
    render(<BlogListing {...makeProps()} />);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });

    tab('Business').dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(window.location.search).toBe('');
  });

  it('pages with numbers and the next / previous links', async () => {
    render(<BlogListing {...makeProps({ posts: POSTS, indexUrl: undefined })} />);

    expect(within(pagination()).getAllByRole('link').map((link) => link.getAttribute('aria-label'))).toEqual([
      'Page 1',
      'Page 2',
      'Page 3',
      'Next page',
    ]);

    fireEvent.click(within(pagination()).getByRole('link', { name: 'Next page' }));
    expect(window.location.search).toBe('?page=2');
    expect(cardTitles()[0]).toBe('Post 10');

    fireEvent.click(within(pagination()).getByRole('link', { name: 'Page 3' }));
    expect(cardTitles()).toEqual(['Post 19', 'Post 20']);
    expect(within(pagination()).queryByRole('link', { name: 'Next page' })).not.toBeInTheDocument();

    fireEvent.click(within(pagination()).getByRole('link', { name: 'Previous page' }));
    expect(window.location.search).toBe('?page=2');
  });

  it('searches locally after a short debounce, from page 1, without more requests', async () => {
    window.history.replaceState(null, '', '/blog?page=2');
    render(<BlogListing {...makeProps()} />);
    await flush();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), { target: { value: 'pump' } });
    expect(window.location.search).toBe('');

    await act(async () => {
      jest.advanceTimersByTime(150);
    });
    expect(cardTitles()).toEqual(['Pump control']);
    expect(screen.getByText('1 posts')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), { target: { value: 'nothing like this' } });
    await act(async () => {
      jest.advanceTimersByTime(150);
    });
    expect(screen.getByText('No posts found')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('pre-fills the search from ?q= on arrival and drops it from the URL once the visitor types', async () => {
    window.history.replaceState(null, '', '/blog?q=pump');
    render(<BlogListing {...makeProps()} />);
    await flush();

    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('pump');
    await waitFor(() => expect(cardTitles()).toEqual(['Pump control']));

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), { target: { value: 'pum' } });
    expect(window.location.search).toBe('');
  });

  it('follows back / forward', async () => {
    render(<BlogListing {...makeProps({ posts: POSTS, indexUrl: undefined })} />);
    fireEvent.click(tab('Business'));
    expect(cardTitles()[0]).toBe('Post 2');

    await act(async () => {
      window.history.replaceState(null, '', '/blog');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(cardTitles()[0]).toBe('Post 1');
    expect(tab('All')).toHaveAttribute('aria-current', 'true');
  });

  it('clamps a page past the end and fixes the URL', async () => {
    window.history.replaceState(null, '', '/blog?page=99');
    render(<BlogListing {...makeProps({ posts: POSTS, indexUrl: undefined })} />);

    expect(cardTitles()).toEqual(['Post 19', 'Post 20']);
    await waitFor(() => expect(window.location.search).toBe('?page=3'));
  });

  it('keeps the server page when the index fails to load, and retries on the next interaction', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });
    window.history.replaceState(null, '', '/blog?category=business');
    render(<BlogListing {...makeProps()} />);
    await flush();
    await flush();

    expect(error).toHaveBeenCalled();
    expect(cardTitles()).toHaveLength(9);
    expect(tab('All')).toHaveAttribute('aria-current', 'true');
    expect(document.querySelector('.blog-listing__results')).not.toHaveAttribute('aria-busy');

    fireEvent.focus(screen.getByRole('searchbox', { name: 'Search' }));
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(tab('Business')).toHaveAttribute('aria-current', 'true'));
    error.mockRestore();
  });

  it('does not fetch when the posts are passed inline (Pages, preview)', async () => {
    render(<BlogListing {...makeProps({ posts: POSTS, indexUrl: undefined })} />);
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
