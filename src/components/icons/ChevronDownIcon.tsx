import { FC, SVGProps } from 'react';

/** Decorative down chevron; inherits its color from `currentColor`. */
export const ChevronDownIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true" focusable="false" {...props}>
    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
