import { addDaysISO, daysInMonth, diffDays } from './dates'
import type { HouseholdEvent } from '../types'

// Tope de seguridad para nunca colgar el hilo con datos raros.
const MAX_ITER = 1000

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Fecha ISO clampeando el día al último del mes (31 ene → 28/29 feb). */
function clampedISO(year: number, month1: number, day: number): string {
  return `${year}-${pad(month1)}-${pad(Math.min(day, daysInMonth(year, month1)))}`
}

/**
 * Fechas ISO (YYYY-MM-DD) de las ocurrencias de un evento dentro del rango
 * [fromISO, toISO] inclusive. Nunca antes de startDate ni después de endDate.
 */
export function occurrencesBetween(
  event: HouseholdEvent,
  fromISO: string,
  toISO: string,
): string[] {
  const { startDate, recurrence, endDate } = event
  // Las ISO YYYY-MM-DD comparan bien como strings.
  const end = endDate && endDate < toISO ? endDate : toISO
  if (end < fromISO || end < startDate) return []

  if (!recurrence) {
    return startDate >= fromISO && startDate <= end ? [startDate] : []
  }

  const interval = Math.max(1, Math.floor(recurrence.interval) || 1)
  const result: string[] = []

  if (recurrence.freq === 'weekly') {
    const step = 7 * interval
    let cur = startDate
    // Adelantar de un salto hasta cerca del inicio del rango
    const behind = diffDays(cur, fromISO)
    if (behind > 0) cur = addDaysISO(cur, Math.floor(behind / step) * step)
    for (let i = 0; i < MAX_ITER && cur <= end; i++) {
      if (cur >= fromISO) result.push(cur)
      cur = addDaysISO(cur, step)
    }
    return result
  }

  const [sy, sm, sd] = startDate.split('-').map(Number)

  if (recurrence.freq === 'monthly') {
    const [fy, fm] = fromISO.split('-').map(Number)
    // Estimar cuántos períodos saltear (uno menos, por seguridad con el clamp)
    const monthsBehind = (fy - sy) * 12 + (fm - sm)
    let k = Math.max(0, Math.floor(monthsBehind / interval) - 1)
    for (let i = 0; i < MAX_ITER; i++, k++) {
      const totalMonths = sm - 1 + k * interval
      const year = sy + Math.floor(totalMonths / 12)
      const month1 = (totalMonths % 12) + 1
      const cur = clampedISO(year, month1, sd)
      if (cur > end) break
      if (cur >= fromISO && cur >= startDate) result.push(cur)
    }
    return result
  }

  // yearly
  const fromYear = Number(fromISO.slice(0, 4))
  let k = Math.max(0, Math.floor((fromYear - sy) / interval) - 1)
  for (let i = 0; i < MAX_ITER; i++, k++) {
    const cur = clampedISO(sy + k * interval, sm, sd)
    if (cur > end) break
    if (cur >= fromISO && cur >= startDate) result.push(cur)
  }
  return result
}
