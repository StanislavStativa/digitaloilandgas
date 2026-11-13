import { CompatibleDatasource, ComponentProps, GraphQLField, GraphQLImageField } from 'lib/component-props';
import { Field } from '@sitecore-content-sdk/nextjs';
import { ReactNode } from 'react';

/** "Image Slider Item" child of the datasource */
export interface ImageSliderItem {
  id: string;
  image?: GraphQLImageField;
}

// Checkbox: boolean from Edge, "1"/"" from some field serializers
type CheckboxField = GraphQLField<Field<boolean | string>>;

/**
 * Shape returned by the rendering's ComponentQuery
 * (/sitecore/layout/Renderings/Project/digitaloilandgas/Image Slider).
 * The checkboxes live on the "Image Slider" datasource template; slides are its children.
 */
export interface ImageSliderDatasource {
  showArrows?: CheckboxField;
  showDots?: CheckboxField;
  isAutoplay?: CheckboxField;
  imageItems?: { results?: ImageSliderItem[] };
}

export interface ImageSliderProps extends ComponentProps {
  fields?: CompatibleDatasource<ImageSliderDatasource>;
}

/** Delay between autoplay slides, ms */
export const IMAGE_SLIDER_AUTOPLAY_INTERVAL = 5000;

/** One slide passed from the server component to the client carousel */
export interface ImageSliderSlide {
  id: string;
  content: ReactNode;
}

export interface ImageSliderCarouselProps {
  slides: ImageSliderSlide[];
  showArrows: boolean;
  showDots: boolean;
  autoplay: boolean;
  isEditing?: boolean;
}
