import { CompatibleDatasource, ComponentProps, GraphQLField } from 'lib/component-props';
import { Field } from '@sitecore-content-sdk/nextjs';

export interface CompanyStatisticItem {
  id: string;
  prefix?: GraphQLField<Field<string>>;
  value?: GraphQLField<Field<string | number>>;
  suffix?: GraphQLField<Field<string>>;
  description?: GraphQLField<Field<string>>;
  // Checkbox: boolean from Edge, "1"/"" from some field serializers
  isCountUpEnabled?: GraphQLField<Field<boolean | string>>;
  isNegative?: GraphQLField<Field<boolean | string>>;
}

export interface CompanyStatisticsDatasource {
  children?: { results?: CompanyStatisticItem[] };
}

export interface CompanyStatisticsProps extends ComponentProps {
  fields?: CompatibleDatasource<CompanyStatisticsDatasource>;
}
