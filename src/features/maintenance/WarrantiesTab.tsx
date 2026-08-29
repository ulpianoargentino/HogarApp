import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  Card,
  EmptyState,
  FAB,
  Field,
  FormSheet,
  inputClass,
} from '../../components/ui'
import { IconShield, IconTrash } from '../../components/icons'
import { diffDays, formatLong, todayISO } from '../../lib/dates'
import { useHome } from '../../hooks/useHousehold'
import { useCollection } from '../../hooks/useCollection'
import type { Warranty } from '../../types'

export default function WarrantiesTab() {
  const { hid } = useHome()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Warranty | null>(null)

  const { data: warranties, loading } = useCollection<Warranty>(hid, 'warranties', {
    orderByField: ['expiresAt', 'asc'],
  })

  async function deleteWarranty(warranty: Warranty) {
    if (!window.confirm(`¿Borrar la garantía de «${warranty.item}»?`)) return
    await deleteDoc(doc(db, 'households', hid, 'warranties', warranty.id))
  }

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(warranty: Warranty) {
    setEditing(warranty)
    setFormOpen(true)
  }

  const today = todayISO()

  return (
    <div className="mt-3">
      {warranties.length > 0 ? (
        <Card>
          {warranties.map((warranty) => {
            const days = diffDays(today, warranty.expiresAt)
            const expired = days < 0
            return (
              <div
                key={warranty.id}
                className={`flex min-h-13 w-full items-center gap-3 border-b border-line bg-card px-4 py-2.5 last:border-b-0 ${
                  expired ? 'opacity-55' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => openEdit(warranty)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="truncate font-medium">{warranty.item}</div>
                  <div className="truncate text-sm text-ink2">
                    {warranty.store ? `${warranty.store} · ` : ''}
                    Vence {formatLong(warranty.expiresAt)}
                  </div>
                </button>
                {expired ? (
                  <span className="shrink-0 rounded-full bg-card2 px-2.5 py-1 text-xs font-semibold text-danger">
                    Vencida
                  </span>
                ) : days <= 30 ? (
                  <span className="shrink-0 rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">
                    Vence pronto
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => deleteWarranty(warranty)}
                  aria-label="Borrar garantía"
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-ink2 active:text-danger"
                >
                  <IconTrash size={19} />
                </button>
              </div>
            )
          })}
        </Card>
      ) : loading ? (
        <p className="px-4 py-14 text-center text-sm text-ink2">Cargando…</p>
      ) : (
        <EmptyState
          icon={<IconShield size={40} />}
          title="Sin garantías guardadas"
          hint="Sumá tus compras con el + y enterate antes de que venzan."
        />
      )}
      <FAB onClick={openNew} label="Nueva garantía" />
      <WarrantyFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
      />
    </div>
  )
}

function WarrantyFormSheet({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: Warranty | null
}) {
  const { hid } = useHome()
  const [item, setItem] = useState('')
  const [store, setStore] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [notes, setNotes] = useState('')

  // Precargar (edición) o resetear (alta) cada vez que se abre
  useEffect(() => {
    if (open) {
      setItem(editing?.item ?? '')
      setStore(editing?.store ?? '')
      setExpiresAt(editing?.expiresAt ?? '')
      setNotes(editing?.notes ?? '')
    }
  }, [open, editing])

  async function handleSubmit() {
    const data = {
      item: item.trim(),
      store: store.trim() === '' ? null : store.trim(),
      expiresAt,
      notes: notes.trim(),
    }
    if (editing) {
      await updateDoc(doc(db, 'households', hid, 'warranties', editing.id), data)
    } else {
      await addDoc(collection(db, 'households', hid, 'warranties'), {
        ...data,
        createdAt: serverTimestamp(),
      })
    }
  }

  return (
    <FormSheet
      open={open}
      onClose={onClose}
      title={editing ? 'Editar garantía' : 'Nueva garantía'}
      onSubmit={handleSubmit}
      submitLabel={editing ? 'Guardar cambios' : 'Agregar garantía'}
      canSubmit={item.trim().length > 0 && expiresAt.length > 0}
    >
      <Field label="Artículo">
        <input
          type="text"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          placeholder="Lavarropas"
          className={inputClass}
          autoFocus
        />
      </Field>
      <Field label="Comercio (opcional)">
        <input
          type="text"
          value={store}
          onChange={(e) => setStore(e.target.value)}
          placeholder="Frávega"
          className={inputClass}
        />
      </Field>
      <Field label="Fecha de vencimiento">
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Notas (opcional)">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Dónde está la factura…"
          className={inputClass}
        />
      </Field>
    </FormSheet>
  )
}
