import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, doc, increment, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  Avatar,
  Card,
  EmptyState,
  FAB,
  ListRow,
  PageHeader,
  SectionTitle,
} from '../../components/ui'
import { IconGift, IconStar } from '../../components/icons'
import { formatShort, toISO } from '../../lib/dates'
import { useHome } from '../../hooks/useHousehold'
import { useCollection } from '../../hooks/useCollection'
import type { MemberProfile, Redemption, Reward } from '../../types'
import RewardFormSheet from './RewardFormSheet'

function Balance({
  profile,
  fallback,
  points,
}: {
  profile: MemberProfile | null
  fallback: string
  points: number
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-1">
      <Avatar profile={profile} size={40} />
      <span className="max-w-full truncate text-sm font-semibold">
        {profile?.name.split(' ')[0] ?? fallback}
      </span>
      <span className="flex items-center gap-1 text-accent">
        <IconStar size={16} />
        <span className="font-display text-2xl font-extrabold tabular">{points}</span>
      </span>
    </div>
  )
}

export default function RewardsPage() {
  const navigate = useNavigate()
  const { hid, uid, household, partnerUid, myProfile, partnerProfile } = useHome()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Reward | null>(null)

  const { data: rewards, loading } = useCollection<Reward>(hid, 'rewards', {
    orderByField: ['createdAt', 'asc'],
  })
  const { data: redemptions } = useCollection<Redemption>(hid, 'redemptions', {
    orderByField: ['createdAt', 'desc'],
    max: 20,
  })

  const myPoints = household.points[uid] ?? 0

  const activeRewards = useMemo(
    () =>
      rewards
        .filter((r) => r.active)
        .sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0)),
    [rewards],
  )

  const history = useMemo(
    () =>
      [...redemptions].sort(
        (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0),
      ),
    [redemptions],
  )

  async function redeem(reward: Reward) {
    if (!window.confirm(`¿Canjear «${reward.title}» por ${reward.cost} puntos?`)) return
    const batch = writeBatch(db)
    batch.set(doc(collection(db, 'households', hid, 'redemptions')), {
      rewardId: reward.id,
      rewardTitle: reward.title,
      cost: reward.cost,
      redeemedBy: uid,
      createdAt: serverTimestamp(),
    })
    batch.update(doc(db, 'households', hid), {
      [`points.${uid}`]: increment(-reward.cost),
    })
    try {
      await batch.commit()
    } catch {
      alert('No se pudo canjear el premio. Probá de nuevo.')
    }
  }

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(reward: Reward) {
    setEditing(reward)
    setFormOpen(true)
  }

  function memberName(memberUid: string) {
    return household.memberProfiles[memberUid]?.name.split(' ')[0] ?? 'Alguien'
  }

  return (
    <div>
      <PageHeader title="Premios" onBack={() => navigate('/nosotros')} />
      <div className="px-4 pt-3 pb-6">
        <Card className="px-4 py-3">
          <div className="grid grid-cols-2 divide-x divide-line">
            <Balance profile={myProfile} fallback="Vos" points={myPoints} />
            {partnerUid ? (
              <Balance
                profile={partnerProfile}
                fallback="Tu pareja"
                points={household.points[partnerUid] ?? 0}
              />
            ) : (
              <div className="flex items-center justify-center px-3 text-center text-sm text-ink2">
                Esperando a tu pareja
              </div>
            )}
          </div>
        </Card>

        <SectionTitle>Para canjear</SectionTitle>
        {activeRewards.length > 0 ? (
          <Card>
            {activeRewards.map((reward) => (
              <div
                key={reward.id}
                className="flex min-h-13 w-full items-center gap-3 border-b border-line px-4 py-2 last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => openEdit(reward)}
                  className="min-h-11 min-w-0 flex-1 text-left"
                >
                  <div className="truncate font-medium">{reward.title}</div>
                  <div className="text-[13px] text-ink2 tabular">{reward.cost} pts</div>
                </button>
                <button
                  type="button"
                  onClick={() => redeem(reward)}
                  disabled={myPoints < reward.cost}
                  className="min-h-9 shrink-0 rounded-full bg-brand px-3 text-sm font-semibold text-on-brand transition-opacity duration-150 active:opacity-80 disabled:opacity-40"
                >
                  Canjear
                </button>
              </div>
            ))}
          </Card>
        ) : loading ? (
          <p className="px-4 py-10 text-center text-sm text-ink2">Cargando…</p>
        ) : (
          <EmptyState
            icon={<IconGift size={28} />}
            title="Todavía no hay premios"
            hint="Agregá algo con el + que dé ganas de sumar puntos."
          />
        )}

        <SectionTitle>Historial</SectionTitle>
        {history.length > 0 ? (
          <Card>
            {history.map((r) => (
              <ListRow
                key={r.id}
                title={`«${r.rewardTitle}»`}
                subtitle={`${memberName(r.redeemedBy)} · ${
                  r.createdAt ? formatShort(toISO(r.createdAt.toDate())) : 'recién'
                }`}
                right={
                  <span className="text-sm font-medium text-ink2 tabular">−{r.cost} pts</span>
                }
              />
            ))}
          </Card>
        ) : (
          <p className="px-4 py-6 text-center text-sm text-ink2">
            Cuando canjeen un premio, queda registrado acá.
          </p>
        )}
      </div>
      <FAB onClick={openNew} label="Nuevo premio" />
      <RewardFormSheet open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />
    </div>
  )
}
