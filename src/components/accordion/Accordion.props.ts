import { Field } from '@sitecore-content-sdk/nextjs';
import { CompatibleDatasource, ComponentProps, GraphQLField, GraphQLRichTextField, GraphQLTextField } from 'lib/component-props';
import { ReactNode } from 'react';

/** Checkbox: boolean from Edge, "1"/"" from some field serializers */
type GraphQLCheckboxField = GraphQLField<Field<boolean | string>>;

/** SXA headless variant; the rendering's exports `Default` / `FAQ` map to these */
export type AccordionVariant = 'default' | 'faq';

/**
 * Most children the rendering's ComponentQuery asks for (`children(first: 30)`).
 * Experience Edge rejects the query as too complex at 35 children (3 jsonValue fields each; 34 passes).
 */
export const ACCORDION_MAX_ITEMS = 30;

/**
 * One child of the "Accordion" datasource ("Accordion Item" template), as selected by the ComponentQuery.
 * A field the child's template doesn't have comes back `null`, which is how other children are told apart.
 */
export interface AccordionListItem {
  id: string;
  title?: GraphQLTextField | null;
  description?: GraphQLRichTextField | null;
  /** "IsOpenByDefault" checkbox (display name "Open by default") */
  isOpenByDefault?: GraphQLCheckboxField | null;
}

/**
 * Shape returned by the ComponentQuery of
 * /sitecore/layout/Renderings/Project/digitaloilandgas/Accordion.
 * The datasource has no own fields; its children are the items, in Sitecore item order.
 */
export interface AccordionDatasource {
  items?: { results?: Array<AccordionListItem | null> } | null;
}

export interface AccordionProps extends ComponentProps {
  fields?: CompatibleDatasource<AccordionDatasource>;
}

/** One item, rendered on the server and handed to the client list */
export interface AccordionEntry {
  /** Sitecore item id: React key, state key and DOM id suffix */
  id: string;
  title: ReactNode;
  /** `null`: nothing to expand (live site, empty Description) */
  description: ReactNode | null;
  /** Expanded on page load (live site only; Pages expands everything) */
  isOpenByDefault: boolean;
}

export interface AccordionListProps {
  entries: AccordionEntry[];
  variant: AccordionVariant;
  /** `AllowMultipleOpen` rendering parameter */
  allowMultipleOpen: boolean;
  /** Pages: every item is expanded and the headers are plain editable fields */
  isEditing?: boolean;
}

export interface AccordionItemProps {
  title: ReactNode;
  description: ReactNode | null;
  /** 1-based position; shown by the FAQ variant */
  number: number;
  variant: AccordionVariant;
  isOpen: boolean;
  isEditing?: boolean;
  buttonId: string;
  panelId: string;
  onToggle?: () => void;
}
