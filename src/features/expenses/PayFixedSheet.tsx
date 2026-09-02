import { useEffect, useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useHome } from '../../hooks/useHousehold'
import { Field, FormSheet, inputClass, MemberPicker, MoneyInput } from '../../components/ui'
import { formatLong } from '../../lib/dates'
import type { FixedExpense } from '../../types'

/**
 * Registra el pago de una ocurrencia de un gasto fijo: crea el movimiento en
 * `expenses` (kind 'fijo', sin puntos) con el monto precargado y editable.
 * Se usa desde Tareas, Inicio, Calendario y Gastos.
 */
export function PayFixedSheet({
  due,
  onClose,
}: {
  /** null = cerrado */
  due: { fixed: FixedExpense; dueDate: string } | null
  onClose: () => void
}) {
  const { hid, uid, household, partnerUid } = useHome()
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState(uid)
  const [date, setDate] = useState('')

  useEffect(() => {
    if (!due) return
    setAmount(String(due.fixed.amount))
    setPaidBy(due.fixed.paidBy ?? uid)
    setDate(due.dueDate)
  }, [due, uid])

  const members = [uid, partnerUid]
    .filter((m): m is string => Boolean(m))
    .map((m) => ({ uid: m, profile: household.memberProfiles[m] }))
    .filter((m) => m.profile)

  async function submit() {
    if (!due) return
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) throw new Error('Ingresá el monto pagado.')
    await addDoc(collection(db, 'households', hid, 'expenses'), {
      amount: Math.round(value),
      description: due.fixed.name,
      category: due.fixed.category,
      paidBy,
      date: date || due.dueDate,
      kind: 'fijo',
      fixedExpenseId: due.fixed.id,
      fixedDueDate: due.dueDate,
      createdBy: uid,
      createdAt: serverTimestamp(),
    })
  }

  return (
    <FormSheet
      open={due !== null}
      onClose={onClose}
      title={due ? `Pagar ${due.fixed.name}` : ''}
      onSubmit={submit}
      submitLabel="Registrar pago"
      canSubmit={Number(amount) > 0}
    >
      {due && (
        <p className="mb-4 text-sm text-ink2">
          Vence el {formatLong(due.dueDate)}. Se guarda como gasto fijo del mes.
        </p>
      )}
      <Field label="Fecha de pago">
        <input
          type="date"
          className={inputClass}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>
      <Field label="Monto">
        <MoneyInput value={amount} onChange={setAmount} placeholder="0" />
      </Field>
      <Field label="Quién pagó">
        <MemberPicker members={members} value={paidBy} onChange={setPaidBy} />
      </Field>
    </FormSheet>
  )
}
