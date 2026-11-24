import { createHmac, timingSafeEqual } from 'node:crypto';
import { unstable_cache } from 'next/cache';
import client from 'lib/sitecore-client';
import { normalizeId } from 'lib/utils';
import { BlogIndex, BlogPostQueryItem, BlogPostTeaser, BlogPostsQueryResult, BlogRootQueryResult } from './blog-list.props';
import { sortByDateDesc, toBlogPostTeaser } from './blog-list.utils';

/** Seconds between background refreshes; publish webhooks (Part 1.4) refresh sooner via the tag */
export const BLOG_INDEX_REVALIDATE = 3600;

/**
 * Edge rejects queries whose estimated cost is too high, and `first` multiplies the cost of every
 * nested selection (categories → targetItems). This query was checked against Edge at 50.
 */
const PAGE_SIZE = 50;

/** Stops a broken cursor from looping forever: 20 × 50 = 1000 posts */
const MAX_PAGES = 20;

export const blogIndexTag = (site: string, language: string) => `blog-index:${site}:${language}`;

/**
 * The blog root's own URL, for "View all". A separate query because Edge allows at most 15 levels
 * of nesting, and any extra field next to `children` in BLOG_POSTS_QUERY goes over that limit.
 */
export const BLOG_ROOT_QUERY = /* GraphQL */ `
  query BlogRoot($root: String!, $language: String!) {
    item(path: $root, language: $language) {
      url {
        path
      }
    }
  }
`;

/**
 * Children of the blog root (the rendering's datasource page).
 * Fields come through the `_Article` and `_Teaser` interfaces, so any page type that inherits them
 * works; other children are dropped in `toBlogPostTeaser`.
 * At the nesting limit: don't add fields here without re-checking the query against Edge.
 */
export const BLOG_POSTS_QUERY = /* GraphQL */ `
  query BlogPosts($root: String!, $language: String!, $first: Int!, $after: String) {
    item(path: $root, language: $language) {
      children(first: $first, after: $after) {
        pageInfo {
          hasNext
          endCursor
        }
        results {
          id
          name
          displayName
          url {
            path
          }
          title: field(name: "Title") {
            value
          }
          ... on _Article {
            publishDate {
              dateValue
            }
            readingTime {
              intValue
            }
            heroImage {
              jsonValue
            }
            categories {
              targetItems {
                id
                name
                ... on _Category {
                  title {
                    value
                  }
                }
              }
            }
          }
          ... on _Teaser {
            summary {
              value
            }
            teaserImage {
              jsonValue
            }
            cTALink {
              jsonValue
            }
          }
        }
      }
    }
  }
`;

export interface BlogIndexOptions {
  site: string;
  language: string;
  /** Item ID of the blog root page, in any format (the rendering's datasource) */
  root: string;
}

/** Fetches every post under the root, page by page. Throws on errors so nothing empty gets cached. */
export const fetchBlogIndex = async ({ language, root }: Omit<BlogIndexOptions, 'site'>): Promise<BlogIndex> => {
  const rootData = await client.getData<BlogRootQueryResult>(BLOG_ROOT_QUERY, { root, language });
  // Unknown root or no version in this language
  if (!rootData.item) return { posts: [] };

  const rootUrl = rootData.item.url?.path || undefined;
  const items: BlogPostQueryItem[] = [];
  let after: string | null | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await client.getData<BlogPostsQueryResult>(BLOG_POSTS_QUERY, {
      root,
      language,
      first: PAGE_SIZE,
      after: after ?? null,
    });
    const children = data.item?.children;
    items.push(...(children?.results ?? []));

    if (!children?.pageInfo?.hasNext || !children.pageInfo.endCursor) break;
    after = children.pageInfo.endCursor;
  }

  return {
    rootUrl,
    posts: sortByDateDesc(items.map(toBlogPostTeaser).filter((post): post is BlogPostTeaser => post !== null)),
  };
};

/**
 * All posts of one blog root in one language, newest first, plus the root's URL.
 * Cached for BLOG_INDEX_REVALIDATE seconds and shared by every render that asks for the same
 * root and language, so Edge sees about one request per language per refresh.
 * Pass `cached: false` in Pages/preview, where editors expect their unpublished changes.
 * Never throws: on errors it logs and returns an empty index (errors are not cached).
 */
export const getBlogIndex = async (options: BlogIndexOptions & { cached?: boolean }): Promise<BlogIndex> => {
  const { cached = true, site, language } = options;
  // One cache entry per item, whatever ID format the caller passes
  const root = normalizeId(options.root);
  if (!root) return { posts: [] };

  try {
    if (!cached) return await fetchBlogIndex({ language, root });

    return await unstable_cache(() => fetchBlogIndex({ language, root }), ['blog-index', site, language, root], {
      revalidate: BLOG_INDEX_REVALIDATE,
      tags: [blogIndexTag(site, language)],
    })();
  } catch (error) {
    console.error('Blog: failed to load the blog index', error);
    return { posts: [], failed: true };
  }
};

/* ================= Index endpoint (/api/blog-index) ================= */

export const BLOG_INDEX_ENDPOINT = '/api/blog-index';

/**
 * The endpoint takes the blog root as a parameter. Any other root ID would cost an Edge request
 * (and a cache entry) per random value, so the server signs the exact site, language and root it
 * renders, and the endpoint answers only signed requests. No allow-list to maintain, and invalid
 * requests never reach Edge.
 *
 * Key: BLOG_INDEX_SECRET, falling back to SITECORE_EDITING_SECRET (always set, server-only).
 */
const signingKey = (): string => process.env.BLOG_INDEX_SECRET || process.env.SITECORE_EDITING_SECRET || '';

export interface BlogIndexRequest {
  site: string;
  locale: string;
  root: string;
}

const sign = (key: string, { site, locale, root }: BlogIndexRequest): string =>
  createHmac('sha256', key).update(`blog-index\n${site}\n${locale}\n${normalizeId(root)}`).digest('base64url').slice(0, 32);

/** Signed endpoint URL for the browser, or undefined when no key is configured (the caller then inlines the posts) */
export const getBlogIndexUrl = (request: BlogIndexRequest): string | undefined => {
  const key = signingKey();
  if (!key) return undefined;

  const params = new URLSearchParams({
    site: request.site,
    locale: request.locale,
    root: normalizeId(request.root),
    sig: sign(key, request),
  });
  return `${BLOG_INDEX_ENDPOINT}?${params}`;
};

/** Constant-time check of a request's signature */
export const isSignedBlogIndexRequest = (request: BlogIndexRequest, signature: string): boolean => {
  const key = signingKey();
  if (!key || !signature) return false;

  const expected = Buffer.from(sign(key, request));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};
