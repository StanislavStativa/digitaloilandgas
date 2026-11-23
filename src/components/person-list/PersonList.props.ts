import { Field, ImageField, LinkField, RichTextField } from '@sitecore-content-sdk/nextjs';
import {
  CompatibleDatasource,
  ComponentProps,
  GraphQLImageField,
  GraphQLLinkField,
  GraphQLRichTextField,
  GraphQLTextField,
} from 'lib/component-props';

/**
 * Most children the rendering's ComponentQuery asks for (`children(first: 20)`).
 * Experience Edge rejects this query as too complex above 22 children (5 jsonValue fields each).
 */
export const PERSON_LIST_MAX_ITEMS = 20;

/**
 * One child of the "Person List" datasource ("Person Item" template), as selected by the ComponentQuery.
 * A field the child's template doesn't have comes back `null`, which is how other children are told apart.
 */
export interface PersonListItem {
  id: string;
  photo?: GraphQLImageField | null;
  name?: GraphQLTextField | null;
  position?: GraphQLTextField | null;
  description?: GraphQLRichTextField | null;
  linkedIn?: GraphQLLinkField | null;
}

/**
 * Shape returned by the ComponentQuery of
 * /sitecore/layout/Renderings/Project/digitaloilandgas/Person List.
 * The list has no own fields; its children are the people, in Sitecore item order.
 */
export interface PersonListDatasource {
  items?: { results?: Array<PersonListItem | null> } | null;
}

export interface PersonListProps extends ComponentProps {
  fields?: CompatibleDatasource<PersonListDatasource>;
}

/** Presentation of one person; owns the card background */
export interface PersonCardProps {
  photo?: ImageField;
  name?: Field<string>;
  position?: Field<string>;
  description?: RichTextField;
  linkedIn?: LinkField;
  isEditing?: boolean;
  /** Root element; the list renders cards as `li` */
  as?: 'div' | 'li';
}
