import { ImageField, LinkField } from '@sitecore-content-sdk/nextjs';
import { CompatibleField, getFieldValue } from './component-props';

/**
 * Presence checks for Sitecore fields, shared by the components.
 * Every helper takes a plain field (`{ value }`), an Integrated GraphQL field (`{ jsonValue }`), or nothing.
 */
type MaybeField<T> = CompatibleField<T> | null | undefined;

/** Text, rich text, number… field value as a trimmed string ('' when empty or missing) */
export const fieldText = (field: MaybeField<{ value?: unknown }>): string => String(getFieldValue<{ value?: unknown }>(field)?.value ?? '').trim();

/** True when the field has a non-blank value (whitespace-only counts as empty) */
export const hasFieldText = (field: MaybeField<{ value?: unknown }>): boolean => fieldText(field) !== '';

/** True when an image field points to a media item */
export const hasImageSrc = (field: MaybeField<ImageField>): boolean => Boolean(getFieldValue(field)?.value?.src);

/** Link destination as a trimmed string ('' when the link is empty or missing) */
export const linkHref = (field: MaybeField<LinkField>): string => String(getFieldValue(field)?.value?.href ?? '').trim();

/** True when a general link has a destination */
export const hasLinkHref = (field: MaybeField<LinkField>): boolean => linkHref(field) !== '';

/** rel for a link that opens a new tab; CompatibleLink's Next.js branch doesn't add it */
export const linkRel = (field: MaybeField<LinkField>): string | undefined =>
  getFieldValue(field)?.value?.target === '_blank' ? 'noopener noreferrer' : undefined;
