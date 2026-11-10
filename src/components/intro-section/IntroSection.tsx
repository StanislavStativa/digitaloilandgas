import { getFieldValue } from 'lib/component-props';
import { RichText as ContentSdkRichText } from '@sitecore-content-sdk/nextjs';
import { FC } from 'react';
import { IntroSectionProps } from './IntroSection.props';
import { CompatibleLink } from 'components/content-sdk/CompatibleLink';

export const Default: FC<IntroSectionProps> = (props) => {
  const { fields, params } = props;
  const { styles, RenderingIdentifier: id } = params;

  const titleField = getFieldValue(fields?.Title);
  const descriptionField = getFieldValue(fields?.Description);
  const ctaLinkField = getFieldValue(fields?.CtaLink);

  return (
    <div className="component mx-auto">
      <div id={typeof id === 'string' ? id : undefined} className={`component ${styles}`.trim()}>
        <div className="component-content">
          <ContentSdkRichText field={titleField} />
          <ContentSdkRichText tag="h5" field={descriptionField} className="pt-4" />
          <div className="field-promolink py-6 md:pt-8 lg:pt-10 btn-primary">{ctaLinkField ? <CompatibleLink field={ctaLinkField} /> : null}</div>
        </div>
      </div>
    </div>
  );
};
