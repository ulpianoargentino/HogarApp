import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { HouseholdProvider, useHousehold, useHome } from './hooks/useHousehold'
import { useCollection } from './hooks/useCollection'
import { computeUpcoming } from './hooks/useUpcoming'
import { TabBar } from './components/TabBar'
import { monthRange, todayISO } from './lib/dates'
import type { Expense, FixedExpense, HouseholdEvent } from './types'
import LoginPage from './features/auth/LoginPage'
import HogarSetupPage from './features/auth/HogarSetupPage'
import HomePage from './features/home/HomePage'
import TasksPage from './features/tasks/TasksPage'
import ShoppingPage from './features/shopping/ShoppingPage'
import ExpensesPage from './features/expenses/ExpensesPage'
import CalendarPage from './features/calendar/CalendarPage'
import NosotrosPage from './features/nosotros/NosotrosPage'
import PlansPage from './features/nosotros/PlansPage'
import RewardsPage from './features/nosotros/RewardsPage'
import ConfigPage from './features/config/ConfigPage'
import ContactsPage from './features/config/ContactsPage'
import SettingsPage from './features/config/SettingsPage'

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="h-10 w-10 animate-pulse rounded-2xl bg-brand" />
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

/** Shell con TabBar y badge del calendario (eventos + pagos fijos urgentes) */
function AppShell() {
  const { hid } = useHome()
  const today = todayISO()
  const [monthStart, monthEnd] = monthRange(Number(today.slice(0, 4)), Number(today.slice(5, 7)))
  const { data: events } = useCollection<HouseholdEvent>(hid, 'events', {
    orderByField: ['startDate', 'asc'],
  })
  const { data: fixed } = useCollection<FixedExpense>(hid, 'fixedExpenses', {
    orderByField: ['dayOfMonth', 'asc'],
  })
  const { data: expenses } = useCollection<Expense>(hid, 'expenses', {
    filters: [
      ['date', '>=', monthStart],
      ['date', '<=', monthEnd],
    ],
    orderByField: ['date', 'desc'],
  })
  const { badgeCount } = computeUpcoming(events, fixed, expenses)

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-28">
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
          <Route path="/compras/provisiones" element={<ShoppingPage />} />
          <Route path="/gastos" element={<ExpensesPage />} />
          <Route path="/calendario" element={<CalendarPage />} />
          <Route path="/nosotros" element={<NosotrosPage />} />
          <Route path="/nosotros/planes" element={<PlansPage kind="plan" />} />
          <Route path="/nosotros/cine" element={<PlansPage kind="cine" />} />
          <Route path="/nosotros/viajes" element={<PlansPage kind="viaje" />} />
          <Route path="/nosotros/premios" element={<RewardsPage />} />
          <Route path="/config" element={<ConfigPage />} />
          <Route path="/config/contactos" element={<ContactsPage />} />
          <Route path="/config/ajustes" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
