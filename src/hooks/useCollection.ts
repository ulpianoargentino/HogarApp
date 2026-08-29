import { useEffect, useMemo, useRef, useState } from 'react'
import {
  collection,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  where,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface CollectionOptions {
  /** [campo, dirección] — un solo campo para no necesitar índices compuestos */
  orderByField?: [string, 'asc' | 'desc']
  /** Filtros where simples (mismo campo que orderBy si hay rango) */
  filters?: Array<[string, '==' | '>=' | '<=', unknown]>
  max?: number
}

/**
 * Suscripción en tiempo real a una subcolección del hogar.
 * Devuelve los docs con `id` incluido y un flag de carga.
 */
export function useCollection<T extends { id: string }>(
  hid: string,
  sub: string,
  options: CollectionOptions = {},
): { data: T[]; loading: boolean } {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  // Clave estable para no re-suscribir en cada render
  const optionsKey = JSON.stringify(options)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    const { orderByField, filters, max } = optionsRef.current
    const constraints: QueryConstraint[] = []
    for (const [field, op, value] of filters ?? []) {
      constraints.push(where(field, op, value))
    }
    if (orderByField) constraints.push(orderBy(orderByField[0], orderByField[1]))
    constraints.push(fsLimit(max ?? 500))

    setLoading(true)
    const q = query(collection(db, 'households', hid, sub), ...constraints)
    return onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as T[])
        setLoading(false)
      },
      (err) => {
        console.error(`useCollection(${sub})`, err)
        setLoading(false)
      },
    )
  }, [hid, sub, optionsKey])

  return useMemo(() => ({ data, loading }), [data, loading])
}
