import { EXPENSE_CATEGORIES, type ExpenseCategory } from '../../types'
import { CATEGORY_EMOJI, categoryLabel } from './categories'

/** Grilla simétrica 4 columnas de categorías (emoji arriba, label abajo). */
export function CategoryGrid({
  value,
  onChange,
}: {
  value: ExpenseCategory
  onChange: (c: ExpenseCategory) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Categoría">
      {EXPENSE_CATEGORIES.map((c) => {
        const on = value === c
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(c)}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 transition-colors duration-150 ${
              on
                ? 'border-brand bg-brand-soft text-brand dark:border-accent dark:text-accent'
                : 'border-line bg-card2 text-ink2'
            }`}
          >
            <span className="text-xl leading-none" aria-hidden>
              {CATEGORY_EMOJI[c]}
            </span>
            <span className="text-[11px] leading-tight font-semibold">{categoryLabel(c)}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Emoji de categoría en un círculo gris (para filas de listas). */
export function CategoryDot({
  category,
  size = 28,
}: {
  category: ExpenseCategory
  size?: number
}) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-card2"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      aria-hidden
    >
      {CATEGORY_EMOJI[category]}
    </span>
  )
}
