import NextLink from 'next/link';
import { AppPlaceholder } from '@sitecore-content-sdk/nextjs';
import componentMap from '.sitecore/component-map';
import { getDictionaryLabels } from 'lib/dictionary';
import { cn, readCheckbox } from 'lib/utils';
import { BlogCard } from './BlogCard';
import { BlogListing } from './BlogListing';
import { BlogCardLabels, BlogIndex, BlogListProps, BlogListingLabels } from './blog-list.props';
import { getBlogIndex, getBlogIndexUrl } from './blog-list.queries';
import { filterPosts, getCategories, latest, paginate } from './blog-list.utils';

/** Dictionary keys (no dots, see lib/dictionary) and their defaults */
const LABEL_DEFAULTS = {
  BlogReadingTime: '{minutes} min',
  BlogViewAll: 'View all',
};

const LISTING_LABEL_DEFAULTS = {
  BlogReadingTime: LABEL_DEFAULTS.BlogReadingTime,
  BlogSearch: 'Search',
  BlogAll: 'All',
  BlogNoResults: 'No posts match your search.',
  BlogCategories: 'Categories',
  BlogPagination: 'Pagination',
  BlogPreviousPage: 'Previous page',
  BlogNextPage: 'Next page',
  BlogPageN: 'Page {page}',
  BlogResultCount: '{count} posts',
};

/** Cards per listing page when the Count parameter is empty */
const LISTING_PAGE_SIZE = 9;

const toCount = (value: string | undefined): number | undefined => {
  const count = Number.parseInt(value ?? '', 10);
  return Number.isFinite(count) && count > 0 ? count : undefined;
};

/** Multilist rendering parameter: "{ID-1}|{ID-2}" */
const toIds = (value: string | undefined): string[] =>
  (value ?? '')
    .split('|')
    .map((id) => id.trim())
    .filter(Boolean);

/** What both variants need: datasource root, mode, and the (cached on the live site) index */
const loadIndex = async ({ rendering, page }: BlogListProps) => {
  const isEditing = Boolean(page?.mode?.isEditing);
  // Pages and preview show unpublished changes, so they skip the cache
  const isLive = !isEditing && !page?.mode?.isPreview;
  const root = rendering?.dataSource ?? '';
  const site = page?.siteName;
  const locale = page?.locale ?? 'en';

  const index: BlogIndex =
    root && site ? await getBlogIndex({ site, language: locale, root, cached: isLive }) : { posts: [] };

  return { isEditing, isLive, root, site, locale, index };
};

/**
 * Default variant: the latest posts of the datasource page as a card grid, optionally followed by
 * a "View all" link to that page (e.g. "Latest Industry Insights" on the home page, Count = 3).
 *
 * The datasource is the blog root page; its children are the posts. Section heading and intro are
 * separate Title / Rich Text components, so they stay inline-editable and translatable.
 * Cards come from the cached blog index, so they are edited on each post, not here.
 */
