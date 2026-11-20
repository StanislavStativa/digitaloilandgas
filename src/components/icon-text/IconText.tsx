import { getFieldValue } from 'lib/component-props';
import { cn } from 'lib/utils';
import { FC } from 'react';
import { IconTextProps, IconTextVariant } from './IconText.props';
import { hasIconTextImage, hasIconTextValue, IconTextItem } from './IconTextItem';

const IconTextRendering: FC<IconTextProps & { variant: IconTextVariant }> = ({ fields, params, page, variant }) => {
  const { styles, RenderingIdentifier: id } = params;
  const isEditing = Boolean(page?.mode?.isEditing);

  const icon = getFieldValue(fields?.Icon);
  const title = getFieldValue(fields?.Title);
  const description = getFieldValue(fields?.Description);

  // Live site: nothing worth showing without a title or an icon
  if (!isEditing && !hasIconTextValue(title) && !hasIconTextImage(icon)) return null;

  return (
    <div id={typeof id === 'string' ? id : undefined} className={cn('component icon-text-component', `icon-text-component--${variant}`, styles)}>
      <div className="component-content">
        {fields ? (
          <IconTextItem icon={icon} title={title} description={description} variant={variant} isEditing={isEditing} />
        ) : (
          <span className="is-empty-hint">Icon Text: select or create a datasource</span>
        )}
      </div>
    </div>
  );
};

/** Large icon + heading row, description below the whole row (e.g. "Our Purpose") */
export const Default: FC<IconTextProps> = (props) => <IconTextRendering {...props} variant="default" />;

/** Compact: icon left, title + description stacked on the right */
export const Feature: FC<IconTextProps> = (props) => <IconTextRendering {...props} variant="feature" />;
