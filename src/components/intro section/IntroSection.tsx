import { getFieldValue } from 'lib/component-props';
import { RichText as ContentSdkRichText } from '@sitecore-content-sdk/nextjs';
import { FC } from 'react';
import { IntroSectionProps } from './IntroSection.props';

export const Default: FC<IntroSectionProps> = (props) => {
  const { fields, params } = props;
  const { styles, RenderingIdentifier: id } = params;

  const titleField = getFieldValue(fields?.Title);
  const descriptionField = getFieldValue(fields?.Description);
  const ctaLinkField = getFieldValue(fields?.CtaLink);

  return (
    <div className="component mx-auto w-full max-w-screen-2xl px-6 md:px-10 lg:px-12">
      <div
        style={{ paddingTop: '250px', paddingBottom: '250px' }}
        id={typeof id === 'string' ? id : undefined}
        className={`component ${styles}`.trim()}
      >
        <div className="component-content">
          <ContentSdkRichText tag="h1" field={titleField} />
          <ContentSdkRichText tag="h4" field={descriptionField} />
        </div>
      </div>
    </div>
  );
};
