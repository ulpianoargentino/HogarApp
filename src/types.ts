import type { Timestamp } from 'firebase/firestore'

// ---------- Cuentas y hogar ----------

export interface UserDoc {
  householdId: string | null
  displayName: string
  photoURL: string | null
  email: string
  createdAt: Timestamp
}

export interface MemberProfile {
  name: string
  photoURL: string | null
}

export interface Household {
  id: string
  name: string
  members: string[] // máx 2 uids
  memberProfiles: Record<string, MemberProfile>
  points: Record<string, number>
  inviteCode: string
  createdAt: Timestamp
}

// ---------- Tareas y premios ----------

export interface Task {
  id: string
  title: string
  assigneeUid: string
  done: boolean
  points: number // 5 | 10 | 20
  createdBy: string
  createdAt: Timestamp
  completedAt: Timestamp | null
  completedBy: string | null
}

export interface Reward {
  id: string
  title: string
  cost: number
  active: boolean
  createdBy: string
  createdAt: Timestamp
}

export interface Redemption {
  id: string
  rewardId: string
  rewardTitle: string
  cost: number
  redeemedBy: string
  createdAt: Timestamp
}

// ---------- Gastos ----------

export const EXPENSE_CATEGORIES = [
  'supermercado',
  'servicios',
  'alquiler',
  'salud',
  'ocio',
  'hogar',
  'otro',
] as const
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export interface Expense {
  id: string
  amount: number // ARS enteros
  description: string
  category: ExpenseCategory
  paidBy: string
  date: string // YYYY-MM-DD
  createdBy: string
  createdAt: Timestamp
}

// ---------- Compras e inventario ----------

export interface ShoppingItem {
  id: string
  name: string
  nameNorm: string
  checked: boolean
  addedBy: string
  createdAt: Timestamp
  checkedAt: Timestamp | null
  fromInventoryId: string | null
}

export interface Product {
  id: string // slug
  name: string
  nameNorm: string
  count: number
  lastUsedAt: Timestamp
}

export type InventoryStatus = 'ok' | 'low' | 'out'

export interface InventoryItem {
  id: string
  name: string
  nameNorm: string
  location: 'heladera' | 'despensa'
  status: InventoryStatus
  updatedAt: Timestamp
  linkedShoppingItemId: string | null
}

// ---------- Calendario ----------

export type EventType = 'pago' | 'salud' | 'visita' | 'otro'

export interface EventRecurrence {
  freq: 'weekly' | 'monthly' | 'yearly'
  interval: number
}

export interface HouseholdEvent {
  id: string
  title: string
  type: EventType
  startDate: string // YYYY-MM-DD
  recurrence: EventRecurrence | null
  endDate: string | null
  remindDaysBefore: number
  notes: string
  doneDates: string[]
  createdBy: string
  createdAt: Timestamp
}

// ---------- Modo pareja ----------

export type PlanKind = 'plan' | 'serie' | 'escapada'

export interface CouplePlan {
  id: string
  title: string
  kind: PlanKind
  status: 'idea' | 'hecho'
  notes: string
  createdBy: string
  createdAt: Timestamp
  doneAt: Timestamp | null
}

// ---------- Mantenimiento ----------

export interface Repair {
  id: string
  title: string
  date: string // YYYY-MM-DD
  cost: number | null
  status: 'pendiente' | 'hecho'
  notes: string
  createdAt: Timestamp
}

export interface Warranty {
  id: string
  item: string
  store: string | null
  expiresAt: string // YYYY-MM-DD
  notes: string
  createdAt: Timestamp
}

export interface HomeContact {
  id: string
  name: string
  role: string
  phone: string
  notes: string
  createdAt: Timestamp
}
