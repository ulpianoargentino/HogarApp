import { useNavigate } from 'react-router-dom'
import { PageHeader, Card, ListRow, SectionTitle, Avatar, EmptyState } from '../../components/ui'
import { IconBell, IconChevron, IconHeart, IconStar } from '../../components/icons'
import { useHome } from '../../hooks/useHousehold'
import { useCollection } from '../../hooks/useCollection'
import { computeUpcoming } from '../../hooks/useUpcoming'
import { formatARS } from '../../lib/money'
import { monthRange, relativeLabel, todayISO } from '../../lib/dates'
import type { CouplePlan, Expense, HouseholdEvent, Task, Warranty } from '../../types'

export default function HomePage() {
  const navigate = useNavigate()
  const { hid, uid, household, myProfile, partnerUid, partnerProfile } = useHome()

  const { data: events } = useCollection<HouseholdEvent>(hid, 'events', {
    orderByField: ['startDate', 'asc'],
  })
  const { data: warranties } = useCollection<Warranty>(hid, 'warranties', {
    orderByField: ['expiresAt', 'asc'],
  })
  const { data: tasks } = useCollection<Task>(hid, 'tasks', {
    orderByField: ['createdAt', 'asc'],
  })
  const today = todayISO()
  const [monthStart, monthEnd] = monthRange(
    Number(today.slice(0, 4)),
    Number(today.slice(5, 7)),
  )
  const { data: expenses } = useCollection<Expense>(hid, 'expenses', {
    filters: [
      ['date', '>=', monthStart],
      ['date', '<=', monthEnd],
    ],
    orderByField: ['date', 'desc'],
  })
  const { data: planes } = useCollection<CouplePlan>(hid, 'planes', {
    orderByField: ['createdAt', 'desc'],
  })

  const { items: upcoming } = computeUpcoming(events, warranties)
  const upcomingTop = upcoming.slice(0, 4)
  const myPending = tasks.filter((t) => !t.done && t.assigneeUid === uid)
  const monthTotal = expenses.reduce((sum, e) => sum + e.amount, 0)
  const ideas = planes.filter((p) => p.status === 'idea')
  const firstName = myProfile?.name.split(' ')[0] ?? 'Hola'

  return (
    <div>
      <PageHeader
        title={`Hola, ${firstName} 👋`}
        subtitle={household.name}
        right={
          <button type="button" onClick={() => navigate('/mas/premios')}>
            <span className="flex items-center gap-1 rounded-full bg-card px-3 py-1.5 text-sm font-semibold shadow-sm">
              <IconStar size={16} className="text-gold" />
              {household.points[uid] ?? 0}
            </span>
          </button>
        }
      />
      <div className="px-4 pb-4">
        {upcomingTop.length > 0 && (
          <>
            <SectionTitle>Próximos</SectionTitle>
            <Card>
              {upcomingTop.map((item) => (
                <ListRow
                  key={`${item.sourceId}-${item.date}`}
                  onClick={() => navigate('/calendario')}
                  left={
                    <IconBell
                      size={20}
                      className={item.urgent ? 'text-warn' : 'text-ink2'}
                    />
                  }
                  title={
                    <span className={item.urgent ? 'text-warn' : undefined}>
                      {item.title}
                    </span>
                  }
                  subtitle={relativeLabel(item.date)}
                  right={<IconChevron size={16} className="text-ink2" />}
                />
              ))}
            </Card>
          </>
        )}

        <SectionTitle>Este mes</SectionTitle>
        <Card>
          <ListRow
            onClick={() => navigate('/mas/gastos')}
            title={<span className="text-lg font-bold">{formatARS(monthTotal)}</span>}
            subtitle={
              expenses.length === 0
                ? 'Sin gastos anotados todavía'
                : `${expenses.length} ${expenses.length === 1 ? 'gasto' : 'gastos'} compartidos`
            }
            right={<IconChevron size={16} className="text-ink2" />}
          />
        </Card>

        <SectionTitle>Tus tareas pendientes</SectionTitle>
        <Card>
          {myPending.length === 0 ? (
            <EmptyState
              icon={<span className="text-3xl">🎉</span>}
              title="¡Estás al día!"
              hint="No tenés tareas pendientes."
            />
          ) : (
            myPending
              .slice(0, 4)
              .map((t) => (
                <ListRow
                  key={t.id}
                  onClick={() => navigate('/tareas')}
                  title={t.title}
                  subtitle={`+${t.points} pts`}
                  right={<IconChevron size={16} className="text-ink2" />}
                />
              ))
          )}
          {myPending.length > 4 && (
            <ListRow
              onClick={() => navigate('/tareas')}
              title={<span className="text-accent">Ver todas ({myPending.length})</span>}
            />
          )}
        </Card>

        <SectionTitle>Para ustedes dos</SectionTitle>
        <Card className="border border-love/25">
          <ListRow
            onClick={() => navigate('/mas/pareja')}
            left={<IconHeart size={22} className="text-love" />}
            title={
              ideas.length === 0
                ? 'Modo pareja'
                : ideas[0].title
            }
            subtitle={
              ideas.length === 0
                ? 'Anoten planes, series y escapadas'
                : `${ideas.length} ${ideas.length === 1 ? 'idea pendiente' : 'ideas pendientes'}`
            }
            right={<IconChevron size={16} className="text-ink2" />}
          />
        </Card>

        {partnerUid ? (
          <p className="mt-6 text-center text-xs text-ink2">
            Compartís este hogar con {partnerProfile?.name.split(' ')[0]}
          </p>
        ) : (
          <Card className="mt-6">
            <ListRow
              onClick={() => navigate('/mas/ajustes')}
              left={<Avatar profile={null} size={28} />}
              title="Invitá a tu pareja"
              subtitle={`Código: ${household.inviteCode}`}
              right={<IconChevron size={16} className="text-ink2" />}
            />
          </Card>
        )}
      </div>
    </div>
  )
}
