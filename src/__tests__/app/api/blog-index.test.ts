/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/blog-index/route';
import { getBlogIndex, getBlogIndexUrl } from 'components/blog-list/blog-list.queries';
import { makePost } from '../../components/blog-list/blog-list.mockData';

jest.mock('lib/sitecore-client', () => ({ __esModule: true, default: { getData: jest.fn() } }));
jest.mock('src/i18n/routing', () => ({ routing: { locales: ['en', 'de'] } }));
jest.mock('components/blog-list/blog-list.queries', () => ({
  ...jest.requireActual('components/blog-list/blog-list.queries'),
  getBlogIndex: jest.fn(),
}));

const index = getBlogIndex as jest.Mock;
// A site from .sitecore/sites.json
const SITE = 'digitaloilandgas';
const ROOT = '{B9575255-3FCB-48BA-8743-8CB54187ADAE}';

const get = (url: string) => GET(new NextRequest(new URL(url, 'https://www.example.com')));
const signedUrl = (site = SITE, locale = 'en') => getBlogIndexUrl({ site, locale, root: ROOT }) ?? '';

describe('GET /api/blog-index', () => {
  const env = { ...process.env };
  beforeEach(() => {
    process.env = { ...env, BLOG_INDEX_SECRET: 'secret-1' };
    index.mockResolvedValue({ rootUrl: '/blog', posts: [makePost(1), makePost(2)] });
  });
  afterAll(() => {
    process.env = env;
  });

  it('returns the posts of a signed request, cacheable by the CDN', async () => {
    const response = await get(signedUrl());

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=');
    expect((await response.json()).posts.map((p: { id: string }) => p.id)).toEqual(['post1', 'post2']);
    expect(index).toHaveBeenCalledWith({ site: SITE, language: 'en', root: 'b95752553fcb48ba87438cb54187adae' });
  });

  it.each([
    ['an unsigned request', (url: string) => url.replace(/&sig=[^&]+/, '')],
    ['a tampered signature', (url: string) => url.replace(/sig=./, 'sig=0')],
    ['another root with the same signature', (url: string) => url.replace(/root=\w+/, 'root=aaaabbbbccccddddeeeeffff00001111')],
    ['a root that is not an ID', (url: string) => url.replace(/root=\w+/, 'root=%2Fsitecore%2Fcontent')],
    ['an unknown site', (url: string) => url.replace(`site=${SITE}`, 'site=evil')],
    ['an unknown locale', (url: string) => url.replace('locale=en', 'locale=xx')],
  ])('answers 404 to %s, without loading anything', async (_case, tamper) => {
    const response = await get(tamper(signedUrl()));

    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(index).not.toHaveBeenCalled();
  });

  it('answers 503, uncached, when the index failed to load', async () => {
    index.mockResolvedValue({ posts: [], failed: true });
    const response = await get(signedUrl());

    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});
