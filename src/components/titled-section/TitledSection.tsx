import { FC } from 'react';
import componentMap from '.sitecore/component-map';
import { AppPlaceholder, Text as ContentSdkText } from '@sitecore-content-sdk/nextjs';
import { getDatasource, getFieldValue } from 'lib/component-props';
import { TitledSectionProps } from './TitledSection.props';

export const Default: FC<TitledSectionProps> = ({ fields, params, rendering, page }) => {
  const { styles, RenderingIdentifier: id, DynamicPlaceholderId } = params;
  const phKey = `titled-section-${DynamicPlaceholderId}`;

  const datasource = getDatasource(fields);
  const titleField = getFieldValue(datasource?.Title);
  const isEditing = page?.mode?.isEditing;

  return (
    <section id={typeof id === 'string' ? id : undefined} className={`component titled-section ${styles ?? ''}`.replace(/\s+/g, ' ').trim()}>
      <div className="component-content titled-section__inner">
        {(titleField?.value || isEditing) && <ContentSdkText tag="h2" field={titleField} className="titled-section__title" />}
        <div className="titled-section__content">
          <AppPlaceholder name={phKey} rendering={rendering} page={page} componentMap={componentMap} />
        </div>
      </div>
    </section>
  );
};
