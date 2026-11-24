import {
  fillPattern,
  filterPosts,
  formatPostDate,
  formatReadingTime,
  getCategories,
  latest,
  pageNumbers,
  paginate,
  parseListingState,
  sortByDateDesc,
  toBlogPostTeaser,
  toListingSearch,
} from 'components/blog-list/blog-list.utils';
import { BlogPostQueryItem } from 'components/blog-list/blog-list.props';
import { makePost, makeQueryItem } from './blog-list.mockData';

describe('toBlogPostTeaser', () => {
  it('maps a blog page to plain card data', () => {
    expect(toBlogPostTeaser(makeQueryItem(1))).toEqual({
      id: 'post1',
      href: '/blog/post-1',
      target: undefined,
      slug: 'post-1',
      title: 'Post 1',
      summary: 'Summary 1 & more',
      image: { src: '/teaser-1.webp', alt: 'teaser', width: 350, height: 170 },
      date: '2026-01-10T00:00:00.000Z',
      readingMinutes: 5,
      categories: [{ id: 'aaaa0001', slug: 'technology', title: 'Technology' }],
    });
  });

  it('drops children that do not inherit _Article (no _Article fields in the result)', () => {
    const folder = { id: 'X', name: 'Data', displayName: 'Data', url: { path: '/blog/data' } } as BlogPostQueryItem;
    expect(toBlogPostTeaser(folder)).toBeNull();
  });

  it('falls back to Hero Image when Teaser Image is empty', () => {
    expect(toBlogPostTeaser(makeQueryItem(1, { teaserImage: null }))?.image?.src).toBe('/hero-1.webp');
    expect(toBlogPostTeaser(makeQueryItem(1, { teaserImage: null, heroImage: null }))?.image).toBeUndefined();
  });

  it('links to the CTA Link when set, keeping its target and anchor', () => {
    const post = toBlogPostTeaser(makeQueryItem(1, { cta: { href: 'https://example.com/a', target: '_blank', anchor: 'x' } }));
    expect(post?.href).toBe('https://example.com/a#x');
    expect(post?.target).toBe('_blank');
  });

  it('treats the empty Sitecore date and a zero reading time as not set', () => {
    const post = toBlogPostTeaser(makeQueryItem(1, { date: null, minutes: 0 }));
    expect(post?.date).toBeUndefined();
    expect(post?.readingMinutes).toBeUndefined();
  });

  it('uses the item name when a category has no Title, and the display name when the page has no Title', () => {
    const post = toBlogPostTeaser(makeQueryItem(1, { title: '', categories: [{ id: '{B-1}', name: 'business' }] }));
    expect(post?.categories[0].title).toBe('business');
    expect(post?.title).toBe('post 1');
  });
});

describe('sortByDateDesc / latest', () => {
  it('sorts newest first, undated last, keeping item order for ties', () => {
    const posts = [makePost(1), makePost(3), makePost(2, { date: undefined }), makePost(4, { date: makePost(3).date })];
    expect(sortByDateDesc(posts).map((p) => p.id)).toEqual(['post3', 'post4', 'post1', 'post2']);
  });

  it('takes the first n, or all when n is missing or not positive', () => {
    const posts = [makePost(1), makePost(2), makePost(3)];
    expect(latest(posts, 2)).toHaveLength(2);
    expect(latest(posts)).toHaveLength(3);
    expect(latest(posts, 0)).toHaveLength(3);
  });
});

describe('filterPosts', () => {
  const posts = [
    makePost(1, { title: 'Pump control' }),
    makePost(2, { categories: [{ id: 'bbbb0002', slug: 'business', title: 'Business' }] }),
    makePost(3, { summary: 'Tank level monitoring' }),
  ];

  it('matches any of the given categories, in any ID format', () => {
    expect(filterPosts(posts, { categoryIds: ['{BBBB-0002}'] }).map((p) => p.id)).toEqual(['post2']);
  });

  it('searches title, summary and category titles case-insensitively', () => {
    expect(filterPosts(posts, { query: 'PUMP' }).map((p) => p.id)).toEqual(['post1']);
    expect(filterPosts(posts, { query: 'tank' }).map((p) => p.id)).toEqual(['post3']);
    expect(filterPosts(posts, { query: 'business' }).map((p) => p.id)).toEqual(['post2']);
  });

  it('returns everything without filters', () => {
    expect(filterPosts(posts)).toHaveLength(3);
  });
});

