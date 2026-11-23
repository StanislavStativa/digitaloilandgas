import { NextImage as ContentSdkImage, LinkField, RichText, Text } from '@sitecore-content-sdk/nextjs';
import { CompatibleLink } from 'components/content-sdk/CompatibleLink';
import { LinkedInIcon } from 'components/icons/LinkedInIcon';
import { fieldText, hasFieldText, hasImageSrc, hasLinkHref, linkRel } from 'lib/field-utils';
import { FC } from 'react';
import { PersonCardProps } from './PersonList.props';

/** Accessible name of the LinkedIn link; mentions the new tab when the link opens one */
const linkedInLabel = (name: string, link: LinkField) =>
  `${name ? `${name} on LinkedIn` : 'LinkedIn profile'}${link.value?.target === '_blank' ? ' (opens in a new tab)' : ''}`;

/**
 * One person: [photo  Name / Position] header, description below the whole header, LinkedIn badge at the bottom.
 * The card is the only element with a background; the list around it stays transparent.
 * Live site: empty optional parts are left out. Pages: every field is rendered so it stays editable inline.
 */
export const PersonCard: FC<PersonCardProps> = ({ photo, name, position, description, linkedIn, isEditing = false, as: Root = 'div' }) => (
  <Root className="person-card">
    <div className="person-card__header">
      {(isEditing || hasImageSrc(photo)) && (
        <span className="person-card__photo">
          {/* Shown as a 64–80px circle: next/image serves a 1x/2x pair instead of the full-size photo.
              Without an alt text in Sitecore the photo is decorative (the name follows it). */}
          <ContentSdkImage field={photo} width={80} height={80} {...(photo?.value?.alt ? {} : { alt: '' })} />
        </span>
      )}
      <div className="person-card__heading">
        <Text field={name} tag="h3" className="person-card__name" />
        {(isEditing || hasFieldText(position)) && <Text field={position} tag="p" className="person-card__position" />}
      </div>
    </div>

    {(isEditing || hasFieldText(description)) && <RichText field={description} className="person-card__description" />}

    {linkedIn != null && (isEditing || hasLinkHref(linkedIn)) && (
      <div className="person-card__social">
        <CompatibleLink
          field={linkedIn}
          className="person-card__linkedin"
          aria-label={linkedInLabel(fieldText(name), linkedIn)}
          rel={linkRel(linkedIn)}
        >
          <LinkedInIcon className="person-card__linkedin-icon" />
        </CompatibleLink>
      </div>
    )}
  </Root>
);
