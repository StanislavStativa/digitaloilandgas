import { FC, SVGProps } from 'react';

/** Decorative magnifier (search buttons); inherits its color from `currentColor`. */
export const SearchIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}>
    <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" />
    <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
