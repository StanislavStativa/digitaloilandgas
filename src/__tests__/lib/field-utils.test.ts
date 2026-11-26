import { ImageField, LinkField } from '@sitecore-content-sdk/nextjs';
import { getDatasource } from 'lib/component-props';
import { fieldText, hasFieldText, hasImageSrc, hasLinkHref, linkHref, linkRel } from 'lib/field-utils';

const image = (src?: string): ImageField => ({ value: src ? { src } : {} });
const link = (href?: string, target?: string): LinkField => ({ value: { href: href ?? '', target } });

describe('field-utils', () => {
  it('reads text from plain and GraphQL fields, trimmed', () => {
    expect(fieldText({ value: '  Matt Moore ' })).toBe('Matt Moore');
    expect(fieldText({ jsonValue: { value: 'Graph' } })).toBe('Graph');
    expect(fieldText({ value: 42 })).toBe('42');
    expect(fieldText(undefined)).toBe('');
    expect(fieldText(null)).toBe('');
  });

  it('treats empty, whitespace-only and missing values as no text', () => {
    expect(hasFieldText({ value: 'x' })).toBe(true);
    expect(hasFieldText({ value: '   ' })).toBe(false);
    expect(hasFieldText({ value: '' })).toBe(false);
    expect(hasFieldText({ jsonValue: { value: '' } })).toBe(false);
    expect(hasFieldText(undefined)).toBe(false);
  });

  it('detects an image by its src', () => {
    expect(hasImageSrc(image('/-/media/a.jpg'))).toBe(true);
    expect(hasImageSrc({ jsonValue: image('/-/media/a.jpg') })).toBe(true);
    expect(hasImageSrc(image())).toBe(false);
    expect(hasImageSrc(null)).toBe(false);
  });

  it('reads link destinations, ignoring blank hrefs', () => {
    expect(linkHref(link(' https://example.com '))).toBe('https://example.com');
    expect(hasLinkHref({ jsonValue: link('/about') })).toBe(true);
    expect(hasLinkHref(link('  '))).toBe(false);
    expect(hasLinkHref(undefined)).toBe(false);
  });

  it('adds rel only to links that open a new tab', () => {
    expect(linkRel(link('https://example.com', '_blank'))).toBe('noopener noreferrer');
    expect(linkRel({ jsonValue: link('https://example.com', '_blank') })).toBe('noopener noreferrer');
    expect(linkRel(link('/about'))).toBeUndefined();
    expect(linkRel(undefined)).toBeUndefined();
  });
});

describe('getDatasource', () => {
  it('returns the Integrated GraphQL datasource, else the context item', () => {
    expect(getDatasource({ data: { datasource: { id: 'ds' } } })).toEqual({ id: 'ds' });
    expect(getDatasource({ data: { datasource: null, contextItem: { id: 'ctx' } } } as never)).toEqual({ id: 'ctx' });
  });

  it('returns undefined when Integrated GraphQL has no datasource', () => {
    expect(getDatasource({ data: { datasource: null } } as never)).toBeUndefined();
    expect(getDatasource({ data: {} })).toBeUndefined();
  });

  it('returns plain fields as they are, and undefined for no fields', () => {
    const fields = { Title: { value: 'x' } };
    expect(getDatasource(fields)).toBe(fields);
    expect(getDatasource(undefined)).toBeUndefined();
    expect(getDatasource(null)).toBeUndefined();
  });
});
