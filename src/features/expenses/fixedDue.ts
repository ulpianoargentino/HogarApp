import { daysInMonth, todayISO } from '../../lib/dates'

/**
 * Primer vencimiento a partir de hoy para un día del mes dado: si el día ya
 * pasó este mes, cae el mes que viene. El día se clampea al último del mes.
 */
export function firstDueFrom(dayOfMonth: number, today = todayISO()): string {
  const [y, m, d] = today.split('-').map(Number)
  const dayThisMonth = Math.min(dayOfMonth, daysInMonth(y, m))
  let year = y
  let month = m
  if (dayThisMonth < d) {
    month = m === 12 ? 1 : m + 1
    year = m === 12 ? y + 1 : y
  }
  const day = Math.min(dayOfMonth, daysInMonth(year, month))
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
