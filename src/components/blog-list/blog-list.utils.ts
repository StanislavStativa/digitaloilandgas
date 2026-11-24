/**
 * Pure helpers over the blog index. No I/O and no server-only imports,
 * so the listing's client component (Part 2) can use them too.
 */
import { normalizeId } from 'lib/utils';
import { BlogCategoryRef, BlogImage, BlogPostQueryItem, BlogPostTeaser } from './blog-list.props';

const stripHtml = (html: string): string =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const toImage = (value: unknown): BlogImage | undefined => {
  const image = value as Partial<BlogImage> | undefined;
  return image?.src ? { src: image.src, alt: image.alt, width: image.width, height: image.height } : undefined;
};

/**
 * Maps one GraphQL child item to card data.
 * Returns null for items that don't inherit `_Article` (GraphQL then returns none of its fields),
 * so the blog root can hold other children (folders, Data) without them becoming cards.
 */
export const toBlogPostTeaser = (item: BlogPostQueryItem): BlogPostTeaser | null => {
  if (!item || item.publishDate === undefined) return null;

  const link = item.cTALink?.jsonValue?.value;
  const ctaHref = typeof link?.href === 'string' && link.href ? `${link.href}${link.anchor ? `#${link.anchor}` : ''}` : '';
  const href = ctaHref || item.url?.path || '';
  if (!href) return null;

  const dateValue = item.publishDate?.dateValue;
  const minutes = item.readingTime?.intValue;

  return {
    id: normalizeId(item.id),
    href,
    target: ctaHref && typeof link?.target === 'string' && link.target ? link.target : undefined,
    slug: item.name,
    title: (item.title?.value || item.displayName || item.name).trim(),
    summary: stripHtml(item.summary?.value ?? ''),
    image: toImage(item.teaserImage?.jsonValue?.value) ?? toImage(item.heroImage?.jsonValue?.value),
    // Sitecore stores an empty date as 0001-01-01; treat anything before 1971 as "not set"
    date: typeof dateValue === 'number' && dateValue > 31536000000 ? new Date(dateValue).toISOString() : undefined,
    readingMinutes: typeof minutes === 'number' && minutes > 0 ? minutes : undefined,
    categories: (item.categories?.targetItems ?? []).map((category) => ({
      id: normalizeId(category.id),
      slug: category.name,
      title: category.title?.value || category.name,
    })),
  };
};

/** Newest first; posts without a date go last, ties keep their item order */
export const sortByDateDesc = (posts: BlogPostTeaser[]): BlogPostTeaser[] =>
  posts
    .map((post, index) => ({ post, index, time: post.date ? Date.parse(post.date) : -Infinity }))
    .sort((a, b) => b.time - a.time || a.index - b.index)
    .map(({ post }) => post);

/** First `count` posts; a missing, zero or negative count means all */
export const latest = (posts: BlogPostTeaser[], count?: number): BlogPostTeaser[] =>
  count && count > 0 ? posts.slice(0, count) : posts;

export interface BlogPostFilter {
  /** Category IDs in any format; a post matches if it has any of them */
  categoryIds?: string[];
  /** Case-insensitive text matched against title, summary and category titles */
  query?: string;
}

export const filterPosts = (posts: BlogPostTeaser[], { categoryIds, query }: BlogPostFilter = {}): BlogPostTeaser[] => {
  const ids = new Set((categoryIds ?? []).map(normalizeId).filter(Boolean));
  const needle = query?.trim().toLocaleLowerCase() ?? '';

  return posts.filter((post) => {
    if (ids.size && !post.categories.some((category) => ids.has(category.id))) return false;
    if (!needle) return true;
    return [post.title, post.summary, ...post.categories.map((category) => category.title)].some((text) =>
      text.toLocaleLowerCase().includes(needle),
    );
  });
};

export interface BlogPage {
  items: BlogPostTeaser[];
  /** 1-based, clamped to [1, pageCount] */
  page: number;
  pageCount: number;
  total: number;
}

export const paginate = (posts: BlogPostTeaser[], page: number, pageSize: number): BlogPage => {
  const size = Math.max(1, Math.floor(pageSize) || 1);
  const pageCount = Math.max(1, Math.ceil(posts.length / size));
  const current = Math.min(pageCount, Math.max(1, Math.floor(page) || 1));

  return {
    items: posts.slice((current - 1) * size, current * size),
    page: current,
    pageCount,
    total: posts.length,
  };
};

/** Date formatted in UTC, so the server and the browser render the same text */
export const formatPostDate = (iso: string | undefined, locale: string): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' }).format(date);
  }
};

/** "{minutes} min" → "8 min" */
export const formatReadingTime = (pattern: string, minutes: number | undefined): string =>
  minutes ? pattern.replace(/\{minutes\}/g, String(minutes)) : '';

/** "Page {page}" → "Page 2"; any `{name}` placeholder from `values` */
export const fillPattern = (pattern: string, values: Record<string, string | number>): string =>
  pattern.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));

/**
 * Category tabs of the listing.
 * With `orderIds` (the Categories rendering parameter): those categories, in that order.
 * Without: every category used by a post, A–Z. Either way only categories that have posts.
 */
export const getCategories = (posts: BlogPostTeaser[], orderIds: string[] = []): BlogCategoryRef[] => {
  const used = new Map<string, BlogCategoryRef>();
  posts.forEach((post) => post.categories.forEach((category) => used.has(category.id) || used.set(category.id, category)));

  if (orderIds.length) {
    return orderIds.map((id) => used.get(normalizeId(id))).filter((category): category is BlogCategoryRef => Boolean(category));
  }
  return [...used.values()].sort((a, b) => a.title.localeCompare(b.title));
};

/** What the listing shows, as kept in the URL (`?category=slug&page=n`; `q` only on arrival) */
export interface ListingState {
  /** Category slug; '' = All */
  category: string;
  page: number;
  query: string;
}

export const DEFAULT_LISTING_STATE: ListingState = { category: '', page: 1, query: '' };

/** Reads the listing state from a query string. Unknown categories fall back to All; the page is clamped later */
export const parseListingState = (search: string, categories: BlogCategoryRef[]): ListingState => {
  const params = new URLSearchParams(search);
  const slug = (params.get('category') ?? '').trim().toLowerCase();
  const category = categories.find((c) => c.slug.toLowerCase() === slug)?.slug ?? '';
  const page = Number.parseInt(params.get('page') ?? '', 10);

  return {
    category,
    page: Number.isFinite(page) && page > 1 ? page : 1,
    query: (params.get('q') ?? '').trim().slice(0, 100),
  };
};

/** Query string for a category and page ('' for All, page 1). The search text is never written to the URL */
export const toListingSearch = ({ category, page }: Pick<ListingState, 'category' | 'page'>): string => {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (page > 1) params.set('page', String(page));
  const search = params.toString();
  return search ? `?${search}` : '';
};

/**
 * Page numbers for the pagination, with `null` for a gap ("…"). At most 7 entries, so it fits on a phone:
 * the first and last page, and the current page with its neighbours.
 * 1 2 3 4 5 … 12  ·  1 … 5 6 7 … 12  ·  1 … 8 9 10 11 12
 */
export const pageNumbers = (current: number, pageCount: number): Array<number | null> => {
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
  if (pageCount <= 7) return range(1, pageCount);
  if (current <= 4) return [...range(1, 5), null, pageCount];
  if (current >= pageCount - 3) return [1, null, ...range(pageCount - 4, pageCount)];
  return [1, null, current - 1, current, current + 1, null, pageCount];
};
