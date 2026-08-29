import { useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { normalizeText } from '../../lib/normalize'
import { useHome } from '../../hooks/useHousehold'
import { useCollection } from '../../hooks/useCollection'
import {
  Card,
  EmptyState,
  FAB,
  Field,
  FormSheet,
  SectionTitle,
  SegmentedControl,
  inputClass,
} from '../../components/ui'
import { IconFridge, IconTrash } from '../../components/icons'
import type { InventoryItem, InventoryStatus } from '../../types'

type Location = InventoryItem['location']

const STATUS_OPTIONS: Array<{ value: InventoryStatus; label: string }> = [
  { value: 'ok', label: 'Hay' },
  { value: 'low', label: 'Queda poco' },
  { value: 'out', label: 'Se terminó' },
]

const statusSelectedClass: Record<InventoryStatus, string> = {
  ok: 'border-ok/60 bg-ok/15 text-ok',
  low: 'border-warn/60 bg-warn-soft text-warn',
  out: 'border-danger/60 bg-danger/15 text-danger',
}

function InventoryRow({
  item,
  onStatus,
  onDelete,
}: {
  item: InventoryItem
  onStatus: (status: InventoryStatus) => void
  onDelete: () => void
}) {
  return (
    <div className="border-b border-line bg-card px-4 py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate font-medium">{item.name}</p>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Borrar ${item.name}`}
          className="-my-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center text-ink2"
        >
          <IconTrash size={18} />
        </button>
      </div>
      <div className="mt-1.5 flex gap-2">
        {STATUS_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onStatus(o.value)}
            className={`min-h-11 flex-1 rounded-full border px-2 text-sm font-medium ${
              item.status === o.value
                ? statusSelectedClass[o.value]
                : 'border-line bg-card2 text-ink2'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function InventoryPanel() {
  const { hid, uid } = useHome()
  const { data: items, loading } = useCollection<InventoryItem>(hid, 'inventoryItems', {
    orderByField: ['nameNorm', 'asc'],
  })
  const [sheetOpen, setSheetOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newLocation, setNewLocation] = useState<Location>('heladera')

  const fridge = items.filter((i) => i.location === 'heladera')
  const pantry = items.filter((i) => i.location === 'despensa')

  function openSheet() {
    setNewName('')
    setNewLocation('heladera')
    setSheetOpen(true)
  }

  async function addItem() {
    const name = newName.trim()
    if (!name) return
    await addDoc(collection(db, 'households', hid, 'inventoryItems'), {
      name,
      nameNorm: normalizeText(name),
      location: newLocation,
      status: 'ok',
      updatedAt: serverTimestamp(),
      linkedShoppingItemId: null,
    })
  }

  async function setStatus(item: InventoryItem, status: InventoryStatus) {
    if (status === item.status) return
    const invRef = doc(db, 'households', hid, 'inventoryItems', item.id)

    if (status === 'ok') {
      // Volvió a haber: si quedó un ítem sin tildar en la lista, lo sacamos
      if (item.linkedShoppingItemId) {
        const shopRef = doc(db, 'households', hid, 'shoppingItems', item.linkedShoppingItemId)
        const shopSnap = await getDoc(shopRef)
        const batch = writeBatch(db)
        if (shopSnap.exists() && shopSnap.data().checked === false) {
          batch.delete(shopRef)
        }
        batch.update(invRef, {
          status: 'ok',
          linkedShoppingItemId: null,
          updatedAt: serverTimestamp(),
        })
        await batch.commit()
      } else {
        await updateDoc(invRef, { status: 'ok', updatedAt: serverTimestamp() })
      }
      return
    }

    // low u out: si ya está vinculado a la lista, solo cambiar el estado
    if (item.linkedShoppingItemId) {
      await updateDoc(invRef, { status, updatedAt: serverTimestamp() })
      return
    }

    // Sin vínculo: agregar a la lista de compras y guardar el vínculo, todo junto
    const shopRef = doc(collection(db, 'households', hid, 'shoppingItems'))
    const batch = writeBatch(db)
    batch.set(shopRef, {
      name: item.name,
      nameNorm: item.nameNorm,
      checked: false,
      addedBy: uid,
      createdAt: serverTimestamp(),
      checkedAt: null,
      fromInventoryId: item.id,
    })
    batch.update(invRef, {
      status,
      linkedShoppingItemId: shopRef.id,
      updatedAt: serverTimestamp(),
    })
    await batch.commit()
  }

  async function removeItem(item: InventoryItem) {
    if (!window.confirm(`¿Borrar "${item.name}" del inventario?`)) return
    const invRef = doc(db, 'households', hid, 'inventoryItems', item.id)
    if (item.linkedShoppingItemId) {
      // Desvincular el ítem de la lista (queda como ítem común si todavía existe)
      const shopRef = doc(db, 'households', hid, 'shoppingItems', item.linkedShoppingItemId)
      const shopSnap = await getDoc(shopRef)
      const batch = writeBatch(db)
      batch.delete(invRef)
      if (shopSnap.exists()) {
        batch.update(shopRef, { fromInventoryId: null })
      }
      await batch.commit()
      return
    }
    await deleteDoc(invRef)
  }

  function renderSection(title: string, sectionItems: InventoryItem[]) {
    if (sectionItems.length === 0) return null
    return (
      <>
        <SectionTitle>{title}</SectionTitle>
        <Card>
          {sectionItems.map((item) => (
            <InventoryRow
              key={item.id}
              item={item}
              onStatus={(s) => setStatus(item, s)}
              onDelete={() => removeItem(item)}
            />
          ))}
        </Card>
      </>
    )
  }

  return (
    <div className="px-4 pb-4">
      {!loading && items.length === 0 && (
        <EmptyState
          icon={<IconFridge size={40} />}
          title="Todavía no cargaron nada"
          hint="Agregá lo que suelen tener en la heladera y la despensa. Cuando marqués que algo se termina, va solo a la lista de compras."
        />
      )}

      {renderSection('Heladera', fridge)}
      {renderSection('Despensa', pantry)}

      <FAB onClick={openSheet} label="Agregar al inventario" />

      <FormSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Agregar al inventario"
        onSubmit={addItem}
        submitLabel="Agregar"
        canSubmit={newName.trim().length > 0}
      >
        <Field label="¿Qué es?">
          <input
            className={inputClass}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Leche, arroz, manteca…"
            autoComplete="off"
          />
        </Field>
        <Field label="¿Dónde va?">
          <SegmentedControl<Location>
            options={[
              { value: 'heladera', label: 'Heladera' },
              { value: 'despensa', label: 'Despensa' },
            ]}
            value={newLocation}
            onChange={setNewLocation}
          />
        </Field>
      </FormSheet>
    </div>
  )
}
