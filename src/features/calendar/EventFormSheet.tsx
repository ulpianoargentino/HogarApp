import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  Chip,
  Field,
  FormSheet,
  GhostButton,
  SegmentedControl,
  inputClass,
} from '../../components/ui'
import { useHome } from '../../hooks/useHousehold'
import { todayISO } from '../../lib/dates'
import type { EventRecurrence, EventType, HouseholdEvent } from '../../types'
import { EVENT_TYPE_OPTIONS, TYPE_TEXT } from './eventMeta'

type FreqOption = 'none' | EventRecurrence['freq']

const FREQ_OPTIONS: Array<{ value: FreqOption; label: string }> = [
  { value: 'none', label: 'No' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'yearly', label: 'Anual' },
]

const REMIND_OPTIONS = [1, 3, 7]

/** Alta y edición de eventos del calendario. `event` null = crear. */
export default function EventFormSheet({
  open,
  onClose,
  event,
  defaultDate,
}: {
  open: boolean
  onClose: () => void
  event: HouseholdEvent | null
  /** Fecha precargada al crear (el día seleccionado en la grilla) */
  defaultDate?: string
}) {
  const { hid, uid } = useHome()
  const [title, setTitle] = useState('')
  const [type, setType] = useState<EventType>('otro')
  const [date, setDate] = useState(todayISO())
  const [time, setTime] = useState('')
  const [freq, setFreq] = useState<FreqOption>('none')
  const [remind, setRemind] = useState(3)
  const [notes, setNotes] = useState('')

  // Precargar / resetear cada vez que se abre
  useEffect(() => {
    if (!open) return
    setTitle(event?.title ?? '')
    setType(event?.type ?? 'otro')
    setDate(event?.startDate ?? defaultDate ?? todayISO())
    setTime(event?.time ?? '')
    setFreq(event?.recurrence?.freq ?? 'none')
    setRemind(event?.remindDaysBefore ?? 3)
    setNotes(event?.notes ?? '')
  }, [open, event, defaultDate])

  async function handleSubmit() {
    if (!date) throw new Error('Elegí una fecha.')
    const recurrence: EventRecurrence | null =
      freq === 'none'
        ? null
        : {
            freq,
            // conservar el intervalo si no cambió la frecuencia
            interval: event?.recurrence?.freq === freq ? event.recurrence.interval : 1,
          }
    const fields = {
      title: title.trim(),
      type,
      startDate: date,
      time: time || null,
      recurrence,
      remindDaysBefore: remind,
      notes: notes.trim(),
    }
    if (event) {
      await updateDoc(doc(db, 'households', hid, 'events', event.id), fields)
    } else {
      await addDoc(collection(db, 'households', hid, 'events'), {
        ...fields,
        endDate: null,
        doneDates: [],
        createdBy: uid,
        createdAt: serverTimestamp(),
      })
    }
  }

  async function handleDelete() {
    if (!event) return
    const message = event.recurrence
      ? `¿Eliminar «${event.title}»? Es un evento que se repite: se borra la serie completa, con todas sus repeticiones.`
      : `¿Eliminar el evento «${event.title}»?`
    if (!window.confirm(message)) return
    try {
      await deleteDoc(doc(db, 'households', hid, 'events', event.id))
      onClose()
    } catch {
      alert('No se pudo eliminar. Probá de nuevo.')
    }
  }

  return (
    <FormSheet
      open={open}
      onClose={onClose}
      title={event ? 'Editar evento' : 'Nuevo evento'}
      onSubmit={handleSubmit}
      submitLabel={event ? 'Guardar cambios' : 'Agregar evento'}
      canSubmit={title.trim().length > 0 && date.length > 0}
      footer={
        event ? (
          <GhostButton tone="danger" onClick={handleDelete}>
            Eliminar evento
          </GhostButton>
        ) : undefined
      }
    >
      <Field label="Título">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Turno con el dentista"
          className={inputClass}
          autoFocus={!event}
        />
      </Field>
      <Field label="Tipo">
        <div className="flex gap-2">
          {EVENT_TYPE_OPTIONS.map((o) => (
            <Chip key={o.value} selected={type === o.value} onClick={() => setType(o.value)}>
              <span className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full bg-current ${TYPE_TEXT[o.value]}`}
                  aria-hidden
                />
                {o.label}
              </span>
            </Chip>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Hora (opcional)">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Repetir">
        <SegmentedControl<FreqOption> options={FREQ_OPTIONS} value={freq} onChange={setFreq} />
      </Field>
      <Field label="Avisar días antes">
        <div className="flex gap-2">
          {REMIND_OPTIONS.map((d) => (
            <Chip key={d} selected={remind === d} onClick={() => setRemind(d)}>
              {d === 1 ? '1 día' : `${d} días`}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Notas (opcional)">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Detalles, dirección, monto…"
          rows={2}
          className={inputClass}
        />
      </Field>
    </FormSheet>
  )
}
