import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Card, ListRow, PageHeader, SectionTitle } from '../../components/ui'
import { IconHome, IconStar, IconUsers } from '../../components/icons'
import { useHome } from '../../hooks/useHousehold'
import { useAuth } from '../../hooks/useAuth'

function IconChip({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand dark:text-accent">
      {children}
    </span>
  )
}

function Points({ value }: { value: number }) {
  return (
    <span className="flex shrink-0 items-center gap-1 text-accent">
      <IconStar size={15} />
      <span className="font-display text-base font-extrabold tabular">{value}</span>
      <span className="text-xs font-semibold text-ink2">pts</span>
    </span>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { household, uid, myProfile, partnerProfile, partnerUid } = useHome()
  const { signOut } = useAuth()
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(household.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard puede fallar en algunos contextos; el código queda visible igual
    }
  }

  async function shareCode() {
    const text = `Unite a nuestro hogar "${household.name}" en HogarApp con el código ${household.inviteCode} → ${location.origin}`
    if (navigator.share) {
      try {
        await navigator.share({ text })
      } catch {
        // cancelado por el usuario
      }
    } else {
      copyCode()
    }
  }

  return (
    <div>
      <PageHeader title="Ajustes" onBack={() => navigate('/config')} />
      <div className="px-4 pb-28">
        <SectionTitle>Hogar</SectionTitle>
        <Card>
          <ListRow
            left={
              <IconChip>
                <IconHome size={20} />
              </IconChip>
            }
            title={household.name}
            subtitle="Nombre del hogar"
          />
          <ListRow
            left={
              <IconChip>
                <IconUsers size={20} />
              </IconChip>
            }
            title={
              <span className="font-display text-lg font-bold tracking-widest">
                {household.inviteCode}
              </span>
            }
            subtitle={
              partnerUid ? 'Código de invitación (ya son dos)' : 'Compartí este código con tu pareja'
            }
            right={
              <button
                type="button"
                onClick={partnerUid ? copyCode : shareCode}
                className="min-h-9 shrink-0 rounded-full bg-brand px-3 text-sm font-semibold text-on-brand transition-opacity duration-150 active:opacity-80"
              >
                {copied ? 'Copiado' : partnerUid ? 'Copiar' : 'Compartir'}
              </button>
            }
          />
        </Card>

        <SectionTitle>Integrantes</SectionTitle>
        <Card>
          <ListRow
            left={<Avatar profile={myProfile} size={40} />}
            title={myProfile?.name ?? 'Vos'}
            subtitle="Vos"
            right={<Points value={household.points[uid] ?? 0} />}
          />
          {partnerUid ? (
            <ListRow
              left={<Avatar profile={partnerProfile} size={40} />}
              title={partnerProfile?.name ?? 'Tu pareja'}
              subtitle="Tu pareja"
              right={<Points value={household.points[partnerUid] ?? 0} />}
            />
          ) : (
            <ListRow
              left={
                <IconChip>
                  <IconUsers size={20} />
                </IconChip>
              }
              title="Esperando a tu pareja"
              subtitle="Cuando use el código, aparece acá"
            />
          )}
        </Card>

        <SectionTitle>Cuenta</SectionTitle>
        <Card>
          <ListRow onClick={signOut} title={<span className="text-danger">Cerrar sesión</span>} />
        </Card>

        <p className="mt-8 mb-4 text-center text-xs text-ink2">HogarApp · hecha para ustedes dos</p>
      </div>
    </div>
  )
}
