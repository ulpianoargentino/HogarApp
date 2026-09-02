import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { arrayUnion, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Card, FAB, ListRow, PageHeader, SectionTitle } from '../../components/ui'
import {
  IconBell,
  IconCheck,
  IconClock,
  IconTasks,
  IconWallet,
} from '../../components/icons'
import { useHome } from '../../hooks/useHousehold'
import { useCollection } from '../../hooks/useCollection'
import { computeUpcoming, type UpcomingItem } from '../../hooks/useUpcoming'
import { occurrencesBetween } from '../../lib/recurrence'
import { materializeSeries } from '../../lib/taskSeries'
import { fixedDuesBetween } from '../../lib/fixed'
import { formatARS } from '../../lib/money'
import { formatDayLong, formatLong, monthRange, relativeLabel, todayISO } from '../../lib/dates'
import { PayFixedSheet } from '../expenses/PayFixedSheet'
import type {
  Expense,
  FixedExpense,
  HouseholdEvent,
  Task,
  TaskSeries,
} from '../../types'
import { TYPE_TEXT, eventTypeLabel } from './eventMeta'
import MonthGrid, { type DotTone } from './MonthGrid'
import EventFormSheet from './EventFormSheet'

type PayTarget = { fixed: FixedExpense; dueDate: string } | null

function monthOf(iso: string): { year: number; month1: number } {
  return { year: Number(iso.slice(0, 4)), month1: Number(iso.slice(5, 7)) }
}

