import { getDatasource, getFieldValue } from 'lib/component-props';
import { fieldText, hasFieldText, hasImageSrc, hasLinkHref } from 'lib/field-utils';
import { cn } from 'lib/utils';
import { CompatibleLink } from 'components/content-sdk/CompatibleLink';
import { Image as ContentSdkImage, RichText, Text } from '@sitecore-content-sdk/nextjs';
import { FC, ReactNode } from 'react';
import { ContentListItem, ContentListProps, InteractiveContentEntry } from './ContentList.props';
import { InteractiveContentSwitcher } from './InteractiveContentSwitcher';
import { ImageListItem } from './ImageListItem';

/** React key: falls back to the position if the ComponentQuery doesn't select `id` */
const itemKey = (item: ContentListItem, i: number) => item.id || `item-${i}`;

/** Description + CTA link; `block` is the BEM block of the variant */
const renderBody = (item: ContentListItem, isEditing: boolean, block: string) => {
  const link = getFieldValue(item.ctaLink);
  return (
    <>
      {(isEditing || hasFieldText(item.description)) && <RichText field={getFieldValue(item.description)} className={`${block}__description`} />}
      {/* No empty anchor on the live site; in Pages the empty field stays editable. If the query returns no
          ctaLink at all there is no field metadata to edit inline, so tell the editor instead of rendering nothing */}
      {isEditing ? (
        <div className={`${block}__cta`}>
          {link ? <CompatibleLink field={link} /> : <span className="is-empty-hint">CTA link: set it in the item fields</span>}
        </div>
      ) : (
        link &&
        hasLinkHref(link) && (
          <div className={`${block}__cta`}>
            <CompatibleLink field={link} />
          </div>
        )
      )}
    </>
  );
};

const renderImage = (item: ContentListItem, i: number, isEditing: boolean, loading: 'eager' | 'lazy') =>
  hasImageSrc(item.image) ? (
    <ContentSdkImage field={getFieldValue(item.image)} loading={loading} />
  ) : isEditing ? (
    <>
      <ContentSdkImage field={getFieldValue(item.image)} />
      <span className="is-empty-hint">Item {i + 1}: select an image</span>
    </>
  ) : null;

interface ContentListShellProps {
  props: ContentListProps;
  variantClass: string;
  /** Receives the items that are worth rendering; never called with an empty list */
  children: (items: ContentListItem[], isEditing: boolean) => ReactNode;
}

/** Wrapper, item filtering and Pages hints shared by every variant */
const ContentListShell: FC<ContentListShellProps> = ({ props: { fields, params, page }, variantClass, children }) => {
  const { styles, RenderingIdentifier: id } = params;
  const isEditing = Boolean(page?.mode?.isEditing);

  const datasource = getDatasource(fields);
  // Live site: an item needs at least a title or an image to be worth a card. Pages: keep every item editable.
  const items = (datasource?.items?.results ?? []).filter((item) => item && (isEditing || fieldText(item.title) || hasImageSrc(item.image)));

  if (!items.length && !isEditing) return null;

  return (
    <div
      id={typeof id === 'string' ? id : undefined}
      className={cn('component content-list-component', variantClass, isEditing && 'is-editing', styles)}
    >
      <div className="component-content">
        {items.length ? (
          children(items, isEditing)
        ) : (
          <span className="is-empty-hint">
            {datasource?.items ? 'Content List: add Content List Item children to the datasource' : 'Content List: select or create a datasource'}
          </span>
        )}
      </div>
    </div>
  );
};

/** Default variant: a static grid of cards (image, title, description, CTA), no interaction */
export const Default: FC<ContentListProps> = (props) => (
  <ContentListShell props={props} variantClass="content-list-component--default">
    {(items, isEditing) => (
      <div className="content-list" role="list">
        {items.map((item, i) => (
          <div key={itemKey(item, i)} role="listitem" className="content-list__card">
            {(isEditing || hasImageSrc(item.image)) && <div className="content-list__image">{renderImage(item, i, isEditing, 'lazy')}</div>}
            {/* Image-only items on the live site: no empty heading */}
            {(isEditing || fieldText(item.title)) && (
              <h4 className="content-list__title">
                <Text field={getFieldValue(item.title)} />
              </h4>
            )}
            {renderBody(item, isEditing, 'content-list')}
          </div>
        ))}
      </div>
    )}
  </ContentListShell>
);

/** Image List variant: one card per row, image left (desktop/tablet) or on top (narrow); same datasource */
export const ImageList: FC<ContentListProps> = (props) => (
  <ContentListShell props={props} variantClass="content-list-component--image-list">
    {(items, isEditing) => (
      <div className="image-content-list" role="list">
        {items.map((item, i) => (
          <ImageListItem key={itemKey(item, i)} item={item} index={i} isEditing={isEditing} />
        ))}
      </div>
    )}
  </ContentListShell>
);

/** Interactive variant: cards switch the image (desktop) or slide one by one (tablet/mobile) */
export const Interactive: FC<ContentListProps> = (props) => (
  <ContentListShell props={props} variantClass="content-list-component--interactive">
    {(items, isEditing) => {
      const entries: InteractiveContentEntry[] = items.map((item, i) => ({
        id: itemKey(item, i),
        label: fieldText(item.title) || `Item ${i + 1}`,
        title: <Text field={getFieldValue(item.title)} />,
        body: renderBody(item, isEditing, 'interactive-content-list'),
        // The first image is visible on load; the others sit in the same (on-screen) box, so lazy still loads them early
        image: renderImage(item, i, isEditing, i === 0 ? 'eager' : 'lazy'),
      }));
      return <InteractiveContentSwitcher entries={entries} isEditing={isEditing} />;
    }}
  </ContentListShell>
);
