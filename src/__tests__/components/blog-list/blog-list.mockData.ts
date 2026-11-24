import { BlogPostQueryItem, BlogPostTeaser } from 'components/blog-list/blog-list.props';

/** A child item of the blog root as BLOG_POSTS_QUERY returns it; pass `null` for an empty field */
export const makeQueryItem = (
  n: number,
  options: {
    date?: string | null;
    minutes?: number | null;
    summary?: string;
    teaserImage?: string | null;
    heroImage?: string | null;
    cta?: { href: string; target?: string; anchor?: string } | null;
    categories?: Array<{ id: string; name: string; title?: string }>;
    title?: string;
  } = {},
): BlogPostQueryItem => {
  const {
    date = `2026-0${n}-10T00:00:00Z`,
    minutes = n + 4,
    summary = `<p>Summary ${n} &amp; more</p>`,
    teaserImage = `/teaser-${n}.webp`,
    heroImage = `/hero-${n}.webp`,
    cta = null,
    categories = [{ id: '{AAAA-0001}', name: 'technology', title: 'Technology' }],
    title = `Post ${n}`,
  } = options;

  return {
    id: `POST-${n}`,
    name: `post-${n}`,
    displayName: `post ${n}`,
    url: { path: `/blog/post-${n}` },
    title: { value: title },
    publishDate: { dateValue: date ? Date.parse(date) : -62135596800000 },
    readingTime: { intValue: minutes },
    heroImage: { jsonValue: { value: heroImage ? { src: heroImage, alt: 'hero', width: 1920, height: 320 } : {} } },
    categories: { targetItems: categories.map((c) => ({ id: c.id, name: c.name, title: c.title ? { value: c.title } : null })) },
    summary: { value: summary },
    teaserImage: { jsonValue: { value: teaserImage ? { src: teaserImage, alt: 'teaser', width: 350, height: 170 } : {} } },
    cTALink: { jsonValue: { value: cta ?? { href: '' } } },
  };
};

export const makePost = (n: number, overrides: Partial<BlogPostTeaser> = {}): BlogPostTeaser => ({
  id: `post${n}`,
  href: `/blog/post-${n}`,
  slug: `post-${n}`,
  title: `Post ${n}`,
  summary: `Summary ${n}`,
  image: { src: `/teaser-${n}.webp`, alt: 'teaser', width: 350, height: 170 },
  date: `2026-0${n}-10T00:00:00.000Z`,
  readingMinutes: n + 4,
  categories: [{ id: 'aaaa0001', slug: 'technology', title: 'Technology' }],
  ...overrides,
});
