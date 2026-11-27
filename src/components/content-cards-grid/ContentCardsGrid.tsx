import { getDatasource, getFieldValue } from 'lib/component-props';
import { hasFieldText } from 'lib/field-utils';
import { cn } from 'lib/utils';
import { FC } from 'react';
import { ContentCard } from './ContentCard';
import { ContentCardsGridItem, ContentCardsGridProps, readCardHeight, readCardWidth } from './ContentCardsGrid.props';

const CARD_FIELDS = ['title', 'description', 'width', 'height'] as const;

/** Content Card Item children have the fields (possibly empty); children of other templates get `null` for all of them */
const isContentCardItem = (item: ContentCardsGridItem | null): item is ContentCardsGridItem =>
  Boolean(item?.id) && CARD_FIELDS.some((key) => item?.[key] != null);

/** Live site: a card needs a title or a description */
const hasContent = (item: ContentCardsGridItem) => hasFieldText(item.title) || hasFieldText(item.description);

/**
 * Cards in a responsive CSS grid, in Sitecore item order. Each card sets its own desktop Width (1/3 or 1/2
 * of a six-column grid) and minimum Height; rows form by themselves as the cards wrap, and the cards in a
 * row stretch to the tallest one. Tablet: two per row, mobile: one (content-cards-grid.css).
 * Server component, no client JavaScript. The wrapper and the grid are transparent; only the cards have a background.
 */
export const Default: FC<ContentCardsGridProps> = ({ fields, params, page }) => {
  const { styles, RenderingIdentifier: id } = params;
  const isEditing = Boolean(page?.mode?.isEditing);
  const datasource = getDatasource(fields);

  // Pages keeps empty items so they stay editable.
  const cards = (datasource?.items?.results ?? []).filter(isContentCardItem).filter((item) => isEditing || hasContent(item));

  if (!cards.length && !isEditing) return null;

  return (
    <div id={typeof id === 'string' ? id : undefined} className={cn('component content-cards-grid-component', styles)}>
      <div className="component-content">
        {cards.length ? (
          <ul className="content-cards-grid">
            {cards.map((item) => (
              <ContentCard
                key={item.id}
                as="li"
                title={getFieldValue(item.title)}
                description={getFieldValue(item.description)}
                width={readCardWidth(item.width?.value)}
                height={readCardHeight(item.height?.value)}
                isEditing={isEditing}
              />
            ))}
          </ul>
        ) : (
          <span className="is-empty-hint">
            {datasource?.items
              ? 'Content Cards Grid: insert Content Card Item children into the datasource'
              : 'Content Cards Grid: select or create a datasource'}
          </span>
        )}
      </div>
    </div>
  );
};
