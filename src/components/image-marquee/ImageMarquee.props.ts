import { CompatibleDatasource, ComponentProps, GraphQLField, GraphQLImageField } from 'lib/component-props';
import { Field } from '@sitecore-content-sdk/nextjs';

export interface ImageMarqueeItem {
  id: string;
  image?: GraphQLImageField;
}

export interface ImageMarqueeDatasource {
  imageItems?: { results?: ImageMarqueeItem[] };
  height?: GraphQLField<Field<number | string>>;
  horizontalPadding?: GraphQLField<Field<number | string>>;
}

export interface ImageMarqueeProps extends ComponentProps {
  fields?: CompatibleDatasource<ImageMarqueeDatasource>;
}
