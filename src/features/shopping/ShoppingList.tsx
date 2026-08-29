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
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { normalizeText, slugify } from '../../lib/normalize'
import { useHome } from '../../hooks/useHousehold'
import { useCollection } from '../../hooks/useCollection'
import { Card, Chip, EmptyState, ListRow, inputClass } from '../../components/ui'
import { IconCart, IconPlus, IconTrash } from '../../components/icons'
import type { ShoppingItem } from '../../types'
import { suggestProducts, useProducts } from './useProducts'

function CheckCircle({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
        checked ? 'border-ok bg-ok text-white' : 'border-line bg-card2'
      }`}
    >
      {checked && (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 13 4 4 10-10" />
        </svg>
      )}
    </span>
  )
}

export default function ShoppingList() {
  const { hid, uid } = useHome()
  const { data: items, loading } = useCollection<ShoppingItem>(hid, 'shoppingItems', {
    orderByField: ['createdAt', 'asc'],
  })
  const { data: products } = useProducts(hid)
  const [input, setInput] = useState('')
  const [flash, setFlash] = useState<string | null>(null)
  const flashTimer = useRef<number | null>(null)

  const pending = items.filter((i) => !i.checked)
  const bought = items.filter((i) => i.checked)
  const suggestions = suggestProducts(products, input)

  function showFlash(msg: string) {
    setFlash(msg)
    if (flashTimer.current) window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(null), 1800)
  }

  async function addItem(rawName: string) {
    const name = rawName.trim()
    if (!name) return
    setInput('')
    const nameNorm = normalizeText(name)
    if (pending.some((i) => i.nameNorm === nameNorm)) {
      showFlash('Ya está en la lista, no lo dupliqué')
      return
    }
    await addDoc(collection(db, 'households', hid, 'shoppingItems'), {
      name,
      nameNorm,
      checked: false,
      addedBy: uid,
      createdAt: serverTimestamp(),
      checkedAt: null,
      fromInventoryId: null,
    })
    await setDoc(
      doc(db, 'households', hid, 'products', slugify(name)),
      { name, nameNorm, count: increment(1), lastUsedAt: serverTimestamp() },
      { merge: true },
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    addItem(input)
  }

  async function toggleItem(item: ShoppingItem) {
    const ref = doc(db, 'households', hid, 'shoppingItems', item.id)
    if (item.checked) {
      await updateDoc(ref, { checked: false, checkedAt: null })
      return
    }
    if (item.fromInventoryId) {
      const invRef = doc(db, 'households', hid, 'inventoryItems', item.fromInventoryId)
      const invSnap = await getDoc(invRef)
      if (
        invSnap.exists() &&
        window.confirm(`¿Repusiste ${item.name}? Lo marco OK en la despensa.`)
      ) {
        const batch = writeBatch(db)
        batch.update(ref, { checked: true, checkedAt: serverTimestamp() })
        batch.update(invRef, {
          status: 'ok',
          linkedShoppingItemId: null,
          updatedAt: serverTimestamp(),
        })
        await batch.commit()
        return
      }
    }
    await updateDoc(ref, { checked: true, checkedAt: serverTimestamp() })
  }

  async function removeItem(item: ShoppingItem) {
    if (!window.confirm(`¿Borrar "${item.name}" de la lista?`)) return
    const ref = doc(db, 'households', hid, 'shoppingItems', item.id)
    if (item.fromInventoryId) {
      // Limpiar el vínculo en la despensa para no dejar referencias colgadas
      const invRef = doc(db, 'households', hid, 'inventoryItems', item.fromInventoryId)
      const invSnap = await getDoc(invRef)
      const batch = writeBatch(db)
      batch.delete(ref)
      if (invSnap.exists() && invSnap.data().linkedShoppingItemId === item.id) {
        batch.update(invRef, { linkedShoppingItemId: null, updatedAt: serverTimestamp() })
      }
      await batch.commit()
      return
    }
    await deleteDoc(ref)
  }

  async function clearBought() {
    if (!window.confirm(`¿Borrar ${bought.length === 1 ? 'el comprado' : `los ${bought.length} comprados`} de la lista?`)) {
      return
    }
    const batch = writeBatch(db)
    for (const i of bought) {
      batch.delete(doc(db, 'households', hid, 'shoppingItems', i.id))
    }
    await batch.commit()
  }

  function renderRow(item: ShoppingItem) {
    return (
      <ListRow
        key={item.id}
        onClick={() => toggleItem(item)}
        dimmed={item.checked}
        left={<CheckCircle checked={item.checked} />}
        title={item.name}
        subtitle={item.fromInventoryId ? 'De la despensa' : undefined}
        right={
          <span
            role="button"
            tabIndex={0}
            aria-label={`Borrar ${item.name}`}
            onClick={(e) => {
              e.stopPropagation()
              removeItem(item)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                removeItem(item)
              }
            }}
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center text-ink2"
          >
            <IconTrash size={18} />
          </span>
        }
      />
    )
  }

  return (
    <div>
      <div
        className="sticky z-10 border-b border-line bg-bg/90 px-4 py-2 backdrop-blur-md"
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
            className="flex min-h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-white active:opacity-80 disabled:opacity-40"
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
        {flash && <p className="mt-1.5 text-sm font-medium text-warn">{flash}</p>}
      </div>

      <div className="px-4 pt-3">
        {!loading && items.length === 0 && (
          <EmptyState
            icon={<IconCart size={40} />}
            title="Lista vacía"
            hint="Agregá lo que falta comprar. Marcá cada cosa cuando la compren."
          />
        )}

        {pending.length > 0 && <Card>{pending.map(renderRow)}</Card>}

        {bought.length > 0 && (
          <>
            <div className="mt-6 mb-2 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold tracking-wide text-ink2 uppercase">
                Comprados
              </h2>
              <button
                type="button"
                onClick={clearBought}
                className="min-h-9 text-sm font-semibold text-danger"
              >
                Limpiar comprados
              </button>
            </div>
            <Card>{bought.map(renderRow)}</Card>
          </>
        )}
      </div>
    </div>
  )
}
