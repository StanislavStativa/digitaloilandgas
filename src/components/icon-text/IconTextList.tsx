import { getDatasource, getFieldValue } from 'lib/component-props';
import { hasFieldText, hasImageSrc } from 'lib/field-utils';
import { cn, normalizeId } from 'lib/utils';
import { FC } from 'react';
import { ICON_TEXT_ITEM_TEMPLATE_ID, IconTextListItem, IconTextListProps, IconTextVariant } from './IconText.props';
import { IconTextItem } from './IconTextItem';

/** Only Icon Text Item children; a query without `template` keeps everything */
const isIconTextItem = (item: IconTextListItem) => !item.template?.id || normalizeId(item.template.id) === normalizeId(ICON_TEXT_ITEM_TEMPLATE_ID);

const hasContent = (item: IconTextListItem) => hasFieldText(item.title) || hasImageSrc(item.icon);

const IconTextListRendering: FC<IconTextListProps & { variant: IconTextVariant }> = ({ fields, params, page, variant }) => {
  const { styles, RenderingIdentifier: id } = params;
  const isEditing = Boolean(page?.mode?.isEditing);

  const datasource = getDatasource(fields);
  // Sitecore item order is kept. Live site: skip children with neither a title nor an icon;
  // Pages: keep them so they stay editable.
  const items = (datasource?.items?.results ?? []).filter((item) => item && isIconTextItem(item) && (isEditing || hasContent(item)));

  if (!items.length && !isEditing) return null;

  return (
    <div id={typeof id === 'string' ? id : undefined} className={cn('component icon-text-component', `icon-text-component--${variant}`, styles)}>
      <div className="component-content">
        {items.length ? (
          <ul className={cn('icon-text-list', `icon-text-list--${variant}`)}>
            {items.map((item, i) => (
              <IconTextItem
                key={item.id || `item-${i}`}
                as="li"
                icon={getFieldValue(item.icon)}
                title={getFieldValue(item.title)}
                description={getFieldValue(item.description)}
                variant={variant}
                isEditing={isEditing}
              />
            ))}
          </ul>
        ) : (
          <span className="is-empty-hint">
            {datasource?.items ? 'Icon Text List: add Icon Text Item children to the datasource' : 'Icon Text List: select or create a datasource'}
          </span>
        )}
      </div>
    </div>
  );
};

/** Every item in the Default layout (large icon + heading, description below) */
export const Default: FC<IconTextListProps> = (props) => <IconTextListRendering {...props} variant="default" />;

/** Every item in the compact Feature layout (icon left, title + description right) */
export const Feature: FC<IconTextListProps> = (props) => <IconTextListRendering {...props} variant="feature" />;
