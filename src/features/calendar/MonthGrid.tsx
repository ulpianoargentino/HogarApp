import { daysInMonth, formatMonthYear, todayISO } from '../../lib/dates'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Grilla del mes: 7 columnas, arranca lunes, puntito en días con eventos. */
export default function MonthGrid({
  year,
  month1,
  markedDays,
  selectedDay,
  onSelectDay,
  onPrev,
  onNext,
}: {
  year: number
  month1: number
  /** fechas ISO del mes que llevan puntito */
  markedDays: Set<string>
  selectedDay: string | null
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

  return (
    <div className="rounded-2xl bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Mes anterior"
          className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-ink2 active:bg-card2"
        >
          ‹
        </button>
        <span className="font-semibold capitalize">{formatMonthYear(year, month1)}</span>
        <button
          type="button"
          onClick={onNext}
          aria-label="Mes siguiente"
          className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-ink2 active:bg-card2"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="pb-1 text-xs font-semibold text-ink2">
            {d}
          </span>
        ))}
        {cells.map((iso, i) =>
          iso === null ? (
            <span key={`x${i}`} />
          ) : (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDay(iso)}
              className={`relative mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-full text-sm ${
                iso === selectedDay
                  ? 'bg-accent font-semibold text-white'
                  : iso === today
                    ? 'bg-accent-soft font-semibold text-accent'
                    : 'text-ink active:bg-card2'
              }`}
            >
              {Number(iso.slice(8))}
              {markedDays.has(iso) && (
                <span
                  className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${
                    iso === selectedDay ? 'bg-white' : 'bg-accent'
                  }`}
                />
              )}
            </button>
          ),
        )}
      </div>
    </div>
  )
}
