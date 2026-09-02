import { IconChevron, IconChevronLeft } from '../../components/icons'
import { Card } from '../../components/ui'
import { daysInMonth, formatMonthYear, todayISO } from '../../lib/dates'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/** accent = evento, brand = tarea, warn = pago fijo pendiente, ok = pago fijo pagado */
export type DotTone = 'accent' | 'brand' | 'warn' | 'ok'

const DOT_CLASS: Record<DotTone, string> = {
  accent: 'bg-accent',
  brand: 'bg-brand dark:bg-accent',
  warn: 'bg-warn',
  ok: 'bg-ok',
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Grilla del mes: 7 columnas desde lunes, hasta 3 puntitos por día, tap selecciona. */
export default function MonthGrid({
  year,
  month1,
  dots,
  selectedDay,
  onSelectDay,
  onPrev,
  onNext,
}: {
  year: number
  month1: number
  /** fecha ISO → tonos de los puntitos (máx. 3 se muestran) */
  dots: Map<string, DotTone[]>
  selectedDay: string
  onSelectDay: (iso: string) => void
  onPrev: () => void
  onNext: () => void
}) {
  const today = todayISO()
  const total = daysInMonth(year, month1)
  // getDay(): 0=domingo → offset con semana que arranca lunes
  const offset = (new Date(year, month1 - 1, 1).getDay() + 6) % 7

  const cells: Array<string | null> = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: total }, (_, i) => `${year}-${pad(month1)}-${pad(i + 1)}`),
  ]

  const navClass =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-brand transition-colors duration-150 active:bg-card2 dark:text-accent'

  return (
    <Card className="p-3">
      <div className="mb-1 flex items-center justify-between">
        <button type="button" onClick={onPrev} aria-label="Mes anterior" className={navClass}>
          <IconChevronLeft size={22} />
        </button>
        <h2 className="text-[16px] font-bold">{capitalize(formatMonthYear(year, month1))}</h2>
        <button type="button" onClick={onNext} aria-label="Mes siguiente" className={navClass}>
          <IconChevron size={22} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="pb-1 text-xs font-semibold text-ink2">
            {d}
          </span>
        ))}
        {cells.map((iso, i) => {
          if (iso === null) return <span key={`x${i}`} />
          const selected = iso === selectedDay
          const isToday = iso === today
          const tones = (dots.get(iso) ?? []).slice(0, 3)
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDay(iso)}
              aria-pressed={selected}
              aria-label={`${Number(iso.slice(8))} de ${formatMonthYear(year, month1)}`}
              className={`mx-auto flex aspect-square min-h-11 w-full max-w-12 flex-col items-center justify-center rounded-full transition-colors duration-150 ${
                selected
                  ? 'bg-brand text-on-brand'
                  : isToday
                    ? 'font-bold text-brand ring-2 ring-brand/45 ring-inset dark:text-accent dark:ring-accent/60'
                    : 'text-ink active:bg-card2'
              }`}
            >
              <span className={`tabular text-sm leading-none ${isToday ? 'font-bold' : ''}`}>
                {Number(iso.slice(8))}
              </span>
              <span className="mt-1 flex h-1.5 items-center gap-0.5">
                {tones.map((tone) => (
                  <span
                    key={tone}
                    className={`h-1.5 w-1.5 rounded-full ${
                      selected ? 'bg-on-brand/85' : DOT_CLASS[tone]
                    }`}
                  />
                ))}
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
