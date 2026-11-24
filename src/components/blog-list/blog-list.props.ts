import { ImageField, LinkField } from '@sitecore-content-sdk/nextjs';
import { ReactNode } from 'react';
import { ComponentProps } from 'lib/component-props';

/** Image value as stored in a Sitecore Image field (`jsonValue.value`) */
export interface BlogImage {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
}

export interface BlogCategoryRef {
  /** Normalized item ID (lowercase, no braces or dashes), see `normalizeId` */
  id: string;
  /** Item name, used as the URL slug in the listing filter (Part 2) */
  slug: string;
  /** `_Category` Title, falls back to the item name */
  title: string;
}

/**
 * Plain, serializable card data built from a page that inherits `_Teaser` and `_Article`.
 * Safe to pass to client components and to return from the index endpoint (Part 2).
 */
export interface BlogPostTeaser {
  id: string;
  /** CTA Link href when set, otherwise the page URL */
  href: string;
  /** `_blank` etc. when the CTA Link asks for it */
  target?: string;
  /** Item name (= URL slug) */
  slug: string;
  title: string;
  /** Card Summary as plain text (the field is rich text; tags are stripped so the card stays one link) */
  summary: string;
  /** Teaser Image, falling back to Hero Image */
  image?: BlogImage;
  /** Publish Date as an ISO string, if set */
  date?: string;
  readingMinutes?: number;
  categories: BlogCategoryRef[];
}

/** The posts of one blog root plus the root's own URL (for "View all") */
export interface BlogIndex {
  rootUrl?: string;
  posts: BlogPostTeaser[];
  /** Set when loading failed (logged); the posts are then empty. Never cached */
  failed?: boolean;
}

/**
 * Rendering parameters of the Blog List rendering (all values arrive as strings).
 * The datasource is the blog root page itself; its children are the posts.
 */
export interface BlogListParams {
  /** How many cards to show; empty or 0 means all */
  Count?: string;
  /** Multilist to Blog Categories: pipe-separated item IDs. A post matches if it has any of them */
  Categories?: string;
  /** Checkbox ("1"): show a "View all" link to the datasource page */
  ShowViewAll?: string;
  /** Listing variant: key suffix of the sidebar placeholder (`blog-list-sidebar-{*}`) */
  DynamicPlaceholderId?: string;
}

export interface BlogListProps extends ComponentProps {
  params: ComponentProps['params'] & BlogListParams;
}

/** Labels the card needs, resolved from the dictionary by the server component */
export interface BlogCardLabels {
  /** Reading time pattern with a `{minutes}` placeholder, e.g. "{minutes} min" */
  readingTime: string;
}

/** Labels of the Listing variant, resolved from the dictionary by the server component */
export interface BlogListingLabels extends BlogCardLabels {
  search: string;
  all: string;
  noResults: string;
  /** Accessible names of the two navigation regions */
  categories: string;
  pagination: string;
  previousPage: string;
  nextPage: string;
  /** "Page {page}" */
  pageN: string;
  /** "{count} posts", announced to screen readers when the results change */
  resultCount: string;
}

/** Props of the Listing variant's client part (all serializable) */
export interface BlogListingProps {
  locale: string;
  labels: BlogListingLabels;
  /** Category tabs, in display order */
  categories: BlogCategoryRef[];
  pageSize: number;
  /** Page 1 of "All", rendered on the server so content and links are in the HTML */
  firstPage: BlogPostTeaser[];
  /** Number of posts, for the server-rendered pagination */
  total: number;
  /** Signed index endpoint; the browser loads every post from it after the page has loaded */
  indexUrl?: string;
  /** Every post, passed inline instead when there is no endpoint (Pages, preview, no signing key) */
  posts?: BlogPostTeaser[];
  /** Server-rendered sidebar content below the category tabs (a placeholder) */
  children?: ReactNode;
}

export interface BlogCardProps {
  post: BlogPostTeaser;
  locale: string;
  labels: BlogCardLabels;
}

/** Raw GraphQL shape of one child item (see BLOG_POSTS_QUERY) */
export interface BlogPostQueryItem {
  id: string;
  name: string;
  displayName?: string;
  url?: { path?: string };
  title?: { value?: string } | null;
  // _Article
  publishDate?: { dateValue?: number | null } | null;
  readingTime?: { intValue?: number | null } | null;
  heroImage?: { jsonValue?: ImageField } | null;
  categories?: {
    targetItems?: Array<{ id: string; name: string; title?: { value?: string } | null }> | null;
  } | null;
  // _Teaser
  summary?: { value?: string } | null;
  teaserImage?: { jsonValue?: ImageField } | null;
  cTALink?: { jsonValue?: LinkField } | null;
}

export interface BlogRootQueryResult {
  item?: { url?: { path?: string } } | null;
}

export interface BlogPostsQueryResult {
  item?: {
    children?: {
      pageInfo?: { hasNext?: boolean; endCursor?: string | null };
      results?: BlogPostQueryItem[];
    };
  } | null;
}
