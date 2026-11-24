'use client';
import { FC, FormEvent, MouseEvent, useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ChevronLeftIcon } from 'components/icons/ChevronLeftIcon';
import { SearchIcon } from 'components/icons/SearchIcon';
import { cn } from 'lib/utils';
import { BlogCard } from './BlogCard';
import { BlogListingProps, BlogPostTeaser } from './blog-list.props';
import {
  BlogPage,
  DEFAULT_LISTING_STATE,
  ListingState,
  fillPattern,
  filterPosts,
  pageNumbers,
  paginate,
  parseListingState,
  toListingSearch,
} from './blog-list.utils';

const SEARCH_DEBOUNCE_MS = 150;
/** Without requestIdleCallback (Safari), load the index shortly after hydration */
const IDLE_FALLBACK_MS = 1500;

type UrlState = Pick<ListingState, 'category' | 'page'>;

/* ---- The URL as an external store: native History API + popstate, read after hydration ---- */

const URL_CHANGE_EVENT = 'blog-listing:urlchange';

const subscribeToUrl = (onChange: () => void) => {
  window.addEventListener('popstate', onChange);
  window.addEventListener(URL_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(URL_CHANGE_EVENT, onChange);
  };
};
const getSearch = () => window.location.search;
const getPathname = () => window.location.pathname;
// The server (and hydration) render page 1 of All with query-only links
const getServerValue = () => '';

/** Writes category and page to the URL; Next.js keeps its router in sync with native pushState / replaceState */
const writeUrl = (state: UrlState, mode: 'push' | 'replace') => {
  const url = `${window.location.pathname}${toListingSearch(state)}${window.location.hash}`;
  if (mode === 'push') window.history.pushState(null, '', url);
  else window.history.replaceState(null, '', url);
  window.dispatchEvent(new Event(URL_CHANGE_EVENT));
};

/** A left click without modifier keys; anything else (new tab, new window) keeps the link's default behaviour */
const isPlainClick = (event: MouseEvent) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

/**
 * Client part of the Blog List "Listing" variant: search box, category tabs, card grid and numbered pagination.
 *
 * - The server renders page 1 of "All" (props), so the HTML has content and links before this loads.
 * - Every post comes from the signed index endpoint, fetched once in browser idle time (or right away when
 *   the URL asks for another view or the visitor interacts first). Search, filter and pagination then
 *   run locally: typing never sends a request.
 * - Category and page live in the URL (`?category=slug&page=n`), written with the native History API.
 *   `?q=` is read on arrival (sidebar search on the post pages); typed text is never written back.
 * - The URL is read with useSyncExternalStore (server snapshot: empty), not useSearchParams, so the
 *   statically rendered page keeps its server HTML instead of bailing out to a Suspense fallback.
 */
