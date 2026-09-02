import type { EventType } from '../../types'

export const EVENT_TYPE_OPTIONS: Array<{ value: EventType; label: string }> = [
  { value: 'pago', label: 'Pago' },
  { value: 'salud', label: 'Salud' },
  { value: 'visita', label: 'Visita' },
  { value: 'otro', label: 'Otro' },
]

const TYPE_LABEL: Record<string, string> = {
  pago: 'Pago',
  salud: 'Salud',
  visita: 'Visita',
  otro: 'Otro',
}

/** Color de texto por tipo: pago accent, salud ok, visita brand, otro ink2. */
export const TYPE_TEXT: Record<string, string> = {
  pago: 'text-accent',
  salud: 'text-ok',
  visita: 'text-brand dark:text-accent',
  otro: 'text-ink2',
}

const TYPE_CHIP: Record<string, string> = {
  pago: 'bg-accent-soft text-accent',
  salud: 'bg-ok-soft text-ok',
  visita: 'bg-brand-soft text-brand dark:text-accent',
  otro: 'bg-card2 text-ink2',
}

/** Etiqueta legible del tipo ('pago' → 'Pago'). */
export function eventTypeLabel(type: string): string {
  return TYPE_LABEL[type] ?? type
}

/** Chip chiquito con el tipo de evento, sin emojis, con el color del tipo. */
export function TypeChip({ type }: { type: string }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
        TYPE_CHIP[type] ?? TYPE_CHIP.otro
      }`}
    >
      {eventTypeLabel(type)}
    </span>
  )
}
