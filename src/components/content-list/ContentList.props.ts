import {
  CompatibleDatasource,
  ComponentProps,
  GraphQLImageField,
  GraphQLLinkField,
  GraphQLRichTextField,
  GraphQLTextField,
} from 'lib/component-props';
import { ReactNode } from 'react';

/** "Content List Item" child of the datasource (one card + its image) */
export interface ContentListItem {
  id: string;
  title?: GraphQLTextField;
  description?: GraphQLRichTextField;
  ctaLink?: GraphQLLinkField;
  image?: GraphQLImageField;
}

/**
 * Shape returned by the rendering's ComponentQuery
 * (/sitecore/layout/Renderings/.../digitaloilandgas/Content List).
 * The "Content List" datasource has no own fields; its children are the cards, in item order.
 * Every variant (Default grid, Interactive switcher, Image List) uses the same datasource.
 */
export interface ContentListDatasource {
  items?: { results?: ContentListItem[] };
}

export interface ContentListProps extends ComponentProps {
  fields?: CompatibleDatasource<ContentListDatasource>;
}

/** Interactive variant: one item rendered on the server and handed to the client switcher */
export interface InteractiveContentEntry {
  id: string;
  /** Plain-text title, used for accessible names of the select button and the dots */
  label: string;
  /** Title field (h4) */
  title: ReactNode;
  /** Description + CTA link */
  body: ReactNode;
  image: ReactNode;
}

/** Tablet/mobile slide between items (card + image move together), ms */
export const INTERACTIVE_CONTENT_SLIDE_DURATION = 450;

export interface InteractiveContentSwitcherProps {
  entries: InteractiveContentEntry[];
  isEditing?: boolean;
}
