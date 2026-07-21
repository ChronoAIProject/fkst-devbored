import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function IconFrame({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

export function BoardIcon(props: IconProps) {
  return <IconFrame {...props}><rect x="2" y="2.5" width="5" height="11" rx="1.2" stroke="currentColor" strokeWidth="1.3" /><rect x="9" y="2.5" width="5" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.3" /></IconFrame>
}

export function CouncilIcon(props: IconProps) {
  return <IconFrame {...props}><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" /><circle cx="8" cy="4" r="1" fill="currentColor" /><circle cx="11.5" cy="7" r="1" fill="currentColor" /><circle cx="9.9" cy="11" r="1" fill="currentColor" /><circle cx="5.3" cy="10.5" r="1" fill="currentColor" /><circle cx="4.3" cy="6.1" r="1" fill="currentColor" /></IconFrame>
}

export function RuntimeIcon(props: IconProps) {
  return <IconFrame {...props}><rect x="2.2" y="2.5" width="11.6" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" /><path d="M4.6 9.6 6.8 7.4 8.5 9.1l2.9-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></IconFrame>
}

export function PlusIcon(props: IconProps) {
  return <IconFrame {...props}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></IconFrame>
}

export function RefreshIcon(props: IconProps) {
  return <IconFrame {...props}><path d="M13 5.4A5.4 5.4 0 1 0 13.2 10M13 2.5v3.2H9.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></IconFrame>
}

export function CloseIcon(props: IconProps) {
  return <IconFrame {...props}><path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></IconFrame>
}

export function ExternalIcon(props: IconProps) {
  return <IconFrame {...props}><path d="M6 3H3.5A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14h8a1.5 1.5 0 0 0 1.5-1.5V10M9 2h5v5M8 8l6-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></IconFrame>
}

export function IssueIcon(props: IconProps) {
  return <IconFrame {...props}><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" /><circle cx="8" cy="8" r="1.2" fill="currentColor" /></IconFrame>
}

export function PullRequestIcon(props: IconProps) {
  return <IconFrame {...props}><circle cx="4" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.2" /><circle cx="4" cy="12.5" r="1.5" stroke="currentColor" strokeWidth="1.2" /><circle cx="12" cy="12.5" r="1.5" stroke="currentColor" strokeWidth="1.2" /><path d="M4 5v6M8 4h1.8A2.2 2.2 0 0 1 12 6.2V11M8 2.5 6.5 4 8 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></IconFrame>
}

export function CheckIcon(props: IconProps) {
  return <IconFrame {...props}><path d="m3.2 8.2 3 3L12.8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></IconFrame>
}

export function AlertIcon(props: IconProps) {
  return <IconFrame {...props}><path d="M8 2.2 14 13H2L8 2.2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><path d="M8 6v3.5M8 11.5v.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></IconFrame>
}
