import { occurrencesBetween } from './recurrence'
import type { Expense, FixedExpense } from '../types'

/** Vencimientos de un gasto fijo dentro del rango (mensual, día clampeado). */
export function fixedDueDates(fixed: FixedExpense, from: string, to: string): string[] {
  if (!fixed.active) return []
  return occurrencesBetween(
    {
      startDate: fixed.startDate,
      recurrence: { freq: 'monthly', interval: 1 },
      endDate: fixed.endDate,
    },
    from,
    to,
  )
}

/** El movimiento que saldó una ocurrencia, si existe. */
export function fixedPayment(
  fixed: FixedExpense,
  dueDate: string,
  expenses: Expense[],
): Expense | null {
  return (
    expenses.find((e) => e.fixedExpenseId === fixed.id && e.fixedDueDate === dueDate) ?? null
  )
}

export interface FixedDue {
  fixed: FixedExpense
  dueDate: string
  paid: Expense | null
}

/** Ocurrencias de todos los gastos fijos en el rango, con su estado de pago. */
export function fixedDuesBetween(
  fixedList: FixedExpense[],
  expenses: Expense[],
  from: string,
  to: string,
): FixedDue[] {
  const out: FixedDue[] = []
  for (const fixed of fixedList) {
    for (const dueDate of fixedDueDates(fixed, from, to)) {
      out.push({ fixed, dueDate, paid: fixedPayment(fixed, dueDate, expenses) })
    }
  }
  return out.sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0))
}
