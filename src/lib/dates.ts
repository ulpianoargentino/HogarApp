// Fechas de calendario como strings YYYY-MM-DD: sin zonas horarias, sin sorpresas.

export function todayISO(): string {
  return toISO(new Date())
}

export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDaysISO(iso: string, days: number): string {
  const d = fromISO(iso)
  d.setDate(d.getDate() + days)
  return toISO(d)
}

export function daysInMonth(year: number, month1: number): number {
  // month1: 1-12
  return new Date(year, month1, 0).getDate()
}

/** Diferencia en días entre dos fechas ISO (b - a). */
export function diffDays(a: string, b: string): number {
  const ms = fromISO(b).getTime() - fromISO(a).getTime()
  return Math.round(ms / 86_400_000)
}

/** 'vie 29 ago' */
export function formatShort(iso: string): string {
  return fromISO(iso)
    .toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/\.,?/g, '')
}

/** '29 de agosto de 2026' */
export function formatLong(iso: string): string {
  return fromISO(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** 'agosto 2026' */
export function formatMonthYear(year: number, month1: number): string {
  return new Date(year, month1 - 1, 1).toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  })
}

/** Rango [primer día, último día] de un mes como ISO. */
export function monthRange(year: number, month1: number): [string, string] {
  const mm = String(month1).padStart(2, '0')
  return [`${year}-${mm}-01`, `${year}-${mm}-${String(daysInMonth(year, month1)).padStart(2, '0')}`]
}

/** Etiqueta relativa amigable: Hoy / Mañana / vie 29 ago */
export function relativeLabel(iso: string): string {
  const d = diffDays(todayISO(), iso)
  if (d === 0) return 'Hoy'
  if (d === 1) return 'Mañana'
  if (d === -1) return 'Ayer'
  return formatShort(iso)
}

/** 'Martes 2 de septiembre' */
export function formatDayLong(iso: string): string {
  const s = fromISO(iso).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
