// Datos de ejemplo para la DEMO, con fechas relativas a hoy
import { Timestamp, __demoSeed, __demoStoreIsEmpty } from './firestore-shim'
import { addDaysISO, todayISO } from '../lib/dates'

const ANA = 'demo-ana'
const BRUNO = 'demo-bruno'
const HID = 'demo-hogar'
const H = `households/${HID}`

function ts(daysAgo: number, hourOffset = 0) {
  return Timestamp.fromMillis(Date.now() - daysAgo * 86_400_000 - hourOffset * 3_600_000)
}

export function seedDemoIfEmpty() {
  if (!__demoStoreIsEmpty()) return
  const today = todayISO()
  const day = (offset: number) => addDaysISO(today, offset)
  const month = today.slice(0, 7)

  __demoSeed({
    [`users/${ANA}`]: {
      householdId: HID,
      displayName: 'Ana',
      photoURL: null,
      email: 'ana@demo.hogarapp',
      createdAt: ts(30),
    },
    [`users/${BRUNO}`]: {
      householdId: HID,
      displayName: 'Bruno',
      photoURL: null,
      email: 'bruno@demo.hogarapp',
      createdAt: ts(30),
    },
    'invites/DEMO42': { householdId: HID, createdBy: ANA, createdAt: ts(30) },
    [H]: {
      name: 'Casa de Ana y Bruno',
      members: [ANA, BRUNO],
      memberProfiles: {
        [ANA]: { name: 'Ana', photoURL: null },
        [BRUNO]: { name: 'Bruno', photoURL: null },
      },
      points: { [ANA]: 35, [BRUNO]: 50 },
      inviteCode: 'DEMO42',
      createdAt: ts(30),
    },

    [`${H}/tasks/t1`]: {
      title: 'Regar las plantas',
      assigneeUid: ANA,
      done: false,
      points: 5,
      createdBy: BRUNO,
      createdAt: ts(2),
      completedAt: null,
      completedBy: null,
    },
    [`${H}/tasks/t2`]: {
      title: 'Llevar la ropa a la tintorería',
      assigneeUid: BRUNO,
      done: false,
      points: 10,
      createdBy: ANA,
      createdAt: ts(1),
      completedAt: null,
      completedBy: null,
    },
    [`${H}/tasks/t3`]: {
      title: 'Limpiar el horno',
      assigneeUid: BRUNO,
      done: true,
      points: 20,
      createdBy: ANA,
      createdAt: ts(4),
      completedAt: ts(1, 3),
      completedBy: BRUNO,
    },

    [`${H}/expenses/e1`]: {
      amount: 48200,
      description: 'Supermercado semanal',
      category: 'supermercado',
      paidBy: ANA,
      date: `${month}-08`,
      createdBy: ANA,
      createdAt: ts(8),
    },
    [`${H}/expenses/e2`]: {
      amount: 21000,
      description: 'Luz (Edesur)',
      category: 'servicios',
      paidBy: BRUNO,
      date: `${month}-12`,
      createdBy: BRUNO,
      createdAt: ts(6),
    },
    [`${H}/expenses/e3`]: {
      amount: 15300,
      description: 'Pizzas del viernes',
      category: 'ocio',
      paidBy: BRUNO,
      date: day(-3) >= `${month}-01` ? day(-3) : `${month}-02`,
      createdBy: BRUNO,
      createdAt: ts(3),
    },

    [`${H}/shoppingItems/s1`]: {
      name: 'Yerba',
      nameNorm: 'yerba',
      checked: false,
      addedBy: ANA,
      createdAt: ts(1),
      checkedAt: null,
      fromInventoryId: 'i2',
    },
    [`${H}/shoppingItems/s2`]: {
      name: 'Detergente',
      nameNorm: 'detergente',
      checked: false,
      addedBy: BRUNO,
      createdAt: ts(0, 5),
      checkedAt: null,
      fromInventoryId: null,
    },
    [`${H}/shoppingItems/s3`]: {
      name: 'Pan lactal',
      nameNorm: 'pan lactal',
      checked: true,
      addedBy: ANA,
      createdAt: ts(2),
      checkedAt: ts(0, 8),
      fromInventoryId: null,
    },

    [`${H}/products/yerba`]: { name: 'Yerba', nameNorm: 'yerba', count: 7, lastUsedAt: ts(1) },
    [`${H}/products/leche`]: { name: 'Leche', nameNorm: 'leche', count: 5, lastUsedAt: ts(4) },
    [`${H}/products/pan-lactal`]: { name: 'Pan lactal', nameNorm: 'pan lactal', count: 4, lastUsedAt: ts(2) },
    [`${H}/products/queso-cremoso`]: { name: 'Queso cremoso', nameNorm: 'queso cremoso', count: 3, lastUsedAt: ts(9) },
    [`${H}/products/detergente`]: { name: 'Detergente', nameNorm: 'detergente', count: 2, lastUsedAt: ts(0) },

    [`${H}/inventoryItems/i1`]: {
      name: 'Leche',
      nameNorm: 'leche',
      location: 'heladera',
      status: 'ok',
      updatedAt: ts(4),
      linkedShoppingItemId: null,
    },
    [`${H}/inventoryItems/i2`]: {
      name: 'Yerba',
      nameNorm: 'yerba',
      location: 'despensa',
      status: 'low',
      updatedAt: ts(1),
      linkedShoppingItemId: 's1',
    },
    [`${H}/inventoryItems/i3`]: {
      name: 'Huevos',
      nameNorm: 'huevos',
      location: 'heladera',
      status: 'ok',
      updatedAt: ts(6),
      linkedShoppingItemId: null,
    },

    [`${H}/events/ev1`]: {
      title: 'Pagar el alquiler',
      type: 'pago',
      startDate: `${month}-05`,
      recurrence: { freq: 'monthly', interval: 1 },
      endDate: null,
      remindDaysBefore: 3,
      notes: 'Transferencia a la inmobiliaria',
      doneDates: [`${month}-05`],
      createdBy: ANA,
      createdAt: ts(30),
    },
    [`${H}/events/ev2`]: {
      title: 'Turno dentista (Ana)',
      type: 'salud',
      startDate: day(2),
      recurrence: null,
      endDate: null,
      remindDaysBefore: 1,
      notes: '',
      doneDates: [],
      createdBy: ANA,
      createdAt: ts(10),
    },
    [`${H}/events/ev3`]: {
      title: 'Vienen los papás de Bruno',
      type: 'visita',
      startDate: day(6),
      recurrence: null,
      endDate: null,
      remindDaysBefore: 3,
      notes: 'Comprar algo rico para la merienda',
      doneDates: [],
      createdBy: BRUNO,
      createdAt: ts(5),
    },

    [`${H}/planes/p1`]: {
      title: 'Cena en la parrilla nueva de Palermo',
      kind: 'plan',
      status: 'idea',
      notes: '',
      createdBy: ANA,
      createdAt: ts(7),
      doneAt: null,
    },
    [`${H}/planes/p2`]: {
      title: 'Severance',
      kind: 'serie',
      status: 'idea',
      notes: 'Dicen que la 2.ª temporada es tremenda',
      createdBy: BRUNO,
      createdAt: ts(3),
      doneAt: null,
    },
    [`${H}/planes/p3`]: {
      title: 'Finde en Tigre',
      kind: 'escapada',
      status: 'hecho',
      notes: 'Salió hermoso 💛',
      createdBy: ANA,
      createdAt: ts(25),
      doneAt: ts(12),
    },

    [`${H}/rewards/r1`]: {
      title: 'Elegís la peli del viernes',
      cost: 30,
      active: true,
      createdBy: ANA,
      createdAt: ts(20),
    },
    [`${H}/rewards/r2`]: {
      title: 'Desayuno a la cama',
      cost: 50,
      active: true,
      createdBy: BRUNO,
      createdAt: ts(18),
    },
    [`${H}/redemptions/rd1`]: {
      rewardId: 'r1',
      rewardTitle: 'Elegís la peli del viernes',
      cost: 30,
      redeemedBy: BRUNO,
      createdAt: ts(6),
    },

    [`${H}/repairs/rp1`]: {
      title: 'Arreglo de la canilla del baño',
      date: day(-15),
      cost: 25000,
      status: 'hecho',
      notes: 'Vino Jorge, quedó perfecta',
      createdAt: ts(15),
    },
    [`${H}/repairs/rp2`]: {
      title: 'Pintar el marco de la ventana',
      date: day(-2),
      cost: null,
      status: 'pendiente',
      notes: '',
      createdAt: ts(2),
    },
    [`${H}/warranties/w1`]: {
      item: 'Lavarropas Drean',
      store: 'Frávega',
      expiresAt: day(20),
      notes: 'Factura en el mail',
      createdAt: ts(300),
    },
    [`${H}/contacts/c1`]: {
      name: 'Jorge',
      role: 'Plomero',
      phone: '11-5555-1234',
      notes: 'Recomendado del edificio',
      createdAt: ts(60),
    },
    [`${H}/contacts/c2`]: {
      name: 'Marta',
      role: 'Electricista',
      phone: '11-5555-9876',
      notes: '',
      createdAt: ts(45),
    },
  })
}
