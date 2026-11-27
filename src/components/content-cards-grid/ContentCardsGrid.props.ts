import { Field, RichTextField } from '@sitecore-content-sdk/nextjs';
import { CompatibleDatasource, ComponentProps, GraphQLRichTextField, GraphQLTextField } from 'lib/component-props';

/**
 * Most children the rendering's ComponentQuery asks for (`children(first: 24)`).
 * Experience Edge rejects the query as too complex above 26 children (2 jsonValue + 2 value fields each).
 */
export const CONTENT_CARDS_GRID_MAX_ITEMS = 24;

/** Desktop share of a row: `third` spans 2 of 6 grid columns, `half` spans 3 */
export type ContentCardWidth = 'third' | 'half';

/** Minimum card height; the pixel values live in content-cards-grid.css per breakpoint */
export type ContentCardHeight = 'auto' | 'compact' | 'medium' | 'tall';

export const DEFAULT_CARD_WIDTH: ContentCardWidth = 'third';
export const DEFAULT_CARD_HEIGHT: ContentCardHeight = 'auto';

const CARD_WIDTHS: Record<string, ContentCardWidth> = { '1/3': 'third', '1/2': 'half' };
const CARD_HEIGHTS: readonly ContentCardHeight[] = ['auto', 'compact', 'medium', 'tall'];

/**
 * "Width" droplist value → card width. A droplist stores the option item's name; Sitecore item names
 * can't contain "/", so the options are named "1-3" / "1-2" (display names "1/3" / "1/2").
 * Both spellings are accepted; empty or unknown values fall back to 1/3.
 */
export const readCardWidth = (value: unknown): ContentCardWidth => {
  const key = String(value ?? '')
    .replace(/\s+/g, '')
    .replace(/[-_]/, '/');
  return CARD_WIDTHS[key] ?? DEFAULT_CARD_WIDTH;
};

/** "Height" droplist value (Auto / Compact / Medium / Tall, any case) → card height; unknown → Auto */
export const readCardHeight = (value: unknown): ContentCardHeight => {
  const key = String(value ?? '')
    .trim()
    .toLowerCase() as ContentCardHeight;
  return CARD_HEIGHTS.includes(key) ? key : DEFAULT_CARD_HEIGHT;
};

/** Droplist selected through `field(name) { value }`: the stored option name */
type GraphQLValueField = { value?: string | null };

/**
 * One child of the "Content Cards Grid" datasource ("Content Card Item" template), as selected by the ComponentQuery.
 * A field the child's template doesn't have comes back `null`, which is how other children are told apart.
 */
export interface ContentCardsGridItem {
  id: string;
  title?: GraphQLTextField | null;
  description?: GraphQLRichTextField | null;
  width?: GraphQLValueField | null;
  height?: GraphQLValueField | null;
}

/**
 * Shape returned by the ComponentQuery of
 * /sitecore/layout/Renderings/Project/digitaloilandgas/Content Cards Grid.
 * The datasource has no own fields; its children are the cards, in Sitecore item order.
 */
export interface ContentCardsGridDatasource {
  items?: { results?: Array<ContentCardsGridItem | null> } | null;
}

export interface ContentCardsGridProps extends ComponentProps {
  fields?: CompatibleDatasource<ContentCardsGridDatasource>;
}

/** Presentation of one card; owns the card background, the grid span and the minimum height */
export interface ContentCardProps {
  title?: Field<string>;
  description?: RichTextField;
  width?: ContentCardWidth;
  height?: ContentCardHeight;
  isEditing?: boolean;
  /** Root element; the grid renders cards as `li` */
  as?: 'div' | 'li';
}
