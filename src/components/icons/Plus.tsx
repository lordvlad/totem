import { SVGProps } from "react";

// https://icones.js.org/collection/lucide?s=plus&icon=lucide:plus
export function Plus(props: SVGProps<SVGSVGElement>) {
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
        d="M5 12h14m-7-7v14"
      ></path>
    </svg>
  );
}
