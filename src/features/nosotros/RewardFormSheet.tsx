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
import { Field, FormSheet, GhostButton, inputClass } from '../../components/ui'
import { useHome } from '../../hooks/useHousehold'
import type { Reward } from '../../types'

const DEFAULT_COST = '30'

export default function RewardFormSheet({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  /** Premio a editar; null = alta */
  editing: Reward | null
}) {
  const { hid, uid } = useHome()
  const [title, setTitle] = useState('')
  const [cost, setCost] = useState(DEFAULT_COST)

  // Precargar (edición) o resetear (alta) cada vez que se abre
  useEffect(() => {
    if (open) {
      setTitle(editing?.title ?? '')
      setCost(editing ? String(editing.cost) : DEFAULT_COST)
    }
  }, [open, editing])

  const costNumber = Number(cost)
  const costOk = Number.isInteger(costNumber) && costNumber > 0

  async function handleSubmit() {
    const data = { title: title.trim(), cost: costNumber }
    if (editing) {
      await updateDoc(doc(db, 'households', hid, 'rewards', editing.id), data)
    } else {
      await addDoc(collection(db, 'households', hid, 'rewards'), {
        ...data,
        active: true,
        createdBy: uid,
        createdAt: serverTimestamp(),
      })
    }
  }

  async function handleDelete() {
    if (!editing) return
    if (!window.confirm(`¿Borrar el premio «${editing.title}»?`)) return
    try {
      await deleteDoc(doc(db, 'households', hid, 'rewards', editing.id))
      onClose()
    } catch {
      alert('No se pudo borrar. Probá de nuevo.')
    }
  }

  return (
    <FormSheet
      open={open}
      onClose={onClose}
      title={editing ? 'Editar premio' : 'Nuevo premio'}
      onSubmit={handleSubmit}
      submitLabel={editing ? 'Guardar cambios' : 'Agregar premio'}
      canSubmit={title.trim().length > 0 && costOk}
      footer={
        editing ? (
          <GhostButton tone="danger" onClick={handleDelete}>
            Eliminar premio
          </GhostButton>
        ) : undefined
      }
    >
      <Field label="Título">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Elegís la peli del viernes"
          className={inputClass}
          autoFocus
        />
      </Field>
      <Field label="Costo en puntos">
        <input
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          className={`${inputClass} tabular font-display text-lg font-bold`}
        />
      </Field>
    </FormSheet>
  )
}
