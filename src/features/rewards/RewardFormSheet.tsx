import { useEffect, useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Field, FormSheet, inputClass } from '../../components/ui'
import { useHome } from '../../hooks/useHousehold'

export default function RewardFormSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { hid, uid } = useHome()
  const [title, setTitle] = useState('')
  const [cost, setCost] = useState('30')

  // Resetear el formulario cada vez que se abre
  useEffect(() => {
    if (open) {
      setTitle('')
      setCost('30')
    }
  }, [open])

  const costNumber = Number(cost)
  const costOk = Number.isInteger(costNumber) && costNumber > 0

  async function handleSubmit() {
    await addDoc(collection(db, 'households', hid, 'rewards'), {
      title: title.trim(),
      cost: costNumber,
      active: true,
      createdBy: uid,
      createdAt: serverTimestamp(),
    })
  }

  return (
    <FormSheet
      open={open}
      onClose={onClose}
      title="Nuevo premio"
      onSubmit={handleSubmit}
      submitLabel="Agregar premio"
      canSubmit={title.trim().length > 0 && costOk}
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
          className={inputClass}
        />
      </Field>
    </FormSheet>
  )
}
