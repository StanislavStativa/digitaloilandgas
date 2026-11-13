import { ImageSliderItem, ImageSliderProps } from 'components/image-slider/ImageSlider.props';

type CheckboxValue = boolean | string | undefined;

/** Pass `null` for an item whose image field is empty */
export const makeItem = (n: number, src: string | null = `/slide-${n}.jpg`): ImageSliderItem => ({
  id: `item-${n}`,
  image: { jsonValue: { value: src ? { src, alt: `Slide image ${n}`, width: 400 + n, height: 300 } : {} } },
});

export const makeProps = (
  options: {
    count?: number;
    items?: ImageSliderItem[];
    showArrows?: CheckboxValue;
    showDots?: CheckboxValue;
    isAutoplay?: CheckboxValue;
    isEditing?: boolean;
    id?: string;
  } = {}
): ImageSliderProps => {
  const { count = 3, showArrows, showDots, isAutoplay, isEditing = false, id = 'image-slider-1' } = options;
  const items = options.items ?? Array.from({ length: count }, (_, i) => makeItem(i + 1));
  const checkbox = (value: CheckboxValue) => (value === undefined ? undefined : { jsonValue: { value } });

  return {
    rendering: { componentName: 'ImageSlider' },
    params: { RenderingIdentifier: id, styles: 'custom-style' },
    page: { mode: { isEditing } },
    fields: {
      data: {
        datasource: {
          showArrows: checkbox(showArrows),
          showDots: checkbox(showDots),
          isAutoplay: checkbox(isAutoplay),
          imageItems: { results: items },
        },
      },
    },
  } as unknown as ImageSliderProps;
};
