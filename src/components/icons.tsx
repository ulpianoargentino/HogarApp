import type { SVGProps } from 'react'

// Íconos SVG propios, trazo 1.8, 24x24. Nada de emojis como íconos.
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
    'aria-hidden': true,
    ...props,
  }
}

// ----- Navegación -----
export const IconHome = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
  </svg>
)
export const IconTasks = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <path d="m8 12.5 2.5 2.5 5-5" />
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
export const IconWallet = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="18" height="14" rx="2.5" />
    <path d="M3 10h18M16.5 15h1.5" />
  </svg>
)
export const IconCalendar = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
)
export const IconHeart = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20.5S4 15.5 4 9.8A4.3 4.3 0 0 1 8.3 5.5c1.6 0 3 .9 3.7 2.2a4.2 4.2 0 0 1 3.7-2.2A4.3 4.3 0 0 1 20 9.8c0 5.7-8 10.7-8 10.7Z" />
  </svg>
)
export const IconSettings = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.5a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.5h4l.4-2.5a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.07-.4.1-.8.1-1.2Z" />
  </svg>
)

// ----- Acciones -----
export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
)
export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
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
export const IconChevronLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="m15 6-6 6 6 6" />
  </svg>
)
export const IconRepeat = (p: P) => (
  <svg {...base(p)}>
    <path d="M17 2.5 20.5 6 17 9.5" />
    <path d="M3.5 11V9a3 3 0 0 1 3-3h14" />
    <path d="m7 21.5-3.5-3.5L7 14.5" />
    <path d="M20.5 13v2a3 3 0 0 1-3 3h-14" />
  </svg>
)
export const IconEdit = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
    <path d="m13.5 8.5 3 3" />
  </svg>
)

// ----- Contenido -----
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
export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)
export const IconAlert = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5 2.5 20h19L12 3.5Z" />
    <path d="M12 10v4M12 17.2v.3" />
  </svg>
)
export const IconGift = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="8.5" width="17" height="4" rx="1" />
    <path d="M5.5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-6.5M12 8.5v12M12 8.5s-4.5.2-5.5-2C5.8 5 7 3.5 8.5 3.8c2 .4 3.5 4.7 3.5 4.7s1.5-4.3 3.5-4.7c1.5-.3 2.7 1.2 2 2.7-1 2.2-5.5 2-5.5 2Z" />
  </svg>
)
export const IconFilm = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
  </svg>
)
export const IconPlane = (p: P) => (
  <svg {...base(p)}>
    <path d="M10.5 13.5 3.5 11l1.2-1.2 7.3 1.2 4.6-4.6a1.6 1.6 0 0 1 2.3 2.3l-4.6 4.6 1.2 7.3L14.3 21.8l-2.5-7" />
    <path d="m10.5 13.5-3 3 .5 2 2-.5 3-3" />
  </svg>
)
export const IconSparkle = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5c.6 4 2.5 5.9 6.5 6.5-4 .6-5.9 2.5-6.5 6.5-.6-4-2.5-5.9-6.5-6.5 4-.6 5.9-2.5 6.5-6.5Z" />
    <path d="M18.5 15.5c.3 1.6 1 2.3 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.2 2.2-.9 2.5-2.5Z" />
  </svg>
)
export const IconPhone = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 3.5h3l1.5 4L8.6 9a12 12 0 0 0 6.4 6.4l1.5-1.9 4 1.5v3a1.6 1.6 0 0 1-1.8 1.6A16.5 16.5 0 0 1 4.4 5.3 1.6 1.6 0 0 1 6 3.5Z" />
  </svg>
)
export const IconUsers = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 5a3.5 3.5 0 0 1 0 6.5M21.5 20a6.5 6.5 0 0 0-4.5-6.2" />
  </svg>
)
export const IconSnowflake = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
    <path d="M12 3l-2 2M12 3l2 2M12 21l-2-2M12 21l2-2M4.2 7.5l2.7.4M4.2 7.5l.4-2.7M19.8 16.5l-2.7-.4M19.8 16.5l-.4 2.7M4.2 16.5l2.7-.4M4.2 16.5l.4 2.7M19.8 7.5l-2.7.4M19.8 7.5l-.4-2.7" />
  </svg>
)
export const IconBox = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16V8Z" />
    <path d="M3.5 8 12 12.5 20.5 8M12 12.5v8" />
  </svg>
)
export const IconSpray = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 8.5h6l1.5 12h-9L9 8.5Z" />
    <path d="M10.5 8.5V6a1.5 1.5 0 0 1 1.5-1.5h3.5" />
    <path d="M15.5 3v3M18.5 4.5l1.5-1M18.5 7.5l1.5 1M18 6h2.5" />
  </svg>
)
export const IconFridge = (p: P) => (
  <svg {...base(p)}>
    <rect x="6" y="2.5" width="12" height="19" rx="2" />
    <path d="M6 9.5h12M9 5.5v2M9 12.5v3" />
  </svg>
)
export const IconTv = IconFilm
export const IconMap = IconPlane
export const IconMore = (p: P) => (
  <svg {...base(p)}>
    <circle cx="5.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="18.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </svg>
)
