'use client';
import { cn } from 'lib/utils';
import { FC, useId, useState } from 'react';
import { AccordionEntry, AccordionListProps } from './Accordion.props';
import { AccordionItem } from './AccordionItem';

/**
 * Open item ids that still exist in the datasource, oldest first.
 * Single-open mode shows only the most recently opened one, so switching AllowMultipleOpen off
 * in Pages collapses the list to one open item without an effect or a reload.
 */
const visibleOpenIds = (openIds: string[], entryIds: string[], allowMultipleOpen: boolean) => {
  const existing = openIds.filter((id) => entryIds.includes(id));
  return allowMultipleOpen ? existing : existing.slice(-1);
};

/**
 * Items checked "Open by default" that have something to expand. Single-open mode takes only the first
 * of them, in item order, so the page never loads with more open than the mode allows.
 */
const initialOpenIds = (entries: AccordionEntry[], allowMultipleOpen: boolean) => {
  const ids = entries.filter((entry) => entry.isOpenByDefault && entry.description != null).map((entry) => entry.id);
  return allowMultipleOpen ? ids : ids.slice(0, 1);
};

/**
 * Accordion state shared by both variants: items checked "Open by default" start expanded, the rest
 * collapsed; with `allowMultipleOpen` every item toggles independently, otherwise opening an item
 * closes the open one. The initial state is the same on the server and the client, so the open items
 * are already open in the server HTML (no flash, no animation on load).
 * State is keyed by Sitecore item id, so reordering, adding or removing items keeps the right ones open.
 */
export const AccordionList: FC<AccordionListProps> = ({ entries, variant, allowMultipleOpen, isEditing = false }) => {
  const baseId = useId();
  const [openIds, setOpenIds] = useState<string[]>(() => initialOpenIds(entries, allowMultipleOpen));

  const entryIds = entries.map((entry) => entry.id);
  const open = visibleOpenIds(openIds, entryIds, allowMultipleOpen);

  // Functional update: rapid clicks always build on the latest state
  const toggle = (id: string) =>
    setOpenIds((current) => {
      const visible = visibleOpenIds(current, entryIds, allowMultipleOpen);
      if (visible.includes(id)) return visible.filter((openId) => openId !== id);
      return allowMultipleOpen ? [...visible, id] : [id];
    });

  return (
    <div className={cn('accordion', `accordion--${variant}`)}>
      {entries.map((entry, index) => (
        <AccordionItem
          key={entry.id}
          title={entry.title}
          description={entry.description}
          number={index + 1}
          variant={variant}
          isOpen={open.includes(entry.id)}
          isEditing={isEditing}
          buttonId={`${baseId}-${entry.id}-button`}
          panelId={`${baseId}-${entry.id}-panel`}
          onToggle={() => toggle(entry.id)}
        />
      ))}
    </div>
  );
};
