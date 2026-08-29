// Entrada de la DEMO: misma app, router por hash, datos de ejemplo locales
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import '../index.css'
import App from '../App'
import { AuthProvider } from '../hooks/useAuth'
import { seedDemoIfEmpty } from './seed'

seedDemoIfEmpty()

function DemoBadge() {
  return (
    <div
      className="pointer-events-none fixed right-2 z-30 rounded-full bg-warn-soft px-2.5 py-1 text-[11px] font-semibold text-warn shadow-sm"
      style={{ top: 'calc(env(safe-area-inset-top) + 8px)' }}
    >
      Demo
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
        <DemoBadge />
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)
