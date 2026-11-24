import { NextRequest, NextResponse } from 'next/server';
import sites from '.sitecore/sites.json';
import { routing } from 'src/i18n/routing';
import { getBlogIndex, isSignedBlogIndexRequest } from 'components/blog-list/blog-list.queries';

/**
 * GET /api/blog-index?site=&locale=&root=&sig=
 *
 * The posts of one blog root as JSON, for the Blog List "Listing" variant, which loads it in the
 * browser after the page has loaded and then searches, filters and paginates locally. Visitors'
 * searches never reach this endpoint, let alone Edge.
 *
 * Only requests signed by the server that rendered the listing are answered (see getBlogIndexUrl),
 * so random parameters can't make the endpoint query Edge. Anything else is a 404.
 * The data comes from the same tagged cache as the server-rendered cards.
 */

const KNOWN_SITES = new Set((sites as Array<{ name: string }>).map((site) => site.name));
const KNOWN_LOCALES = new Set<string>(routing.locales);

/** Short CDN cache: the data cache behind it is refreshed by publish webhooks, the CDN copy is not */
const CACHE_CONTROL = 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400';

const notFound = () => NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const site = params.get('site') ?? '';
  const locale = params.get('locale') ?? '';
  const root = params.get('root') ?? '';
  const signature = params.get('sig') ?? '';

  if (!KNOWN_SITES.has(site) || !KNOWN_LOCALES.has(locale) || !/^[0-9a-f]{32}$/.test(root)) return notFound();
  if (!isSignedBlogIndexRequest({ site, locale, root }, signature)) return notFound();

  const { posts, failed } = await getBlogIndex({ site, language: locale, root });
  // An Edge outage must not leave an empty list in the CDN; the client keeps the server-rendered page
  if (failed) return NextResponse.json({ error: 'Unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });

  return NextResponse.json({ posts }, { headers: { 'Cache-Control': CACHE_CONTROL } });
}
