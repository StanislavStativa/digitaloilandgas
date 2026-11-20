import { GraphQLImageField, getDatasource, getFieldValue } from 'lib/component-props';
import { cn, normalizeId } from 'lib/utils';
import { CompatibleLink } from 'components/content-sdk/CompatibleLink';
import { Image as ContentSdkImage, LinkField, Text } from '@sitecore-content-sdk/nextjs';
import { FC } from 'react';
import {
  FOOTER_TEMPLATE_IDS,
  FooterNavigationEntry,
  FooterNavigationLinksProps,
  FooterProps,
  FooterSection,
  FooterSocialLinkProps,
} from './Footer.props';
import { FooterNavigation } from './FooterNavigation';

const textOf = (field: { jsonValue?: { value?: unknown } } | null | undefined) => String(getFieldValue(field)?.value ?? '').trim();
const hrefOf = (link: LinkField | undefined) => String(link?.value?.href ?? '').trim();
const hasImage = (field: GraphQLImageField | null | undefined) => Boolean(getFieldValue(field)?.value?.src);

const isTemplate = (section: FooterSection, templateId: string) => normalizeId(section.template?.id) === normalizeId(templateId);

/** New-tab links get rel="noopener noreferrer" (CompatibleLink's Next.js branch doesn't add it) */
const relFor = (link: LinkField | undefined) => (link?.value?.target === '_blank' ? 'noopener noreferrer' : undefined);

const NavigationLinks: FC<FooterNavigationLinksProps> = ({ links, isEditing }) => {
  // Live site: skip links without a destination. Pages: keep every item editable.
  const visible = links.filter((item) => isEditing || hrefOf(getFieldValue(item.link)));
  if (!visible.length) {
    return isEditing ? <span className="is-empty-hint">Add Footer Navigation Link items to this group</span> : null;
  }

  return (
    <ul className="footer-nav__links">
      {visible.map((item) => {
        const link = getFieldValue(item.link);
        return (
          <li key={item.id} className="footer-nav__item">
            {link && <CompatibleLink field={link} className="footer-nav__link" rel={relFor(link)} />}
          </li>
        );
      })}
    </ul>
  );
};

/**
 * Group title link (desktop/tablet only; the mobile accordion trigger stays a button).
 * Live site: the title text wrapped in the link, or nothing when the link has no destination.
 * Pages: a fixed placeholder so the Title Link field stays editable next to the title.
 */
const hasTitleLink = (group: FooterSection, isEditing: boolean) => {
  const link = getFieldValue(group.titleLink);
  return Boolean(link) && (isEditing || Boolean(hrefOf(link)));
};

const GroupTitleLink: FC<{ group: FooterSection; isEditing: boolean }> = ({ group, isEditing }) => {
  const link = getFieldValue(group.titleLink);
  if (!link) return null;

  if (isEditing) {
    return (
      <CompatibleLink field={link} className="footer-nav__title-link-edit">
        [Title link]
      </CompatibleLink>
    );
  }

  return (
    <CompatibleLink field={link} className="footer-nav__title-link" rel={relFor(link)}>
      {textOf(group.title)}
    </CompatibleLink>
  );
};

const SocialLink: FC<FooterSocialLinkProps> = ({ item, isEditing }) => {
  const link = getFieldValue(item.link);
  const label = textOf(item.accessibleLabel) || String(link?.value?.text ?? '').trim() || undefined;
  // The link carries the accessible name, so the icon itself is decorative.
  // width/height come from the media item, so the browser reserves the icon's real aspect ratio.
  const icon =
    isEditing || hasImage(item.icon) ? (
      <ContentSdkImage field={getFieldValue(item.icon)} alt="" className="footer-social__icon" />
    ) : null;

  if (isEditing) {
    // Every field editable on its own: icon, link, label
    return (
      <li className="footer-social__item footer-social__item--editing">
        {icon}
        {/* Fixed placeholder instead of the URL; the field stays editable through the link chrome */}
        {link && (
          <CompatibleLink field={link} className="footer-social__link-text">
            [Link]
          </CompatibleLink>
        )}
        <Text field={getFieldValue(item.accessibleLabel)} tag="span" className="footer-social__label" />
      </li>
    );
  }

  if (!link) return null;

  return (
    <li className="footer-social__item">
      <CompatibleLink field={link} className="footer-social__link" aria-label={label} title={label} rel={relFor(link)}>
        {icon}
      </CompatibleLink>
    </li>
  );
};

export const Default: FC<FooterProps> = ({ fields, params, page }) => {
  const { styles, RenderingIdentifier: id } = params;
  const isEditing = Boolean(page?.mode?.isEditing);
  const resolved = getDatasource(fields);
  // No datasource: Integrated GraphQL sends { data: { datasource: null } }, which getDatasource hands back as is
  const datasource = resolved && ['logo', 'copyright', 'socialHeading', 'sections'].some((key) => key in resolved) ? resolved : undefined;

  if (!datasource && !isEditing) return null;

  const sections = (datasource?.sections?.results ?? []).filter(Boolean);
  const groups = sections.filter(
    (section) => isTemplate(section, FOOTER_TEMPLATE_IDS.navigationGroup) && (isEditing || Boolean(textOf(section.title))),
  );
  const socialLinks = sections
    .filter((section) => isTemplate(section, FOOTER_TEMPLATE_IDS.socialLinks))
    .flatMap((folder) => folder.items?.results ?? [])
    .filter((item) => item && (isEditing || (hrefOf(getFieldValue(item.link)) && hasImage(item.icon))));

  const entries: FooterNavigationEntry[] = groups.map((group) => ({
    id: group.id,
    title: <Text field={getFieldValue(group.title)} tag="span" />,
    titleLink: hasTitleLink(group, isEditing) ? <GroupTitleLink group={group} isEditing={isEditing} /> : undefined,
    links: <NavigationLinks links={group.items?.results ?? []} isEditing={isEditing} />,
  }));

  const showLogo = isEditing || hasImage(datasource?.logo);
  const showSocial = isEditing || socialLinks.length > 0;
  const showCopyright = isEditing || Boolean(textOf(datasource?.copyright));

  return (
    <div id={typeof id === 'string' ? id : undefined} className={cn('component footer-component', isEditing && 'is-editing', styles)}>
      <div className="component-content footer">
        {!datasource ? (
          <span className="is-empty-hint">Footer: select or create a datasource</span>
        ) : (
          <>
            <div className="footer__main">
              {showLogo && (
                <div className="footer__logo">
                  <ContentSdkImage field={getFieldValue(datasource.logo)} className="footer__logo-image" />
                </div>
              )}

              {entries.length > 0 ? (
                <FooterNavigation entries={entries} isEditing={isEditing} />
              ) : (
                isEditing && <span className="is-empty-hint footer__nav-hint">Add Footer Navigation Group items to the datasource</span>
              )}

              {showSocial && (
                <div className="footer-social">
                  {(isEditing || textOf(datasource.socialHeading)) && (
                    <Text field={getFieldValue(datasource.socialHeading)} tag="h2" className="footer-social__heading" />
                  )}
                  {socialLinks.length > 0 ? (
                    <ul className="footer-social__list">
                      {socialLinks.map((item) => (
                        <SocialLink key={item.id} item={item} isEditing={isEditing} />
                      ))}
                    </ul>
                  ) : (
                    <span className="is-empty-hint">Add Footer Social Link items under Footer Social Links</span>
                  )}
                </div>
              )}
            </div>

            {showCopyright && <Text field={getFieldValue(datasource.copyright)} tag="p" className="footer__copyright" />}
          </>
        )}
      </div>
    </div>
  );
};
