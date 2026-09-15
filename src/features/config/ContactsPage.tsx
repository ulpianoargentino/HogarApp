import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  GhostButton,
  PageHeader,
  inputClass,
} from '../../components/ui'
import { IconPhone } from '../../components/icons'
import { useHome } from '../../hooks/useHousehold'
import { useCollection } from '../../hooks/useCollection'
import type { HomeContact } from '../../types'

export default function ContactsPage() {
  const navigate = useNavigate()
  const { hid } = useHome()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<HomeContact | null>(null)

  const { data: contacts, loading } = useCollection<HomeContact>(hid, 'contacts')

  const sorted = useMemo(
    () => [...contacts].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [contacts],
  )

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(contact: HomeContact) {
    setEditing(contact)
    setFormOpen(true)
  }

  return (
    <div>
      <PageHeader title="Contactos" onBack={() => navigate('/config')} />
      <div className="px-4 pt-3 pb-6">
        {sorted.length > 0 ? (
          <Card>
            {sorted.map((contact) => (
              <div
                key={contact.id}
                className="flex min-h-13 w-full items-center gap-3 border-b border-line px-4 py-2 last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => openEdit(contact)}
                  className="min-h-11 min-w-0 flex-1 text-left"
                >
                  <div className="truncate font-medium">{contact.name}</div>
                  <div className="truncate text-[13px] text-ink2">
                    {contact.role}
                    {contact.notes ? ` · ${contact.notes}` : ''}
                  </div>
                </button>
                <a
                  href={`tel:${contact.phone}`}
                  aria-label={`Llamar a ${contact.name}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand transition-colors duration-150 dark:text-accent"
                >
                  <IconPhone size={20} />
                </a>
              </div>
            ))}
          </Card>
        ) : loading ? (
          <p className="px-4 py-14 text-center text-sm text-ink2">Cargando…</p>
        ) : (
          <EmptyState
            icon={<IconPhone size={28} />}
            title="Agenda vacía"
            hint="Guardá al plomero, al gasista y compañía para tenerlos siempre a mano."
          />
        )}
      </div>
      <FAB onClick={openNew} label="Nuevo contacto" />
      <ContactFormSheet open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />
    </div>
  )
}

function ContactFormSheet({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: HomeContact | null
}) {
  const { hid } = useHome()
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  // Precargar (edición) o resetear (alta) cada vez que se abre
  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '')
      setRole(editing?.role ?? '')
      setPhone(editing?.phone ?? '')
      setNotes(editing?.notes ?? '')
    }
  }, [open, editing])

  async function handleSubmit() {
    const data = {
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
    }
    if (editing) {
      await updateDoc(doc(db, 'households', hid, 'contacts', editing.id), data)
    } else {
      await addDoc(collection(db, 'households', hid, 'contacts'), {
        ...data,
        createdAt: serverTimestamp(),
      })
    }
  }

  async function handleDelete() {
    if (!editing) return
    if (!window.confirm(`¿Borrar el contacto «${editing.name}»?`)) return
    try {
      await deleteDoc(doc(db, 'households', hid, 'contacts', editing.id))
      onClose()
    } catch {
      alert('No se pudo borrar. Probá de nuevo.')
    }
  }

  return (
    <FormSheet
      open={open}
      onClose={onClose}
      title={editing ? 'Editar contacto' : 'Nuevo contacto'}
      onSubmit={handleSubmit}
      submitLabel={editing ? 'Guardar cambios' : 'Agregar contacto'}
      canSubmit={name.trim().length > 0 && role.trim().length > 0 && phone.trim().length > 0}
      footer={
        editing ? (
          <GhostButton tone="danger" onClick={handleDelete}>
            Eliminar contacto
          </GhostButton>
        ) : undefined
      }
    >
      <Field label="Nombre">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Oscar"
          className={inputClass}
          autoFocus
        />
      </Field>
      <Field label="Oficio">
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Plomero"
          className={inputClass}
        />
      </Field>
      <Field label="Teléfono">
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="11 5555-5555"
          className={inputClass}
        />
      </Field>
      <Field label="Notas (opcional)">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Vino a arreglar la ducha"
          className={inputClass}
        />
      </Field>
    </FormSheet>
  )
}
