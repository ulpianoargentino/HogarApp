import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useHousehold } from '../../hooks/useHousehold'
import { useAuth } from '../../hooks/useAuth'
import { Field, inputClass, SegmentedControl, SubmitButton } from '../../components/ui'

export default function HogarSetupPage() {
  const { userDoc, household, loading, createHousehold, joinHousehold } = useHousehold()
  const { signOut } = useAuth()
  const [mode, setMode] = useState<'crear' | 'unirse'>('crear')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!loading && userDoc?.householdId && household) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'crear') await createHousehold(name.trim())
      else await joinHousehold(code)
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo completar. Probá de nuevo.',
      )
    } finally {
      setBusy(false)
    }
  }

  const canSubmit = mode === 'crear' ? name.trim().length >= 2 : code.trim().length >= 4

  return (
    <div className="pt-safe pb-safe mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6">
      <div className="mb-6 text-center">
        <div className="text-5xl">🏠</div>
        <h1 className="mt-2 text-2xl font-bold">Tu hogar</h1>
        <p className="mt-1 text-ink2">
          Creá un hogar nuevo o unite al que armó tu pareja.
        </p>
      </div>

      <SegmentedControl
        options={[
          { value: 'crear', label: 'Crear hogar' },
          { value: 'unirse', label: 'Tengo un código' },
        ]}
        value={mode}
        onChange={(m) => {
          setMode(m)
          setError(null)
        }}
      />

      <form onSubmit={handleSubmit} className="mt-6">
        {mode === 'crear' ? (
          <Field label="Nombre del hogar">
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Casa de Ana y Bruno"
              autoFocus
            />
          </Field>
        ) : (
          <Field label="Código de invitación">
            <input
              className={`${inputClass} text-center font-mono text-xl tracking-[0.3em] uppercase`}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="K7M3PQ"
              maxLength={6}
              autoCapitalize="characters"
              autoComplete="off"
            />
          </Field>
        )}
        {error && <p className="mb-3 text-sm text-danger">{error}</p>}
        <SubmitButton disabled={!canSubmit || busy}>
          {busy ? 'Un momento…' : mode === 'crear' ? 'Crear hogar' : 'Unirme'}
        </SubmitButton>
      </form>

      <button
        type="button"
        onClick={signOut}
        className="mt-8 min-h-11 text-sm text-ink2"
      >
        Cerrar sesión
      </button>
    </div>
  )
}
