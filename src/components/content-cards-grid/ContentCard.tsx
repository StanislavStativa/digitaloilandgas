import { RichText, Text } from '@sitecore-content-sdk/nextjs';
import { hasFieldText } from 'lib/field-utils';
import { cn } from 'lib/utils';
import { FC } from 'react';
import { ContentCardProps, DEFAULT_CARD_HEIGHT, DEFAULT_CARD_WIDTH } from './ContentCardsGrid.props';

/**
 * One card: title with the red accent line, rich text description below.
 * Width and Height are only modifier classes; the grid (content-cards-grid.css) turns them into a column
 * span and a minimum height, and stretches every card in a row to the row's height.
 * Live site: empty parts are left out. Pages: both fields are rendered so they stay editable inline.
 */
export const ContentCard: FC<ContentCardProps> = ({
  title,
  description,
  width = DEFAULT_CARD_WIDTH,
  height = DEFAULT_CARD_HEIGHT,
  isEditing = false,
  as: Root = 'div',
}) => (
  <Root className={cn('content-card', `content-card--width-${width}`, `content-card--height-${height}`)}>
    {(isEditing || hasFieldText(title)) && <Text field={title} tag="h3" className="content-card__title" />}
    {(isEditing || hasFieldText(description)) && <RichText field={description} className="content-card__description" />}
  </Root>
);