/** Ícono redondo a la izquierda de cada fila del día */
function RowIcon({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card2 ${className}`}
    >
      {children}
    </span>
  )
}

/** Botón chico de acción (Pagar / Listo) */
function PillButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-9 shrink-0 rounded-full bg-brand-soft px-3.5 text-sm font-semibold text-brand transition-colors duration-150 active:bg-brand/15 dark:text-accent"
    >
      {children}
    </button>
  )
}

export default function CalendarPage() {
  const { hid, household } = useHome()
  const today = todayISO()

  const [view, setView] = useState(() => monthOf(today))
  const [selectedDay, setSelectedDay] = useState(today)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<HouseholdEvent | null>(null)
  const [paying, setPaying] = useState<PayTarget>(null)

  const [monthStart, monthEnd] = monthRange(view.year, view.month1)
  const [nowStart, nowEnd] = monthRange(monthOf(today).year, monthOf(today).month1)
  const isCurrentMonth = monthStart === nowStart

  // ---- Suscripciones ----
  const { data: events } = useCollection<HouseholdEvent>(hid, 'events', {
    orderByField: ['startDate', 'asc'],
  })
  const { data: tasks, loading: tasksLoading } = useCollection<Task>(hid, 'tasks', {
    filters: [
      ['date', '>=', monthStart],
      ['date', '<=', monthEnd],
    ],
    orderByField: ['date', 'asc'],
  })
  const { data: series, loading: seriesLoading } = useCollection<TaskSeries>(hid, 'taskSeries')
  const { data: fixed } = useCollection<FixedExpense>(hid, 'fixedExpenses', {
    orderByField: ['dayOfMonth', 'asc'],
  })
  const { data: expenses } = useCollection<Expense>(hid, 'expenses', {
    filters: [
      ['date', '>=', monthStart],
      ['date', '<=', monthEnd],
    ],
    orderByField: ['date', 'desc'],
  })
  // Para "Próximos" necesitamos los pagos del mes actual aunque estemos mirando otro mes.
  // Cuando coinciden, la query es idéntica y Firestore comparte el listener.
  const { data: expensesNow } = useCollection<Expense>(hid, 'expenses', {
    filters: [
      ['date', '>=', nowStart],
      ['date', '<=', nowEnd],
    ],
    orderByField: ['date', 'desc'],
  })
  const upcomingExpenses = isCurrentMonth ? expenses : expensesNow

  // Materializar las series del día seleccionado (solo con las tareas ya cargadas:
  // si no, el set() pisaría una tarea de serie ya hecha).
  useEffect(() => {
    if (tasksLoading || seriesLoading || series.length === 0) return
    materializeSeries(hid, series, tasks, selectedDay, selectedDay).catch((err) =>
      console.error('materializeSeries', err),
    )
  }, [hid, series, tasks, selectedDay, tasksLoading, seriesLoading])

  // ---- Puntitos del mes ----
  const dots = useMemo(() => {
    const map = new Map<string, Set<DotTone>>()
    const add = (date: string, tone: DotTone) => {
      const set = map.get(date) ?? new Set<DotTone>()
      set.add(tone)
      map.set(date, set)
    }
    for (const event of events) {
      for (const date of occurrencesBetween(event, monthStart, monthEnd)) add(date, 'accent')
    }
    for (const t of tasks) add(t.date, 'brand')
    for (const s of series) {
      if (!s.active) continue
      for (const date of occurrencesBetween(s, monthStart, monthEnd)) add(date, 'brand')
    }
    for (const due of fixedDuesBetween(fixed, expenses, monthStart, monthEnd)) {
      add(due.dueDate, due.paid ? 'ok' : 'warn')
    }
    const order: DotTone[] = ['accent', 'brand', 'warn', 'ok']
    const out = new Map<string, DotTone[]>()
    for (const [date, set] of map) out.set(date, order.filter((t) => set.has(t)))
    return out
  }, [events, tasks, series, fixed, expenses, monthStart, monthEnd])

  // ---- Lo del día seleccionado ----
  const dayEvents = useMemo(
    () => events.filter((e) => occurrencesBetween(e, selectedDay, selectedDay).length > 0),
    [events, selectedDay],
  )
  const dayTasks = useMemo(() => tasks.filter((t) => t.date === selectedDay), [tasks, selectedDay])
  const dayDues = useMemo(
    () => fixedDuesBetween(fixed, expenses, selectedDay, selectedDay),
    [fixed, expenses, selectedDay],
  )
  const dayEmpty = dayEvents.length + dayTasks.length + dayDues.length === 0

  // ---- Próximos 14 días agrupados por etiqueta relativa ----
  const upcomingGroups = useMemo(() => {
    const { items } = computeUpcoming(events, fixed, upcomingExpenses)
    const groups: Array<{ label: string; items: UpcomingItem[] }> = []
    for (const item of items) {
      const label = relativeLabel(item.date)
      const last = groups[groups.length - 1]
      if (last && last.label === label) last.items.push(item)
      else groups.push({ label, items: [item] })
    }
    return groups
  }, [events, fixed, upcomingExpenses])

  // ---- Acciones ----
  function moveMonth(delta: number) {
    setView(({ year, month1 }) => {
      const total = year * 12 + (month1 - 1) + delta
      const next = { year: Math.floor(total / 12), month1: (((total % 12) + 12) % 12) + 1 }
      const [start] = monthRange(next.year, next.month1)
      setSelectedDay(start === nowStart ? today : start)
      return next
    })
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

  function assigneeName(uid: string): string {
    return household.memberProfiles[uid]?.name.split(' ')[0] ?? 'Sin asignar'
  }

  return (
    <div>
      <PageHeader title="Calendario" />
      <div className="px-4 pb-28">
        <div className="mt-2">
          <MonthGrid
            year={view.year}
            month1={view.month1}
            dots={dots}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onPrev={() => moveMonth(-1)}
            onNext={() => moveMonth(1)}
          />
        </div>

        <SectionTitle right={formatDayLong(selectedDay)}>{relativeLabel(selectedDay)}</SectionTitle>
        <Card>
          {dayEmpty ? (
            <p className="px-4 py-4 text-sm text-ink2">Nada anotado para este día</p>
          ) : (
            <>
              {dayEvents.map((event) => (
                <ListRow
                  key={event.id}
                  onClick={() => openEdit(event)}
                  left={
                    <RowIcon className={TYPE_TEXT[event.type] ?? 'text-ink2'}>
                      {event.time ? <IconClock size={20} /> : <IconBell size={20} />}
                    </RowIcon>
                  }
                  title={event.title}
                  subtitle={
                    event.time
                      ? `${event.time} · ${eventTypeLabel(event.type)}`
                      : eventTypeLabel(event.type)
                  }
                />
              ))}
              {dayTasks.map((task) => (
                <ListRow
                  key={task.id}
                  left={
                    <RowIcon className="text-brand dark:text-accent">
                      <IconTasks size={20} />
                    </RowIcon>
                  }
                  title={task.title}
                  subtitle={assigneeName(task.assigneeUid)}
                />
              ))}
              {dayDues.map((due) => (
                <ListRow
                  key={`${due.fixed.id}:${due.dueDate}`}
                  left={
                    <RowIcon className={due.paid ? 'text-ok' : 'text-warn'}>
                      <IconWallet size={20} />
                    </RowIcon>
                  }
                  title={`Pagar ${due.fixed.name}`}
                  subtitle={
                    due.paid ? `Pagado · ${formatARS(due.paid.amount)}` : formatARS(due.fixed.amount)
                  }
                  right={
                    due.paid ? (
                      <IconCheck size={20} className="shrink-0 text-ok" />
                    ) : (
                      <PillButton onClick={() => setPaying({ fixed: due.fixed, dueDate: due.dueDate })}>
                        Pagar
                      </PillButton>
                    )
                  }
                />
              ))}
            </>
          )}
        </Card>

        <SectionTitle>Próximos 14 días</SectionTitle>
        {upcomingGroups.length > 0 ? (
          upcomingGroups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="mb-1 px-1 text-[13px] font-semibold text-ink2">{group.label}</p>
              <Card>
                {group.items.map((item) => (
                  <div
                    key={`${item.kind}:${item.sourceId}:${item.date}`}
                    className={`flex min-h-13 items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0 ${
                      item.urgent ? 'bg-warn-soft' : ''
                    }`}
                  >
                    <RowIcon
                      className={
                        item.urgent
                          ? 'bg-card text-warn'
                          : item.kind === 'pago'
                            ? 'text-warn'
                            : (TYPE_TEXT[item.type] ?? 'text-ink2')
                      }
                    >
                      {item.urgent ? (
                        <IconBell size={20} />
                      ) : item.kind === 'pago' ? (
                        <IconWallet size={20} />
                      ) : item.time ? (
                        <IconClock size={20} />
                      ) : (
                        <IconBell size={20} />
                      )}
                    </RowIcon>
                    <button
                      type="button"
                      onClick={item.event ? () => openEdit(item.event!) : undefined}
                      disabled={!item.event}
                      className="min-h-11 min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate font-medium">{item.title}</span>
                      <span className="block truncate text-[13px] text-ink2">
                        {item.kind === 'pago'
                          ? `${formatLong(item.date)}${item.fixed ? ` · ${formatARS(item.fixed.amount)}` : ''}`
                          : `${formatLong(item.date)}${item.time ? ` · ${item.time}` : ''} · ${eventTypeLabel(item.type)}`}
                      </span>
                    </button>
                    {item.event && (
                      <PillButton onClick={() => markOccurrenceDone(item.event!, item.date)}>
                        Listo
                      </PillButton>
                    )}
                    {item.fixed && (
                      <PillButton
                        onClick={() => setPaying({ fixed: item.fixed!, dueDate: item.date })}
                      >
                        Pagar
                      </PillButton>
                    )}
                  </div>
                ))}
              </Card>
            </div>
          ))
        ) : (
          <Card>
            <p className="px-4 py-4 text-sm text-ink2">Nada agendado para los próximos 14 días.</p>
          </Card>
        )}
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
        defaultDate={selectedDay}
      />
      <PayFixedSheet due={paying} onClose={() => setPaying(null)} />
    </div>
  )
}
