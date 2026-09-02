import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, increment, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  Avatar,
  Card,
  Checkbox,
  IconButton,
  ListRow,
  SectionTitle,
} from '../../components/ui'
import {
  IconBell,
  IconCheck,
  IconChevron,
  IconClock,
  IconRepeat,
  IconSettings,
  IconStar,
  IconUsers,
  IconWallet,
} from '../../components/icons'
import { useHome } from '../../hooks/useHousehold'
import { useCollection } from '../../hooks/useCollection'
import { formatARS } from '../../lib/money'
import { addDaysISO, formatDayLong, monthRange, relativeLabel, todayISO } from '../../lib/dates'
import { occurrencesBetween } from '../../lib/recurrence'
import { fixedDuesBetween, type FixedDue } from '../../lib/fixed'
import { materializeSeries } from '../../lib/taskSeries'
import { PayFixedSheet } from '../expenses/PayFixedSheet'
import type {
  Expense,
  FixedExpense,
  HouseholdEvent,
  Task,
  TaskSeries,
} from '../../types'

export default function HomePage() {
  const navigate = useNavigate()
  const { hid, uid, household, myProfile, partnerUid, partnerProfile } = useHome()
  const today = todayISO()
  const [monthStart, monthEnd] = monthRange(
    Number(today.slice(0, 4)),
    Number(today.slice(5, 7)),
  )
  const lookback = addDaysISO(today, -60)

  const { data: tasks, loading: tasksLoading } = useCollection<Task>(hid, 'tasks', {
    filters: [
      ['date', '>=', lookback],
      ['date', '<=', today],
    ],
    orderByField: ['date', 'asc'],
  })
  const { data: series, loading: seriesLoading } = useCollection<TaskSeries>(hid, 'taskSeries', {
    orderByField: ['createdAt', 'asc'],
  })
  const { data: events } = useCollection<HouseholdEvent>(hid, 'events', {
    orderByField: ['startDate', 'asc'],
  })
  const { data: fixedList } = useCollection<FixedExpense>(hid, 'fixedExpenses', {
    orderByField: ['dayOfMonth', 'asc'],
  })
  const { data: expenses } = useCollection<Expense>(hid, 'expenses', {
    filters: [
      ['date', '>=', monthStart],
      ['date', '<=', monthEnd],
    ],
    orderByField: ['date', 'desc'],
  })

  // Materializar las tareas recurrentes de hoy (idempotente, una vez por carga)
  const materialized = useRef(false)
  useEffect(() => {
    if (tasksLoading || seriesLoading || materialized.current) return
    materialized.current = true
    materializeSeries(hid, series, tasks, today, today).catch(console.error)
  }, [hid, series, tasks, tasksLoading, seriesLoading, today])

  const todayTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.date === today)
        .sort((a, b) => Number(a.done) - Number(b.done) || (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0)),
    [tasks, today],
  )
  const overdue = useMemo(
    () => tasks.filter((t) => t.date < today && !t.done),
    [tasks, today],
  )
  const myPendingToday = todayTasks.filter((t) => !t.done && t.assigneeUid === uid).length
  const doneToday = todayTasks.filter((t) => t.done).length

  const todayEvents = useMemo(
    () =>
      events
        .filter((e) => occurrencesBetween(e, today, today).length > 0)
        .sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99')),
    [events, today],
  )
  const todayDues = useMemo(
    () => fixedDuesBetween(fixedList, expenses, today, today),
    [fixedList, expenses, today],
  )
  const [paying, setPaying] = useState<FixedDue | null>(null)

  const monthTotal = expenses.reduce((s, e) => s + e.amount, 0)
  const monthFixed = expenses.filter((e) => e.kind === 'fijo').reduce((s, e) => s + e.amount, 0)
  const fixedPct = monthTotal > 0 ? Math.round((monthFixed / monthTotal) * 100) : 0

  const firstName = myProfile?.name.split(' ')[0] ?? 'Hola'
  const myPoints = household.points[uid] ?? 0
  const partnerPoints = partnerUid ? (household.points[partnerUid] ?? 0) : 0

  async function toggleTask(task: Task) {
    const taskRef = doc(db, 'households', hid, 'tasks', task.id)
    const homeRef = doc(db, 'households', hid)
    const batch = writeBatch(db)
    if (!task.done) {
      batch.update(taskRef, { done: true, completedAt: serverTimestamp(), completedBy: uid })
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
      alert('No se pudo actualizar la tarea. Probá de nuevo.')
    }
  }

  const heroTitle =
    myPendingToday === 0
      ? todayTasks.length === 0
        ? 'Hoy no hay tareas'
        : 'Ya hiciste lo tuyo'
      : `Hoy tenés ${myPendingToday} ${myPendingToday === 1 ? 'tarea' : 'tareas'}`
  const heroBits = [
    `${todayEvents.length + todayDues.length} ${todayEvents.length + todayDues.length === 1 ? 'evento' : 'eventos'}`,
    overdue.length > 0 ? `${overdue.length} ${overdue.length === 1 ? 'atrasada' : 'atrasadas'}` : null,
  ].filter(Boolean)

  return (
    <div>
      <header className="pt-safe sticky top-0 z-10 bg-bg/92 backdrop-blur-md">
        <div className="flex items-end justify-between gap-3 px-4 pt-3 pb-2">
          <div className="min-w-0">
            <p className="mb-0.5 text-[11.5px] font-semibold tracking-[0.08em] text-ink2 uppercase">
              {formatDayLong(today)}
            </p>
            <h1 className="truncate text-[28px] leading-tight font-extrabold">Hola, {firstName}</h1>
          </div>
          <IconButton label="Configuración" onClick={() => navigate('/config')}>
            <IconSettings size={22} />
          </IconButton>
        </div>
      </header>

      <div className="px-4 pb-6">
        {/* Hero marino */}
        <button
          type="button"
          onClick={() => navigate('/tareas')}
          className="mt-2 flex w-full items-center justify-between rounded-2xl bg-brand px-4 py-3.5 text-left text-on-brand shadow-[0_10px_24px_-14px_rgb(27_47_91/0.8)]"
        >
          <span>
            <span className="block font-display text-[17px] font-bold">{heroTitle}</span>
            <span className="block text-[12.5px] text-white/70">{heroBits.join(' · ')}</span>
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 font-display text-sm font-bold">
            <IconStar size={15} className="text-gold" fill="currentColor" stroke="none" />
            <span className="tabular">{myPoints}</span>
          </span>
        </button>

        {/* Tareas de hoy */}
        <SectionTitle right={todayTasks.length > 0 ? `${doneToday} de ${todayTasks.length}` : undefined}>
          Tareas de hoy
        </SectionTitle>
        <Card>
          {todayTasks.length === 0 ? (
            <p className="px-4 py-4 text-sm text-ink2">
              Sin tareas para hoy. Agregá una desde Tareas.
            </p>
          ) : (
            todayTasks.map((t) => (
              <ListRow
                key={t.id}
                dimmed={t.done}
                left={<Checkbox checked={t.done} onChange={() => toggleTask(t)} label={t.title} />}
                title={t.title}
                subtitle={
                  <span className="inline-flex items-center gap-1.5">
                    <Avatar profile={household.memberProfiles[t.assigneeUid] ?? null} size={16} />
                    {household.memberProfiles[t.assigneeUid]?.name.split(' ')[0]}
                    {t.seriesId && <IconRepeat size={13} className="text-ink2" />}
                  </span>
                }
                right={<span className="tabular text-sm font-semibold text-accent">+{t.points}</span>}
              />
            ))
          )}
        </Card>

        {/* Agenda de hoy */}
        {(todayEvents.length > 0 || todayDues.length > 0) && (
          <>
            <SectionTitle right="hoy">Agenda</SectionTitle>
            <Card>
              {todayEvents.map((e) => (
                <ListRow
                  key={e.id}
                  onClick={() => navigate('/calendario')}
                  left={e.time ? <IconClock size={20} className="text-ink2" /> : <IconBell size={20} className="text-ink2" />}
                  title={e.title}
                  subtitle={e.time ?? 'Todo el día'}
                  right={<IconChevron size={16} className="text-ink2" />}
                />
              ))}
              {todayDues.map((d) => (
                <ListRow
                  key={`${d.fixed.id}-${d.dueDate}`}
                  dimmed={Boolean(d.paid)}
                  left={<IconWallet size={20} className="text-ink2" />}
                  title={`Pagar ${d.fixed.name}`}
                  subtitle={`Gasto fijo · ${formatARS(d.paid?.amount ?? d.fixed.amount)}`}
                  right={
                    d.paid ? (
                      <IconCheck size={18} className="text-ok" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPaying(d)}
                        className="min-h-9 rounded-full bg-warn-soft px-3 text-xs font-bold text-warn"
                      >
                        Vence hoy
                      </button>
                    )
                  }
                />
              ))}
            </Card>
          </>
        )}

        {/* Tiles */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate('/gastos')}
            className="rounded-2xl bg-card p-3.5 text-left shadow-[0_1px_2px_rgb(20_33_61/0.05)]"
          >
            <span className="block text-xs font-semibold text-ink2">Gastos del mes</span>
            <span className="tabular mt-0.5 block font-display text-[22px] font-extrabold">
              {formatARS(monthTotal)}
            </span>
            <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-line">
              <span className="block h-full bg-brand" style={{ width: `${fixedPct}%` }} />
            </span>
            <span className="mt-1 block text-[11px] text-ink2">
              {monthTotal > 0 ? `${fixedPct} % fijos · ${100 - fixedPct} % variables` : 'Sin gastos todavía'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/nosotros/premios')}
            className="rounded-2xl bg-card p-3.5 text-left shadow-[0_1px_2px_rgb(20_33_61/0.05)]"
          >
            <span className="block text-xs font-semibold text-ink2">Puntos</span>
            <span className="mt-1.5 flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-display text-[15px] font-bold">
                <Avatar profile={myProfile} size={22} />
                <span className="tabular">{myPoints}</span>
              </span>
              {partnerUid && (
                <span className="flex items-center gap-1.5 font-display text-[15px] font-bold">
                  <Avatar profile={partnerProfile} size={22} />
                  <span className="tabular">{partnerPoints}</span>
                </span>
              )}
            </span>
            <span className="mt-2 block text-[11px] text-ink2">
              {!partnerUid
                ? 'Invitá a tu pareja'
                : myPoints === partnerPoints
                  ? 'Van empatados'
                  : myPoints > partnerPoints
                    ? 'Vas ganando'
                    : `${partnerProfile?.name.split(' ')[0]} va ganando`}
            </span>
          </button>
        </div>

        {/* Atrasadas */}
        {overdue.length > 0 && (
          <>
            <SectionTitle right={`${overdue.length}`}>Atrasadas</SectionTitle>
            <Card className="border border-warn/25">
              {overdue.slice(0, 5).map((t) => (
                <ListRow
                  key={t.id}
                  left={<Checkbox checked={false} onChange={() => toggleTask(t)} label={t.title} />}
                  title={t.title}
                  subtitle={
                    <span className="inline-flex items-center gap-1 text-warn">
                      <IconClock size={13} />
                      {relativeLabel(t.date)} · {household.memberProfiles[t.assigneeUid]?.name.split(' ')[0]}
                    </span>
                  }
                  right={<span className="tabular text-sm font-semibold text-accent">+{t.points}</span>}
                />
              ))}
              {overdue.length > 5 && (
                <ListRow
                  onClick={() => navigate('/tareas')}
                  title={<span className="text-brand dark:text-accent">Ver todas</span>}
                />
              )}
            </Card>
          </>
        )}

        {!partnerUid && (
          <Card className="mt-6">
            <ListRow
              onClick={() => navigate('/config/ajustes')}
              left={<IconUsers size={22} className="text-brand dark:text-accent" />}
              title="Invitá a tu pareja"
              subtitle={`Código ${household.inviteCode}`}
              right={<IconChevron size={16} className="text-ink2" />}
            />
          </Card>
        )}
      </div>

      <PayFixedSheet due={paying} onClose={() => setPaying(null)} />
    </div>
  )
}
