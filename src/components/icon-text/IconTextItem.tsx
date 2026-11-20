import { Image as ContentSdkImage, RichText, Text } from '@sitecore-content-sdk/nextjs';
import { FC } from 'react';
import { IconTextItemProps } from './IconText.props';

export const hasIconTextValue = (field?: { value?: unknown }) => Boolean(field?.value);
export const hasIconTextImage = (field?: { value?: { src?: string } }) => Boolean(field?.value?.src);

/**
 * One icon + title + optional description. Shared by the Icon Text and Icon Text List renderings;
 * the variant only changes the arrangement:
 * - default: [icon  Large title] row, description below the whole row
 * - feature: icon left, title + description stacked on the right
 * Colours are inherited from the parent container, so it works on light and dark sections.
 */
export const IconTextItem: FC<IconTextItemProps> = ({ icon, title, description, variant, isEditing = false, as: Root = 'div' }) => {
  // Live site: no empty wrappers. Pages: keep empty fields so they stay editable inline.
  const iconNode = (isEditing || hasIconTextImage(icon)) && (
    <span className="icon-text__icon">
      <ContentSdkImage field={icon} />
    </span>
  );
  const titleNode = <Text field={title} tag={variant === 'default' ? 'h2' : 'h3'} className="icon-text__title" />;
  const descriptionNode = (isEditing || hasIconTextValue(description)) && <RichText field={description} className="icon-text__description" />;

  if (variant === 'feature') {
    return (
      <Root className="icon-text icon-text--feature">
        {iconNode}
        <div className="icon-text__content">
          {titleNode}
          {descriptionNode}
        </div>
      </Root>
    );
  }

  return (
    <Root className="icon-text icon-text--default">
      <div className="icon-text__heading">
        {iconNode}
        {titleNode}
      </div>
      {descriptionNode}
    </Root>
  );
};
