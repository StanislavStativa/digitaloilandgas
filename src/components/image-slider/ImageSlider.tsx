import { getDatasource, getFieldValue } from 'lib/component-props';
import { readCheckbox } from 'lib/utils';
import { Image as ContentSdkImage } from '@sitecore-content-sdk/nextjs';
import { FC } from 'react';
import { ImageSliderItem, ImageSliderProps, ImageSliderSlide } from './ImageSlider.props';
import { ImageSliderCarousel } from './ImageSliderCarousel';

const hasImage = (item: ImageSliderItem) => Boolean(getFieldValue(item.image)?.value?.src);

export const Default: FC<ImageSliderProps> = ({ fields, params, page }) => {
  const { styles, RenderingIdentifier: id } = params;
  const isEditing = Boolean(page?.mode?.isEditing);

  const datasource = getDatasource(fields);
  // Live site: skip slides without an image. Pages: keep them so the empty field stays editable.
  const items = (datasource?.imageItems?.results ?? []).filter((item) => item && (isEditing || hasImage(item)));

  const showArrows = readCheckbox(getFieldValue(datasource?.showArrows)?.value, true);
  const showDots = readCheckbox(getFieldValue(datasource?.showDots)?.value, true);
  const autoplay = readCheckbox(getFieldValue(datasource?.isAutoplay)?.value, false);

  if (!items.length && !isEditing) return null;

  const slides: ImageSliderSlide[] = items.map((item, i) => ({
    id: item.id,
    content: (
      <>
        <ContentSdkImage field={getFieldValue(item.image)} loading={i === 0 ? 'eager' : 'lazy'} />
        {isEditing && !hasImage(item) && <span className="is-empty-hint">Slide {i + 1}: select an image</span>}
      </>
    ),
  }));

  return (
    <div
      id={typeof id === 'string' ? id : undefined}
      className={`component image-slider-component ${isEditing ? 'is-editing' : ''} ${styles ?? ''}`.replace(/\s+/g, ' ').trim()}
    >
      <div className="component-content">
        {slides.length ? (
          <ImageSliderCarousel slides={slides} showArrows={showArrows} showDots={showDots} autoplay={autoplay} isEditing={isEditing} />
        ) : (
          <span className="is-empty-hint">Image Slider: add Image Slider Item children to the datasource</span>
        )}
      </div>
    </div>
  );
};
