import { FC } from 'react';
import { CompatibleLink } from 'components/content-sdk/CompatibleLink';
import { getFieldValue } from 'lib/component-props';
import { LinkProps } from './link.props';

export const Default: FC<LinkProps> = ({ params, fields, page }) => {
  const { styles, RenderingIdentifier: id } = params;
  const hrefField = getFieldValue(fields?.Href);
  const isEditing = page?.mode?.isEditing;

  return (
    <div className={`component link btn-primary ${styles || ''}`.trim()} id={id}>
      <div className="component-content">
        {hrefField ? <CompatibleLink field={hrefField} /> : isEditing ? <span className="is-empty-hint">Link</span> : null}
      </div>
    </div>
  );
};
