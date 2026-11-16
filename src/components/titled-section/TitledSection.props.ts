import { CompatibleDatasource, CompatibleField, ComponentProps } from 'lib/component-props';
import { TextField } from '@sitecore-content-sdk/nextjs';

export interface TitledSectionFields {
  Title?: CompatibleField<TextField>;
}

export interface TitledSectionProps extends ComponentProps {
  fields?: CompatibleDatasource<TitledSectionFields>;
  params: ComponentProps['params'] & {
    DynamicPlaceholderId: string;
  };
}
