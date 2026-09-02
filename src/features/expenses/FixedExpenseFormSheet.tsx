import { useEffect, useState } from 'react'
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  Chip,
  Field,
  FormSheet,
  GhostButton,
  MemberPicker,
  MoneyInput,
  inputClass,
} from '../../components/ui'
import { useHome } from '../../hooks/useHousehold'
import { todayISO } from '../../lib/dates'
import type { ExpenseCategory, FixedExpense } from '../../types'
import { CategoryGrid } from './CategoryGrid'
import { firstDueFrom } from './fixedDue'
import { useMembers } from './useMembers'

const REMIND_OPTIONS = [1, 3, 7]

export default function FixedExpenseFormSheet({
  open,
  onClose,
  fixed,
}: {
  open: boolean
  onClose: () => void
  /** null = alta; con gasto fijo = edición */
  fixed: FixedExpense | null
}) {
  const { hid, uid } = useHome()
  const members = useMembers()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('alquiler')
  const [day, setDay] = useState('10')
  const [paidBy, setPaidBy] = useState<string | null>(uid)
  const [remind, setRemind] = useState(3)

  useEffect(() => {
    if (!open) return
    if (fixed) {
      setName(fixed.name)
      setAmount(String(fixed.amount))
      setCategory(fixed.category)
      setDay(String(fixed.dayOfMonth))
      setPaidBy(fixed.paidBy)
      setRemind(fixed.remindDaysBefore)
    } else {
      setName('')
      setAmount('')
      setCategory('alquiler')
      setDay('10')
      setPaidBy(uid)
      setRemind(3)
    }
  }, [open, fixed, uid])

  const parsedAmount = Number.parseInt(amount, 10) || 0
  const parsedDay = Number.parseInt(day, 10) || 0
  const dayOk = parsedDay >= 1 && parsedDay <= 31
  const canSubmit = name.trim().length > 0 && parsedAmount > 0 && dayOk

  async function handleSubmit() {
    const base = {
      name: name.trim(),
      amount: parsedAmount,
      category,
      dayOfMonth: parsedDay,
      paidBy,
      remindDaysBefore: remind,
    }
    if (fixed) {
      const ref = doc(db, 'households', hid, 'fixedExpenses', fixed.id)
      await updateDoc(ref, {
        ...base,
        ...(fixed.dayOfMonth !== parsedDay ? { startDate: firstDueFrom(parsedDay) } : {}),
      })
      return
    }
    await addDoc(collection(db, 'households', hid, 'fixedExpenses'), {
      ...base,
      startDate: firstDueFrom(parsedDay),
      endDate: null,
      active: true,
      createdBy: uid,
      createdAt: serverTimestamp(),
    })
  }

  async function handleStop() {
    if (!fixed) return
    if (
      !window.confirm(
        `¿Dejar de programar «${fixed.name}»? Los pagos ya anotados se conservan.`,
      )
    )
      return
    try {
      await updateDoc(doc(db, 'households', hid, 'fixedExpenses', fixed.id), {
        active: false,
        endDate: todayISO(),
      })
      onClose()
    } catch {
      alert('No se pudo dejar de programar. Probá de nuevo.')
    }
  }

  return (
    <FormSheet
      open={open}
      onClose={onClose}
      title={fixed ? 'Editar gasto fijo' : 'Programar gasto fijo'}
      onSubmit={handleSubmit}
      submitLabel={fixed ? 'Guardar cambios' : 'Programar'}
      canSubmit={canSubmit}
      footer={
        fixed ? (
          <GhostButton tone="danger" onClick={handleStop}>
            Dejar de programar
          </GhostButton>
        ) : undefined
      }
    >
      <Field label="Nombre">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alquiler, expensas, luz…"
          className={inputClass}
          autoFocus={!fixed}
        />
      </Field>

      <Field label="Monto estimado" hint="Lo confirmás cada vez que lo pagás.">
        <MoneyInput value={amount} onChange={setAmount} placeholder="0" />
      </Field>

      <Field label="Categoría">
        <CategoryGrid value={category} onChange={setCategory} />
      </Field>

      <Field
        label="Día del mes en que vence"
        hint="Si el mes es más corto, cae el último día."
      >
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={31}
          step={1}
          value={day}
          onChange={(e) => setDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
          className={`${inputClass} tabular`}
        />
      </Field>

      <Field label="Quién suele pagarlo">
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <MemberPicker members={members} value={paidBy ?? ''} onChange={setPaidBy} />
          </div>
          <Chip selected={paidBy === null} onClick={() => setPaidBy(null)}>
            Cualquiera
          </Chip>
        </div>
      </Field>

      <Field label="Avisar días antes">
        <div className="flex gap-2">
          {REMIND_OPTIONS.map((n) => (
            <Chip key={n} selected={remind === n} onClick={() => setRemind(n)}>
              {n === 1 ? '1 día' : `${n} días`}
            </Chip>
          ))}
        </div>
      </Field>
    </FormSheet>
  )
}
