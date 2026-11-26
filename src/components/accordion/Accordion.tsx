import { RichText, Text } from '@sitecore-content-sdk/nextjs';
import { getDatasource, getFieldValue } from 'lib/component-props';
import { hasFieldText } from 'lib/field-utils';
import { cn, readCheckbox } from 'lib/utils';
import { FC } from 'react';
import { AccordionEntry, AccordionListItem, AccordionProps, AccordionVariant } from './Accordion.props';
import { AccordionList } from './AccordionList';

/** Accordion Item children have the fields (possibly empty); children of other templates get `null` for both */
const isAccordionItem = (item: AccordionListItem | null): item is AccordionListItem =>
  Boolean(item?.id) && (item?.title != null || item?.description != null);

/**
 * Title + Rich Text items in an accordion. The fields are rendered here (server) and the open state
 * lives in AccordionList (client). No background: the section colour comes from the parent container.
 * Text colours are fixed per variant (accordion.css): Default for dark sections, FAQ for light ones.
 */
const AccordionRendering: FC<AccordionProps & { variant: AccordionVariant }> = ({ fields, params, page, variant }) => {
  const { styles, RenderingIdentifier: id } = params;
  const isEditing = Boolean(page?.mode?.isEditing);
  // Checkbox rendering parameter: "1" when checked, missing or "" when not.
  // Params keys are the Sitecore field names as-is (PascalCase), not camelCased.
  const allowMultipleOpen = readCheckbox(params.AllowMultipleOpen, false);

  const datasource = getDatasource(fields);

  // Sitecore item order is kept. Live site: an item needs a title to have a header;
  // Pages keeps empty items so they stay editable.
  const entries: AccordionEntry[] = (datasource?.items?.results ?? [])
    .filter(isAccordionItem)
    .filter((item) => isEditing || hasFieldText(item.title))
    .map((item) => {
      const description = getFieldValue(item.description);
      return {
        id: item.id,
        title: <Text field={getFieldValue(item.title)} tag="span" />,
        description: isEditing || hasFieldText(description) ? <RichText field={description} className="accordion__description" /> : null,
        isOpenByDefault: readCheckbox(getFieldValue(item.isOpenByDefault)?.value, false),
      };
    });

  if (!entries.length && !isEditing) return null;

  return (
    <div id={typeof id === 'string' ? id : undefined} className={cn('component accordion-component', `accordion-component--${variant}`, styles)}>
      <div className="component-content">
        {entries.length ? (
          <AccordionList entries={entries} variant={variant} allowMultipleOpen={allowMultipleOpen} isEditing={isEditing} />
        ) : (
          <span className="is-empty-hint">
            {datasource?.items ? 'Accordion: insert Accordion Item children into the datasource' : 'Accordion: select or create a datasource'}
          </span>
        )}
      </div>
    </div>
  );
};

/** Benefits list: red check icon, title, chevron */
export const Default: FC<AccordionProps> = (props) => <AccordionRendering {...props} variant="default" />;

/** Numbered questions with plus/minus controls */
export const FAQ: FC<AccordionProps> = (props) => <AccordionRendering {...props} variant="faq" />;