export const Default = async ({ params, rendering, page }: BlogListProps) => {
  const { styles, RenderingIdentifier: id } = params;
  const [{ isEditing, root, locale, index }, labels] = await Promise.all([
    loadIndex({ params, rendering, page }),
    getDictionaryLabels(page?.siteName, LABEL_DEFAULTS),
  ]);

  const posts = latest(filterPosts(index.posts, { categoryIds: toIds(params.Categories) }), toCount(params.Count));
  const viewAllHref = readCheckbox(params.ShowViewAll) ? index.rootUrl : undefined;

  // Live site: no posts means no section
  if (!posts.length && !isEditing) return null;

  const cardLabels: BlogCardLabels = { readingTime: labels.BlogReadingTime };

  return (
    <div
      id={typeof id === 'string' ? id : undefined}
      className={cn('component blog-list-component blog-list-component--default', isEditing && 'is-editing', styles)}
    >
      <div className="component-content">
        {isEditing && (
          <span className="is-empty-hint">
            {!root
              ? 'Blog List: select the blog page as the datasource'
              : posts.length
                ? 'Cards come from the posts under the datasource page: edit them on each post. Count and categories are in the rendering parameters'
                : 'Blog List: no blog posts found under the datasource page (check the category filter and that the posts are published)'}
          </span>
        )}

        {posts.length > 0 && (
          <ul className="blog-list" role="list">
            {posts.map((post) => (
              <li key={post.id} className="blog-list__item">
                <BlogCard post={post} locale={locale} labels={cardLabels} />
              </li>
            ))}
          </ul>
        )}

        {viewAllHref && (
          <div className="blog-list__view-all">
            <NextLink href={viewAllHref}>{labels.BlogViewAll}</NextLink>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Listing variant: every post of the datasource page with a search box, category tabs and numbered
 * pagination (the /blog page). The server renders page 1 of "All"; the client part (BlogListing) then
 * loads the whole index once from the signed endpoint and does search, filter and paging in the browser.
 *
 * Rendering parameters: Count = cards per page (default 9); Categories = which tabs to show, in that
 * order (default: every category used by a post, A–Z). ShowViewAll is ignored.
 * Below the tabs is the `blog-list-sidebar-{*}` placeholder (follow links, contact CTA, …).
 */
export const Listing = async ({ params, rendering, page }: BlogListProps) => {
  const { styles, RenderingIdentifier: id, DynamicPlaceholderId } = params;
  const [{ isEditing, isLive, root, site, locale, index }, dictionary] = await Promise.all([
    loadIndex({ params, rendering, page }),
    getDictionaryLabels(page?.siteName, LISTING_LABEL_DEFAULTS),
  ]);

  // Live site without a datasource: nothing to list
  if (!root && !isEditing) return null;

  const pageSize = toCount(params.Count) ?? LISTING_PAGE_SIZE;
  const categories = getCategories(index.posts, toIds(params.Categories));
  const firstPage = paginate(index.posts, 1, pageSize);
  // Live: the browser loads the index from the signed endpoint. Pages / preview (uncached data) or no
  // signing key: the posts go inline instead
  const indexUrl = isLive && site && root ? getBlogIndexUrl({ site, locale, root }) : undefined;

  const labels: BlogListingLabels = {
    readingTime: dictionary.BlogReadingTime,
    search: dictionary.BlogSearch,
    all: dictionary.BlogAll,
    noResults: dictionary.BlogNoResults,
    categories: dictionary.BlogCategories,
    pagination: dictionary.BlogPagination,
    previousPage: dictionary.BlogPreviousPage,
    nextPage: dictionary.BlogNextPage,
    pageN: dictionary.BlogPageN,
    resultCount: dictionary.BlogResultCount,
  };

  return (
    <div
      id={typeof id === 'string' ? id : undefined}
      className={cn('component blog-list-component blog-list-component--listing', isEditing && 'is-editing', styles)}
    >
      <div className="component-content">
        {isEditing && (
          <span className="is-empty-hint">
            {!root
              ? 'Blog List: select the blog page as the datasource'
              : index.posts.length
                ? 'Cards come from the posts under the datasource page: edit them on each post. Cards per page (Count) and the category tabs (Categories) are in the rendering parameters'
                : 'Blog List: no blog posts found under the datasource page (check that the posts are published)'}
          </span>
        )}

        <BlogListing
          locale={locale}
          labels={labels}
          categories={categories}
          pageSize={pageSize}
          firstPage={firstPage.items}
          total={firstPage.total}
          indexUrl={indexUrl}
          posts={indexUrl ? undefined : index.posts}
        >
          <div className="blog-listing__sidebar-content">
            <AppPlaceholder
              name={`blog-list-sidebar-${DynamicPlaceholderId ?? '1'}`}
              rendering={rendering}
              page={page}
              componentMap={componentMap}
            />
          </div>
        </BlogListing>
      </div>
    </div>
  );
};
