import { CompatibleField, ComponentProps } from 'lib/component-props';
import { LinkField, TextField } from '@sitecore-content-sdk/nextjs';

/** A single navigation item as returned by the Navigation rendering contents resolver. */
export interface NavigationFields {
  Id: string;
  Href: string;
  Querystring: string;
  Styles: string[];
  NavigationTitle?: CompatibleField<TextField>;
  Title?: CompatibleField<TextField>;
  DisplayName?: string;
  Children?: NavigationFields[];
}

export interface NavigationListItemProps {
  fields?: NavigationFields;
  handleClick: (event?: React.MouseEvent<HTMLElement>) => void;
  relativeLevel: number;
}

export interface NavigationProps extends ComponentProps {
  /** Root items; may arrive as an array or as an index-keyed object ({ "0": {...} }). */
  fields?: NavigationFields[] | Record<string, NavigationFields>;
}

export interface NavigationMenuProps {
  params: NavigationProps['params'];
  fields: NavigationFields[];
}

export type NavigationLinkField = LinkField;

/** A Link item inside a submenu Link List (`{site}/Data/Navigation/<Link List>/<Link>`). */
export interface SubmenuLinkItem {
  id: string;
  displayName: string;
  link?: { jsonValue?: LinkField };
}

/** Result of the `NavigationSiteRoot` query. */
export interface NavigationSiteRootQueryResult {
  site?: { siteInfo?: { rootPath?: string } };
}

/** Result of the `NavigationSubmenus` query; non-Link List items come back without `children`. */
export interface NavigationSubmenusQueryResult {
  item?: {
    children?: {
      results?: Array<{
        id: string;
        children?: { results?: SubmenuLinkItem[] };
      }>;
    };
  };
}
