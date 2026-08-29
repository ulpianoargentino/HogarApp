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

/**
 * Deriva "Próximos" de eventos + garantías ya suscriptos.
 * Implementación real en la fase de Calendario (fase 3C) — este stub
 * fija el contrato para que el shell compile mientras tanto.
 */
export function computeUpcoming(
  _events: HouseholdEvent[],
  _warranties: Warranty[],
): Upcoming {
  return { items: [], badgeCount: 0 }
}
