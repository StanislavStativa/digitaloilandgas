import { FC, SVGProps } from 'react';

/** Decorative left chevron (mirror it with CSS for "next"); inherits its color from `currentColor`. */
export const ChevronLeftIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg width="13" height="20" viewBox="0 0 13 20" fill="none" aria-hidden="true" focusable="false" {...props}>
    <path d="M11 2L2.5 10L11 18"stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
