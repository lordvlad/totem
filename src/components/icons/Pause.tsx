import { SVGProps } from "react";

// https://icones.js.org/collection/lucide?s=pause
export default function Pause(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <rect width="4" height="16" x="6" y="4"></rect>
        <rect width="4" height="16" x="14" y="4"></rect>
      </g>
    </svg>
  );
}
