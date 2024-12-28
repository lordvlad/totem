import { SVGProps } from "react";

export function CirclePower(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
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
        <path d="M12 7v4M7.998 9.003a5 5 0 1 0 8-.005"></path>
        <circle cx="12" cy="12" r="10"></circle>
      </g>
    </svg>
  );
}
