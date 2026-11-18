import { FC } from 'react';
import { cn } from 'lib/utils';
import { Interactive } from 'components/content-list/ContentList';
import { ContentListProps } from 'components/content-list/ContentList.props';

/**
 * Legacy rendering "Interactive Content List" (Component Name `InteractiveContentList`).
 * Kept so pages that still use it, and hosts on older code, keep working: it renders
 * the Content List "Interactive" variant. Remove once no page references the old rendering.
 *
 * The old rendering was always white text (it sat on dark sections); the Content List variant
 * defaults to dark text and needs the "text-text-white" style, so it is forced here to keep
 * existing pages readable without re-editing them.
 */
export const Default: FC<ContentListProps> = (props) => (
  <Interactive {...props} params={{ ...props.params, styles: cn(props.params?.styles, 'text-text-white') }} />
);
