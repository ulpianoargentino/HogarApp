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
  Field,
  FormSheet,
  GhostButton,
  MemberPicker,
  MoneyInput,
  inputClass,
} from '../../components/ui'
import { useHome } from '../../hooks/useHousehold'
import { todayISO } from '../../lib/dates'
import type { Expense, ExpenseCategory } from '../../types'
import { CATEGORY_EMOJI, categoryLabel } from './categories'
import { CategoryGrid } from './CategoryGrid'
import { useMembers } from './useMembers'

export default function ExpenseFormSheet({
  open,
  onClose,
  expense,
}: {
  open: boolean
  onClose: () => void
  /** null = alta (gasto variable); con gasto = edición */
  expense: Expense | null
}) {
  const { hid, uid } = useHome()
  const members = useMembers()
  const [date, setDate] = useState(todayISO())
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('supermercado')
  const [paidBy, setPaidBy] = useState(uid)

  const isFixed = expense?.kind === 'fijo'

  // Precargar (edición) o resetear (alta) cada vez que se abre
  useEffect(() => {
    if (!open) return
    if (expense) {
      setDate(expense.date)
      setDescription(expense.description)
      setAmount(String(expense.amount))
      setCategory(expense.category)
      setPaidBy(expense.paidBy)
    } else {
      setDate(todayISO())
      setDescription('')
      setAmount('')
      setCategory('supermercado')
      setPaidBy(uid)
    }
  }, [open, expense, uid])

  const parsedAmount = Number.parseInt(amount, 10) || 0
  const canSubmit =
    parsedAmount > 0 && date.length > 0 && (isFixed || description.trim().length > 0)

  async function handleSubmit() {
    if (expense) {
      const ref = doc(db, 'households', hid, 'expenses', expense.id)
      if (isFixed) {
        await updateDoc(ref, { amount: parsedAmount, date, paidBy })
      } else {
        await updateDoc(ref, {
          amount: parsedAmount,
          description: description.trim(),
          category,
          paidBy,
          date,
        })
      }
      return
    }
    await addDoc(collection(db, 'households', hid, 'expenses'), {
      amount: parsedAmount,
      description: description.trim(),
      category,
      paidBy,
      date,
      kind: 'variable',
      fixedExpenseId: null,
      fixedDueDate: null,
      createdBy: uid,
      createdAt: serverTimestamp(),
    })
  }

  async function handleDelete() {
    if (!expense) return
    if (!window.confirm(`¿Eliminar el gasto «${expense.description}»?`)) return
    try {
      await deleteDoc(doc(db, 'households', hid, 'expenses', expense.id))
      onClose()
    } catch {
      alert('No se pudo eliminar el gasto. Probá de nuevo.')
    }
  }

  return (
    <FormSheet
      open={open}
      onClose={onClose}
      title={expense ? (isFixed ? 'Editar pago' : 'Editar gasto') : 'Nuevo gasto'}
      onSubmit={handleSubmit}
      submitLabel={expense ? 'Guardar cambios' : 'Agregar gasto'}
      canSubmit={canSubmit}
      footer={
        expense ? (
          <GhostButton tone="danger" onClick={handleDelete}>
            Eliminar gasto
          </GhostButton>
        ) : undefined
      }
    >
      {isFixed && expense && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-brand-soft px-3.5 py-3">
          <span className="text-xl leading-none" aria-hidden>
            {CATEGORY_EMOJI[expense.category]}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-brand dark:text-accent">
              {expense.description}
            </p>
            <p className="text-xs text-ink2">
              Gasto fijo · {categoryLabel(expense.category)}. Podés cambiar el monto, la fecha
              y quién lo pagó.
            </p>
          </div>
        </div>
      )}

      <Field label="Fecha">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
        />
      </Field>

      {!isFixed && (
        <Field label="Descripción">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Compra semanal"
            className={inputClass}
            autoFocus={!expense}
          />
        </Field>
      )}

      <Field label="Monto">
        <MoneyInput value={amount} onChange={setAmount} placeholder="0" />
      </Field>

      {!isFixed && (
        <Field label="Categoría">
          <CategoryGrid value={category} onChange={setCategory} />
        </Field>
      )}

      <Field label="Quién pagó">
        <MemberPicker members={members} value={paidBy} onChange={setPaidBy} />
      </Field>
    </FormSheet>
  )
}
