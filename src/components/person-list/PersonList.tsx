import { getDatasource, getFieldValue } from 'lib/component-props';
import { hasFieldText, hasImageSrc } from 'lib/field-utils';
import { cn } from 'lib/utils';
import { FC } from 'react';
import { PersonListItem, PersonListProps } from './PersonList.props';
import { PersonCard } from './PersonCard';

const PERSON_FIELDS = ['photo', 'name', 'position', 'description', 'linkedIn'] as const;

/** Person Item children have the fields (possibly empty); children of other templates get `null` for all of them */
const isPersonItem = (item: PersonListItem | null): item is PersonListItem => Boolean(item?.id) && PERSON_FIELDS.some((key) => item?.[key] != null);

/** Live site: a card needs at least a name or a photo */
const hasContent = (item: PersonListItem) => hasFieldText(item.name) || hasImageSrc(item.photo);

/**
 * Team members as a responsive card grid: two columns when the component is wide enough, one otherwise
 * (container query, so a narrow column splitter gets one column on a wide screen too).
 * The wrapper and the grid are transparent; only the cards have a background.
 */
export const Default: FC<PersonListProps> = ({ fields, params, page }) => {
  const { styles, RenderingIdentifier: id } = params;
  const isEditing = Boolean(page?.mode?.isEditing);
  const datasource = getDatasource(fields);

  // Sitecore item order is kept. Pages keeps empty items so they stay editable.
  const people = (datasource?.items?.results ?? []).filter(isPersonItem).filter((item) => isEditing || hasContent(item));

  if (!people.length && !isEditing) return null;

  return (
    <div id={typeof id === 'string' ? id : undefined} className={cn('component person-list-component', styles)}>
      <div className="component-content">
        {people.length ? (
          <ul className="person-list">
            {people.map((item) => (
              <PersonCard
                key={item.id}
                as="li"
                photo={getFieldValue(item.photo)}
                name={getFieldValue(item.name)}
                position={getFieldValue(item.position)}
                description={getFieldValue(item.description)}
                linkedIn={getFieldValue(item.linkedIn)}
                isEditing={isEditing}
              />
            ))}
          </ul>
        ) : (
          <span className="is-empty-hint">
            {datasource?.items ? 'Person List: insert Person Item children into the datasource' : 'Person List: select or create a datasource'}
          </span>
        )}
      </div>
    </div>
  );
};
