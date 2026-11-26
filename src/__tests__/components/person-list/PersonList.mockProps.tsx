import { PersonListItem, PersonListProps } from 'components/person-list/PersonList.props';

type MockField = { value?: unknown };

/** Content SDK field components, reduced to plain markup (the real ones return null for empty fields too) */
export const contentSdkMock = () => ({
  NextImage: ({
    field,
    alt,
    width,
    height,
  }: {
    field?: { value?: { src?: string; alt?: string } };
    alt?: string;
    width?: number;
    height?: number;
  }) =>
    field?.value?.src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={field.value.src} alt={alt ?? field.value.alt ?? ''} width={width} height={height} />
    ) : null,
  Text: ({ field, tag: Tag = 'span', className }: { field?: MockField; tag?: 'h3' | 'p' | 'span'; className?: string }) =>
    field?.value ? <Tag className={className}>{field.value as string}</Tag> : null,
  RichText: ({ field, className }: { field?: MockField; className?: string }) =>
    field?.value ? <div className={className} dangerouslySetInnerHTML={{ __html: field.value as string }} /> : null,
  Link: ({ field, children, ...props }: { field?: { value?: Record<string, string> }; children?: React.ReactNode; [key: string]: unknown }) =>
    field?.value?.href ? (
      <a href={field.value.href} target={field.value.target || undefined} {...(props as object)}>
        {children ?? field.value.text}
      </a>
    ) : null,
});

interface ItemOptions {
  name?: string | null;
  position?: string | null;
  description?: string | null;
  photo?: string | null;
  photoAlt?: string;
  linkedIn?: string | null;
  target?: string;
}

/** Pass `null` for a field that is empty in Sitecore */
export const makePerson = (n: number, options: ItemOptions = {}): PersonListItem => {
  const {
    name = `Person ${n}`,
    position = `Position ${n}`,
    description = `<p>Description ${n}</p>`,
    photo = `/-/media/person-${n}.jpg`,
    photoAlt = `Photo of person ${n}`,
    linkedIn = `https://www.linkedin.com/in/person-${n}`,
    target = '_blank',
  } = options;

  return {
    id: `PERSON${n}`,
    photo: { jsonValue: { value: photo ? { src: photo, alt: photoAlt, width: '400', height: '400' } : {} } },
    name: { jsonValue: { value: name ?? '' } },
    position: { jsonValue: { value: position ?? '' } },
    description: { jsonValue: { value: description ?? '' } },
    linkedIn: { jsonValue: { value: linkedIn ? { href: linkedIn, linktype: 'external', target } : { href: '' } } },
  } as PersonListItem;
};

/** A child of another template: the query returns null for every Person Item field */
export const makeForeignChild = (id: string): PersonListItem => ({
  id,
  photo: null,
  name: null,
  position: null,
  description: null,
  linkedIn: null,
});

export const makePersonListProps = (
  options: { count?: number; items?: PersonListItem[]; isEditing?: boolean; noDatasource?: boolean; id?: string } = {},
): PersonListProps => {
  const { count = 4, isEditing = false, noDatasource = false, id = 'pl-1' } = options;
  const items = options.items ?? Array.from({ length: count }, (_, i) => makePerson(i + 1));

  return {
    rendering: { componentName: 'PersonList' },
    params: { RenderingIdentifier: id, styles: 'custom-style ' },
    page: { mode: { isEditing } },
    // Integrated GraphQL shape; no datasource comes back as { data: { datasource: null } }
    fields: { data: { datasource: noDatasource ? null : { id: 'LIST', items: { results: items } } } },
  } as unknown as PersonListProps;
};
