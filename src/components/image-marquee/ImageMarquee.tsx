import { getDatasource, getFieldValue } from 'lib/component-props';
import { cn } from 'lib/utils';
import { CSSProperties, FC } from 'react';
import { Image as ContentSdkImage } from '@sitecore-content-sdk/nextjs';
import { ImageMarqueeItem, ImageMarqueeProps } from './ImageMarquee.props';

const SPEED = 50;
const FAST_SPEED = 100;
const DEFAULT_GAP = 16;

// Sitecore number/text fields come as number or string
const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/**
 * The keyframe travels 50% of the doubled track + half a gap,
 * which equals one set of items: sum of rendered widths + one gap per item.
 * Returns undefined if any image lacks dimensions → CSS fallback duration is used.
 */
const getAnimationDuration = (items: ImageMarqueeItem[], itemHeight: number | undefined, gap: number, speed: number) => {
  let distance = 0;

  for (const item of items) {
    const value = getFieldValue(item.image)?.value;
    const width = toNumber(value?.width);
    const height = toNumber(value?.height);
    if (!width || !height) return undefined;

    distance += (itemHeight ? (itemHeight * width) / height : width) + gap;
  }

  return distance > 0 ? `${distance / speed}s` : undefined;
};

export const Default: FC<ImageMarqueeProps> = ({ fields, params, page }) => {
  const { styles, RenderingIdentifier: id } = params;
  const isEditing = page?.mode?.isEditing;

  const datasource = getDatasource(fields);
  const images = datasource?.imageItems?.results || [];
  const height = toNumber(datasource?.height?.jsonValue?.value);
  const gap = toNumber(datasource?.horizontalPadding?.jsonValue?.value);
  // "speed-fast" in Styles doubles the speed; "speed-slow" or none keeps the default
  const speed = styles?.split(/\s+/).includes('speed-fast') ? FAST_SPEED : SPEED;
  const duration = getAnimationDuration(images, height, gap ?? DEFAULT_GAP, speed);

  const style = {
    ...(gap !== undefined && { '--image-marquee-gap': `${gap}px` }),
    ...(duration && { '--animation-duration': duration }),
  } as CSSProperties;

  const renderItems = (items: ImageMarqueeItem[], isClone = false) =>
    items.map((item) => (
      <div
        key={isClone ? `${item.id}-clone` : item.id}
        className="image-marquee__item"
        style={{ height: height !== undefined ? `${height}px` : undefined }}
        aria-hidden={isClone || undefined}
      >
        <ContentSdkImage field={getFieldValue(item.image)} />
      </div>
    ));

  return (
    <div
      id={typeof id === 'string' ? id : undefined}
      className={cn('component', isEditing && 'is-editing', styles)}
      style={style}
    >
      <div className="component-content image-marquee">
        <div className="image-marquee__track">
          {renderItems(images)}
          {/* Duplicate set makes the -50% translate loop seamless */}
          {!isEditing && renderItems(images, true)}
        </div>
      </div>
    </div>
  );
};
