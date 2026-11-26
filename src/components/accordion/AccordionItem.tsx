import { CheckCircleIcon } from 'components/icons/CheckCircleIcon';
import { ChevronDownIcon } from 'components/icons/ChevronDownIcon';
import { cn } from 'lib/utils';
import { FC } from 'react';
import { AccordionItemProps } from './Accordion.props';

/**
 * One accordion item: a heading with a toggle button, and the description panel below it.
 * Stateless; AccordionList owns the open state. The variant only changes the decoration:
 * - default: [red check] Title ............ [chevron down/up]
 * - faq:     1. Title ..................... [outlined + / filled −]
 * The header is a plain heading (no button, no toggle icon) in Pages, so the title stays editable inline,
 * and on the live site when the item has no description (nothing to expand).
 * Closed panels are visibility: hidden (CSS), so links inside them leave the tab order.
 */
export const AccordionItem: FC<AccordionItemProps> = ({
  title,
  description,
  number,
  variant,
  isOpen,
  isEditing = false,
  buttonId,
  panelId,
  onToggle,
}) => {
  const isInteractive = !isEditing && description != null;
  const isExpanded = isEditing || (isInteractive && isOpen);

  const label = (
    <>
      {variant === 'default' && <CheckCircleIcon className="accordion__check" />}
      <span className="accordion__title">
        {/* Generated from the item order, so it never has to be typed into the title */}
        {variant === 'faq' && <span className="accordion__number">{number}. </span>}
        {title}
      </span>
    </>
  );

  return (
    <div className={cn('accordion__item', isExpanded && 'is-open')}>
      <h3 className="accordion__heading">
        {isInteractive ? (
          <button id={buttonId} type="button" className="accordion__trigger" aria-expanded={isOpen} aria-controls={panelId} onClick={onToggle}>
            {label}
            {variant === 'faq' ? <span className="accordion__plus-minus" aria-hidden="true" /> : <ChevronDownIcon className="accordion__chevron" />}
          </button>
        ) : (
          <span className="accordion__trigger">{label}</span>
        )}
      </h3>
      {description != null && (
        <div
          id={panelId}
          className="accordion__panel"
          data-state={isExpanded ? 'open' : 'closed'}
          {...(isInteractive && { role: 'region', 'aria-labelledby': buttonId })}
        >
          <div className="accordion__panel-inner">{description}</div>
        </div>
      )}
    </div>
  );
};
