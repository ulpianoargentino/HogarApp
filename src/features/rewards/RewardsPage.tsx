import { useMemo, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  increment,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
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
import { IconGift, IconStar, IconTrash } from '../../components/icons'
import { formatShort, toISO } from '../../lib/dates'
import { useHome } from '../../hooks/useHousehold'
import { useCollection } from '../../hooks/useCollection'
import type { Redemption, Reward } from '../../types'
import RewardFormSheet from './RewardFormSheet'

export default function RewardsPage() {
  const { hid, uid, household, partnerUid, myProfile, partnerProfile } = useHome()
  const [formOpen, setFormOpen] = useState(false)

  const { data: rewards, loading } = useCollection<Reward>(hid, 'rewards', {
    orderByField: ['createdAt', 'asc'],
  })
  const { data: redemptions } = useCollection<Redemption>(hid, 'redemptions', {
    orderByField: ['createdAt', 'desc'],
    max: 30,
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

  async function deleteReward(reward: Reward) {
    if (!window.confirm(`¿Borrar el premio «${reward.title}»?`)) return
    await deleteDoc(doc(db, 'households', hid, 'rewards', reward.id))
  }

  function memberName(memberUid: string) {
    return household.memberProfiles[memberUid]?.name.split(' ')[0] ?? 'Alguien'
  }

  return (
    <div>
      <PageHeader title="Premios" />
      <div className="px-4 pt-3 pb-28">
        <Card>
          <ListRow
            left={<Avatar profile={myProfile} />}
            title={myProfile?.name.split(' ')[0] ?? 'Vos'}
            right={
              <span className="flex items-center gap-1 font-semibold text-gold">
                <IconStar size={17} />
                {myPoints} pts
              </span>
            }
          />
          {partnerUid && (
            <ListRow
              left={<Avatar profile={partnerProfile} />}
              title={partnerProfile?.name.split(' ')[0] ?? 'Tu pareja'}
              right={
                <span className="flex items-center gap-1 font-semibold text-gold">
                  <IconStar size={17} />
                  {household.points[partnerUid] ?? 0} pts
                </span>
              }
            />
          )}
        </Card>

        <SectionTitle>Premios</SectionTitle>
        {activeRewards.length > 0 ? (
          <Card>
            {activeRewards.map((reward) => (
              <ListRow
                key={reward.id}
                title={reward.title}
                subtitle={
                  <span className="text-gold">{reward.cost} pts</span>
                }
                right={
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => redeem(reward)}
                      disabled={myPoints < reward.cost}
                      className="min-h-11 rounded-full bg-accent-soft px-4 text-sm font-semibold text-accent disabled:opacity-40"
                    >
                      Canjear
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteReward(reward)}
                      aria-label="Borrar premio"
                      className="flex h-11 w-11 shrink-0 items-center justify-center text-ink2 active:text-danger"
                    >
                      <IconTrash size={19} />
                    </button>
                  </span>
                }
              />
            ))}
          </Card>
        ) : loading ? (
          <p className="px-4 py-10 text-center text-sm text-ink2">Cargando…</p>
        ) : (
          <EmptyState
            icon={<IconGift size={40} />}
            title="Todavía no hay premios"
            hint="Agregá algo con el + para tentarse a sumar puntos."
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
                right={<span className="text-sm font-medium text-ink2">−{r.cost} pts</span>}
              />
            ))}
          </Card>
        ) : (
          <EmptyState
            icon={<IconGift size={40} />}
            title="Nada canjeado por ahora"
            hint="Cuando canjeen un premio, queda registrado acá."
          />
        )}
      </div>
      <FAB onClick={() => setFormOpen(true)} label="Nuevo premio" />
      <RewardFormSheet open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
