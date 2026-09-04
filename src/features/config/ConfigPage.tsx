import { useNavigate } from 'react-router-dom'
import { MenuButton, PageHeader } from '../../components/ui'
import { IconChevron, IconPhone, IconSettings } from '../../components/icons'

export default function ConfigPage() {
  const navigate = useNavigate()
  const chevron = <IconChevron size={20} className="shrink-0 text-ink2" />

  return (
    <div>
      <PageHeader title="Configuración" onBack={() => navigate('/')} />
      <div className="flex flex-col gap-3 px-4 pt-3 pb-6">
        <MenuButton
          icon={<IconPhone size={22} />}
          title="Contactos"
          subtitle="Plomero, electricista, cerrajero…"
          onClick={() => navigate('/config/contactos')}
          right={chevron}
        />
        <MenuButton
          icon={<IconSettings size={22} />}
          title="Ajustes"
          subtitle="Tu hogar, tu pareja y tu cuenta"
          onClick={() => navigate('/config/ajustes')}
          right={chevron}
        />
      </div>
    </div>
  )
}
