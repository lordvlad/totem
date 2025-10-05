import { SVGProps } from "react";

// https://icones.js.org/collection/lucide?s=test-tube&icon=lucide:test-tube
export default function TestTube(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5V2m-4 8l8.5 8.5M6 2h12"
      ></path>
    </svg>
  );
}
