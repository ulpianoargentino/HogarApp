import type { ExpenseCategory } from '../../types'

export const CATEGORY_EMOJI: Record<ExpenseCategory, string> = {
  supermercado: '🛒',
  servicios: '💡',
  alquiler: '🏠',
  salud: '🩺',
  ocio: '🍿',
  hogar: '🛋️',
  otro: '📦',
}

/** 'supermercado' → 'Supermercado' */
export function categoryLabel(category: ExpenseCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1)
}
