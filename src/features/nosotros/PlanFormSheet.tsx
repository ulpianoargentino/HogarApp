import { useEffect, useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Field, FormSheet, inputClass } from '../../components/ui'
import { useHome } from '../../hooks/useHousehold'
import type { PlanKind } from '../../types'

const COPY: Record<PlanKind, { title: string; placeholder: string; submit: string }> = {
  plan: { title: 'Nuevo plan', placeholder: 'Cena en la parrilla nueva', submit: 'Agregar plan' },
  serie: { title: 'Nueva serie', placeholder: 'The Bear', submit: 'Agregar serie' },
  escapada: { title: 'Nueva escapada', placeholder: 'Finde en Tigre', submit: 'Agregar escapada' },
}

export default function PlanFormSheet({
  open,
  onClose,
  kind,
}: {
  open: boolean
  onClose: () => void
  kind: PlanKind
}) {
  const { hid, uid } = useHome()
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')

  // Resetear el formulario cada vez que se abre
  useEffect(() => {
    if (open) {
      setTitle('')
      setNotes('')
    }
  }, [open])

  async function handleSubmit() {
    await addDoc(collection(db, 'households', hid, 'planes'), {
      title: title.trim(),
      kind,
      status: 'idea',
      notes: notes.trim(),
      createdBy: uid,
      createdAt: serverTimestamp(),
      doneAt: null,
    })
  }

  const copy = COPY[kind]

  return (
    <FormSheet
      open={open}
      onClose={onClose}
      title={copy.title}
      onSubmit={handleSubmit}
      submitLabel={copy.submit}
      canSubmit={title.trim().length > 0}
    >
      <Field label="Título">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={copy.placeholder}
          className={inputClass}
          autoFocus
        />
      </Field>
      <Field label="Notas (opcional)">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Un detalle para acordarse"
          className={inputClass}
        />
      </Field>
    </FormSheet>
  )
}
