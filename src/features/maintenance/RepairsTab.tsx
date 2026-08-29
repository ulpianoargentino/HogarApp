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
  Card,
  EmptyState,
  FAB,
  Field,
  FormSheet,
  ListRow,
  inputClass,
} from '../../components/ui'
import { IconTrash, IconWrench } from '../../components/icons'
import { formatShort, todayISO } from '../../lib/dates'
import { formatARS } from '../../lib/money'
import { useHome } from '../../hooks/useHousehold'
import { useCollection } from '../../hooks/useCollection'
import type { Repair } from '../../types'

export default function RepairsTab() {
  const { hid } = useHome()
  const [formOpen, setFormOpen] = useState(false)

  const { data: repairs, loading } = useCollection<Repair>(hid, 'repairs', {
    orderByField: ['date', 'desc'],
  })

  async function toggleStatus(repair: Repair) {
    try {
      await updateDoc(doc(db, 'households', hid, 'repairs', repair.id), {
        status: repair.status === 'pendiente' ? 'hecho' : 'pendiente',
      })
    } catch {
      alert('No se pudo actualizar el arreglo. Probá de nuevo.')
    }
  }

  async function deleteRepair(repair: Repair) {
    if (!window.confirm(`¿Borrar el arreglo «${repair.title}»?`)) return
    await deleteDoc(doc(db, 'households', hid, 'repairs', repair.id))
  }

  return (
    <div className="mt-3">
      {repairs.length > 0 ? (
        <Card>
          {repairs.map((repair) => (
            <ListRow
              key={repair.id}
              title={repair.title}
              subtitle={`${formatShort(repair.date)}${
                repair.cost ? ` · ${formatARS(repair.cost)}` : ''
              }${repair.notes ? ` · ${repair.notes}` : ''}`}
              right={
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleStatus(repair)}
                    className={`min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold ${
                      repair.status === 'pendiente'
                        ? 'bg-warn-soft text-warn'
                        : 'bg-card2 text-ok'
                    }`}
                  >
                    {repair.status === 'pendiente' ? 'Pendiente' : 'Hecho'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRepair(repair)}
                    aria-label="Borrar arreglo"
                    className="flex h-11 w-11 shrink-0 items-center justify-center text-ink2 active:text-danger"
                  >
                    <IconTrash size={19} />
                  </button>
                </span>
              }
            />
          ))}
        </Card>
      ) : loading ? (
        <p className="px-4 py-14 text-center text-sm text-ink2">Cargando…</p>
      ) : (
        <EmptyState
          icon={<IconWrench size={40} />}
          title="Nada roto por acá"
          hint="Cuando encargues o hagas un arreglo, anotalo con el + para llevar el registro."
        />
      )}
      <FAB onClick={() => setFormOpen(true)} label="Nuevo arreglo" />
      <RepairFormSheet open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}

function RepairFormSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { hid } = useHome()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayISO())
  const [cost, setCost] = useState('')
  const [notes, setNotes] = useState('')

  // Resetear el formulario cada vez que se abre
  useEffect(() => {
    if (open) {
      setTitle('')
      setDate(todayISO())
      setCost('')
      setNotes('')
    }
  }, [open])

  const costNumber = cost.trim() === '' ? null : Number(cost)
  const costOk = costNumber === null || (Number.isFinite(costNumber) && costNumber >= 0)

  async function handleSubmit() {
    await addDoc(collection(db, 'households', hid, 'repairs'), {
      title: title.trim(),
      date,
      cost: costNumber,
      status: 'pendiente',
      notes: notes.trim(),
      createdAt: serverTimestamp(),
    })
  }

  return (
    <FormSheet
      open={open}
      onClose={onClose}
      title="Nuevo arreglo"
      onSubmit={handleSubmit}
      submitLabel="Agregar arreglo"
      canSubmit={title.trim().length > 0 && date.length > 0 && costOk}
    >
      <Field label="Título">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Cambiar el cuerito de la canilla"
          className={inputClass}
          autoFocus
        />
      </Field>
      <Field label="Fecha">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Costo (opcional)">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="$"
          className={inputClass}
        />
      </Field>
      <Field label="Notas (opcional)">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Quién lo hizo, qué faltó…"
          className={inputClass}
        />
      </Field>
    </FormSheet>
  )
}
