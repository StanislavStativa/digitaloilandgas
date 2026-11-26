import { FC, SVGProps } from 'react';

/** Decorative LinkedIn badge: brand-blue rounded square with a white "in". The link around it carries the name. */
export const LinkedInIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" focusable="false" {...props}>
    <rect width="32" height="32" rx="4" fill="#0B86CA" />
    <g fill="#fff">
      <circle cx="9.25" cy="9.4" r="2.1" />
      <rect x="7.5" y="13" width="3.5" height="11" />
      <path d="M13.3 13h3.4v1.5c.5-.9 1.8-1.8 3.6-1.8 3.7 0 4.4 2.4 4.4 5.5V24h-3.6v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V24h-3.9z" />
    </g>
  </svg>
);
