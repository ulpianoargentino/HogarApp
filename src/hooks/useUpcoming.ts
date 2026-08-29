import { addDaysISO, diffDays, todayISO } from '../lib/dates'
import { occurrencesBetween } from '../lib/recurrence'
import type { HouseholdEvent, Warranty } from '../types'

export interface UpcomingItem {
  /** id del evento o de la garantía */
  sourceId: string
  kind: 'evento' | 'garantia'
  title: string
  date: string // YYYY-MM-DD de la ocurrencia
  type: string // EventType o 'garantia'
  /** true si ya entró en la ventana de recordatorio (badge) */
  urgent: boolean
  /** solo eventos: la ocurrencia puede marcarse hecha/pagada */
  event: HouseholdEvent | null
}

export interface Upcoming {
  /** Ocurrencias de los próximos 14 días, ordenadas por fecha */
  items: UpcomingItem[]
  /** Cantidad de ítems urgentes (badge del tab Calendario) */
  badgeCount: number
}

/** Deriva "Próximos" de eventos + garantías ya suscriptos. */
export function computeUpcoming(
  events: HouseholdEvent[],
  warranties: Warranty[],
): Upcoming {
  const today = todayISO()
  const windowEnd = addDaysISO(today, 14)
  const items: UpcomingItem[] = []

  for (const event of events) {
    for (const date of occurrencesBetween(event, today, windowEnd)) {
      if (event.doneDates?.includes(date)) continue
      items.push({
        sourceId: event.id,
        kind: 'evento',
        title: event.title,
        date,
        type: event.type,
        urgent: diffDays(today, date) <= event.remindDaysBefore,
        event,
      })
    }
  }

  for (const warranty of warranties) {
    const date = warranty.expiresAt
    if (date < today || date > windowEnd) continue
    items.push({
      sourceId: warranty.id,
      kind: 'garantia',
      title: `Vence garantía: ${warranty.item}`,
      date,
      type: 'garantia',
      urgent: diffDays(today, date) <= 7,
      event: null,
    })
  }

  items.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    return Number(b.urgent) - Number(a.urgent)
  })

  return { items, badgeCount: items.filter((i) => i.urgent).length }
}
