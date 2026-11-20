'use client';
import { FC, useId, useState } from 'react';
import { cn } from 'lib/utils';
import { ChevronDownIcon } from 'components/icons/ChevronDownIcon';
import { FooterNavigationProps } from './Footer.props';

/**
 * Footer navigation groups, one DOM for every viewport:
 * - desktop/tablet: CSS shows every group as a titled column (the toggle buttons are display: none);
 * - mobile: CSS turns the groups into an accordion driven by the toggle buttons.
 * A single `openId` keeps the accordion exclusive: at most one group is open, and all can be closed.
 * Closed panels are visibility: hidden on mobile, so their links leave the tab order.
 * Pages: every group stays open and the titles are plain editable fields (no button around them).
 */
export const FooterNavigation: FC<FooterNavigationProps> = ({ entries, isEditing = false }) => {
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => setOpenId((current) => (current === id ? null : id));

  return (
    <nav className="footer-nav" aria-label="Footer">
      {entries.map((entry) => {
        const isOpen = isEditing || openId === entry.id;
        const buttonId = `${baseId}-${entry.id}-toggle`;
        const panelId = `${baseId}-${entry.id}-panel`;

        return (
          <div key={entry.id} className={cn('footer-nav__group', isOpen && 'is-open')}>
            <h2 className="footer-nav__heading">
              {isEditing ? (
                <span className="footer-nav__title footer-nav__title--editing">
                  {entry.title}
                  {entry.titleLink}
                </span>
              ) : (
                <>
                  {/* Mobile accordion trigger */}
                  <button
                    id={buttonId}
                    type="button"
                    className="footer-nav__toggle"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(entry.id)}
                  >
                    <span>{entry.title}</span>
                    <ChevronDownIcon className="footer-nav__chevron" />
                  </button>
                  {/* Desktop/tablet column title: a link when the group's Title Link is set */}
                  <span className="footer-nav__title">{entry.titleLink ?? entry.title}</span>
                </>
              )}
            </h2>
            <div id={panelId} className="footer-nav__panel" data-state={isOpen ? 'open' : 'closed'}>
              <div className="footer-nav__panel-inner">{entry.links}</div>
            </div>
          </div>
        );
      })}
    </nav>
  );
};
