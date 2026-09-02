import { useRef, useState, type FormEvent } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { normalizeText, slugify } from '../../lib/normalize'
import { useHome } from '../../hooks/useHousehold'
import { useCollection } from '../../hooks/useCollection'
import {
  Card,
  Checkbox,
  Chip,
  EmptyState,
  IconButton,
  ListRow,
  inputClass,
} from '../../components/ui'
import { IconCart, IconPlus, IconTrash, IconX } from '../../components/icons'
import type { InventoryItem, InventoryLocation, ShoppingItem } from '../../types'
import { LOCATIONS } from './locations'
import { suggestProducts, useProducts } from './useProducts'

export default function ShoppingList() {
  const { hid, uid } = useHome()
  const { data: items, loading } = useCollection<ShoppingItem>(hid, 'shoppingItems', {
    orderByField: ['createdAt', 'asc'],
  })
  const { data: inventory } = useCollection<InventoryItem>(hid, 'inventoryItems', {
    orderByField: ['nameNorm', 'asc'],
  })
  const { data: products } = useProducts(hid)

  const [input, setInput] = useState('')
  const [flash, setFlash] = useState<string | null>(null)
  const flashTimer = useRef<number | null>(null)
  /** Ítem que se está procesando (para mostrar el check lleno mientras tanto) */
  const [busyId, setBusyId] = useState<string | null>(null)
  /** Ítem tildado sin categoría conocida: está eligiendo dónde va */
  const [choosingId, setChoosingId] = useState<string | null>(null)

  const suggestions = suggestProducts(products, input)

  const itemRef = (id: string) => doc(db, 'households', hid, 'shoppingItems', id)
  const inventoryRef = (id: string) => doc(db, 'households', hid, 'inventoryItems', id)
  const productRef = (name: string) => doc(db, 'households', hid, 'products', slugify(name))

  function showFlash(msg: string) {
    setFlash(msg)
    if (flashTimer.current) window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(null), 1800)
  }

  // ----- Alta -----

  async function addItem(rawName: string) {
    const name = rawName.trim()
    if (!name) return
    setInput('')
    const nameNorm = normalizeText(name)
    if (items.some((i) => i.nameNorm === nameNorm)) {
      showFlash('Ya está en la lista')
      return
    }
    await addDoc(collection(db, 'households', hid, 'shoppingItems'), {
      name,
      nameNorm,
      addedBy: uid,
      createdAt: serverTimestamp(),
      fromInventoryId: null,
    })
    // Aprender el producto para el autocompletado (sin pisar la categoría recordada)
    await setDoc(
      productRef(name),
      { name, nameNorm, count: increment(1), lastUsedAt: serverTimestamp() },
      { merge: true },
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    addItem(input)
  }

  // ----- Comprado → Provisiones -----

  /**
   * Saca el ítem de la lista y lo deja como "Hay" en Provisiones en la categoría dada.
   * Si ya existe uno con el mismo nombre, lo actualiza; si no, lo crea.
   */
  async function moveToProvisions(item: ShoppingItem, location: InventoryLocation, remember: boolean) {
    const batch = writeBatch(db)
    batch.delete(itemRef(item.id))
    const existing = inventory.find((i) => i.nameNorm === item.nameNorm)
    if (existing) {
      batch.update(inventoryRef(existing.id), {
        status: 'ok',
        linkedShoppingItemId: null,
        updatedAt: serverTimestamp(),
      })
    } else {
      batch.set(doc(collection(db, 'households', hid, 'inventoryItems')), {
        name: item.name,
        nameNorm: item.nameNorm,
        location,
        status: 'ok',
        updatedAt: serverTimestamp(),
        linkedShoppingItemId: null,
      })
    }
    if (remember) {
      batch.set(
        productRef(item.name),
        { name: item.name, nameNorm: item.nameNorm, location },
        { merge: true },
      )
    }
    await batch.commit()
  }

  async function checkItem(item: ShoppingItem) {
    if (busyId) return
    setBusyId(item.id)
    try {
      // 1. Vino de Provisiones: vuelve a "Hay" en su lugar
      if (item.fromInventoryId) {
        const invRef = inventoryRef(item.fromInventoryId)
        const invSnap = await getDoc(invRef)
        const batch = writeBatch(db)
        batch.delete(itemRef(item.id))
        if (invSnap.exists()) {
          batch.update(invRef, {
            status: 'ok',
            linkedShoppingItemId: null,
            updatedAt: serverTimestamp(),
          })
        }
        await batch.commit()
        return
      }
      // 2. Producto con categoría recordada: va directo
      const prodSnap = await getDoc(productRef(item.name))
      const location: InventoryLocation | null = prodSnap.exists()
        ? (prodSnap.data().location ?? null)
        : null
      if (location) {
        await moveToProvisions(item, location, false)
        return
      }
      // 3. Sin categoría: preguntar dónde va
      setChoosingId(item.id)
    } finally {
      setBusyId(null)
    }
  }

  async function chooseLocation(item: ShoppingItem, location: InventoryLocation) {
    if (busyId) return
    setBusyId(item.id)
    try {
      await moveToProvisions(item, location, true)
      setChoosingId(null)
    } finally {
      setBusyId(null)
    }
  }

  // ----- Borrar -----

  async function removeItem(item: ShoppingItem) {
    if (!window.confirm(`¿Sacar "${item.name}" de la lista?`)) return
    if (choosingId === item.id) setChoosingId(null)
    if (item.fromInventoryId) {
      // Soltar el vínculo en Provisiones para no dejar referencias colgadas
      const invRef = inventoryRef(item.fromInventoryId)
      const invSnap = await getDoc(invRef)
      const batch = writeBatch(db)
      batch.delete(itemRef(item.id))
      if (invSnap.exists() && invSnap.data().linkedShoppingItemId === item.id) {
        batch.update(invRef, { linkedShoppingItemId: null, updatedAt: serverTimestamp() })
      }
      await batch.commit()
      return
    }
    await deleteDoc(itemRef(item.id))
  }

  // ----- Render -----

  function renderChooser(item: ShoppingItem) {
    return (
      <div className="flex shrink-0 items-center gap-1" role="group" aria-label="¿Dónde va?">
        {LOCATIONS.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => chooseLocation(item, value)}
            className="flex h-11 w-[52px] flex-col items-center justify-center gap-0.5 rounded-lg bg-brand-soft text-brand transition-colors duration-150 active:bg-brand active:text-on-brand dark:text-accent"
          >
            <Icon size={18} />
            <span className="text-[10px] leading-none font-semibold">{label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setChoosingId(null)}
          aria-label="Cancelar"
          className="flex h-11 w-9 items-center justify-center rounded-lg text-ink2 transition-colors duration-150"
        >
          <IconX size={18} />
        </button>
      </div>
    )
  }

  function renderRow(item: ShoppingItem) {
    const choosing = choosingId === item.id
    return (
      <ListRow
        key={item.id}
        left={
          <Checkbox
            checked={choosing || busyId === item.id}
            onChange={() => (choosing ? setChoosingId(null) : checkItem(item))}
            label={`Comprado: ${item.name}`}
          />
        }
        title={item.name}
        subtitle={choosing ? '¿Dónde va?' : item.fromInventoryId ? 'De provisiones' : undefined}
        right={
          choosing ? (
            renderChooser(item)
          ) : (
            <IconButton label={`Sacar ${item.name}`} tone="danger" onClick={() => removeItem(item)}>
              <IconTrash size={18} />
            </IconButton>
          )
        }
      />
    )
  }

  return (
    <div>
      <div
        className="sticky z-10 bg-bg/92 px-4 pt-1 pb-2 backdrop-blur-md"
        style={{ top: 'calc(env(safe-area-inset-top) + 53px)' }}
      >
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            className={inputClass}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Agregar producto…"
            enterKeyHint="done"
            autoComplete="off"
            aria-label="Agregar producto"
          />
          <button
            type="submit"
            aria-label="Agregar a la lista"
            disabled={!input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-on-brand transition-opacity duration-150 active:opacity-80 disabled:opacity-40"
          >
            <IconPlus size={22} />
          </button>
        </form>
        {suggestions.length > 0 && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5">
            {suggestions.map((p) => (
              <Chip key={p.id} onClick={() => addItem(p.name)}>
                {p.name}
              </Chip>
            ))}
          </div>
        )}
        {flash && (
          <p role="status" className="mt-1.5 text-sm font-medium text-warn">
            {flash}
          </p>
        )}
      </div>

      <div className="px-4 pt-2 pb-8">
        {loading && items.length === 0 && (
          <p className="px-4 py-14 text-center text-sm text-ink2">Cargando…</p>
        )}
        {!loading && items.length === 0 && (
          <EmptyState
            icon={<IconCart size={30} />}
            title="La lista está vacía"
            hint="Agregá lo que falte; lo que tildás pasa a Provisiones"
          />
        )}
        {items.length > 0 && <Card>{items.map(renderRow)}</Card>}
      </div>
    </div>
  )
}
