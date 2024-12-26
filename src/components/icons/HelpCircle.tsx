import { SVGProps } from 'react'

// https://icones.js.org/collection/lucide?s=help-circle
export default function HelpCircle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' {...props}><g fill='none' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='2'><circle cx='12' cy='12' r='10' /><path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m.08 4h.01' /></g></svg>
  )
}
