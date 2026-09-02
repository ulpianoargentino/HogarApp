import { useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { normalizeText, slugify } from '../../lib/normalize'
import { useHome } from '../../hooks/useHousehold'
import { useCollection } from '../../hooks/useCollection'
import {
  Card,
  Chip,
  EmptyState,
  FAB,
  Field,
  FormSheet,
  GhostButton,
  PillToggle,
  SectionTitle,
  inputClass,
} from '../../components/ui'
import { IconBox } from '../../components/icons'
import type { InventoryItem, InventoryLocation, InventoryStatus } from '../../types'
import { LOCATIONS } from './locations'

type SheetState = { mode: 'new' } | { mode: 'edit'; item: InventoryItem } | null

const STATUS_OPTIONS: [
  { value: InventoryStatus; label: string },
  { value: InventoryStatus; label: string },
] = [
  { value: 'ok', label: 'Hay' },
  { value: 'comprar', label: 'Comprar' },
]

function ProvisionRow({
  item,
  onEdit,
  onStatus,
}: {
  item: InventoryItem
  onEdit: () => void
  onStatus: (s: InventoryStatus) => void
}) {
  return (
    <div className="flex min-h-13 items-center gap-3 border-b border-line px-4 py-1.5 last:border-b-0">
      <button
        type="button"
        onClick={onEdit}
        className="min-h-11 min-w-0 flex-1 truncate text-left font-medium"
      >
        {item.name}
      </button>
      <PillToggle<InventoryStatus>
        options={STATUS_OPTIONS}
        value={item.status}
        onChange={onStatus}
        activeTone="warn"
      />
    </div>
  )
}

export default function ProvisionsPanel() {
  const { hid, uid } = useHome()
  const { data: items, loading } = useCollection<InventoryItem>(hid, 'inventoryItems', {
    orderByField: ['nameNorm', 'asc'],
  })
  const [sheet, setSheet] = useState<SheetState>(null)
  const [name, setName] = useState('')
  const [location, setLocation] = useState<InventoryLocation>('despensa')

  const inventoryRef = (id: string) => doc(db, 'households', hid, 'inventoryItems', id)
  const shoppingRef = (id: string) => doc(db, 'households', hid, 'shoppingItems', id)
  const productRef = (n: string) => doc(db, 'households', hid, 'products', slugify(n))

  // ----- Sheet -----

  function openNew() {
    setName('')
    setLocation('despensa')
    setSheet({ mode: 'new' })
  }

  function openEdit(item: InventoryItem) {
    setName(item.name)
    setLocation(item.location)
    setSheet({ mode: 'edit', item })
  }

  /** Recordar nombre y categoría en products (sin tocar count) */
  function rememberProduct(n: string, nameNorm: string, loc: InventoryLocation) {
    return setDoc(
      productRef(n),
      { name: n, nameNorm, location: loc, lastUsedAt: serverTimestamp() },
      { merge: true },
    )
  }

  async function submitSheet() {
    const n = name.trim()
    if (!n || !sheet) return
    const nameNorm = normalizeText(n)

    if (sheet.mode === 'new') {
      if (items.some((i) => i.nameNorm === nameNorm)) {
        throw new Error('Ya está en Provisiones')
      }
      await addDoc(collection(db, 'households', hid, 'inventoryItems'), {
        name: n,
        nameNorm,
        location,
        status: 'ok',
        updatedAt: serverTimestamp(),
        linkedShoppingItemId: null,
      })
      await rememberProduct(n, nameNorm, location)
      return
    }

    const { item } = sheet
    if (items.some((i) => i.id !== item.id && i.nameNorm === nameNorm)) {
      throw new Error('Ya hay otro con ese nombre')
    }
    const batch = writeBatch(db)
    batch.update(inventoryRef(item.id), {
      name: n,
      nameNorm,
      location,
      updatedAt: serverTimestamp(),
    })
    // Si está en la lista de compras, que se vea con el nombre nuevo
    if (item.linkedShoppingItemId && item.name !== n) {
      const shopSnap = await getDoc(shoppingRef(item.linkedShoppingItemId))
      if (shopSnap.exists()) batch.update(shopSnap.ref, { name: n, nameNorm })
    }
    await batch.commit()
    await rememberProduct(n, nameNorm, location)
  }

  async function removeItem(item: InventoryItem) {
    if (!window.confirm(`¿Eliminar "${item.name}" de Provisiones?`)) return
    const batch = writeBatch(db)
    batch.delete(inventoryRef(item.id))
    if (item.linkedShoppingItemId) {
      const shopSnap = await getDoc(shoppingRef(item.linkedShoppingItemId))
      if (shopSnap.exists()) batch.delete(shopSnap.ref)
    }
    await batch.commit()
    setSheet(null)
  }

  // ----- Hay / Comprar -----

  async function setStatus(item: InventoryItem, status: InventoryStatus) {
    if (status === item.status) return
    const invRef = inventoryRef(item.id)

    if (status === 'ok') {
      const batch = writeBatch(db)
      batch.update(invRef, {
        status: 'ok',
        linkedShoppingItemId: null,
        updatedAt: serverTimestamp(),
      })
      if (item.linkedShoppingItemId) {
        const shopSnap = await getDoc(shoppingRef(item.linkedShoppingItemId))
        if (shopSnap.exists()) batch.delete(shopSnap.ref)
      }
      await batch.commit()
      return
    }

    // A comprar: si ya está en la lista, solo cambia el estado
    if (item.linkedShoppingItemId) {
      await updateDoc(invRef, { status: 'comprar', updatedAt: serverTimestamp() })
      return
    }
    const shopRef = doc(collection(db, 'households', hid, 'shoppingItems'))
    const batch = writeBatch(db)
    batch.set(shopRef, {
      name: item.name,
      nameNorm: item.nameNorm,
      addedBy: uid,
      createdAt: serverTimestamp(),
      fromInventoryId: item.id,
    })
    batch.update(invRef, {
      status: 'comprar',
      linkedShoppingItemId: shopRef.id,
      updatedAt: serverTimestamp(),
    })
    await batch.commit()
  }

  // ----- Render -----

  function renderSection(loc: (typeof LOCATIONS)[number]) {
    const { value, label, Icon } = loc
    const sectionItems = items
      .filter((i) => i.location === value)
      .sort((a, b) => Number(b.status === 'comprar') - Number(a.status === 'comprar'))
    const toBuy = sectionItems.filter((i) => i.status === 'comprar').length
    return (
      <section key={value}>
        <SectionTitle right={toBuy > 0 ? `${toBuy} a comprar` : undefined}>
          <span className="inline-flex items-center gap-2">
            <Icon size={18} className="text-brand dark:text-accent" />
            {label}
          </span>
        </SectionTitle>
        <Card>
          {sectionItems.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink2">Nada todavía</p>
          ) : (
            sectionItems.map((item) => (
              <ProvisionRow
                key={item.id}
                item={item}
                onEdit={() => openEdit(item)}
                onStatus={(s) => setStatus(item, s)}
              />
            ))
          )}
        </Card>
      </section>
    )
  }

  const editing = sheet?.mode === 'edit' ? sheet.item : null

  return (
    <div className="px-4 pb-28">
      {loading && items.length === 0 && (
        <p className="px-4 py-14 text-center text-sm text-ink2">Cargando…</p>
      )}
      {!loading && items.length === 0 && (
        <EmptyState
          icon={<IconBox size={30} />}
          title="Provisiones vacías"
          hint="Lo que tildás como comprado aparece acá"
        />
      )}
      {items.length > 0 && LOCATIONS.map(renderSection)}

      <FAB onClick={openNew} label="Agregar a Provisiones" />

      <FormSheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        title={editing ? 'Editar' : 'Agregar a Provisiones'}
        onSubmit={submitSheet}
        submitLabel={editing ? 'Guardar' : 'Agregar'}
        canSubmit={name.trim().length > 0}
        footer={
          editing && (
            <GhostButton tone="danger" onClick={() => removeItem(editing)}>
              Eliminar
            </GhostButton>
          )
        }
      >
        <Field label="¿Qué es?">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Leche, arroz, lavandina…"
            autoComplete="off"
          />
        </Field>
        <Field label="¿Dónde va?">
          <div className="flex gap-2">
            {LOCATIONS.map(({ value, label, Icon }) => (
              <Chip key={value} selected={location === value} onClick={() => setLocation(value)}>
                <span className="inline-flex items-center gap-1.5">
                  <Icon size={16} />
                  {label}
                </span>
              </Chip>
            ))}
          </div>
        </Field>
      </FormSheet>
    </div>
  )
}
