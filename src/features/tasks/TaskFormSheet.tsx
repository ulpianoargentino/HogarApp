import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useHome } from '../../hooks/useHousehold'
import { useCollection } from '../../hooks/useCollection'
import {
  Chip,
  Field,
  FormSheet,
  GhostButton,
  MemberPicker,
  SegmentedControl,
  inputClass,
} from '../../components/ui'
import { IconRepeat } from '../../components/icons'
import { normalizeText, slugify } from '../../lib/normalize'
import { materializeSeries, recurrenceLabel } from '../../lib/taskSeries'
import type { EventRecurrence, Task, TaskSeries, TaskTemplate } from '../../types'

type RepeatMode = 'none' | 'weekly' | 'biweekly' | 'monthly' | 'custom'
type CustomFreq = 'weekly' | 'monthly'
type EditScope = 'one' | 'all'

const DEFAULT_POINTS = 10
const MAX_POINTS = 500
const MAX_INTERVAL = 52

function modeFromRecurrence(r: EventRecurrence | null): {
  mode: RepeatMode
  n: string
  freq: CustomFreq
} {
  if (!r) return { mode: 'none', n: '2', freq: 'weekly' }
  if (r.freq === 'weekly' && r.interval === 1) return { mode: 'weekly', n: '2', freq: 'weekly' }
  if (r.freq === 'weekly' && r.interval === 2) return { mode: 'biweekly', n: '2', freq: 'weekly' }
  if (r.freq === 'monthly' && r.interval === 1) return { mode: 'monthly', n: '2', freq: 'monthly' }
  return {
    mode: 'custom',
    n: String(r.interval),
    freq: r.freq === 'monthly' ? 'monthly' : 'weekly',
  }
}

function parseInt0(s: string): number | null {
  if (!/^\d+$/.test(s)) return null
  return Number(s)
}

/**
 * Alta y edición de tareas. Si `task` viene con `seriesId`, permite editar
 * solo esa instancia o toda la serie.
 */
