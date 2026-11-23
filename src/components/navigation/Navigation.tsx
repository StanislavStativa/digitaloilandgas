import client from 'lib/sitecore-client';
import { normalizeId } from 'lib/utils';
import {
  NavigationFields,
  NavigationProps,
  NavigationSiteRootQueryResult,
  NavigationSubmenusQueryResult,
  Submenu,
  SubmenuLinkItem,
} from './navigation.props';
import { NavigationMenu } from './NavigationMenu';
import { normalizePath } from './navigation.utils';

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

const getLinkValue = (link: SubmenuLinkItem) => link.link?.jsonValue?.value;

const toNavigationItem = (link: SubmenuLinkItem): NavigationFields => {
  const value = getLinkValue(link);
  const anchor = value?.anchor ? `#${value.anchor}` : '';

  return {
    Id: link.id,
    Href: `${value?.href ?? ''}${anchor}`,
    Querystring: value?.querystring ?? '',
    Target: value?.target || undefined,
    Styles: ['submenu-link'],
    NavigationTitle: { value: value?.text || value?.title || link.displayName },
  };
};

/** Builds a submenu from a Link List's links; only internal links (those with a page id) identify its owner. */
const toSubmenu = (links: SubmenuLinkItem[]): Submenu => {
  const targetIds = new Set<string>();
  const targetPaths: string[] = [];

  for (const link of links) {
    const value = getLinkValue(link);
    if (typeof value?.id !== 'string' || !value.id) continue;

    targetIds.add(normalizeId(value.id));
    const path = normalizePath(value.href);
    if (path) targetPaths.push(path);
  }

  return { targetIds, targetPaths, items: links.map(toNavigationItem) };
};

/** Loads the Link Lists under {site}/Data/Navigation. */
const getSubmenus = async (site: string, language: string): Promise<Submenu[]> => {
  try {
    const root = await client.getData<NavigationSiteRootQueryResult>(SITE_ROOT_QUERY, { site });
    const rootPath = root.site?.siteInfo?.rootPath;
    if (!rootPath) return [];

    const data = await client.getData<NavigationSubmenusQueryResult>(SUBMENUS_QUERY, { path: `${rootPath}${SUBMENU_FOLDER}`, language });

    return (data.item?.children?.results ?? [])
      .map((list) => list.children?.results ?? [])
      .filter((links) => links.length > 0)
      .map(toSubmenu);
  } catch (error) {
    console.error('Navigation: failed to load submenus', error);
    return [];
  }
};

/**
 * A Link List belongs to a navigation item when one of its internal links points at that item's page
 * or at a page below it (e.g. /Insights/Blog belongs to /Insights). The home page only matches by id,
 * since every page is below it.
 */
const ownsSubmenu = (item: NavigationFields, submenu: Submenu): boolean => {
  if (submenu.targetIds.has(normalizeId(item.Id))) return true;

  const path = normalizePath(item.Href);
  if (!path || path === '/') return false;

  return submenu.targetPaths.some((target) => target.startsWith(`${path}/`));
};

/**
 * Replaces the children of navigation items that own a Link List. Levels are matched top-down,
 * so a list is claimed by the highest item it belongs to and never attached twice.
 */
const attachSubmenus = (items: NavigationFields[], submenus: Submenu[]): NavigationFields[] => {
  const remaining = [...submenus];
  const owned = items.map((item) => {
    const index = remaining.findIndex((submenu) => ownsSubmenu(item, submenu));
    return index === -1 ? undefined : remaining.splice(index, 1)[0];
  });

  return items.map((item, i) => ({
    ...item,
    Children: owned[i]?.items ?? (item.Children ? attachSubmenus(item.Children, remaining) : undefined),
  }));
};

export const Default = async ({ params, fields, page }: NavigationProps) => {
  const items = Object.values(fields ?? {}).filter(Boolean);
  const site = page?.siteName;
  const submenus = items.length && site ? await getSubmenus(site, page.locale) : [];

  return <NavigationMenu params={params} fields={attachSubmenus(items, submenus)} />;
};
