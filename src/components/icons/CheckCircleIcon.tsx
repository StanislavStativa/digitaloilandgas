import { FC, SVGProps, useId } from 'react';

/**
 * Decorative check in a filled circle. The circle takes `currentColor`; the check is cut out of it
 * (mask), so the background behind the icon shows through.
 */
export const CheckCircleIcon: FC<SVGProps<SVGSVGElement>> = (props) => {
  // One mask per icon instance: ids must stay unique when the icon repeats on the page
  const maskId = `check-circle-${useId()}`;

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}>
      <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="#fff" />
        <path d="M7 12.4L10.3 15.6L17 8.8" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </mask>
      <circle cx="12" cy="12" r="12" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
};