export const BlogListing: FC<BlogListingProps> = ({
  locale,
  labels,
  categories,
  pageSize,
  firstPage,
  total,
  indexUrl,
  posts: inlinePosts,
  children,
}) => {
  const searchId = useId();
  const resultsRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<Promise<void> | null>(null);
  const focusResultsRef = useRef(false);

  const search = useSyncExternalStore(subscribeToUrl, getSearch, getServerValue);
  const basePath = useSyncExternalStore(subscribeToUrl, getPathname, getServerValue);
  const urlState = useMemo(() => parseListingState(search, categories), [search, categories]);

  const [posts, setPosts] = useState<BlogPostTeaser[] | null>(inlinePosts ?? null);
  const [failed, setFailed] = useState(false);
  // null until the visitor types; until then the search text is the arrival `?q=`
  const [typed, setTyped] = useState<string | null>(null);
  const [debounced, setDebounced] = useState('');
  const inputValue = typed ?? urlState.query;
  const appliedQuery = typed === null ? urlState.query : debounced;

  /** Starts loading the index once; a failed request may be retried by the next interaction */
  const loadIndex = useCallback(() => {
    if (!indexUrl || requestRef.current) return;
    requestRef.current = fetch(indexUrl, { credentials: 'omit' })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then((data: { posts?: unknown }) => {
        if (!Array.isArray(data?.posts)) throw new Error('Unexpected response');
        setPosts(data.posts as BlogPostTeaser[]);
        setFailed(false);
      })
      .catch((error) => {
        console.error('Blog: failed to load the post index', error);
        requestRef.current = null;
        setFailed(true);
      });
  }, [indexUrl]);

  // Load the index right away if the arrival URL asks for more than page 1 of All, otherwise when idle
  useEffect(() => {
    const arrival = parseListingState(window.location.search, categories);
    if (arrival.category || arrival.page > 1 || arrival.query) {
      loadIndex();
      return;
    }
    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(loadIndex, { timeout: 4000 });
      return () => window.cancelIdleCallback(handle);
    }
    const handle = window.setTimeout(loadIndex, IDLE_FALLBACK_MS);
    return () => window.clearTimeout(handle);
  }, [categories, loadIndex]);

  // Debounced search
  useEffect(() => {
    if (typed === null) return;
    const handle = window.setTimeout(() => setDebounced(typed), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [typed]);

  const isDefaultView = !urlState.category && urlState.page === 1 && !appliedQuery.trim();

  const view: BlogPage = useMemo(() => {
    if (!posts) {
      return { items: firstPage, page: 1, pageCount: Math.max(1, Math.ceil(total / pageSize)), total };
    }
    const categoryIds = categories.filter((category) => category.slug === urlState.category).map((category) => category.id);
    return paginate(filterPosts(posts, { categoryIds, query: appliedQuery }), urlState.page, pageSize);
  }, [posts, firstPage, total, pageSize, categories, urlState.category, urlState.page, appliedQuery]);

  // The requested view needs the index: show the server page as busy until it arrives (or fails)
  const isPending = !posts && !isDefaultView && !failed;
  // Without the index (failed), only page 1 of All is real, so highlight that
  const shown: UrlState = posts || !failed ? { category: urlState.category, page: view.page } : DEFAULT_LISTING_STATE;

  // A page number past the end (old link, fewer results) is clamped: fix the URL to match
  useEffect(() => {
    if (posts && view.page !== urlState.page) writeUrl({ category: urlState.category, page: view.page }, 'replace');
  }, [posts, view.page, urlState.category, urlState.page]);

  // After a tab or page change, move focus to the results (and scroll them into view when above the viewport)
  useEffect(() => {
    const results = resultsRef.current;
    if (!focusResultsRef.current || !results) return;
    focusResultsRef.current = false;
    results.focus({ preventScroll: true });
    if (results.getBoundingClientRect().top < 0) results.scrollIntoView({ block: 'start' });
  }, [search]);

  /** Tabs and pagination are real links (shareable, open in a new tab); a plain click stays on the page */
  const onLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    const next = parseListingState(new URL(event.currentTarget.href).search, categories);
    if (next.category === shown.category && next.page === shown.page) return;
    focusResultsRef.current = true;
    writeUrl(next, 'push');
    loadIndex();
  };

  const hrefFor = (state: UrlState) => `${basePath}${toListingSearch(state)}` || '?';

  const onQueryChange = (value: string) => {
    setTyped(value);
    loadIndex();
    // New search text starts at page 1, and drops an arrival `?q=` so a reload doesn't bring old text back
    if (urlState.page > 1 || urlState.query) writeUrl({ category: urlState.category, page: 1 }, 'replace');
  };

  const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (typed !== null) setDebounced(typed);
    loadIndex();
  };

  const cardLabels = { readingTime: labels.readingTime };
  const pageLabel = (page: number) => fillPattern(labels.pageN, { page });

  return (
    <div className="blog-listing">
      <aside className="blog-listing__sidebar">
        <form role="search" className="blog-listing__search" onSubmit={onSearchSubmit}>
          <label htmlFor={searchId} className="blog-listing__sr-only">
            {labels.search}
          </label>
          <input
            id={searchId}
            type="search"
            className="blog-listing__search-input"
            placeholder={labels.search}
            value={inputValue}
            maxLength={100}
            autoComplete="off"
            onFocus={loadIndex}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <button type="submit" className="blog-listing__search-button" aria-label={labels.search}>
            <SearchIcon />
          </button>
        </form>

        {categories.length > 0 && (
          <nav className="blog-listing__categories" aria-label={labels.categories}>
            <ul role="list">
              {[{ slug: '', title: labels.all, id: 'all' }, ...categories].map((category) => (
                <li key={category.id}>
                  <a
                    href={hrefFor({ category: category.slug, page: 1 })}
                    onClick={onLinkClick}
                    aria-current={shown.category === category.slug ? 'true' : undefined}
                  >
                    {category.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {children}
      </aside>

      <div className="blog-listing__main">
        <p className="blog-listing__sr-only" aria-live="polite" aria-atomic="true">
          {posts && !isDefaultView ? fillPattern(labels.resultCount, { count: view.total }) : ''}
        </p>

        <div
          ref={resultsRef}
          tabIndex={-1}
          className={cn('blog-listing__results', isPending && 'is-loading')}
          aria-busy={isPending || undefined}
        >
          {view.items.length > 0 ? (
            <ul className="blog-list" role="list">
              {view.items.map((post) => (
                <li key={post.id} className="blog-list__item">
                  <BlogCard post={post} locale={locale} labels={cardLabels} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="blog-listing__empty">{labels.noResults}</p>
          )}
        </div>

        {view.pageCount > 1 && (
          <nav className="blog-pagination" aria-label={labels.pagination}>
            <ul role="list">
              <li>
                {shown.page > 1 ? (
                  <a
                    href={hrefFor({ ...shown, page: shown.page - 1 })}
                    onClick={onLinkClick}
                    className="blog-pagination__step"
                    aria-label={labels.previousPage}
                  >
                    <ChevronLeftIcon />
                  </a>
                ) : (
                  <span className="blog-pagination__step" aria-hidden="true">
                    <ChevronLeftIcon />
                  </span>
                )}
              </li>

              {pageNumbers(shown.page, view.pageCount).map((page, index) =>
                page === null ? (
                  <li key={`gap-${index}`} className="blog-pagination__gap" aria-hidden="true">
                    …
                  </li>
                ) : (
                  <li key={page}>
                    <a
                      href={hrefFor({ ...shown, page })}
                      onClick={onLinkClick}
                      className="blog-pagination__page"
                      aria-label={pageLabel(page)}
                      aria-current={page === shown.page ? 'page' : undefined}
                    >
                      {page}
                    </a>
                  </li>
                ),
              )}

              <li>
                {shown.page < view.pageCount ? (
                  <a
                    href={hrefFor({ ...shown, page: shown.page + 1 })}
                    onClick={onLinkClick}
                    className="blog-pagination__step blog-pagination__step--next"
                    aria-label={labels.nextPage}
                  >
                    <ChevronLeftIcon />
                  </a>
                ) : (
                  <span className="blog-pagination__step blog-pagination__step--next" aria-hidden="true">
                    <ChevronLeftIcon />
                  </span>
                )}
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
};
