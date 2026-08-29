import { useCollection } from '../../hooks/useCollection'
import { normalizeText } from '../../lib/normalize'
import type { Product } from '../../types'

/** Productos usados alguna vez en el hogar, ordenados por frecuencia (autocompletado) */
export function useProducts(hid: string) {
  return useCollection<Product>(hid, 'products', {
    orderByField: ['count', 'desc'],
    max: 150,
  })
}

/**
 * Hasta `max` sugerencias para el texto tipeado (mínimo 2 caracteres):
 * primero matches por prefijo de nameNorm, después por includes.
 */
export function suggestProducts(products: Product[], input: string, max = 6): Product[] {
  const norm = normalizeText(input)
  if (norm.length < 2) return []
  const byPrefix: Product[] = []
  const byIncludes: Product[] = []
  for (const p of products) {
    if (p.nameNorm.startsWith(norm)) byPrefix.push(p)
    else if (p.nameNorm.includes(norm)) byIncludes.push(p)
  }
  return [...byPrefix, ...byIncludes].slice(0, max)
}
