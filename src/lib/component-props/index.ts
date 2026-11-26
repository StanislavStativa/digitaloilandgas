import { ComponentParams, ComponentRendering, Field, ImageField, LinkField, Page, RichTextField } from '@sitecore-content-sdk/nextjs';

export type ComponentProps = {
  rendering: ComponentRendering;
  params: ComponentParams & {
    RenderingIdentifier?: string;
    styles?: string;
    EnabledPlaceholders?: string;
  };
  page: Page;
};

export type ComponentWithContextProps = ComponentProps & {
  page: Page;
};

export type GraphQLField<T> = {
  jsonValue: T;
};

export type CompatibleField<T> = T | GraphQLField<T> | { jsonValue?: T };

export type GraphQLTextField = GraphQLField<Field<string>>;
export type GraphQLImageField = GraphQLField<ImageField>;
export type GraphQLLinkField = GraphQLField<LinkField>;
export type GraphQLRichTextField = GraphQLField<RichTextField>;

export type GraphQLDatasource<T> = {
  data: {
    datasource: T;
  };
};

export type CompatibleDatasource<T> =
  | GraphQLDatasource<T>
  | {
      data?: {
        datasource?: T;
        contextItem?: T;
      };
    }
  | T;

/**
 * The rendering's datasource, whichever shape the fields arrive in:
 * - Integrated GraphQL `{ data: { datasource, contextItem } }`: the datasource, else the context item,
 *   else undefined (no datasource selected comes back as `{ data: { datasource: null } }`);
 * - plain fields (default resolver): the fields object itself.
 */
export const getDatasource = <T>(fields: CompatibleDatasource<T> | null | undefined): T | undefined => {
  if (!fields) return undefined;

  if (typeof fields === 'object' && 'data' in fields) {
    const { data } = fields as { data?: { datasource?: T | null; contextItem?: T | null } | null };
    return data?.datasource ?? data?.contextItem ?? undefined;
  }

  return fields as T;
};

export const getFieldValue = <T>(field: CompatibleField<T> | null | undefined): T | undefined => {
  if (!field) return undefined;

  const maybeWrapped = field as { jsonValue?: T };
  if ('jsonValue' in maybeWrapped) {
    return maybeWrapped.jsonValue;
  }

  return field as T;
};
