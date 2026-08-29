import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

function base({ size = 24, ...props }: P) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  }
}

export const IconHome = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
  </svg>
)

export const IconCheckCircle = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.5 2.5 4.5-5" />
  </svg>
)

export const IconCart = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 4h2l2.4 12.2a1.5 1.5 0 0 0 1.5 1.3h7.7a1.5 1.5 0 0 0 1.5-1.2L20 8H6" />
    <circle cx="9.5" cy="20.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="16.5" cy="20.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
)

export const IconCalendar = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
)

export const IconMore = (p: P) => (
  <svg {...base(p)}>
    <circle cx="5.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="18.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </svg>
)

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconTrash = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M10 11v6M14 11v6M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2" />
  </svg>
)

export const IconChevron = (p: P) => (
  <svg {...base(p)}>
    <path d="m9 6 6 6-6 6" />
  </svg>
)

export const IconHeart = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20.5S4 15.5 4 9.8A4.3 4.3 0 0 1 8.3 5.5c1.6 0 3 .9 3.7 2.2a4.2 4.2 0 0 1 3.7-2.2A4.3 4.3 0 0 1 20 9.8c0 5.7-8 10.7-8 10.7Z" />
  </svg>
)

export const IconGift = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="8.5" width="17" height="4" rx="1" />
    <path d="M5.5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-6.5M12 8.5v12M12 8.5s-4.5.2-5.5-2C5.8 5 7 3.5 8.5 3.8c2 .4 3.5 4.7 3.5 4.7s1.5-4.3 3.5-4.7c1.5-.3 2.7 1.2 2 2.7-1 2.2-5.5 2-5.5 2Z" />
  </svg>
)

export const IconWrench = (p: P) => (
  <svg {...base(p)}>
    <path d="M14.5 6.5a4 4 0 0 0 5 5L16 15l-6.5 6.5a2.1 2.1 0 0 1-3-3L13 12l3.5-3.5a4 4 0 0 0-2-2Z" />
    <path d="M14.5 6.5 18 3l3 3-3.5 3.5" />
  </svg>
)

export const IconWallet = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="18" height="14" rx="2.5" />
    <path d="M3 10h18M16.5 15h1.5" />
  </svg>
)

export const IconPhone = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 3.5h3l1.5 4L8.6 9a12 12 0 0 0 6.4 6.4l1.5-1.9 4 1.5v3a1.6 1.6 0 0 1-1.8 1.6A16.5 16.5 0 0 1 4.4 5.3 1.6 1.6 0 0 1 6 3.5Z" />
  </svg>
)

export const IconShield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3 5 5.5v5.2c0 4.6 3 8 7 10.3 4-2.3 7-5.7 7-10.3V5.5Z" />
    <path d="m9 11.5 2.2 2.2L15 9.5" />
  </svg>
)

export const IconFridge = (p: P) => (
  <svg {...base(p)}>
    <rect x="6" y="2.5" width="12" height="19" rx="2" />
    <path d="M6 9.5h12M9 5.5v2M9 12.5v3" />
  </svg>
)

export const IconSettings = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.5a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.5h4l.4-2.5a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.07-.4.1-.8.1-1.2Z" />
  </svg>
)

export const IconStar = (p: P) => (
  <svg {...base(p)}>
    <path d="m12 3.5 2.5 5.2 5.7.7-4.2 4 1.1 5.6L12 16.2 6.9 19l1.1-5.6-4.2-4 5.7-.7Z" />
  </svg>
)

export const IconBell = (p: P) => (
  <svg {...base(p)}>
    <path d="M18 16v-5a6 6 0 1 0-12 0v5l-1.5 2.5h15Z" />
    <path d="M10 20.5a2 2 0 0 0 4 0" />
  </svg>
)

export const IconTv = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M8 21h8" />
  </svg>
)

export const IconMap = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s-6.5-5.6-6.5-10.4a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z" />
    <circle cx="12" cy="10.5" r="2.2" />
  </svg>
)