describe('paginate', () => {
  const posts = Array.from({ length: 20 }, (_, i) => makePost(i + 1));

  it('slices one page and reports the page count', () => {
    const page = paginate(posts, 2, 9);
    expect(page.items.map((p) => p.id)).toEqual(posts.slice(9, 18).map((p) => p.id));
    expect(page).toMatchObject({ page: 2, pageCount: 3, total: 20 });
  });

  it('clamps out-of-range and invalid pages', () => {
    expect(paginate(posts, 99, 9).page).toBe(3);
    expect(paginate(posts, -1, 9).page).toBe(1);
    expect(paginate(posts, Number.NaN, 9).page).toBe(1);
    expect(paginate([], 1, 9)).toMatchObject({ page: 1, pageCount: 1, total: 0 });
  });
});

describe('formatting', () => {
  it('formats the date in UTC for the locale', () => {
    expect(formatPostDate('2026-11-10T00:00:00.000Z', 'en')).toBe('November 10, 2026');
    expect(formatPostDate(undefined, 'en')).toBe('');
    expect(formatPostDate('not a date', 'en')).toBe('');
  });

  it('fills the reading time pattern', () => {
    expect(formatReadingTime('{minutes} min', 8)).toBe('8 min');
    expect(formatReadingTime('{minutes} min', undefined)).toBe('');
  });
});

describe('fillPattern', () => {
  it('fills known placeholders and leaves unknown ones', () => {
    expect(fillPattern('Page {page} of {count}', { page: 2 })).toBe('Page 2 of {count}');
  });
});

describe('getCategories', () => {
  const business = { id: 'bbbb0002', slug: 'business', title: 'Business' };
  const technology = { id: 'aaaa0001', slug: 'technology', title: 'Technology' };
  const human = { id: 'cccc0003', slug: 'human-capital', title: 'Human Capital' };
  const posts = [makePost(1, { categories: [technology] }), makePost(2, { categories: [human, business] }), makePost(3)];

  it('lists each used category once, A–Z', () => {
    expect(getCategories(posts).map((c) => c.slug)).toEqual(['business', 'human-capital', 'technology']);
  });

  it('follows the given order (any ID format) and skips categories without posts', () => {
    expect(getCategories(posts, ['{AAAA-0001}', '{DDDD-0004}', '{BBBB-0002}']).map((c) => c.slug)).toEqual([
      'technology',
      'business',
    ]);
  });
});

describe('listing URL state', () => {
  const categories = [{ id: 'bbbb0002', slug: 'business', title: 'Business' }];

  it('reads category, page and the arrival search text', () => {
    expect(parseListingState('?category=Business&page=3&q=%20pump%20', categories)).toEqual({
      category: 'business',
      page: 3,
      query: 'pump',
    });
  });

  it('falls back to All, page 1 for unknown or invalid values', () => {
    expect(parseListingState('?category=nope&page=-2', categories)).toEqual({ category: '', page: 1, query: '' });
    expect(parseListingState('?page=abc', categories).page).toBe(1);
    expect(parseListingState(`?q=${'x'.repeat(300)}`, categories).query).toHaveLength(100);
  });

  it('writes only non-default values, never the search text', () => {
    expect(toListingSearch({ category: '', page: 1 })).toBe('');
    expect(toListingSearch({ category: 'business', page: 1 })).toBe('?category=business');
    expect(toListingSearch({ category: 'business', page: 2 })).toBe('?category=business&page=2');
  });
});

describe('pageNumbers', () => {
  it('lists every page up to 7', () => {
    expect(pageNumbers(1, 1)).toEqual([1]);
    expect(pageNumbers(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('keeps 7 entries with gaps for longer lists', () => {
    expect(pageNumbers(1, 12)).toEqual([1, 2, 3, 4, 5, null, 12]);
    expect(pageNumbers(4, 12)).toEqual([1, 2, 3, 4, 5, null, 12]);
    expect(pageNumbers(5, 12)).toEqual([1, null, 4, 5, 6, null, 12]);
    expect(pageNumbers(9, 12)).toEqual([1, null, 8, 9, 10, 11, 12]);
    expect(pageNumbers(12, 12)).toEqual([1, null, 8, 9, 10, 11, 12]);
  });
});
