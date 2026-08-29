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
import { Chip, Field, FormSheet, SegmentedControl, inputClass } from '../../components/ui'
import { IconTrash } from '../../components/icons'
import { useHome } from '../../hooks/useHousehold'
import { todayISO } from '../../lib/dates'
import type { EventRecurrence, EventType, HouseholdEvent } from '../../types'
import { EVENT_TYPE_OPTIONS } from './eventMeta'

type FreqOption = 'none' | EventRecurrence['freq']

const FREQ_OPTIONS: Array<{ value: FreqOption; label: string }> = [
  { value: 'none', label: 'No se repite' },
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
}: {
  open: boolean
  onClose: () => void
  event: HouseholdEvent | null
}) {
  const { hid, uid } = useHome()
  const [title, setTitle] = useState('')
  const [type, setType] = useState<EventType>('otro')
  const [date, setDate] = useState(todayISO())
  const [freq, setFreq] = useState<FreqOption>('none')
  const [remind, setRemind] = useState(3)
  const [notes, setNotes] = useState('')

  // Precargar / resetear cada vez que se abre
  useEffect(() => {
    if (!open) return
    setTitle(event?.title ?? '')
    setType(event?.type ?? 'otro')
    setDate(event?.startDate ?? todayISO())
    setFreq(event?.recurrence?.freq ?? 'none')
    setRemind(event?.remindDaysBefore ?? 3)
    setNotes(event?.notes ?? '')
  }, [open, event])

  async function handleSubmit() {
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
      ? `¿Eliminar «${event.title}»? Se borra la serie completa, con todas sus repeticiones.`
      : `¿Eliminar el evento «${event.title}»?`
    if (!window.confirm(message)) return
    await deleteDoc(doc(db, 'households', hid, 'events', event.id))
    onClose()
  }

  return (
    <FormSheet
      open={open}
      onClose={onClose}
      title={event ? 'Editar evento' : 'Nuevo evento'}
      onSubmit={handleSubmit}
      submitLabel={event ? 'Guardar cambios' : 'Agregar evento'}
      canSubmit={title.trim().length > 0}
    >
      <Field label="Título">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Pagar el alquiler"
          className={inputClass}
          autoFocus={!event}
        />
      </Field>
      <Field label="Tipo">
        <div className="flex gap-2">
          {EVENT_TYPE_OPTIONS.map((o) => (
            <Chip key={o.value} selected={type === o.value} onClick={() => setType(o.value)}>
              {o.label}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Fecha">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className={inputClass}
        />
      </Field>
      <Field label="Repetición">
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
      {event && (
        <button
          type="button"
          onClick={handleDelete}
          className="mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-danger/40 font-medium text-danger active:opacity-70"
        >
          <IconTrash size={18} />
          Eliminar evento
        </button>
      )}
    </FormSheet>
  )
}
