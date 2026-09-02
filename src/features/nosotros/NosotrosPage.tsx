import { useNavigate } from 'react-router-dom'
import { MenuButton, PageHeader } from '../../components/ui'
import {
  IconChevron,
  IconFilm,
  IconGift,
  IconPlane,
  IconSparkle,
} from '../../components/icons'
import { useHome } from '../../hooks/useHousehold'
import { useCollection } from '../../hooks/useCollection'
import type { CouplePlan, PlanKind } from '../../types'

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}

export default function NosotrosPage() {
  const navigate = useNavigate()
  const { hid, uid, household } = useHome()

  const { data: plans } = useCollection<CouplePlan>(hid, 'planes', {
    orderByField: ['createdAt', 'desc'],
  })

  function pending(kind: PlanKind) {
    return plans.filter((p) => p.kind === kind && p.status === 'idea').length
  }

  const myPoints = household.points[uid] ?? 0
  const chevron = <IconChevron size={20} className="shrink-0 text-ink2" />

  return (
    <div>
      <PageHeader title="Nosotros" subtitle="El espacio de ustedes dos" />
      <div className="flex flex-col gap-3 px-4 pt-3 pb-28">
        <MenuButton
          icon={<IconSparkle size={22} />}
          title="Planes"
          subtitle={plural(pending('plan'), 'idea pendiente', 'ideas pendientes')}
          onClick={() => navigate('/nosotros/planes')}
          right={chevron}
        />
        <MenuButton
          icon={<IconFilm size={22} />}
          title="Cine"
          subtitle={`${pending('cine')} por ver`}
          onClick={() => navigate('/nosotros/cine')}
          right={chevron}
        />
        <MenuButton
          icon={<IconPlane size={22} />}
          title="Viajes"
          subtitle={plural(pending('viaje'), 'destino soñado', 'destinos soñados')}
          onClick={() => navigate('/nosotros/viajes')}
          right={chevron}
        />
        <MenuButton
          icon={<IconGift size={22} />}
          title="Premios"
          subtitle={`Tenés ${plural(myPoints, 'punto', 'puntos')}`}
          onClick={() => navigate('/nosotros/premios')}
          right={chevron}
        />
      </div>
    </div>
  )
}
