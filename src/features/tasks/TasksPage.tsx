import { useEffect, useMemo, useRef, useState } from 'react'
import { doc, increment, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  Card,
  EmptyState,
  FAB,
  IconButton,
  ListRow,
  PageHeader,
} from '../../components/ui'
import { IconCalendar, IconCheck, IconTasks, IconWallet } from '../../components/icons'
import { useHome } from '../../hooks/useHousehold'
import { useCollection } from '../../hooks/useCollection'
import { addDaysISO, diffDays, formatMonthYear, monthRange, todayISO } from '../../lib/dates'
import { formatARS } from '../../lib/money'
import { fixedDuesBetween } from '../../lib/fixed'
import { materializeSeries } from '../../lib/taskSeries'
import { PayFixedSheet } from '../expenses/PayFixedSheet'
import type { Expense, FixedExpense, Task, TaskSeries } from '../../types'
import TaskFormSheet from './TaskFormSheet'
import TaskRow from './TaskRow'
import WeekStrip, { startOfWeek } from './WeekStrip'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function monthOf(iso: string): [number, number] {
  return [Number(iso.slice(0, 4)), Number(iso.slice(5, 7))]
}

export default function TasksPage() {
  const { hid, uid, household } = useHome()
  const today = todayISO()
  const [selected, setSelected] = useState(today)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today))
  const weekEnd = addDaysISO(weekStart, 6)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [paying, setPaying] = useState<{ fixed: FixedExpense; dueDate: string } | null>(null)

  // ---------- Datos ----------
  const { data: tasks, loading: tasksLoading } = useCollection<Task>(hid, 'tasks', {
    filters: [
      ['date', '>=', weekStart],
      ['date', '<=', weekEnd],
    ],
    orderByField: ['date', 'asc'],
  })
  const { data: series, loading: seriesLoading } = useCollection<TaskSeries>(hid, 'taskSeries', {
    orderByField: ['createdAt', 'asc'],
  })
  const { data: fixedList } = useCollection<FixedExpense>(hid, 'fixedExpenses', {
    orderByField: ['dayOfMonth', 'asc'],
  })
  const [firstY, firstM] = monthOf(weekStart)
  const [lastY, lastM] = monthOf(weekEnd)
  const { data: expenses } = useCollection<Expense>(hid, 'expenses', {
    filters: [
      ['date', '>=', monthRange(firstY, firstM)[0]],
      ['date', '<=', monthRange(lastY, lastM)[1]],
    ],
    orderByField: ['date', 'asc'],
  })

  // ---------- Materialización de series ----------
  // La clave incluye el rango y la "forma" de cada serie: si cambia una
  // recurrencia se vuelve a materializar; si solo llega otro snapshot, no.
  const seriesKey = series
    .map((s) => {
      const r = `${s.recurrence.freq}${s.recurrence.interval}`
      return `${s.id}:${s.active ? 1 : 0}:${r}:${s.startDate}:${s.endDate ?? ''}`
    })
    .join(',')
  const rangeKey = `${weekStart}_${weekEnd}`
  const materializedKey = useRef<string | null>(null)
  // useCollection pone loading=true recién en su efecto: en el primer render
  // tras cambiar de semana todavía vemos los datos viejos. Solo materializamos
  // cuando ya vimos "cargando" para este rango.
  const seenLoadingFor = useRef<string | null>(null)
  useEffect(() => {
    if (tasksLoading) seenLoadingFor.current = rangeKey
  }, [tasksLoading, rangeKey])

  useEffect(() => {
    if (tasksLoading || seriesLoading) return
    if (seenLoadingFor.current !== rangeKey) return
    const key = `${rangeKey}|${seriesKey}`
    if (materializedKey.current === key) return
    materializedKey.current = key
    if (series.length === 0) return
    materializeSeries(hid, series, tasks, weekStart, weekEnd).catch((err) => {
      console.error('materializeSeries', err)
      materializedKey.current = null
    })
  }, [hid, tasks, series, tasksLoading, seriesLoading, rangeKey, seriesKey, weekStart, weekEnd])

  // ---------- Derivados ----------
  const seriesById = useMemo(() => new Map(series.map((s) => [s.id, s])), [series])

  const pendingDates = useMemo(() => {
    const set = new Set<string>()
    for (const t of tasks) if (!t.done) set.add(t.date)
    return set
  }, [tasks])

  const dayTasks = useMemo(() => {
    const ofDay = tasks.filter((t) => t.date === selected)
    const ms = (t: Task) => t.createdAt?.toMillis() ?? 0
    const pending = ofDay.filter((t) => !t.done).sort((a, b) => ms(a) - ms(b))
    const done = ofDay
      .filter((t) => t.done)
      .sort((a, b) => (a.completedAt?.toMillis() ?? 0) - (b.completedAt?.toMillis() ?? 0))
    return [...pending, ...done]
  }, [tasks, selected])

  const dayDues = useMemo(
    () => fixedDuesBetween(fixedList, expenses, selected, selected),
    [fixedList, expenses, selected],
  )

  // ---------- Acciones ----------
  function goToday() {
    setSelected(today)
    setWeekStart(startOfWeek(today))
  }

  function changeWeek(newStart: string) {
    setWeekStart(newStart)
    // Mantener el mismo día de la semana seleccionado
    const offset = Math.max(0, Math.min(6, diffDays(weekStart, selected)))
    setSelected(addDaysISO(newStart, offset))
  }

  async function toggleTask(task: Task) {
    const taskRef = doc(db, 'households', hid, 'tasks', task.id)
    const homeRef = doc(db, 'households', hid)
    const batch = writeBatch(db)
    if (!task.done) {
      batch.update(taskRef, {
        done: true,
        completedAt: serverTimestamp(),
        completedBy: uid,
      })
      batch.update(homeRef, { [`points.${uid}`]: increment(task.points) })
    } else {
      if (task.completedBy !== uid) {
        alert('Solo quien la completó puede desmarcarla.')
        return
      }
      batch.update(taskRef, { done: false, completedAt: null, completedBy: null })
      batch.update(homeRef, { [`points.${uid}`]: increment(-task.points) })
    }
    try {
      await batch.commit()
    } catch {
      alert('No pudimos actualizar la tarea. Probá de nuevo.')
    }
  }

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(task: Task) {
    setEditing(task)
    setFormOpen(true)
  }

  const [selY, selM] = monthOf(selected)
  const isEmpty = dayTasks.length === 0 && dayDues.length === 0

  return (
    <div>
      <div className="sticky top-0 z-10 bg-bg">
        <PageHeader
          title="Tareas"
          eyebrow={capitalize(formatMonthYear(selY, selM))}
          right={
            <IconButton label="Ir a hoy" onClick={goToday} tone="brand">
              <IconCalendar size={20} />
            </IconButton>
          }
        />
        <WeekStrip
          weekStart={weekStart}
          selected={selected}
          today={today}
          pendingDates={pendingDates}
          onSelect={setSelected}
          onWeekChange={changeWeek}
        />
      </div>

      <div className="px-4 pt-2 pb-6">
        {isEmpty ? (
          tasksLoading ? (
            <p className="px-4 py-14 text-center text-sm text-ink2">Cargando…</p>
          ) : (
            <EmptyState
              icon={<IconTasks size={30} />}
              title="Nada para este día"
              hint="Agregá una tarea con el +"
            />
          )
        ) : (
          <Card>
            {dayTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                series={task.seriesId ? (seriesById.get(task.seriesId) ?? null) : null}
                profiles={household.memberProfiles}
                onToggle={toggleTask}
                onEdit={openEdit}
              />
            ))}
            {dayDues.map(({ fixed, dueDate, paid }) => (
              <ListRow
                key={`${fixed.id}_${dueDate}`}
                dimmed={paid !== null}
                left={
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center text-brand dark:text-accent">
                    <IconWallet size={22} />
                  </span>
                }
                title={`Pagar ${fixed.name}`}
                subtitle={
                  paid
                    ? `Pagado · ${formatARS(paid.amount)}`
                    : `${formatARS(fixed.amount)} · gasto fijo`
                }
                right={
                  paid ? (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center text-ok">
                      <IconCheck size={20} strokeWidth={2.4} />
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPaying({ fixed, dueDate })}
                      className="min-h-9 shrink-0 rounded-full bg-brand-soft px-4 text-sm font-semibold text-brand transition-colors duration-150 active:bg-brand active:text-on-brand dark:text-accent"
                    >
                      Pagar
                    </button>
                  )
                }
              />
            ))}
          </Card>
        )}
      </div>

      <FAB onClick={openNew} label="Nueva tarea" />
      <TaskFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        defaultDate={selected}
        task={editing}
        series={editing?.seriesId ? (seriesById.get(editing.seriesId) ?? null) : null}
      />
      <PayFixedSheet due={paying} onClose={() => setPaying(null)} />
    </div>
  )
}
