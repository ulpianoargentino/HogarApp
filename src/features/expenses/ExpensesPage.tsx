import { useMemo, useState } from 'react'
import { deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  Avatar,
  Card,
  EmptyState,
  FAB,
  ListRow,
  PageHeader,
  SectionTitle,
} from '../../components/ui'
import { IconChevron, IconTrash, IconWallet } from '../../components/icons'
import { useHome } from '../../hooks/useHousehold'
import { useCollection } from '../../hooks/useCollection'
import { formatARS } from '../../lib/money'
import { formatMonthYear, formatShort, monthRange } from '../../lib/dates'
import { EXPENSE_CATEGORIES, type Expense } from '../../types'
import { CATEGORY_EMOJI, categoryLabel } from './categories'
import ExpenseFormSheet from './ExpenseFormSheet'

export default function ExpensesPage() {
  const { hid, uid, household, partnerUid } = useHome()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-12
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
  const [from, to] = monthRange(year, month)

  const { data: expenses, loading } = useCollection<Expense>(hid, 'expenses', {
    filters: [
      ['date', '>=', from],
      ['date', '<=', to],
    ],
    orderByField: ['date', 'desc'],
  })

  function goPrev() {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
    } else {
      setMonth(month - 1)
    }
  }

  function goNext() {
    if (isCurrentMonth) return
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
    } else {
      setMonth(month + 1)
    }
  }

  const total = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses])

  const members = useMemo(
    () =>
      [uid, ...(partnerUid ? [partnerUid] : [])].map((m) => ({
        uid: m,
        profile: household.memberProfiles[m] ?? null,
        total: expenses.filter((e) => e.paidBy === m).reduce((sum, e) => sum + e.amount, 0),
      })),
    [uid, partnerUid, household.memberProfiles, expenses],
  )

  const byCategory = useMemo(
    () =>
      EXPENSE_CATEGORIES.map((category) => ({
        category,
        total: expenses
          .filter((e) => e.category === category)
          .reduce((sum, e) => sum + e.amount, 0),
      }))
        .filter((c) => c.total > 0)
        .sort((a, b) => b.total - a.total),
    [expenses],
  )

  async function deleteExpense(expense: Expense) {
    if (!window.confirm(`¿Borrar el gasto «${expense.description}»?`)) return
    await deleteDoc(doc(db, 'households', hid, 'expenses', expense.id))
  }

  function payerName(paidBy: string): string {
    return household.memberProfiles[paidBy]?.name.split(' ')[0] ?? 'Alguien'
  }

  return (
    <div>
      <PageHeader title="Gastos" />
      <div className="px-4 pt-3 pb-28">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Mes anterior"
            className="flex h-11 w-11 items-center justify-center text-ink2"
          >
            <IconChevron size={22} className="rotate-180" />
          </button>
          <span className="font-semibold capitalize">{formatMonthYear(year, month)}</span>
          <button
            type="button"
            onClick={goNext}
            disabled={isCurrentMonth}
            aria-label="Mes siguiente"
            className="flex h-11 w-11 items-center justify-center text-ink2 disabled:opacity-30"
          >
            <IconChevron size={22} />
          </button>
        </div>

        {expenses.length > 0 ? (
          <>
            <Card>
              <div className="px-4 pt-4 pb-2 text-center">
                <p className="text-sm text-ink2">Total del mes</p>
                <p className="text-3xl font-bold tracking-tight">{formatARS(total)}</p>
              </div>
              {members.map((m) => (
                <ListRow
                  key={m.uid}
                  left={<Avatar profile={m.profile} size={28} />}
                  title={m.profile?.name.split(' ')[0] ?? 'Alguien'}
                  right={<span className="font-semibold">{formatARS(m.total)}</span>}
                />
              ))}
            </Card>

            <SectionTitle>Por categoría</SectionTitle>
            <Card>
              {byCategory.map(({ category, total: catTotal }) => (
                <ListRow
                  key={category}
                  title={`${CATEGORY_EMOJI[category]} ${categoryLabel(category)}`}
                  right={<span className="font-semibold">{formatARS(catTotal)}</span>}
                />
              ))}
            </Card>

            <SectionTitle>Movimientos</SectionTitle>
            <Card>
              {expenses.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  payerName={payerName(expense.paidBy)}
                  onEdit={() => {
                    setEditing(expense)
                    setFormOpen(true)
                  }}
                  onDelete={() => deleteExpense(expense)}
                />
              ))}
            </Card>
          </>
        ) : loading ? (
          <p className="px-4 py-14 text-center text-sm text-ink2">Cargando…</p>
        ) : (
          <EmptyState
            icon={<IconWallet size={40} />}
            title="Todavía no anotaron gastos este mes"
            hint="Agregá el primero con el + y llevá la cuenta entre los dos."
          />
        )}
      </div>

      <FAB
        onClick={() => {
          setEditing(null)
          setFormOpen(true)
        }}
        label="Nuevo gasto"
      />
      <ExpenseFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        expense={editing}
      />
    </div>
  )
}

function ExpenseRow({
  expense,
  payerName,
  onEdit,
  onDelete,
}: {
  expense: Expense
  payerName: string
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <ListRow
      onClick={onEdit}
      title={expense.description}
      subtitle={`${formatShort(expense.date)} · ${payerName} · ${categoryLabel(expense.category)}`}
      right={
        <span className="flex shrink-0 items-center gap-1">
          <span className="font-semibold">{formatARS(expense.amount)}</span>
          <span
            role="button"
            aria-label="Borrar gasto"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="flex h-11 w-11 items-center justify-center text-ink2 active:text-danger"
          >
            <IconTrash size={19} />
          </span>
        </span>
      }
    />
  )
}
