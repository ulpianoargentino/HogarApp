import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!loading && user) return <Navigate to="/" replace />

  async function handleSignIn() {
    setBusy(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch {
      setError('No pudimos iniciar sesión. Probá de nuevo.')
      setBusy(false)
    }
  }

  return (
    <div className="pt-safe pb-safe flex min-h-dvh flex-col items-center justify-center px-8">
      <div className="mb-2 text-6xl">🏠</div>
      <h1 className="text-3xl font-bold">HogarApp</h1>
      <p className="mt-2 mb-10 text-center text-ink2">
        Administrá tu hogar entre dos: tareas, gastos, compras y más.
      </p>
      <button
        type="button"
        onClick={handleSignIn}
        disabled={busy || loading}
        className="flex min-h-12 w-full max-w-xs items-center justify-center gap-3 rounded-xl bg-accent font-semibold text-white active:opacity-80 disabled:opacity-50"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4Z"
          />
          <path
            fill="currentColor"
            opacity=".8"
            d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1a5.9 5.9 0 0 1-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"
          />
          <path
            fill="currentColor"
            opacity=".6"
            d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z"
          />
          <path
            fill="currentColor"
            opacity=".9"
            d="M12 6c1.5 0 2.8.5 3.8 1.5L18.7 5A10 10 0 0 0 3.1 7.5l3.3 2.6A5.9 5.9 0 0 1 12 6Z"
          />
        </svg>
        {busy ? 'Redirigiendo…' : 'Continuar con Google'}
      </button>
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      <p className="mt-10 max-w-xs text-center text-xs text-ink2">
        Después de entrar vas a poder crear tu hogar o unirte al de tu pareja
        con un código.
      </p>
    </div>
  )
}
