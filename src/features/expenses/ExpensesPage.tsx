import { useMemo, useState } from 'react'
import {
  Avatar,
  Card,
  EmptyState,
  FAB,
  IconButton,
  ListRow,
  PageHeader,
  SectionTitle,
} from '../../components/ui'
import {
  IconCheck,
  IconChevron,
  IconChevronLeft,
  IconPlus,
  IconWallet,
} from '../../components/icons'
import { useHome } from '../../hooks/useHousehold'
import { useCollection } from '../../hooks/useCollection'
import { formatARS } from '../../lib/money'
import { formatMonthYear, formatShort, fromISO, monthRange } from '../../lib/dates'
import { fixedDuesBetween, type FixedDue } from '../../lib/fixed'
import { EXPENSE_CATEGORIES, type Expense, type FixedExpense } from '../../types'
import { categoryLabel } from './categories'
import { CategoryDot } from './CategoryGrid'
import ExpenseFormSheet from './ExpenseFormSheet'
import FixedExpenseFormSheet from './FixedExpenseFormSheet'
import { PayFixedSheet } from './PayFixedSheet'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function ExpensesPage() {
  const { hid, uid, household, partnerUid } = useHome()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-12

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [fixedFormOpen, setFixedFormOpen] = useState(false)
  const [editingFixed, setEditingFixed] = useState<FixedExpense | null>(null)
  const [paying, setPaying] = useState<{ fixed: FixedExpense; dueDate: string } | null>(null)

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
  const [from, to] = monthRange(year, month)

  const { data: expenses, loading } = useCollection<Expense>(hid, 'expenses', {
    filters: [
      ['date', '>=', from],
      ['date', '<=', to],
    ],
    orderByField: ['date', 'desc'],
  })
  const { data: fixedList } = useCollection<FixedExpense>(hid, 'fixedExpenses', {
    orderByField: ['dayOfMonth', 'asc'],
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
  const fixedTotal = useMemo(
    () => expenses.filter((e) => e.kind === 'fijo').reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  )
  const variableTotal = total - fixedTotal
  const fixedPct = total > 0 ? Math.round((fixedTotal / total) * 100) : 0

  const members = useMemo(
    () =>
      [uid, ...(partnerUid ? [partnerUid] : [])].map((m) => ({
        uid: m,
        profile: household.memberProfiles[m] ?? null,
        total: expenses.filter((e) => e.paidBy === m).reduce((sum, e) => sum + e.amount, 0),
      })),
    [uid, partnerUid, household.memberProfiles, expenses],
  )

  const dues = useMemo(
    () => fixedDuesBetween(fixedList, expenses, from, to),
    [fixedList, expenses, from, to],
  )
  const paidCount = dues.filter((d) => d.paid).length

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

  function firstName(memberUid: string): string {
    return household.memberProfiles[memberUid]?.name.split(' ')[0] ?? 'Alguien'
  }

  function openFixedForm(fixed: FixedExpense | null) {
    setEditingFixed(fixed)
    setFixedFormOpen(true)
  }

  const hasAnything = expenses.length > 0 || dues.length > 0
  const monthLabel = capitalize(formatMonthYear(year, month))

  return (
    <div>
      <PageHeader
        title="Gastos"
        eyebrow={monthLabel}
        right={
          <div className="flex gap-2">
            <IconButton label="Mes anterior" onClick={goPrev}>
              <IconChevronLeft size={22} />
            </IconButton>
            <span
              aria-disabled={isCurrentMonth}
              className={isCurrentMonth ? 'pointer-events-none opacity-35' : ''}
            >
              <IconButton label="Mes siguiente" onClick={goNext}>
                <IconChevron size={22} />
              </IconButton>
            </span>
          </div>
        }
      />

      <div className="px-4 pt-2 pb-28">
        {!hasAnything && loading ? (
          <p className="px-4 py-14 text-center text-sm text-ink2">Cargando…</p>
        ) : !hasAnything ? (
          <>
            <EmptyState
              icon={<IconWallet size={30} />}
              title={`Sin gastos en ${monthLabel.toLowerCase()}`}
              hint="Anotá el primero con el + o programá los fijos de todos los meses."
            />
            <Card>
              <AddFixedRow onClick={() => openFixedForm(null)} />
            </Card>
          </>
        ) : (
          <>
            {/* Resumen del mes */}
            <Card className="px-4 pt-4 pb-1">
              <p className="text-[13px] font-semibold text-ink2">Total del mes</p>
              <p className="tabular font-display text-3xl font-extrabold tracking-tight">
                {formatARS(total)}
              </p>
              <div
                className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-card2"
                role="img"
                aria-label={`Fijos ${fixedPct}%, variables ${100 - fixedPct}%`}
              >
                {fixedTotal > 0 && (
                  <div className="h-full bg-brand" style={{ width: `${fixedPct}%` }} />
                )}
                {variableTotal > 0 && (
                  <div className="h-full flex-1 bg-accent" />
                )}
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs text-ink2">
                <span className="inline-block h-2 w-2 rounded-full bg-brand" aria-hidden />
                <span>
                  Fijos <span className="tabular font-semibold text-ink">{formatARS(fixedTotal)}</span>
                </span>
                <span aria-hidden>·</span>
                <span className="inline-block h-2 w-2 rounded-full bg-accent" aria-hidden />
                <span>
                  Variables{' '}
                  <span className="tabular font-semibold text-ink">{formatARS(variableTotal)}</span>
                </span>
              </p>
              <div className="mt-3 border-t border-line">
                {members.map((m) => (
                  <div key={m.uid} className="flex min-h-12 items-center gap-3 py-2">
                    <Avatar profile={m.profile} size={28} />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {m.profile?.name.split(' ')[0] ?? 'Alguien'}
                    </span>
                    <span className="tabular font-semibold">{formatARS(m.total)}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Gastos fijos del mes */}
            <SectionTitle right={dues.length > 0 ? `${paidCount}/${dues.length}` : undefined}>
              Gastos fijos
            </SectionTitle>
            <Card>
              {dues.length === 0 && (
                <p className="border-b border-line px-4 py-3 text-[13px] text-ink2">
                  Programá alquiler, expensas, servicios… y el calendario te avisa cada mes.
                </p>
              )}
              {dues.map((due) => (
                <FixedDueRow
                  key={`${due.fixed.id}_${due.dueDate}`}
                  due={due}
                  onEdit={() => openFixedForm(due.fixed)}
                  onPay={() => setPaying({ fixed: due.fixed, dueDate: due.dueDate })}
                />
              ))}
              <AddFixedRow onClick={() => openFixedForm(null)} />
            </Card>

            {/* Por categoría */}
            {byCategory.length > 0 && (
              <>
                <SectionTitle>Por categoría</SectionTitle>
                <Card>
                  {byCategory.map(({ category, total: catTotal }) => (
                    <ListRow
                      key={category}
                      left={<CategoryDot category={category} />}
                      title={categoryLabel(category)}
                      right={
                        <span className="tabular font-semibold">{formatARS(catTotal)}</span>
                      }
                    />
                  ))}
                </Card>
              </>
            )}

            {/* Movimientos */}
            {expenses.length > 0 && (
              <>
                <SectionTitle right={String(expenses.length)}>Movimientos</SectionTitle>
                <Card>
                  {expenses.map((expense) => (
                    <ListRow
                      key={expense.id}
                      onClick={() => {
                        setEditing(expense)
                        setFormOpen(true)
                      }}
                      left={<CategoryDot category={expense.category} />}
                      title={expense.description}
                      subtitle={
                        <>
                          {formatShort(expense.date)} · {firstName(expense.paidBy)}
                          {expense.kind === 'fijo' && (
                            <span className="ml-1.5 inline-block rounded bg-brand-soft px-1.5 text-[11px] font-semibold text-brand dark:text-accent">
                              Fijo
                            </span>
                          )}
                        </>
                      }
                      right={
                        <span className="tabular shrink-0 font-semibold">
                          {formatARS(expense.amount)}
                        </span>
                      }
                    />
                  ))}
                </Card>
              </>
            )}
          </>
        )}
      </div>

      <FAB
        onClick={() => {
          setEditing(null)
          setFormOpen(true)
        }}
        label="Nuevo gasto"
      />
      <ExpenseFormSheet open={formOpen} onClose={() => setFormOpen(false)} expense={editing} />
      <FixedExpenseFormSheet
        open={fixedFormOpen}
        onClose={() => setFixedFormOpen(false)}
        fixed={editingFixed}
      />
      <PayFixedSheet due={paying} onClose={() => setPaying(null)} />
    </div>
  )
}

function FixedDueRow({
  due,
  onEdit,
  onPay,
}: {
  due: FixedDue
  onEdit: () => void
  onPay: () => void
}) {
  const { fixed, dueDate, paid } = due
  const dueDay = fromISO(dueDate).getDate()
  return (
    <div className="flex min-h-14 items-center gap-3 border-b border-line px-4 py-2 last:border-b-0">
      <button
        type="button"
        onClick={onEdit}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left"
      >
        <CategoryDot category={fixed.category} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{fixed.name}</span>
          <span className="block truncate text-[13px] text-ink2">
            Vence el {dueDay} · <span className="tabular">{formatARS(fixed.amount)}</span>
          </span>
        </span>
      </button>
      {paid ? (
        <span className="flex shrink-0 items-center gap-1.5 text-ok">
          <IconCheck size={18} strokeWidth={2.4} />
          <span className="tabular font-semibold text-ink">{formatARS(paid.amount)}</span>
        </span>
      ) : (
        <button
          type="button"
          onClick={onPay}
          className="min-h-9 shrink-0 rounded-full bg-brand-soft px-3 text-sm font-semibold text-brand transition-colors duration-150 active:bg-line dark:text-accent"
        >
          Pagar
        </button>
      )}
    </div>
  )
}

function AddFixedRow({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left font-semibold text-brand transition-colors duration-150 active:bg-card2 dark:text-accent"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft">
        <IconPlus size={18} />
      </span>
      Programar gasto fijo
    </button>
  )
}
