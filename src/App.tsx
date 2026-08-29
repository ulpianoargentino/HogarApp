import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { HouseholdProvider, useHousehold, useHome } from './hooks/useHousehold'
import { useCollection } from './hooks/useCollection'
import { computeUpcoming } from './hooks/useUpcoming'
import { TabBar } from './components/TabBar'
import type { HouseholdEvent, Warranty } from './types'
import LoginPage from './features/auth/LoginPage'
import HogarSetupPage from './features/auth/HogarSetupPage'
import HomePage from './features/home/HomePage'
import TasksPage from './features/tasks/TasksPage'
import ShoppingPage from './features/shopping/ShoppingPage'
import CalendarPage from './features/calendar/CalendarPage'
import MorePage from './features/more/MorePage'
import ExpensesPage from './features/expenses/ExpensesPage'
import CouplePage from './features/couple/CouplePage'
import RewardsPage from './features/rewards/RewardsPage'
import MaintenancePage from './features/maintenance/MaintenancePage'
import SettingsPage from './features/settings/SettingsPage'

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="animate-pulse text-4xl">🏠</div>
    </div>
  )
}

/** Requiere sesión iniciada; monta el HouseholdProvider */
function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace />
  return (
    <HouseholdProvider>
      <Outlet />
    </HouseholdProvider>
  )
}

/** Requiere hogar creado/unido */
function RequireHousehold() {
  const { loading, userDoc, household } = useHousehold()
  if (loading) return <Splash />
  if (!userDoc?.householdId || !household) return <Navigate to="/hogar" replace />
  return <AppShell />
}

/** Shell con TabBar y badge del calendario */
function AppShell() {
  const { hid } = useHome()
  const { data: events } = useCollection<HouseholdEvent>(hid, 'events', {
    orderByField: ['startDate', 'asc'],
  })
  const { data: warranties } = useCollection<Warranty>(hid, 'warranties', {
    orderByField: ['expiresAt', 'asc'],
  })
  const { badgeCount } = computeUpcoming(events, warranties)

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-24">
      <Outlet />
      <TabBar calendarBadge={badgeCount} />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/hogar" element={<HogarSetupPage />} />
        <Route element={<RequireHousehold />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/tareas" element={<TasksPage />} />
          <Route path="/compras" element={<ShoppingPage />} />
          <Route path="/compras/despensa" element={<ShoppingPage />} />
          <Route path="/calendario" element={<CalendarPage />} />
          <Route path="/mas" element={<MorePage />} />
          <Route path="/mas/gastos" element={<ExpensesPage />} />
          <Route path="/mas/pareja" element={<CouplePage />} />
          <Route path="/mas/premios" element={<RewardsPage />} />
          <Route path="/mas/mantenimiento" element={<MaintenancePage />} />
          <Route path="/mas/ajustes" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
