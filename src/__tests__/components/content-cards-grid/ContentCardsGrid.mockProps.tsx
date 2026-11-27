import { ContentCardsGridItem, ContentCardsGridProps } from 'components/content-cards-grid/ContentCardsGrid.props';

type MockField = { value?: unknown };

/** Content SDK field components, reduced to plain markup (the real ones return null for empty fields too) */
export const contentSdkMock = () => ({
  Text: ({ field, tag: Tag = 'span', className }: { field?: MockField; tag?: 'h3' | 'span'; className?: string }) =>
    field?.value ? <Tag className={className}>{field.value as string}</Tag> : null,
  RichText: ({ field, className }: { field?: MockField; className?: string }) =>
    field?.value ? <div className={className} dangerouslySetInnerHTML={{ __html: field.value as string }} /> : null,
});

interface CardOptions {
  title?: string | null;
  description?: string | null;
  /** Stored droplist value; `null` = field missing from the query result, `undefined` = default */
  width?: string | null;
  height?: string | null;
}

/** Pass `null` for a field that is empty in Sitecore */
export const makeCard = (n: number, options: CardOptions = {}): ContentCardsGridItem => {
  const { title = `Card ${n}`, description = `<p>Description ${n}</p>`, width = '1-3', height = 'Auto' } = options;

  return {
    id: `CARD${n}`,
    title: { jsonValue: { value: title ?? '' } },
    description: { jsonValue: { value: description ?? '' } },
    width: width === null ? null : { value: width },
    height: height === null ? null : { value: height },
  };
};

/** A child of another template: the query returns null for every Content Card Item field */
export const makeForeignChild = (id: string): ContentCardsGridItem => ({ id, title: null, description: null, width: null, height: null });

export const makeGridProps = (
  options: {
    count?: number;
    items?: Array<ContentCardsGridItem | null>;
    isEditing?: boolean;
    noDatasource?: boolean;
    noChildren?: boolean;
    id?: string;
  } = {},
): ContentCardsGridProps => {
  const { count = 3, isEditing = false, noDatasource = false, noChildren = false, id = 'ccg-1' } = options;
  const items = options.items ?? Array.from({ length: count }, (_, i) => makeCard(i + 1));
  const datasource = noDatasource ? null : { id: 'GRID', items: noChildren ? { results: [] } : { results: items } };

  return {
    rendering: { componentName: 'ContentCardsGrid' },
    params: { RenderingIdentifier: id, styles: 'custom-style ' },
    page: { mode: { isEditing } },
    // Integrated GraphQL shape; no datasource comes back as { data: { datasource: null } }
    fields: { data: { datasource } },
  } as unknown as ContentCardsGridProps;
};