export default function TaskFormSheet({
  open,
  onClose,
  defaultDate,
  task,
  series,
}: {
  open: boolean
  onClose: () => void
  /** Día seleccionado en la agenda (default del alta) */
  defaultDate: string
  /** null = alta */
  task: Task | null
  /** Serie de la tarea en edición, si pertenece a una */
  series: TaskSeries | null
}) {
  const { hid, uid, household, partnerUid } = useHome()
  const { data: templates } = useCollection<TaskTemplate>(hid, 'taskTemplates', {
    orderByField: ['count', 'desc'],
    max: 100,
  })

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [assigneeUid, setAssigneeUid] = useState(uid)
  const [points, setPoints] = useState(String(DEFAULT_POINTS))
  const [mode, setMode] = useState<RepeatMode>('none')
  const [customN, setCustomN] = useState('2')
  const [customFreq, setCustomFreq] = useState<CustomFreq>('weekly')
  const [scope, setScope] = useState<EditScope>('one')
  const [titleFocused, setTitleFocused] = useState(false)
  const blurTimer = useRef<number | null>(null)

  const editing = task !== null
  const isSeriesTask = editing && series !== null

  // Resetear el formulario cada vez que se abre
  useEffect(() => {
    if (!open) return
    if (task) {
      setTitle(task.title)
      setDate(task.date)
      setAssigneeUid(task.assigneeUid)
      setPoints(String(task.points))
      const r = modeFromRecurrence(series?.recurrence ?? null)
      setMode(r.mode)
      setCustomN(r.n)
      setCustomFreq(r.freq)
    } else {
      setTitle('')
      setDate(defaultDate)
      setAssigneeUid(uid)
      setPoints(String(DEFAULT_POINTS))
      setMode('none')
      setCustomN('2')
      setCustomFreq('weekly')
    }
    setScope('one')
    setTitleFocused(false)
    // Solo al abrir (o cambiar de tarea): los snapshots renuevan `task`/`series`
    // y no queremos pisar lo que la persona está escribiendo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id, series?.id])

  useEffect(
    () => () => {
      if (blurTimer.current !== null) window.clearTimeout(blurTimer.current)
    },
    [],
  )

  const members = [uid, partnerUid]
    .filter((m): m is string => Boolean(m))
    .map((m) => ({ uid: m, profile: household.memberProfiles[m] }))
    .filter((m) => m.profile)

  // ---------- Plantillas (autocompletado) ----------
  const suggestions = useMemo(() => {
    const q = normalizeText(title)
    if (q.length === 0) return titleFocused ? templates.slice(0, 5) : []
    if (q.length < 2) return []
    const prefix: TaskTemplate[] = []
    const inside: TaskTemplate[] = []
    for (const t of templates) {
      const n = normalizeText(t.title)
      if (n === q) continue
      if (n.startsWith(q)) prefix.push(t)
      else if (n.includes(q)) inside.push(t)
    }
    return [...prefix, ...inside].slice(0, 5)
  }, [title, templates, titleFocused])

  function pickTemplate(t: TaskTemplate) {
    setTitle(t.title)
    setPoints(String(t.points))
    setTitleFocused(false)
  }

  // ---------- Validación ----------
  const pointsValue = parseInt0(points)
  const pointsOk = pointsValue !== null && pointsValue <= MAX_POINTS
  const intervalValue = parseInt0(customN)
  const intervalOk = intervalValue !== null && intervalValue >= 1 && intervalValue <= MAX_INTERVAL
  const showRepeat = !editing || (isSeriesTask && scope === 'all')
  const recurrence: EventRecurrence | null = !showRepeat
    ? null
    : mode === 'none'
      ? null
      : mode === 'weekly'
        ? { freq: 'weekly', interval: 1 }
        : mode === 'biweekly'
          ? { freq: 'weekly', interval: 2 }
          : mode === 'monthly'
            ? { freq: 'monthly', interval: 1 }
            : { freq: customFreq, interval: intervalValue ?? 1 }
  const canSubmit =
    title.trim().length > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    pointsOk &&
    (mode !== 'custom' || !showRepeat || intervalOk)

  // ---------- Guardar ----------
  async function rememberTemplate(cleanTitle: string, pts: number) {
    const slug = slugify(cleanTitle)
    if (!slug) return
    await setDoc(
      doc(db, 'households', hid, 'taskTemplates', slug),
      { title: cleanTitle, points: pts, count: increment(1), lastUsedAt: serverTimestamp() },
      { merge: true },
    )
  }

  async function submit() {
    const cleanTitle = title.trim()
    const pts = pointsValue ?? 0
    if (!cleanTitle) throw new Error('Escribí un título para la tarea.')
    if (!pointsOk) throw new Error(`Los puntos van de 0 a ${MAX_POINTS}.`)

    if (!editing) {
      if (!recurrence) {
        await addDoc(collection(db, 'households', hid, 'tasks'), {
          title: cleanTitle,
          assigneeUid,
          date,
          done: false,
          points: pts,
          seriesId: null,
          createdBy: uid,
          createdAt: serverTimestamp(),
          completedAt: null,
          completedBy: null,
        })
      } else {
        const seriesData = {
          title: cleanTitle,
          assigneeUid,
          points: pts,
          startDate: date,
          recurrence,
          endDate: null,
          active: true,
          createdBy: uid,
        }
        const ref = await addDoc(collection(db, 'households', hid, 'taskSeries'), {
          ...seriesData,
          createdAt: serverTimestamp(),
        })
        // Que la primera ocurrencia aparezca ya en el día elegido
        await materializeSeries(
          hid,
          [{ id: ref.id, ...seriesData, createdAt: null } as unknown as TaskSeries],
          [],
          date,
          date,
        )
      }
      await rememberTemplate(cleanTitle, pts)
      return
    }

    // Edición
    const taskRef = doc(db, 'households', hid, 'tasks', task.id)
    const instancePatch = { title: cleanTitle, assigneeUid, date, points: pts }
    if (isSeriesTask && scope === 'all') {
      await updateDoc(doc(db, 'households', hid, 'taskSeries', series.id), {
        title: cleanTitle,
        assigneeUid,
        points: pts,
        recurrence: recurrence ?? series.recurrence,
      })
    }
    await updateDoc(taskRef, instancePatch)
  }

  async function remove() {
    if (!task) return
    if (!window.confirm(`¿Eliminar la tarea «${task.title}»?`)) return
    try {
      await deleteDoc(doc(db, 'households', hid, 'tasks', task.id))
      if (series && window.confirm('¿Terminar también la repetición?')) {
        await updateDoc(doc(db, 'households', hid, 'taskSeries', series.id), {
          active: false,
          endDate: task.date,
        })
      }
      onClose()
    } catch {
      alert('No pudimos eliminar la tarea. Probá de nuevo.')
    }
  }

  return (
    <FormSheet
      open={open}
      onClose={onClose}
      title={editing ? 'Editar tarea' : 'Nueva tarea'}
      onSubmit={submit}
      submitLabel={editing ? 'Guardar cambios' : 'Agregar tarea'}
      canSubmit={canSubmit}
      footer={
        editing ? (
          <GhostButton tone="danger" onClick={remove}>
            Eliminar tarea
          </GhostButton>
        ) : undefined
      }
    >
      {isSeriesTask && (
        <div className="mb-4 rounded-xl bg-brand-soft p-3">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-brand dark:text-accent">
            <IconRepeat size={16} />
            Esta tarea se repite {recurrenceLabel(series.recurrence)}
          </p>
          <SegmentedControl<EditScope>
            options={[
              { value: 'one', label: 'Solo esta' },
              { value: 'all', label: 'Toda la serie' },
            ]}
            value={scope}
            onChange={setScope}
          />
        </div>
      )}

      <Field label="Título">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => {
            if (blurTimer.current !== null) window.clearTimeout(blurTimer.current)
            setTitleFocused(true)
          }}
          onBlur={() => {
            blurTimer.current = window.setTimeout(() => setTitleFocused(false), 150)
          }}
          placeholder="Lavar los platos"
          className={inputClass}
          autoComplete="off"
          autoFocus={!editing}
        />
        {suggestions.length > 0 && (
          <div
            className="mt-2 flex gap-2 overflow-x-auto pb-1"
            onMouseDown={(e) => e.preventDefault()}
          >
            {suggestions.map((t) => (
              <Chip key={t.id} onClick={() => pickTemplate(t)}>
                {t.title} · {t.points} pts
              </Chip>
            ))}
          </div>
        )}
      </Field>

      <Field label="Fecha">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
          required
        />
      </Field>

      <Field label="Para quién">
        <MemberPicker members={members} value={assigneeUid} onChange={setAssigneeUid} />
      </Field>

      <Field label="Puntos" hint="Los suma quien la completa">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={points}
          onChange={(e) => setPoints(e.target.value.replace(/\D/g, '').slice(0, 3))}
          className={`${inputClass} tabular max-w-28 font-display text-lg font-bold`}
          aria-invalid={!pointsOk}
        />
      </Field>

      {showRepeat && (
        <Field label="Repetir">
          {/* Con "Personalizado" activo ningún segmento queda marcado */}
          <SegmentedControl<RepeatMode>
            options={[
              { value: 'none', label: 'No' },
              { value: 'weekly', label: 'Semanal' },
              { value: 'biweekly', label: 'Quincenal' },
              { value: 'monthly', label: 'Mensual' },
            ]}
            value={mode}
            onChange={setMode}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Chip selected={mode === 'custom'} onClick={() => setMode('custom')}>
              Personalizado
            </Chip>
            {mode === 'custom' && (
              <span className="flex items-center gap-2 text-sm text-ink2">
                cada
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={customN}
                  onChange={(e) => setCustomN(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  className={`${inputClass} tabular w-16 min-h-10 px-2 text-center`}
                  aria-label="Cada cuántos"
                  aria-invalid={!intervalOk}
                />
                <select
                  value={customFreq}
                  onChange={(e) => setCustomFreq(e.target.value as CustomFreq)}
                  className={`${inputClass} min-h-10 w-auto px-2`}
                  aria-label="Semanas o meses"
                >
                  <option value="weekly">semanas</option>
                  <option value="monthly">meses</option>
                </select>
              </span>
            )}
          </div>
        </Field>
      )}
    </FormSheet>
  )
}
