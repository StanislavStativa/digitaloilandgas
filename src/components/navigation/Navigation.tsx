'use client';
import React, { useEffect, useState, JSX } from 'react';
import { usePathname } from 'next/navigation';
import { LinkField, Text, useSitecore, FieldMetadata } from '@sitecore-content-sdk/nextjs';
import { CompatibleLink } from 'components/content-sdk/CompatibleLink';
import { getFieldValue } from 'lib/component-props';
import { NavigationFields as Fields, NavigationListItemProps, NavigationProps } from './navigation.props';

const MOBILE_QUERY = '(max-width: 992px)';
const CTA_MATCHER = /contact/i;

const getTextContent = (fields?: Fields): JSX.Element | string => {
  if (!fields) {
    return '';
  }

  const navigationTitle = getFieldValue(fields.NavigationTitle);
  const title = getFieldValue(fields.Title);

  if (navigationTitle) return <Text field={navigationTitle} />;
  if (title) return <Text field={title} />;
  return fields.DisplayName;
};

const getTitleString = (fields?: Fields): string =>
  getFieldValue(fields?.NavigationTitle)?.value?.toString() ?? getFieldValue(fields?.Title)?.value?.toString() ?? fields?.DisplayName ?? '';

const getLinkField = (fields?: Fields): LinkField & FieldMetadata => ({
  value: {
    href: fields?.Href ?? '',
    title: getTitleString(fields),
    querystring: fields?.Querystring ?? '',
  },
  metadata: getFieldValue(fields?.NavigationTitle)?.metadata ?? getFieldValue(fields?.Title)?.metadata,
});

const normalizePath = (path?: string | null): string => {
  if (!path) return '';
  const clean = path.split(/[?#]/)[0].toLowerCase().replace(/\/+$/, '');
  return clean || '/';
};

/** An item is "current" when it is the current page, or (for non-home items) an ancestor of it. */
const isCurrentItem = (fields: Fields, pathname: string): boolean => {
  const href = normalizePath(fields.Href);
  const current = normalizePath(pathname);
  if (!href || !current) return false;
  if (href === current) return true;
  if (href !== '/' && current.startsWith(`${href}/`)) return true;
  return fields.Children?.some((child) => isCurrentItem(child, pathname)) ?? false;
};

const isCtaItem = (fields: Fields): boolean =>
  !fields.Children?.length && (CTA_MATCHER.test(fields.Href ?? '') || CTA_MATCHER.test(getTitleString(fields)));

const ChevronIcon = () => (
  <svg className="navigation-chevron" width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NavigationListItem: React.FC<NavigationListItemProps> = ({ fields, handleClick, relativeLevel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { page } = useSitecore();
  const pathname = usePathname();

  if (!fields) {
    return null;
  }

  const hasChildren = fields.Children?.length > 0;
  const isCurrent = isCurrentItem(fields, pathname ?? '');
  const isCta = relativeLevel === 1 && isCtaItem(fields);

  const classNames = [
    ...(fields.Styles ?? []),
    'navigation-item',
    `rel-level${relativeLevel}`,
    hasChildren ? 'has-children' : '',
    isOpen ? 'open' : '',
    isCurrent ? 'current' : '',
    isCta ? 'btn-primary' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const toggle = () => setIsOpen((prev) => !prev);

  const onLinkClick = (event: React.MouseEvent<HTMLElement>) => {
    // On mobile, a parent item expands/collapses its submenu instead of navigating.
    if (hasChildren && typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches) {
      event.preventDefault();
      toggle();
      return;
    }
    handleClick(event);
  };

  return (
    <li className={classNames} key={fields.Id}>
      <div className="navigation-title">
        <CompatibleLink
          field={getLinkField(fields)}
          editable={page.mode.isEditing}
          onClick={onLinkClick}
          aria-current={isCurrent && !hasChildren ? 'page' : undefined}
        >
          {getTextContent(fields)}
        </CompatibleLink>
        {hasChildren && (
          <button
            type="button"
            className="navigation-toggle"
            aria-expanded={isOpen}
            aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${getTitleString(fields)}`}
            onClick={toggle}
          >
            <ChevronIcon />
          </button>
        )}
      </div>
      {hasChildren && (
        <ul className="navigation-submenu">
          {fields.Children.map((child, index) => (
            <NavigationListItem key={`${index}-${child.Id}`} fields={child} handleClick={handleClick} relativeLevel={relativeLevel + 1} />
          ))}
        </ul>
      )}
    </li>
  );
};

export const Default = ({ params, fields }: NavigationProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { page } = useSitecore();
  const pathname = usePathname();
  const { styles, RenderingIdentifier: id } = params;

  // Close the mobile menu on route change.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Lock page scroll while the mobile menu is open.
  useEffect(() => {
    document.body.classList.toggle('navigation-open', isMenuOpen);
    return () => document.body.classList.remove('navigation-open');
  }, [isMenuOpen]);

  if (!fields || !Object.values(fields).length) {
    return (
      <div className={`component navigation ${styles}`} id={id}>
        <div className="component-content">[Navigation]</div>
      </div>
    );
  }

  const handleToggleMenu = (event?: React.MouseEvent<HTMLElement>, forceState?: boolean) => {
    if (event && page.mode.isEditing) {
      event.preventDefault();
    }

    setIsMenuOpen(forceState ?? !isMenuOpen);
  };

  const navigationItems = Object.values(fields)
    .filter(Boolean)
    .map((item: Fields, index) => (
      <NavigationListItem key={`${index}-${item.Id}`} fields={item} handleClick={(event) => handleToggleMenu(event, false)} relativeLevel={1} />
    ));

  return (
    <div className={`component navigation ${styles} ${isMenuOpen ? 'menu-open' : ''}`} id={id}>
      <button
        type="button"
        className="navigation-hamburger"
        aria-expanded={isMenuOpen}
        aria-controls={`${id ?? 'navigation'}-menu`}
        aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={() => handleToggleMenu()}
      >
        <span />
        <span />
      </button>
      <div className="component-content" id={`${id ?? 'navigation'}-menu`}>
        <nav>
          <ul className="navigation-list">{navigationItems}</ul>
        </nav>
      </div>
    </div>
  );
};
