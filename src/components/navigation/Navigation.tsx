import client from 'lib/sitecore-client';
import { NavigationFields, NavigationProps, NavigationSiteRootQueryResult, NavigationSubmenusQueryResult, SubmenuLinkItem } from './navigation.props';
import { NavigationMenu } from './NavigationMenu';

/** Link List folder (relative to the site root) whose Link Lists become submenus. */
const SUBMENU_FOLDER = '/Data/Navigation';

const SITE_ROOT_QUERY = /* GraphQL */ `
  query NavigationSiteRoot($site: String!) {
    site {
      siteInfo(site: $site) {
        rootPath
      }
    }
  }
`;

const SUBMENUS_QUERY = /* GraphQL */ `
  query NavigationSubmenus($path: String!, $language: String!) {
    item(path: $path, language: $language) {
      children {
        results {
          id
          ... on LinkList {
            children {
              results {
                id
                displayName
                ... on Link {
                  link {
                    jsonValue
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const normalizeId = (id?: string) => id?.replace(/[{}-]/g, '').toLowerCase() ?? '';

const toNavigationItem = (link: SubmenuLinkItem): NavigationFields => {
  const value = link.link?.jsonValue?.value;
  const anchor = value?.anchor ? `#${value.anchor}` : '';

  return {
    Id: link.id,
    Href: `${value?.href ?? ''}${anchor}`,
    Querystring: value?.querystring ?? '',
    Styles: ['submenu-link'],
    NavigationTitle: { value: value?.text || value?.title || link.displayName },
  };
};

/**
 * Loads the Link Lists under {site}/Data/Navigation, keyed by the page they belong to.
 * A Link List belongs to the page its (first internal) link points at.
 */
const getSubmenus = async (site: string, language: string): Promise<Map<string, NavigationFields[]>> => {
  const submenus = new Map<string, NavigationFields[]>();

  try {
    const root = await client.getData<NavigationSiteRootQueryResult>(SITE_ROOT_QUERY, { site });
    const rootPath = root.site?.siteInfo?.rootPath;
    if (!rootPath) return submenus;

    const data = await client.getData<NavigationSubmenusQueryResult>(SUBMENUS_QUERY, { path: `${rootPath}${SUBMENU_FOLDER}`, language });

    for (const list of data.item?.children?.results ?? []) {
      const links = list.children?.results ?? [];
      const targetId = links.map((link) => link.link?.jsonValue?.value?.id).find(Boolean);
      const ownerId = normalizeId(typeof targetId === 'string' ? targetId : undefined);
      if (ownerId && links.length) submenus.set(ownerId, links.map(toNavigationItem));
    }
  } catch (error) {
    console.error('Navigation: failed to load submenus', error);
  }

  return submenus;
};

/** Replaces the children of every navigation item that has a matching Link List. */
const attachSubmenus = (items: NavigationFields[], submenus: Map<string, NavigationFields[]>): NavigationFields[] =>
  items.map((item) => ({
    ...item,
    Children: submenus.get(normalizeId(item.Id)) ?? (item.Children ? attachSubmenus(item.Children, submenus) : undefined),
  }));

export const Default = async ({ params, fields, page }: NavigationProps) => {
  const items = Object.values(fields ?? {}).filter(Boolean);
  const site = page?.siteName;
  const submenus = items.length && site ? await getSubmenus(site, page.locale) : new Map<string, NavigationFields[]>();

  return <NavigationMenu params={params} fields={attachSubmenus(items, submenus)} />;
};
