import { getDatasource, getFieldValue } from 'lib/component-props';
import { Text as ContentSdkText } from '@sitecore-content-sdk/nextjs';
import { FC } from 'react';
import { CompanyStatisticItem, CompanyStatisticsProps } from './CompanyStatistics.props';
import { CountUp } from './CountUp';

const isChecked = (value: unknown) => value === true || value === '1' || value === 'true';

/** "4.40" → { end: 4.4, decimals: 2 }; "2,200" → { end: 2200, decimals: 0 }; non-numeric → undefined */
const parseNumber = (value: unknown) => {
  const raw = String(value ?? '')
    .trim()
    .replace(/,/g, '');
  if (!/^\d+(\.\d+)?$/.test(raw)) return undefined;

  return { end: Number(raw), decimals: raw.split('.')[1]?.length ?? 0 };
};

const StatisticValue: FC<{ item: CompanyStatisticItem; isEditing?: boolean }> = ({ item, isEditing }) => {
  const valueField = getFieldValue(item.value);
  const parsed = parseNumber(valueField?.value);
  const countUp = !isEditing && parsed && isChecked(getFieldValue(item.isCountUpEnabled?.jsonValue)?.value);

  // Editing mode or non-animated: render the field as is (editable in Pages)
  if (!countUp) return <ContentSdkText field={valueField} tag="span" />;

  return <CountUp end={parsed.end} decimals={parsed.decimals} />;
};

export const Default: FC<CompanyStatisticsProps> = ({ fields, params, page }) => {
  const { styles, RenderingIdentifier: id } = params;
  const isEditing = page?.mode?.isEditing;

  const datasource = getDatasource(fields);
  const statistics = datasource?.children?.results || [];

  return (
    <div
      id={typeof id === 'string' ? id : undefined}
      className={`component ${isEditing ? 'is-editing' : ''} ${styles ?? ''}`.replace(/\s+/g, ' ').trim()}
    >
      <div className="component-content company-statistics">
        <ul className="company-statistics__list">
          {statistics.map((item) => (
            <li key={item.id} className="company-statistics__item">
              <p
                className={`company-statistics__value ${
                  isChecked(getFieldValue(item.isNegative?.jsonValue)?.value) ? 'company-statistics__value--negative' : ''
                }`.trim()}
              >
                <ContentSdkText field={getFieldValue(item.prefix)} tag="span" />
                <StatisticValue item={item} isEditing={isEditing} />
                <ContentSdkText field={getFieldValue(item.suffix)} tag="span" />
              </p>
              <ContentSdkText field={getFieldValue(item.description)} tag="p" className="company-statistics__description" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
