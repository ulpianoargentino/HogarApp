import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  Card,
  Checkbox,
  EmptyState,
  FAB,
  IconButton,
  ListRow,
  PageHeader,
  SectionTitle,
} from '../../components/ui'
import { IconFilm, IconPlane, IconSparkle, IconTrash } from '../../components/icons'
import { useHome } from '../../hooks/useHousehold'
import { useCollection } from '../../hooks/useCollection'
import type { CouplePlan, PlanKind } from '../../types'
import PlanFormSheet from './PlanFormSheet'

const COPY: Record<
  PlanKind,
  {
    title: string
    subtitle: string
    icon: typeof IconSparkle
    fab: string
    emptyTitle: string
    emptyHint: string
  }
> = {
  plan: {
    title: 'Planes',
    subtitle: 'Ideas para hacer juntos',
    icon: IconSparkle,
    fab: 'Nuevo plan',
    emptyTitle: 'Todavía no hay planes',
    emptyHint: 'Anotá esa idea que vienen postergando. Tocá el + y proponé la primera.',
  },
  cine: {
    title: 'Cine',
    subtitle: 'Pelis y series para ver',
    icon: IconFilm,
    fab: 'Nueva peli o serie',
    emptyTitle: 'Nada por ver, por ahora',
    emptyHint: 'Agregá esa peli o serie que se deben hace rato.',
  },
  viaje: {
    title: 'Viajes',
    subtitle: 'Escapadas y viajes',
    icon: IconPlane,
    fab: 'Nuevo viaje',
    emptyTitle: 'Ningún viaje a la vista',
    emptyHint: 'Soñá en grande, o en finde, y anotalo acá para no olvidarlo.',
  },
}

export default function PlansPage({ kind }: { kind: PlanKind }) {
  const navigate = useNavigate()
  const { hid } = useHome()
  const [formOpen, setFormOpen] = useState(false)

  const { data: plans, loading } = useCollection<CouplePlan>(hid, 'planes', {
    orderByField: ['createdAt', 'desc'],
  })

  const ofKind = useMemo(
    () =>
      plans
        .filter((p) => p.kind === kind)
        .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)),
    [plans, kind],
  )
  const ideas = ofKind.filter((p) => p.status === 'idea')
  const done = ofKind.filter((p) => p.status === 'hecho')

  async function toggleDone(plan: CouplePlan) {
    const ref = doc(db, 'households', hid, 'planes', plan.id)
    try {
      if (plan.status === 'idea') {
        await updateDoc(ref, { status: 'hecho', doneAt: serverTimestamp() })
      } else {
        await updateDoc(ref, { status: 'idea', doneAt: null })
      }
    } catch {
      alert('No se pudo actualizar. Probá de nuevo.')
    }
  }

  async function deletePlan(plan: CouplePlan) {
    if (!window.confirm(`¿Borrar «${plan.title}»?`)) return
    await deleteDoc(doc(db, 'households', hid, 'planes', plan.id))
  }

  function renderRow(plan: CouplePlan) {
    const isDone = plan.status === 'hecho'
    return (
      <ListRow
        key={plan.id}
        title={plan.title}
        subtitle={plan.notes || undefined}
        dimmed={isDone}
        left={
          <Checkbox
            checked={isDone}
            onChange={() => toggleDone(plan)}
            label={isDone ? `Volver a idea: ${plan.title}` : `Marcar hecho: ${plan.title}`}
          />
        }
        right={
          <IconButton label="Borrar" tone="danger" onClick={() => deletePlan(plan)}>
            <IconTrash size={19} />
          </IconButton>
        }
      />
    )
  }

  const copy = COPY[kind]
  const Icon = copy.icon
  const isEmpty = ideas.length === 0 && done.length === 0

  return (
    <div>
      <PageHeader title={copy.title} subtitle={copy.subtitle} onBack={() => navigate('/nosotros')} />
      <div className="px-4 pt-3 pb-6">
        {ideas.length > 0 && <Card>{ideas.map(renderRow)}</Card>}

        {isEmpty &&
          (loading ? (
            <p className="px-4 py-14 text-center text-sm text-ink2">Cargando…</p>
          ) : (
            <EmptyState
              icon={<Icon size={28} />}
              title={copy.emptyTitle}
              hint={copy.emptyHint}
            />
          ))}

        {done.length > 0 && (
          <>
            <SectionTitle right={String(done.length)}>Hechos</SectionTitle>
            <Card>{done.map(renderRow)}</Card>
          </>
        )}
      </div>
      <FAB onClick={() => setFormOpen(true)} label={copy.fab} />
      <PlanFormSheet open={formOpen} onClose={() => setFormOpen(false)} kind={kind} />
    </div>
  )
}
