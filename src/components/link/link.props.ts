import { CompatibleField, ComponentProps } from 'lib/component-props';
import { LinkField } from '@sitecore-content-sdk/nextjs';

export interface LinkFields {
  Href?: CompatibleField<LinkField>;
}

export interface LinkProps extends ComponentProps {
  fields?: LinkFields;
}
