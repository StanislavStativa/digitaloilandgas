import { getFieldValue } from 'lib/component-props';
import { fieldText, hasFieldText, hasImageSrc } from 'lib/field-utils';
import { cn } from 'lib/utils';
import { Image as ContentSdkImage, NextImage, RichText, Text } from '@sitecore-content-sdk/nextjs';
import { FC } from 'react';
import { ContentListItem } from './ContentList.props';

/**
 * The image is about a third of the card from 768px up and the full card width below
 * (content-list.css); next/image picks the matching srcset width instead of the original file.
 */
export const IMAGE_LIST_IMAGE_SIZES = '(max-width: 767px) 100vw, (max-width: 1440px) 34vw, 490px';

interface ImageListItemProps {
  item: ContentListItem;
  index: number;
  isEditing: boolean;
}

/**
 * One card of the Content List "Image List" variant: image + title + description.
 * Server-only markup; the image-left / image-top switch is pure CSS (container + media queries).
 * The CTA link of the shared item template is not part of this design and is not rendered.
 */
export const ImageListItem: FC<ImageListItemProps> = ({ item, index, isEditing }) => {
  const hasImage = hasImageSrc(item.image);
  const showImage = hasImage || isEditing;

  return (
    <div role="listitem" className={cn('image-content-list__card', !showImage && 'image-content-list__card--no-image')}>
      {showImage && (
        <div className="image-content-list__media">
          {hasImage ? (
            // `fill`: the box sets the size (card height on desktop, fixed height on mobile), object-fit crops
            <NextImage field={getFieldValue(item.image)} fill sizes={IMAGE_LIST_IMAGE_SIZES} />
          ) : (
            // Pages, empty image: the plain SDK image keeps the empty field editable
            <>
              <ContentSdkImage field={getFieldValue(item.image)} />
              <span className="is-empty-hint">Item {index + 1}: select an image</span>
            </>
          )}
        </div>
      )}

      <div className="image-content-list__body">
        {(isEditing || fieldText(item.title)) && (
          <h4 className="image-content-list__title">
            <Text field={getFieldValue(item.title)} />
          </h4>
        )}
        {(isEditing || hasFieldText(item.description)) && (
          <RichText field={getFieldValue(item.description)} className="image-content-list__description" />
        )}
      </div>
    </div>
  );
};
