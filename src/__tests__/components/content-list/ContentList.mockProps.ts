import { ContentListItem, ContentListProps } from 'components/content-list/ContentList.props';

interface ItemOptions {
  title?: string | null;
  description?: string | null;
  link?: { href: string; text?: string; target?: string } | null;
  image?: string | null;
}

/** Pass `null` for a field that is empty in Sitecore */
export const makeItem = (n: number, options: ItemOptions = {}): ContentListItem => {
  const {
    title = `Item title ${n}`,
    description = `<p>Description ${n}</p>`,
    link = { href: `/solutions/item-${n}`, text: 'Explore' },
    image = `/item-${n}.jpg`,
  } = options;

  return {
    id: `item-${n}`,
    title: { jsonValue: { value: title ?? '' } },
    description: { jsonValue: { value: description ?? '' } },
    ctaLink: { jsonValue: { value: link ?? { href: '' } } },
    image: { jsonValue: { value: image ? { src: image, alt: `Image alt ${n}`, width: 800, height: 600 } : {} } },
  };
};

export const makeProps = (
  options: { count?: number; items?: ContentListItem[]; isEditing?: boolean; id?: string; noDatasource?: boolean } = {},
): ContentListProps => {
  const { count = 3, isEditing = false, id = 'icl-1', noDatasource = false } = options;
  const items = options.items ?? Array.from({ length: count }, (_, i) => makeItem(i + 1));

  return {
    rendering: { componentName: 'ContentList' },
    params: { RenderingIdentifier: id, styles: 'custom-style' },
    page: { mode: { isEditing } },
    fields: noDatasource ? {} : { data: { datasource: { items: { results: items } } } },
  } as unknown as ContentListProps;
};
