import { AccordionListItem, AccordionProps } from 'components/accordion/Accordion.props';

type MockField = { value?: unknown };

/** Content SDK field components, reduced to plain markup (the real ones return null for empty fields too) */
export const contentSdkMock = () => ({
  Text: ({ field, tag: Tag = 'span', className }: { field?: MockField; tag?: 'span'; className?: string }) =>
    field?.value ? <Tag className={className}>{field.value as string}</Tag> : null,
  RichText: ({ field, className }: { field?: MockField; className?: string }) =>
    field?.value ? <div className={className} dangerouslySetInnerHTML={{ __html: field.value as string }} /> : null,
});

/** Pass `null` for a field that is empty in Sitecore; omit `isOpenByDefault` for a query without the field */
export const makeItem = (
  n: number,
  options: { title?: string | null; description?: string | null; isOpenByDefault?: boolean | string } = {},
): AccordionListItem => {
  const { title = `Question ${n}`, description = `<p>Answer ${n}</p>`, isOpenByDefault } = options;
  return {
    id: `ITEM${n}`,
    title: { jsonValue: { value: title ?? '' } },
    description: { jsonValue: { value: description ?? '' } },
    ...(isOpenByDefault !== undefined && { isOpenByDefault: { jsonValue: { value: isOpenByDefault } } }),
  };
};

/** A child of another template: the query returns null for every Accordion Item field */
export const makeForeignChild = (id: string): AccordionListItem => ({ id, title: null, description: null });

export const makeAccordionProps = (
  options: {
    count?: number;
    items?: AccordionListItem[];
    isEditing?: boolean;
    noDatasource?: boolean;
    allowMultipleOpen?: unknown;
    id?: string;
  } = {},
): AccordionProps => {
  const { count = 3, isEditing = false, noDatasource = false, allowMultipleOpen, id = 'acc-1' } = options;
  const items = options.items ?? Array.from({ length: count }, (_, i) => makeItem(i + 1));

  return {
    rendering: { componentName: 'Accordion' },
    params: {
      RenderingIdentifier: id,
      styles: 'custom-style ',
      ...(allowMultipleOpen !== undefined && { AllowMultipleOpen: allowMultipleOpen }),
    },
    page: { mode: { isEditing } },
    // Integrated GraphQL shape; no datasource comes back as { data: { datasource: null } }
    fields: { data: { datasource: noDatasource ? null : { id: 'ACCORDION', items: { results: items } } } },
  } as unknown as AccordionProps;
};
