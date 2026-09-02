import { IconChevron, IconChevronLeft } from '../../components/icons'
import { addDaysISO, fromISO } from '../../lib/dates'

const DAY_INITIALS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/** Lunes de la semana que contiene la fecha. */
export function startOfWeek(iso: string): string {
  const dow = fromISO(iso).getDay() // 0 = domingo
  return addDaysISO(iso, -((dow + 6) % 7))
}

/**
 * Tira horizontal de 7 días (lunes a domingo) con flechas para cambiar de semana.
 * `pendingDates` marca con un puntito los días que tienen tareas sin hacer.
 */
export default function WeekStrip({
  weekStart,
  selected,
  today,
  pendingDates,
  onSelect,
  onWeekChange,
}: {
  weekStart: string
  selected: string
  today: string
  pendingDates: Set<string>
  onSelect: (iso: string) => void
  onWeekChange: (newWeekStart: string) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i))

  return (
    <div className="flex items-center gap-1 px-2 pb-2">
      <button
        type="button"
        onClick={() => onWeekChange(addDaysISO(weekStart, -7))}
        aria-label="Semana anterior"
        className="flex h-11 w-9 shrink-0 items-center justify-center rounded-full text-ink2 transition-colors duration-150 active:text-brand"
      >
        <IconChevronLeft size={22} />
      </button>

      <div className="grid flex-1 grid-cols-7">
        {days.map((iso, i) => {
          const isSelected = iso === selected
          const isToday = iso === today
          const hasPending = pendingDates.has(iso)
          const dayNumber = Number(iso.slice(8, 10))
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              aria-label={`${DAY_INITIALS[i]} ${dayNumber}`}
              aria-pressed={isSelected}
              className="flex min-h-[64px] flex-col items-center justify-center gap-0.5 py-1"
            >
              <span
                className={`text-[11px] font-semibold ${
                  isSelected ? 'text-brand dark:text-accent' : 'text-ink2'
                }`}
              >
                {DAY_INITIALS[i]}
              </span>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full font-display text-[15px] font-bold tabular transition-colors duration-150 ${
                  isSelected ? 'bg-brand text-on-brand' : 'text-ink'
                }`}
              >
                {dayNumber}
              </span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isToday ? 'bg-accent' : hasPending ? 'bg-ink2' : 'bg-transparent'
                }`}
              />
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => onWeekChange(addDaysISO(weekStart, 7))}
        aria-label="Semana siguiente"
        className="flex h-11 w-9 shrink-0 items-center justify-center rounded-full text-ink2 transition-colors duration-150 active:text-brand"
      >
        <IconChevron size={22} />
      </button>
    </div>
  )
}
