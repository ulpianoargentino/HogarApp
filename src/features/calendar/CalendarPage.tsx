import { useMemo, useRef, useState } from 'react'
import { arrayUnion, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Card, EmptyState, FAB, PageHeader, SectionTitle } from '../../components/ui'
import { IconBell, IconCalendar } from '../../components/icons'
import { useHome } from '../../hooks/useHousehold'
import { useCollection } from '../../hooks/useCollection'
import { computeUpcoming, type UpcomingItem } from '../../hooks/useUpcoming'
import { occurrencesBetween } from '../../lib/recurrence'
import { formatShort, fromISO, monthRange, relativeLabel, todayISO } from '../../lib/dates'
import type { HouseholdEvent, Warranty } from '../../types'
import { TypeChip } from './eventMeta'
import MonthGrid from './MonthGrid'
import EventFormSheet from './EventFormSheet'

interface MonthItem {
  key: string
  date: string
  title: string
  type: string
  done: boolean
  event: HouseholdEvent | null
}

export default function CalendarPage() {
  const { hid } = useHome()
  const { data: events, loading } = useCollection<HouseholdEvent>(hid, 'events', {
    orderByField: ['startDate', 'asc'],
  })
  const { data: warranties } = useCollection<Warranty>(hid, 'warranties', {
    orderByField: ['expiresAt', 'asc'],
  })

  const [view, setView] = useState(() => {
    const t = fromISO(todayISO())
    return { year: t.getFullYear(), month1: t.getMonth() + 1 }
  })
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<HouseholdEvent | null>(null)
  const monthListRef = useRef<HTMLDivElement>(null)

  const upcoming = useMemo(() => computeUpcoming(events, warranties), [events, warranties])

  // Próximos agrupados por etiqueta relativa (Hoy / Mañana / vie 29 ago)
  const upcomingGroups = useMemo(() => {
    const groups: Array<{ label: string; items: UpcomingItem[] }> = []
    for (const item of upcoming.items) {
      const label = relativeLabel(item.date)
      const last = groups[groups.length - 1]
      if (last && last.label === label) last.items.push(item)
      else groups.push({ label, items: [item] })
    }
    return groups
  }, [upcoming])

  // Ocurrencias del mes visible (eventos + vencimientos de garantía)
  const monthItems = useMemo<MonthItem[]>(() => {
    const [from, to] = monthRange(view.year, view.month1)
    const list: MonthItem[] = []
    for (const event of events) {
      for (const date of occurrencesBetween(event, from, to)) {
        list.push({
          key: `${event.id}:${date}`,
          date,
          title: event.title,
          type: event.type,
          done: event.doneDates?.includes(date) ?? false,
          event,
        })
      }
    }
    for (const w of warranties) {
      if (w.expiresAt >= from && w.expiresAt <= to) {
        list.push({
          key: `w:${w.id}`,
          date: w.expiresAt,
          title: `Vence garantía: ${w.item}`,
          type: 'garantia',
          done: false,
          event: null,
        })
      }
    }
    return list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  }, [events, warranties, view])

  const markedDays = useMemo(() => new Set(monthItems.map((i) => i.date)), [monthItems])

  function moveMonth(delta: number) {
    setSelectedDay(null)
    setView(({ year, month1 }) => {
      const total = year * 12 + (month1 - 1) + delta
      return { year: Math.floor(total / 12), month1: (((total % 12) + 12) % 12) + 1 }
    })
  }

  function selectDay(iso: string) {
    const next = selectedDay === iso ? null : iso
    setSelectedDay(next)
    if (next && markedDays.has(next)) {
      requestAnimationFrame(() => {
        monthListRef.current
          ?.querySelector(`[data-date="${next}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
  }

  async function markOccurrenceDone(event: HouseholdEvent, date: string) {
    try {
      await updateDoc(doc(db, 'households', hid, 'events', event.id), {
        doneDates: arrayUnion(date),
      })
    } catch {
      alert('No se pudo marcar. Probá de nuevo.')
    }
  }

  function openEdit(event: HouseholdEvent) {
    setEditing(event)
    setFormOpen(true)
  }

  return (
    <div>
      <PageHeader title="Calendario" />
      <div className="px-4 pb-28">
        <SectionTitle>Próximos</SectionTitle>
        {upcomingGroups.length > 0 ? (
          upcomingGroups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="mb-1 px-1 text-sm font-semibold text-ink">{group.label}</p>
              <Card>
                {group.items.map((item) => (
                  <div
                    key={`${item.sourceId}:${item.date}`}
                    className={`flex min-h-13 items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0 ${
                      item.urgent ? 'border-l-4 border-l-warn bg-warn-soft' : 'bg-card'
                    }`}
                  >
                    {item.urgent && <IconBell size={18} className="shrink-0 text-warn" />}
                    <button
                      type="button"
                      onClick={item.event ? () => openEdit(item.event!) : undefined}
                      className="min-h-11 min-w-0 flex-1 text-left"
                      disabled={!item.event}
                    >
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium">{item.title}</span>
                        <TypeChip type={item.type} />
                      </span>
                      <span className="block text-sm text-ink2">{formatShort(item.date)}</span>
                    </button>
                    {item.event && (
                      <button
                        type="button"
                        onClick={() => markOccurrenceDone(item.event!, item.date)}
                        className="min-h-9 shrink-0 rounded-full bg-accent-soft px-3 text-sm font-semibold text-accent active:opacity-70"
                      >
                        {item.type === 'pago' ? 'Pagado' : 'Listo'}
                      </button>
                    )}
                  </div>
                ))}
              </Card>
            </div>
          ))
        ) : (
          <Card>
            <p className="px-4 py-4 text-sm text-ink2">
              {loading ? 'Cargando…' : 'Nada agendado para los próximos 14 días.'}
            </p>
          </Card>
        )}

        <div className="mt-6">
          <MonthGrid
            year={view.year}
            month1={view.month1}
            markedDays={markedDays}
            selectedDay={selectedDay}
            onSelectDay={selectDay}
            onPrev={() => moveMonth(-1)}
            onNext={() => moveMonth(1)}
          />
        </div>

        <SectionTitle>Eventos del mes</SectionTitle>
        <div ref={monthListRef}>
          {monthItems.length > 0 ? (
            <Card>
              {monthItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  data-date={item.date}
                  onClick={item.event ? () => openEdit(item.event!) : undefined}
                  disabled={!item.event}
                  className={`flex min-h-13 w-full items-center gap-3 border-b border-line px-4 py-2.5 text-left last:border-b-0 ${
                    item.date === selectedDay ? 'bg-accent-soft' : 'bg-card'
                  } ${item.done ? 'opacity-55' : ''}`}
                >
                  <TypeChip type={item.type} />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate font-medium ${item.done ? 'line-through' : ''}`}
                    >
                      {item.title}
                    </span>
                    <span className="block text-sm text-ink2">{formatShort(item.date)}</span>
                  </span>
                  {item.done && <span className="shrink-0 font-semibold text-ok">✓</span>}
                </button>
              ))}
            </Card>
          ) : loading ? (
            <p className="px-4 py-10 text-center text-sm text-ink2">Cargando…</p>
          ) : (
            <EmptyState
              icon={<IconCalendar size={40} />}
              title="Nada este mes"
              hint="Agregá pagos, turnos o visitas con el + y no se olviden de nada."
            />
          )}
        </div>
      </div>

      <FAB
        onClick={() => {
          setEditing(null)
          setFormOpen(true)
        }}
        label="Nuevo evento"
      />
      <EventFormSheet
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        event={editing}
      />
    </div>
  )
}
