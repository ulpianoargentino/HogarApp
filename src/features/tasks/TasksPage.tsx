import { useMemo, useState } from 'react'
import {
  deleteDoc,
  doc,
  increment,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  Card,
  EmptyState,
  FAB,
  PageHeader,
  SegmentedControl,
} from '../../components/ui'
import { IconCheckCircle } from '../../components/icons'
import { useHome } from '../../hooks/useHousehold'
import { useCollection } from '../../hooks/useCollection'
import type { Task } from '../../types'
import TaskFormSheet from './TaskFormSheet'
import TaskRow from './TaskRow'

type Tab = 'pendientes' | 'hechas'

export default function TasksPage() {
  const { hid, uid, household } = useHome()
  const [tab, setTab] = useState<Tab>('pendientes')
  const [formOpen, setFormOpen] = useState(false)

  const { data: tasks, loading } = useCollection<Task>(hid, 'tasks', {
    orderByField: ['createdAt', 'asc'],
  })

  const pending = useMemo(
    () =>
      tasks
        .filter((t) => !t.done)
        .sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0)),
    [tasks],
  )

  const done = useMemo(
    () =>
      tasks
        .filter((t) => t.done)
        .sort((a, b) => (b.completedAt?.toMillis() ?? 0) - (a.completedAt?.toMillis() ?? 0)),
    [tasks],
  )

  async function toggleTask(task: Task) {
    const taskRef = doc(db, 'households', hid, 'tasks', task.id)
    const homeRef = doc(db, 'households', hid)
    const batch = writeBatch(db)
    if (!task.done) {
      // Completar: los puntos van a quien la marca
      batch.update(taskRef, {
        done: true,
        completedAt: serverTimestamp(),
        completedBy: uid,
      })
      batch.update(homeRef, { [`points.${uid}`]: increment(task.points) })
    } else {
      if (task.completedBy !== uid) {
        alert('Solo quien la completó puede desmarcarla.')
        return
      }
      batch.update(taskRef, {
        done: false,
        completedAt: null,
        completedBy: null,
      })
      batch.update(homeRef, { [`points.${uid}`]: increment(-task.points) })
    }
    try {
      await batch.commit()
    } catch {
      alert('No se pudo actualizar la tarea. Probá de nuevo.')
    }
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`¿Borrar la tarea «${task.title}»?`)) return
    await deleteDoc(doc(db, 'households', hid, 'tasks', task.id))
  }

  const list = tab === 'pendientes' ? pending : done

  return (
    <div>
      <PageHeader title="Tareas" />
      <div className="px-4 pt-3">
        <SegmentedControl<Tab>
          options={[
            { value: 'pendientes', label: 'Pendientes' },
            { value: 'hechas', label: 'Hechas' },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div className="mt-3 pb-28">
          {list.length > 0 ? (
            <Card>
              {list.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  profiles={household.memberProfiles}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                />
              ))}
            </Card>
          ) : loading ? (
            <p className="px-4 py-14 text-center text-sm text-ink2">Cargando…</p>
          ) : tab === 'pendientes' ? (
            <EmptyState
              icon={<IconCheckCircle size={40} />}
              title="¡No queda nada pendiente!"
              hint="Agregá una tarea con el + y repartan los puntos."
            />
          ) : (
            <EmptyState
              icon={<IconCheckCircle size={40} />}
              title="Todavía no hicieron ninguna"
              hint="Marcá una tarea pendiente y sumá esos puntos."
            />
          )}
        </div>
      </div>
      <FAB onClick={() => setFormOpen(true)} label="Nueva tarea" />
      <TaskFormSheet open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
