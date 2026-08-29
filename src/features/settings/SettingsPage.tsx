import { useState } from 'react'
import { PageHeader, Card, ListRow, Avatar, SectionTitle } from '../../components/ui'
import { useHome } from '../../hooks/useHousehold'
import { useAuth } from '../../hooks/useAuth'

export default function SettingsPage() {
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
      <PageHeader title="Ajustes" />
      <div className="px-4">
        <SectionTitle>Hogar</SectionTitle>
        <Card>
          <ListRow title={household.name} subtitle="Nombre del hogar" />
          <ListRow
            title={<span className="font-mono tracking-widest">{household.inviteCode}</span>}
            subtitle={
              partnerUid
                ? 'Código de invitación (ya son dos)'
                : 'Compartí este código con tu pareja'
            }
            right={
              <button
                type="button"
                onClick={partnerUid ? copyCode : shareCode}
                className="min-h-9 rounded-full bg-accent-soft px-3 text-sm font-semibold text-accent"
              >
                {copied ? '¡Copiado!' : partnerUid ? 'Copiar' : 'Compartir'}
              </button>
            }
          />
        </Card>

        <SectionTitle>Integrantes</SectionTitle>
        <Card>
          <ListRow
            left={<Avatar profile={myProfile} />}
            title={myProfile?.name ?? 'Vos'}
            subtitle={`${household.points[uid] ?? 0} puntos`}
          />
          {partnerUid ? (
            <ListRow
              left={<Avatar profile={partnerProfile} />}
              title={partnerProfile?.name ?? 'Tu pareja'}
              subtitle={`${household.points[partnerUid] ?? 0} puntos`}
            />
          ) : (
            <ListRow
              title="Esperando a tu pareja…"
              subtitle="Cuando use el código, aparece acá"
            />
          )}
        </Card>

        <SectionTitle>Cuenta</SectionTitle>
        <Card>
          <ListRow
            onClick={signOut}
            title={<span className="text-danger">Cerrar sesión</span>}
          />
        </Card>

        <p className="mt-8 mb-4 text-center text-xs text-ink2">
          HogarApp · hecha para ustedes dos 💛
        </p>
      </div>
    </div>
  )
}
