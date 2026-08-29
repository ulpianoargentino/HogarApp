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
  garantia: 'Garantía',
}

const TYPE_CLASS: Record<string, string> = {
  pago: 'bg-accent-soft text-accent',
  salud: 'bg-ok/15 text-ok',
  visita: 'bg-love-soft text-love',
  otro: 'bg-card2 text-ink2',
  garantia: 'bg-warn-soft text-warn',
}

/** Chip chiquito con el tipo de evento (pago/salud/visita/otro/garantía). */
export function TypeChip({ type }: { type: string }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
        TYPE_CLASS[type] ?? TYPE_CLASS.otro
      }`}
    >
      {TYPE_LABEL[type] ?? type}
    </span>
  )
}
