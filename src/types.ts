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

// ---------- Recurrencia (compartida por eventos, tareas y gastos fijos) ----------

export interface EventRecurrence {
  freq: 'weekly' | 'monthly' | 'yearly'
  interval: number
}

// ---------- Tareas ----------

/** Una tarea concreta de un día. Si viene de una serie, id = `${seriesId}_${date}`. */
export interface Task {
  id: string
  title: string
  assigneeUid: string
  date: string // YYYY-MM-DD
  done: boolean
  points: number // libre, entero >= 0
  seriesId: string | null
  createdBy: string
  createdAt: Timestamp
  completedAt: Timestamp | null
  completedBy: string | null
}

/** Tarea recurrente: genera una Task por ocurrencia (materializada al ver el día). */
export interface TaskSeries {
  id: string
  title: string
  assigneeUid: string
  points: number
  startDate: string
  recurrence: EventRecurrence
  endDate: string | null
  active: boolean
  createdBy: string
  createdAt: Timestamp
}

/** Tarea frecuente autoaprendida (docId = slug del título) con sus últimos puntos. */
export interface TaskTemplate {
  id: string
  title: string
  points: number
  count: number
  lastUsedAt: Timestamp
}

// ---------- Premios ----------

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
  kind: 'fijo' | 'variable'
  /** Si es el pago de un gasto fijo programado */
  fixedExpenseId: string | null
  /** Fecha de vencimiento de la ocurrencia que salda (YYYY-MM-DD) */
  fixedDueDate: string | null
  createdBy: string
  createdAt: Timestamp
}

/** Gasto fijo programado (alquiler, expensas, servicios…): vence todos los meses. */
export interface FixedExpense {
  id: string
  name: string
  amount: number // monto estimado, se confirma al pagar
  category: ExpenseCategory
  dayOfMonth: number // 1-31 (se clampea al último día del mes)
  startDate: string // primer vencimiento YYYY-MM-DD
  endDate: string | null
  paidBy: string | null // quién suele pagarlo
  remindDaysBefore: number
  active: boolean
  createdBy: string
  createdAt: Timestamp
}

// ---------- Compras y provisiones ----------

export interface ShoppingItem {
  id: string
  name: string
  nameNorm: string
  addedBy: string
  createdAt: Timestamp
  /** Si vino de Provisiones (para devolverlo a "Hay" al comprarlo) */
  fromInventoryId: string | null
}

export type InventoryLocation = 'heladera' | 'despensa' | 'limpieza'
export type InventoryStatus = 'ok' | 'comprar'

export interface Product {
  id: string // slug
  name: string
  nameNorm: string
  count: number
  lastUsedAt: Timestamp
  /** Categoría recordada de Provisiones (null hasta la primera vez) */
  location: InventoryLocation | null
}

export interface InventoryItem {
  id: string
  name: string
  nameNorm: string
  location: InventoryLocation
  status: InventoryStatus
  updatedAt: Timestamp
  linkedShoppingItemId: string | null
}

// ---------- Calendario ----------

export type EventType = 'pago' | 'salud' | 'visita' | 'otro'

export interface HouseholdEvent {
  id: string
  title: string
  type: EventType
  startDate: string // YYYY-MM-DD
  time: string | null // HH:MM opcional
  recurrence: EventRecurrence | null
  endDate: string | null
  remindDaysBefore: number
  notes: string
  doneDates: string[]
  createdBy: string
  createdAt: Timestamp
}

// ---------- Nosotros ----------

export type PlanKind = 'plan' | 'cine' | 'viaje'

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

// ---------- Configuración ----------

export interface HomeContact {
  id: string
  name: string
  role: string
  phone: string
  notes: string
  createdAt: Timestamp
}
