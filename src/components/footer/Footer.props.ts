import { CompatibleDatasource, ComponentProps, GraphQLImageField, GraphQLLinkField, GraphQLTextField } from 'lib/component-props';
import { ReactNode } from 'react';

/**
 * Datasource templates (/sitecore/templates/Project/digitaloilandgas/Components/Footer).
 * Footer children are told apart by template: navigation groups vs the social links folder.
 */
export const FOOTER_TEMPLATE_IDS = {
  navigationGroup: 'E33BD81D147C4403B732C35EE90F15B5',
  socialLinks: 'DA3C22D24CE94B1198EFBFCDE1AD6F84',
} as const;

/**
 * Grandchild of the Footer datasource:
 * - "Footer Navigation Link" (under a group): `link`;
 * - "Footer Social Link" (under Social Links): `icon`, `link`, `accessibleLabel`.
 * The query asks for every field on every item; fields missing from the template come back null.
 */
export interface FooterSectionItem {
  id: string;
  link?: GraphQLLinkField | null;
  icon?: GraphQLImageField | null;
  accessibleLabel?: GraphQLTextField | null;
}

/** Child of the Footer datasource: a "Footer Navigation Group" or the "Footer Social Links" folder */
export interface FooterSection {
  id: string;
  template?: { id?: string } | null;
  /** Group title; null on the social links folder */
  title?: GraphQLTextField | null;
  /** Optional group title link (desktop/tablet column title); null on the social links folder */
  titleLink?: GraphQLLinkField | null;
  items?: { results?: FooterSectionItem[] };
}

/**
 * Shape returned by the Footer rendering's ComponentQuery (Integrated GraphQL).
 * One `children` level with nested `children` keeps the query within Experience Edge depth/complexity limits;
 * item order inside each collection is Sitecore's.
 */
export interface FooterDatasource {
  logo?: GraphQLImageField | null;
  copyright?: GraphQLTextField | null;
  socialHeading?: GraphQLTextField | null;
  sections?: { results?: FooterSection[] };
}

export interface FooterProps extends ComponentProps {
  fields?: CompatibleDatasource<FooterDatasource>;
}

/** Link list of one navigation group */
export interface FooterNavigationLinksProps {
  links: FooterSectionItem[];
  isEditing: boolean;
}

/** One social icon link */
export interface FooterSocialLinkProps {
  item: FooterSectionItem;
  isEditing: boolean;
}

/** One navigation group rendered on the server and handed to the client accordion */
export interface FooterNavigationEntry {
  id: string;
  /** Title field (editable in Pages) */
  title: ReactNode;
  /**
   * Title Link field. Live site: the desktop/tablet column title wrapped in the link (absent when the link is empty).
   * Pages: the editable link chrome shown next to the title.
   */
  titleLink?: ReactNode;
  /** The group's link list */
  links: ReactNode;
}

export interface FooterNavigationProps {
  entries: FooterNavigationEntry[];
  isEditing?: boolean;
}
