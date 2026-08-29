import { useNavigate } from 'react-router-dom'
import { PageHeader, Card, ListRow } from '../../components/ui'
import {
  IconChevron,
  IconGift,
  IconHeart,
  IconSettings,
  IconWallet,
  IconWrench,
} from '../../components/icons'

const entries = [
  { to: '/mas/gastos', label: 'Gastos', sub: 'Gastos y compras compartidos', icon: IconWallet },
  { to: '/mas/pareja', label: 'Modo pareja', sub: 'Planes, series y escapadas', icon: IconHeart },
  { to: '/mas/premios', label: 'Premios', sub: 'Puntos y canjes', icon: IconGift },
  { to: '/mas/mantenimiento', label: 'Mantenimiento', sub: 'Arreglos, garantías y contactos', icon: IconWrench },
  { to: '/mas/ajustes', label: 'Ajustes', sub: 'Tu hogar y tu cuenta', icon: IconSettings },
]

export default function MorePage() {
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader title="Más" />
      <div className="px-4 pt-4">
        <Card>
          {entries.map(({ to, label, sub, icon: Icon }) => (
            <ListRow
              key={to}
              onClick={() => navigate(to)}
              left={<Icon size={24} className="text-accent" />}
              title={label}
              subtitle={sub}
              right={<IconChevron size={18} className="text-ink2" />}
            />
          ))}
        </Card>
      </div>
    </div>
  )
}
