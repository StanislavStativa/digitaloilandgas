import { CompatibleField, ComponentProps } from 'lib/component-props';
import { LinkField, RichTextField } from '@sitecore-content-sdk/nextjs';
import type React from 'react';

export interface IntroSectionFields {
  Title?: CompatibleField<RichTextField>;
  Description?: CompatibleField<RichTextField>;
  CtaLink?: CompatibleField<LinkField>;
}

export interface IntroSectionProps extends ComponentProps {
  fields?: IntroSectionFields;
}

export interface IntroSectionWrapperProps {
  className: string;
  id?: string;
  children: React.ReactNode;
}
