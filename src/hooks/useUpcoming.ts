import { addDaysISO, diffDays, todayISO } from '../lib/dates'
import { occurrencesBetween } from '../lib/recurrence'
import { fixedDuesBetween } from '../lib/fixed'
import type { Expense, FixedExpense, HouseholdEvent } from '../types'

export interface UpcomingItem {
  /** id del evento o del gasto fijo */
  sourceId: string
  kind: 'evento' | 'pago'
  title: string
  date: string // YYYY-MM-DD de la ocurrencia
  time: string | null
  type: string // EventType o 'pago'
  /** true si ya entró en la ventana de recordatorio (badge) */
  urgent: boolean
  event: HouseholdEvent | null
  fixed: FixedExpense | null
}

export interface Upcoming {
  /** Ocurrencias pendientes de los próximos 14 días, ordenadas por fecha */
  items: UpcomingItem[]
  /** Cantidad de ítems urgentes (badge del tab Calendario) */
  badgeCount: number
}

/** Deriva "Próximos" de eventos + gastos fijos impagos, ya suscriptos. */
export function computeUpcoming(
  events: HouseholdEvent[],
  fixedList: FixedExpense[],
  expenses: Expense[],
  days = 14,
): Upcoming {
  const today = todayISO()
  const windowEnd = addDaysISO(today, days)
  const items: UpcomingItem[] = []

  for (const event of events) {
    for (const date of occurrencesBetween(event, today, windowEnd)) {
      if (event.doneDates?.includes(date)) continue
      items.push({
        sourceId: event.id,
        kind: 'evento',
        title: event.title,
        date,
        time: event.time ?? null,
        type: event.type,
        urgent: diffDays(today, date) <= event.remindDaysBefore,
        event,
        fixed: null,
      })
    }
  }

  for (const due of fixedDuesBetween(fixedList, expenses, today, windowEnd)) {
    if (due.paid) continue
    items.push({
      sourceId: due.fixed.id,
      kind: 'pago',
      title: `Pagar ${due.fixed.name}`,
      date: due.dueDate,
      time: null,
      type: 'pago',
      urgent: diffDays(today, due.dueDate) <= due.fixed.remindDaysBefore,
      event: null,
      fixed: due.fixed,
    })
  }

  items.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    return Number(b.urgent) - Number(a.urgent)
  })

  return { items, badgeCount: items.filter((i) => i.urgent).length }
}
