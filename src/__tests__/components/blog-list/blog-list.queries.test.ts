import client from 'lib/sitecore-client';
import { unstable_cache } from 'next/cache';
import {
  BLOG_POSTS_QUERY,
  BLOG_ROOT_QUERY,
  blogIndexTag,
  fetchBlogIndex,
  getBlogIndex,
  getBlogIndexUrl,
  isSignedBlogIndexRequest,
} from 'components/blog-list/blog-list.queries';
import { makeQueryItem } from './blog-list.mockData';

jest.mock('lib/sitecore-client', () => ({ __esModule: true, default: { getData: jest.fn() } }));
jest.mock('next/cache', () => ({
  unstable_cache: jest.fn((fn: () => unknown) => fn),
}));

const getData = client.getData as jest.Mock;

const rootFound = { item: { url: { path: '/blog' } } };
const page = (items: unknown[], hasNext = false, endCursor: string | null = null) => ({
  item: { children: { pageInfo: { hasNext, endCursor }, results: items } },
});

describe('fetchBlogIndex', () => {
  it('returns the root URL and follows the cursor, dropping non-blog children, newest first', async () => {
    getData
      .mockResolvedValueOnce(rootFound)
      .mockResolvedValueOnce(page([makeQueryItem(1), { id: 'F', name: 'Data', url: { path: '/x' } }], true, 'c1'))
      .mockResolvedValueOnce(page([makeQueryItem(3), makeQueryItem(2)]));

    const index = await fetchBlogIndex({ language: 'en', root: 'root1' });

    expect(getData).toHaveBeenNthCalledWith(1, BLOG_ROOT_QUERY, { root: 'root1', language: 'en' });
    expect(getData).toHaveBeenNthCalledWith(2, BLOG_POSTS_QUERY, { root: 'root1', language: 'en', first: 50, after: null });
    expect(getData.mock.calls[2][1]).toMatchObject({ after: 'c1' });
    expect(index.rootUrl).toBe('/blog');
    expect(index.posts.map((p) => p.slug)).toEqual(['post-3', 'post-2', 'post-1']);
  });

  it('stops after the root query when the root does not exist in that language', async () => {
    getData.mockResolvedValueOnce({ item: null });
    await expect(fetchBlogIndex({ language: 'de', root: 'root1' })).resolves.toEqual({ posts: [] });
    expect(getData).toHaveBeenCalledTimes(1);
  });
});

describe('getBlogIndex', () => {
  it('caches per site, language and normalized root ID, tagged for on-demand revalidation', async () => {
    getData.mockResolvedValueOnce(rootFound).mockResolvedValueOnce(page([makeQueryItem(1)]));

    await getBlogIndex({ site: 's', language: 'de', root: '{B9575255-3FCB-48BA-8743-8CB54187ADAE}' });

    expect(unstable_cache).toHaveBeenCalledWith(
      expect.any(Function),
      ['blog-index', 's', 'de', 'b95752553fcb48ba87438cb54187adae'],
      { revalidate: 3600, tags: [blogIndexTag('s', 'de')] },
    );
    expect(getData.mock.calls[0][1]).toEqual({ root: 'b95752553fcb48ba87438cb54187adae', language: 'de' });
  });

  it('skips the cache when asked (Pages, preview)', async () => {
    getData.mockResolvedValueOnce(rootFound).mockResolvedValueOnce(page([makeQueryItem(1)]));
    const index = await getBlogIndex({ site: 's', language: 'en', root: 'root1', cached: false });
    expect(index.posts).toHaveLength(1);
    expect(unstable_cache).not.toHaveBeenCalled();
  });

  it('returns an empty index without a root, and does not query', async () => {
    await expect(getBlogIndex({ site: 's', language: 'en', root: '' })).resolves.toEqual({ posts: [] });
    expect(getData).not.toHaveBeenCalled();
  });

  it('logs and returns an empty index on errors', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    getData.mockRejectedValueOnce(new Error('Edge down'));

    await expect(getBlogIndex({ site: 's', language: 'en', root: 'root1' })).resolves.toEqual({ posts: [], failed: true });
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});

describe('signed index URL', () => {
  const env = { ...process.env };
  const request = { site: 'site', locale: 'en', root: '{B9575255-3FCB-48BA-8743-8CB54187ADAE}' };
  const signatureOf = (url: string) => new URL(url, 'https://x').searchParams.get('sig') ?? '';

  beforeEach(() => {
    process.env = { ...env, BLOG_INDEX_SECRET: 'secret-1', SITECORE_EDITING_SECRET: 'editing' };
  });
  afterAll(() => {
    process.env = env;
  });

  it('builds the endpoint URL with the normalized root and a signature that verifies', () => {
    const url = getBlogIndexUrl(request) ?? '';
    const params = new URL(url, 'https://x').searchParams;

    expect(url.startsWith('/api/blog-index?')).toBe(true);
    expect(params.get('root')).toBe('b95752553fcb48ba87438cb54187adae');
    expect(isSignedBlogIndexRequest({ ...request, root: params.get('root') ?? '' }, signatureOf(url))).toBe(true);
  });

  it('rejects a signature for another site, locale or root, or a tampered one', () => {
    const signature = signatureOf(getBlogIndexUrl(request) ?? '');

    expect(isSignedBlogIndexRequest({ ...request, site: 'other' }, signature)).toBe(false);
    expect(isSignedBlogIndexRequest({ ...request, locale: 'de' }, signature)).toBe(false);
    expect(isSignedBlogIndexRequest({ ...request, root: 'aaaabbbbccccddddeeeeffff00001111' }, signature)).toBe(false);
    expect(isSignedBlogIndexRequest(request, `${signature.slice(0, -1)}x`)).toBe(false);
    expect(isSignedBlogIndexRequest(request, '')).toBe(false);
  });

  it('signs with SITECORE_EDITING_SECRET when BLOG_INDEX_SECRET is not set, and changes with the key', () => {
    const withBlogSecret = signatureOf(getBlogIndexUrl(request) ?? '');
    delete process.env.BLOG_INDEX_SECRET;
    const withEditingSecret = signatureOf(getBlogIndexUrl(request) ?? '');

    expect(withEditingSecret).not.toBe(withBlogSecret);
    expect(isSignedBlogIndexRequest(request, withEditingSecret)).toBe(true);
  });

  it('returns no URL and verifies nothing without a key', () => {
    delete process.env.BLOG_INDEX_SECRET;
    delete process.env.SITECORE_EDITING_SECRET;

    expect(getBlogIndexUrl(request)).toBeUndefined();
    expect(isSignedBlogIndexRequest(request, 'anything')).toBe(false);
  });
});
