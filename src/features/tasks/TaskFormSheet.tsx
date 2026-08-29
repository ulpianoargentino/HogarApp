import { useEffect, useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Chip, Field, FormSheet, MemberPicker, inputClass } from '../../components/ui'
import { useHome } from '../../hooks/useHousehold'

const POINT_OPTIONS = [5, 10, 20]

export default function TaskFormSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { hid, uid, partnerUid, myProfile, partnerProfile } = useHome()
  const [title, setTitle] = useState('')
  const [assigneeUid, setAssigneeUid] = useState(uid)
  const [points, setPoints] = useState(10)

  // Resetear el formulario cada vez que se abre
  useEffect(() => {
    if (open) {
      setTitle('')
      setAssigneeUid(uid)
      setPoints(10)
    }
  }, [open, uid])

  const members = [
    { uid, profile: myProfile ?? { name: 'Vos', photoURL: null } },
    ...(partnerUid
      ? [{ uid: partnerUid, profile: partnerProfile ?? { name: 'Tu pareja', photoURL: null } }]
      : []),
  ]

  async function handleSubmit() {
    await addDoc(collection(db, 'households', hid, 'tasks'), {
      title: title.trim(),
      assigneeUid,
      done: false,
      points,
      createdBy: uid,
      createdAt: serverTimestamp(),
      completedAt: null,
      completedBy: null,
    })
  }

  return (
    <FormSheet
      open={open}
      onClose={onClose}
      title="Nueva tarea"
      onSubmit={handleSubmit}
      submitLabel="Agregar tarea"
      canSubmit={title.trim().length > 0}
    >
      <Field label="Título">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lavar los platos"
          className={inputClass}
          autoFocus
        />
      </Field>
      <Field label="Asignada a">
        <MemberPicker members={members} value={assigneeUid} onChange={setAssigneeUid} />
      </Field>
      <Field label="Puntos">
        <div className="flex gap-2">
          {POINT_OPTIONS.map((p) => (
            <Chip key={p} selected={points === p} onClick={() => setPoints(p)}>
              +{p} pts
            </Chip>
          ))}
        </div>
      </Field>
    </FormSheet>
  )
}
