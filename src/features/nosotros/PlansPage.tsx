import { useMemo, useState } from 'react'
import { deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  Card,
  EmptyState,
  FAB,
  ListRow,
  PageHeader,
  SectionTitle,
  SegmentedControl,
} from '../../components/ui'
import {
  IconCheckCircle,
  IconHeart,
  IconMap,
  IconTrash,
  IconTv,
} from '../../components/icons'
import { useHome } from '../../hooks/useHousehold'
import { useCollection } from '../../hooks/useCollection'
import type { CouplePlan, PlanKind } from '../../types'
import PlanFormSheet from './PlanFormSheet'

const EMPTY: Record<PlanKind, { icon: typeof IconHeart; title: string; hint: string }> = {
  plan: {
    icon: IconHeart,
    title: 'Todavía no hay planes…',
    hint: '¿Proponés el primero? El + te espera.',
  },
  serie: {
    icon: IconTv,
    title: 'Nada para ver juntos… ¡todavía!',
    hint: 'Anotá esa serie que se deben hace rato.',
  },
  escapada: {
    icon: IconMap,
    title: 'Ninguna escapada a la vista',
    hint: 'Soñá en grande (o en finde) y anotala acá.',
  },
}

export default function CouplePage() {
  const { hid } = useHome()
  const [kind, setKind] = useState<PlanKind>('plan')
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
        right={
          <span className="flex items-center">
            <button
              type="button"
              onClick={() => toggleDone(plan)}
              aria-label={isDone ? 'Volver a idea' : 'Marcar como hecho'}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                isDone ? 'text-love' : 'text-ink2 active:text-love'
              }`}
            >
              {isDone ? (
                <IconCheckCircle size={22} />
              ) : (
                <IconHeart size={22} />
              )}
            </button>
            <button
              type="button"
              onClick={() => deletePlan(plan)}
              aria-label="Borrar"
              className="flex h-11 w-11 shrink-0 items-center justify-center text-ink2 active:text-danger"
            >
              <IconTrash size={19} />
            </button>
          </span>
        }
      />
    )
  }

  const empty = EMPTY[kind]
  const EmptyIcon = empty.icon

  return (
    <div>
      <PageHeader title="Modo pareja" subtitle="Planes para ustedes dos" />
      <div className="px-4 pt-3 pb-28">
        <SegmentedControl<PlanKind>
          options={[
            { value: 'plan', label: 'Planes' },
            { value: 'serie', label: 'Series' },
            { value: 'escapada', label: 'Escapadas' },
          ]}
          value={kind}
          onChange={setKind}
        />

        {ideas.length > 0 && (
          <>
            <SectionTitle>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-love-soft px-2.5 py-0.5 normal-case text-love">
                <IconHeart size={14} /> Ideas
              </span>
            </SectionTitle>
            <Card>{ideas.map(renderRow)}</Card>
          </>
        )}

        {ideas.length === 0 && done.length === 0 && (
          loading ? (
            <p className="px-4 py-14 text-center text-sm text-ink2">Cargando…</p>
          ) : (
            <EmptyState
              icon={<EmptyIcon size={40} className="text-love" />}
              title={empty.title}
              hint={empty.hint}
            />
          )
        )}

        {done.length > 0 && (
          <>
            <SectionTitle>Hechos ✓</SectionTitle>
            <Card>{done.map(renderRow)}</Card>
          </>
        )}
      </div>
      <FAB onClick={() => setFormOpen(true)} label="Nueva idea" />
      <PlanFormSheet open={formOpen} onClose={() => setFormOpen(false)} kind={kind} />
    </div>
  )
}
