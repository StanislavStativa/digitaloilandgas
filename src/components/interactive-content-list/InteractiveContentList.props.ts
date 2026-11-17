import {
  CompatibleDatasource,
  ComponentProps,
  GraphQLImageField,
  GraphQLLinkField,
  GraphQLRichTextField,
  GraphQLTextField,
} from 'lib/component-props';
import { ReactNode } from 'react';

/** "Interactive Content Item" child of the datasource (one card + its image) */
export interface InteractiveContentItem {
  id: string;
  title?: GraphQLTextField;
  description?: GraphQLRichTextField;
  ctaLink?: GraphQLLinkField;
  image?: GraphQLImageField;
}

/**
 * Shape returned by the rendering's ComponentQuery
 * (/sitecore/layout/Renderings/.../digitaloilandgas/Interactive Content List).
 * The "Interactive Content List" datasource has no own fields; its children are the cards, in item order.
 */
export interface InteractiveContentListDatasource {
  items?: { results?: InteractiveContentItem[] };
}

export interface InteractiveContentListProps extends ComponentProps {
  fields?: CompatibleDatasource<InteractiveContentListDatasource>;
}

/** One item rendered on the server and handed to the client switcher */
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
