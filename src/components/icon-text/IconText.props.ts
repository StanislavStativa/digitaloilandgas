import { Field, ImageField, RichTextField } from '@sitecore-content-sdk/nextjs';
import {
  CompatibleDatasource,
  CompatibleField,
  ComponentProps,
  GraphQLImageField,
  GraphQLRichTextField,
  GraphQLTextField,
} from 'lib/component-props';

/** SXA headless variant; the rendering's exports `Default` / `Feature` map to these */
export type IconTextVariant = 'default' | 'feature';

/**
 * "Icon Text Item" template
 * (/sitecore/templates/Project/digitaloilandgas/Components/Icon Text/Icon Text Item).
 * Edge returns template ids without braces/dashes, upper case.
 */
export const ICON_TEXT_ITEM_TEMPLATE_ID = 'F2D86F2600F447F385ACEFF5152EAB9D';

/** Icon Text rendering: the datasource item's own fields (default Datasource resolver) */
export interface IconTextFields {
  Icon?: CompatibleField<ImageField>;
  Title?: CompatibleField<Field<string>>;
  Description?: CompatibleField<RichTextField>;
}

export interface IconTextProps extends ComponentProps {
  fields?: IconTextFields;
}

/** One child of the "Icon Text List" datasource, as selected by the rendering's ComponentQuery */
export interface IconTextListItem {
  id: string;
  template?: { id?: string };
  icon?: GraphQLImageField;
  title?: GraphQLTextField;
  description?: GraphQLRichTextField;
}

/**
 * Shape returned by the ComponentQuery of
 * /sitecore/layout/Renderings/Project/digitaloilandgas/Icon Text List.
 * The list has no own fields; its children are the items, in Sitecore item order.
 */
export interface IconTextListDatasource {
  items?: { results?: IconTextListItem[] };
}

export interface IconTextListProps extends ComponentProps {
  fields?: CompatibleDatasource<IconTextListDatasource>;
}

/** Shared presentation of one icon + title + description, used by both renderings */
export interface IconTextItemProps {
  icon?: ImageField;
  title?: Field<string>;
  description?: RichTextField;
  variant: IconTextVariant;
  isEditing?: boolean;
  /** Root element; the list renders items as `li` */
  as?: 'div' | 'li';
}
