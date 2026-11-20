import { IconTextListItem, IconTextListProps, IconTextProps, ICON_TEXT_ITEM_TEMPLATE_ID } from 'components/icon-text/IconText.props';

type MockField = { value?: unknown };

/** Content SDK field components, reduced to plain markup (the real ones return null for empty fields too) */
export const contentSdkMock = () => ({
  Image: ({ field }: { field?: { value?: { src?: string; alt?: string } } }) =>
    field?.value?.src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={field.value.src} alt={field.value.alt ?? ''} />
    ) : null,
  Text: ({ field, tag: Tag = 'span', className }: { field?: MockField; tag?: 'h2' | 'h3' | 'span'; className?: string }) =>
    field?.value ? <Tag className={className}>{field.value as string}</Tag> : null,
  RichText: ({ field, className }: { field?: MockField; className?: string }) =>
    field?.value ? <div className={className} dangerouslySetInnerHTML={{ __html: field.value as string }} /> : null,
});

interface ItemOptions {
  title?: string | null;
  description?: string | null;
  icon?: string | null;
  templateId?: string;
}

/** Pass `null` for a field that is empty in Sitecore */
const values = (n: number, { title = `Title ${n}`, description = `<p>Description ${n}</p>`, icon = `/icon-${n}.svg` }: ItemOptions) => ({
  icon: { value: icon ? { src: icon, alt: `Icon alt ${n}`, width: 48, height: 48 } : {} },
  title: { value: title ?? '' },
  description: { value: description ?? '' },
});

export const makeIconTextProps = (options: ItemOptions & { isEditing?: boolean; noDatasource?: boolean; styles?: string } = {}): IconTextProps => {
  const { isEditing = false, noDatasource = false, styles = 'custom-style' } = options;
  const v = values(1, options);

  return {
    rendering: { componentName: 'IconText' },
    params: { RenderingIdentifier: 'it-1', styles },
    page: { mode: { isEditing } },
    fields: noDatasource ? undefined : { Icon: v.icon, Title: v.title, Description: v.description },
  } as unknown as IconTextProps;
};

export const makeListItem = (n: number, options: ItemOptions = {}): IconTextListItem => {
  const v = values(n, options);
  return {
    id: `item-${n}`,
    template: { id: options.templateId ?? ICON_TEXT_ITEM_TEMPLATE_ID },
    icon: { jsonValue: v.icon },
    title: { jsonValue: v.title },
    description: { jsonValue: v.description },
  } as IconTextListItem;
};

export const makeListProps = (
  options: { count?: number; items?: IconTextListItem[]; isEditing?: boolean; noDatasource?: boolean } = {},
): IconTextListProps => {
  const { count = 3, isEditing = false, noDatasource = false } = options;
  const items = options.items ?? Array.from({ length: count }, (_, i) => makeListItem(i + 1));

  return {
    rendering: { componentName: 'IconTextList' },
    params: { RenderingIdentifier: 'itl-1', styles: 'custom-style' },
    page: { mode: { isEditing } },
    fields: noDatasource ? {} : { data: { datasource: { items: { results: items } } } },
  } as unknown as IconTextListProps;
};
