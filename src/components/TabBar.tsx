import { NavLink } from 'react-router-dom'
import {
  IconCalendar,
  IconCart,
  IconCheckCircle,
  IconHome,
  IconMore,
} from './icons'

const tabs = [
  { to: '/', label: 'Inicio', icon: IconHome, end: true },
  { to: '/tareas', label: 'Tareas', icon: IconCheckCircle },
  { to: '/compras', label: 'Compras', icon: IconCart },
  { to: '/calendario', label: 'Calendario', icon: IconCalendar },
  { to: '/mas', label: 'Más', icon: IconMore },
]

export function TabBar({ calendarBadge = 0 }: { calendarBadge?: number }) {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 pb-1 text-[11px] font-medium ${
                isActive ? 'text-accent' : 'text-ink2'
              }`
            }
          >
            <span className="relative">
              <Icon size={24} />
              {to === '/calendario' && calendarBadge > 0 && (
                <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {calendarBadge}
                </span>
              )}
            </span>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
