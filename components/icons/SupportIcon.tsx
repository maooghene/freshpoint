import * as React from "react";

/**
 * FreshPoint AI support icon: a rounded chat bubble with a spark inside.
 * Draws in currentColor so it follows the surrounding text colour.
 */
export function SupportIcon({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* Bubble with a tail at the bottom left */}
      <path
        d="M7 3.5h10a4 4 0 0 1 4 4v5a4 4 0 0 1-4 4h-5.5l-3.9 3.3a.6.6 0 0 1-1-.45V16.5H7a4 4 0 0 1-4-4v-5a4 4 0 0 1 4-4Z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Main spark */}
      <path
        d="M12 6.2c.3 2.2 1.6 3.5 3.8 3.8-2.2.3-3.5 1.6-3.8 3.8-.3-2.2-1.6-3.5-3.8-3.8 2.2-.3 3.5-1.6 3.8-3.8Z"
        fill="currentColor"
      />
      {/* Small spark */}
      <path
        d="m17.2 5.5.35.95.95.35-.95.35-.35.95-.35-.95-.95-.35.95-.35.35-.95Z"
        fill="currentColor"
      />
    </svg>
  );
}
