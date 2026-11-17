import { getDatasource, getFieldValue } from 'lib/component-props';
import { cn } from 'lib/utils';
import { CompatibleLink } from 'components/content-sdk/CompatibleLink';
import { Image as ContentSdkImage, RichText, Text } from '@sitecore-content-sdk/nextjs';
import { FC } from 'react';
import { InteractiveContentEntry, InteractiveContentItem, InteractiveContentListProps } from './InteractiveContentList.props';
import { InteractiveContentSwitcher } from './InteractiveContentSwitcher';

const hasImage = (item: InteractiveContentItem) => Boolean(getFieldValue(item.image)?.value?.src);
const hasLink = (item: InteractiveContentItem) => Boolean(getFieldValue(item.ctaLink)?.value?.href);
const hasDescription = (item: InteractiveContentItem) => Boolean(getFieldValue(item.description)?.value);
const titleText = (item: InteractiveContentItem) => String(getFieldValue(item.title)?.value ?? '').trim();

export const Default: FC<InteractiveContentListProps> = ({ fields, params, page }) => {
  const { styles, RenderingIdentifier: id } = params;
  const isEditing = Boolean(page?.mode?.isEditing);

  const datasource = getDatasource(fields);
  // Live site: an item needs at least a title or an image to be worth a card. Pages: keep every item editable.
  const items = (datasource?.items?.results ?? []).filter((item) => item && (isEditing || titleText(item) || hasImage(item)));

  if (!items.length && !isEditing) return null;

  const entries: InteractiveContentEntry[] = items.map((item, i) => {
    const link = getFieldValue(item.ctaLink);
    return {
      id: item.id,
      label: titleText(item) || `Item ${i + 1}`,
      title: <Text field={getFieldValue(item.title)} />,
      body: (
        <>
          {(isEditing || hasDescription(item)) && (
            <RichText field={getFieldValue(item.description)} className="interactive-content-list__description" />
          )}
          {/* No empty anchor on the live site; in Pages the empty field stays editable */}
          {link && (isEditing || hasLink(item)) && (
            <div className="interactive-content-list__cta">
              <CompatibleLink field={link} />
            </div>
          )}
        </>
      ),
      image: hasImage(item) ? (
        // The first image is visible on load; the others sit in the same (on-screen) box, so lazy still loads them early
        <ContentSdkImage field={getFieldValue(item.image)} loading={i === 0 ? 'eager' : 'lazy'} />
      ) : isEditing ? (
        <>
          <ContentSdkImage field={getFieldValue(item.image)} />
          <span className="is-empty-hint">Item {i + 1}: select an image</span>
        </>
      ) : null,
    };
  });

  return (
    <div
      id={typeof id === 'string' ? id : undefined}
      className={cn('component interactive-content-list-component', isEditing && 'is-editing', styles)}
    >
      <div className="component-content">
        {entries.length ? (
          <InteractiveContentSwitcher entries={entries} isEditing={isEditing} />
        ) : (
          <span className="is-empty-hint">
            {datasource?.items
              ? 'Interactive Content List: add Interactive Content Item children to the datasource'
              : 'Interactive Content List: select or create a datasource'}
          </span>
        )}
      </div>
    </div>
  );
};
