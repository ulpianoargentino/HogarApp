import { NavLink } from 'react-router-dom'
import {
  IconCalendar,
  IconCart,
  IconHeart,
  IconHome,
  IconTasks,
  IconWallet,
} from './icons'

const tabs = [
  { to: '/', label: 'Inicio', icon: IconHome, end: true },
  { to: '/tareas', label: 'Tareas', icon: IconTasks },
  { to: '/compras', label: 'Compras', icon: IconCart },
  { to: '/gastos', label: 'Gastos', icon: IconWallet },
  { to: '/calendario', label: 'Calendario', icon: IconCalendar },
  { to: '/nosotros', label: 'Nosotros', icon: IconHeart },
]

export function TabBar({ calendarBadge = 0 }: { calendarBadge?: number }) {
  return (
    <nav
      aria-label="Secciones"
      className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-lg px-1">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex min-h-13 flex-1 flex-col items-center justify-center gap-0.5 pt-2 pb-1 text-[10.5px] font-semibold transition-colors duration-150 ${
                isActive ? 'text-brand dark:text-accent' : 'text-ink2'
              }`
            }
          >
            <span className="relative">
              <Icon size={23} />
              {to === '/calendario' && calendarBadge > 0 && (
                <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
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
