import { useEffect, useState } from 'react'
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Chip, Field, FormSheet, MemberPicker, inputClass } from '../../components/ui'
import { useHome } from '../../hooks/useHousehold'
import { todayISO } from '../../lib/dates'
import { EXPENSE_CATEGORIES, type Expense, type ExpenseCategory } from '../../types'
import { CATEGORY_EMOJI, categoryLabel } from './categories'

export default function ExpenseFormSheet({
  open,
  onClose,
  expense,
}: {
  open: boolean
  onClose: () => void
  /** null = alta; con gasto = edición */
  expense: Expense | null
}) {
  const { hid, uid, partnerUid, myProfile, partnerProfile } = useHome()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('supermercado')
  const [paidBy, setPaidBy] = useState(uid)
  const [date, setDate] = useState(todayISO())

  // Precargar (edición) o resetear (alta) cada vez que se abre
  useEffect(() => {
    if (!open) return
    if (expense) {
      setAmount(String(expense.amount))
      setDescription(expense.description)
      setCategory(expense.category)
      setPaidBy(expense.paidBy)
      setDate(expense.date)
    } else {
      setAmount('')
      setDescription('')
      setCategory('supermercado')
      setPaidBy(uid)
      setDate(todayISO())
    }
  }, [open, expense, uid])

  const members = [
    { uid, profile: myProfile ?? { name: 'Vos', photoURL: null } },
    ...(partnerUid
      ? [{ uid: partnerUid, profile: partnerProfile ?? { name: 'Tu pareja', photoURL: null } }]
      : []),
  ]

  const parsedAmount = Number.parseInt(amount, 10) || 0
  const canSubmit = parsedAmount > 0 && description.trim().length > 0 && date.length > 0

  async function handleSubmit() {
    const data = {
      amount: parsedAmount,
      description: description.trim(),
      category,
      paidBy,
      date,
    }
    if (expense) {
      await updateDoc(doc(db, 'households', hid, 'expenses', expense.id), data)
    } else {
      await addDoc(collection(db, 'households', hid, 'expenses'), {
        ...data,
        createdBy: uid,
        createdAt: serverTimestamp(),
      })
    }
  }

  return (
    <FormSheet
      open={open}
      onClose={onClose}
      title={expense ? 'Editar gasto' : 'Nuevo gasto'}
      onSubmit={handleSubmit}
      submitLabel={expense ? 'Guardar cambios' : 'Agregar gasto'}
      canSubmit={canSubmit}
    >
      <Field label="Monto (ARS)">
        <input
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
          placeholder="15300"
          className={inputClass}
          autoFocus={!expense}
        />
      </Field>
      <Field label="Descripción">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Compra semanal"
          className={inputClass}
        />
      </Field>
      <Field label="Categoría">
        <div className="flex flex-wrap gap-2">
          {EXPENSE_CATEGORIES.map((c) => (
            <Chip key={c} selected={category === c} onClick={() => setCategory(c)}>
              {CATEGORY_EMOJI[c]} {categoryLabel(c)}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="¿Quién pagó?">
        <MemberPicker members={members} value={paidBy} onChange={setPaidBy} />
      </Field>
      <Field label="Fecha">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
        />
      </Field>
    </FormSheet>
  )
}
