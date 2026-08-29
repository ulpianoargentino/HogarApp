// Tests de las reglas de seguridad de Firestore contra el emulador.
// Correr con: npm run test:rules  (levanta el emulador y ejecuta este archivo)
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { readFileSync } from 'node:fs'
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

let env: RulesTestEnvironment

const ANA = 'uid-ana'
const BRUNO = 'uid-bruno'
const INTRUSO = 'uid-intruso'
const HID = 'hogar-1'
const CODE = 'K7M3PQ'

function db(uid: string) {
  return env.authenticatedContext(uid).firestore()
}

async function seedHousehold(members: string[], points: Record<string, number>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'households', HID), {
      name: 'Casa test',
      members,
      memberProfiles: Object.fromEntries(
        members.map((m) => [m, { name: m, photoURL: null }]),
      ),
      points,
      inviteCode: CODE,
    })
    await setDoc(doc(ctx.firestore(), 'invites', CODE), {
      householdId: HID,
      createdBy: members[0],
    })
  })
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'hogarapp-rules-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

afterAll(async () => {
  await env.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
})

describe('households: creación y join', () => {
  it('permite crear un hogar solo con uno mismo como único miembro', async () => {
    await assertSucceeds(
      setDoc(doc(db(ANA), 'households', HID), {
        name: 'Casa',
        members: [ANA],
        memberProfiles: { [ANA]: { name: 'Ana', photoURL: null } },
        points: { [ANA]: 0 },
        inviteCode: CODE,
      }),
    )
  })

  it('rechaza crear un hogar con otro como miembro', async () => {
    await assertFails(
      setDoc(doc(db(ANA), 'households', HID), {
        name: 'Casa',
        members: [ANA, BRUNO],
        memberProfiles: {},
        points: { [ANA]: 0, [BRUNO]: 0 },
        inviteCode: CODE,
      }),
    )
  })

  it('permite al segundo unirse agregándose exactamente a sí mismo', async () => {
    await seedHousehold([ANA], { [ANA]: 0 })
    await assertSucceeds(
      updateDoc(doc(db(BRUNO), 'households', HID), {
        members: [ANA, BRUNO],
        [`memberProfiles.${BRUNO}`]: { name: 'Bruno', photoURL: null },
        [`points.${BRUNO}`]: 0,
      }),
    )
  })

  it('rechaza a un tercero cuando ya son dos', async () => {
    await seedHousehold([ANA, BRUNO], { [ANA]: 0, [BRUNO]: 0 })
    await assertFails(
      updateDoc(doc(db(INTRUSO), 'households', HID), {
        members: [ANA, BRUNO, INTRUSO],
        [`memberProfiles.${INTRUSO}`]: { name: 'X', photoURL: null },
        [`points.${INTRUSO}`]: 0,
      }),
    )
  })

  it('rechaza un join que además toque otros campos', async () => {
    await seedHousehold([ANA], { [ANA]: 0 })
    await assertFails(
      updateDoc(doc(db(BRUNO), 'households', HID), {
        members: [ANA, BRUNO],
        [`points.${BRUNO}`]: 0,
        name: 'Casa hackeada',
      }),
    )
  })

  it('un no-miembro no puede leer el hogar', async () => {
    await seedHousehold([ANA, BRUNO], { [ANA]: 0, [BRUNO]: 0 })
    await assertFails(getDoc(doc(db(INTRUSO), 'households', HID)))
  })
})

describe('households: puntos', () => {
  beforeEach(() => seedHousehold([ANA, BRUNO], { [ANA]: 10, [BRUNO]: 40 }))

  it('permite sumarse hasta +50 al balance propio', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ANA), 'households', HID), { [`points.${ANA}`]: 30 }),
    )
  })

  it('rechaza un delta mayor a +50', async () => {
    await assertFails(
      updateDoc(doc(db(ANA), 'households', HID), { [`points.${ANA}`]: 100 }),
    )
  })

  it('permite canjear (delta negativo) sin quedar bajo cero', async () => {
    await assertSucceeds(
      updateDoc(doc(db(BRUNO), 'households', HID), { [`points.${BRUNO}`]: 0 }),
    )
  })

  it('rechaza un balance negativo', async () => {
    await assertFails(
      updateDoc(doc(db(ANA), 'households', HID), { [`points.${ANA}`]: -5 }),
    )
  })

  it('rechaza tocar el balance de la pareja', async () => {
    await assertFails(
      updateDoc(doc(db(ANA), 'households', HID), { [`points.${BRUNO}`]: 0 }),
    )
  })
})

describe('subcolecciones', () => {
  beforeEach(() => seedHousehold([ANA, BRUNO], { [ANA]: 0, [BRUNO]: 0 }))

  it('un miembro escribe y lee tareas; un intruso no', async () => {
    const ref = doc(db(ANA), 'households', HID, 'tasks', 't1')
    await assertSucceeds(
      setDoc(ref, { title: 'Lavar los platos', done: false }),
    )
    await assertSucceeds(getDoc(doc(db(BRUNO), 'households', HID, 'tasks', 't1')))
    await assertFails(getDoc(doc(db(INTRUSO), 'households', HID, 'tasks', 't1')))
    await assertFails(
      setDoc(doc(db(INTRUSO), 'households', HID, 'tasks', 't2'), { title: 'x' }),
    )
  })

  it('redemptions: solo alta propia, nunca editar ni borrar', async () => {
    const ref = doc(db(ANA), 'households', HID, 'redemptions', 'r1')
    await assertSucceeds(
      setDoc(ref, { rewardId: 'w', rewardTitle: 'Peli', cost: 30, redeemedBy: ANA }),
    )
    await assertFails(
      setDoc(doc(db(ANA), 'households', HID, 'redemptions', 'r2'), {
        rewardId: 'w',
        rewardTitle: 'Peli',
        cost: 30,
        redeemedBy: BRUNO,
      }),
    )
    await assertFails(updateDoc(ref, { cost: 1 }))
    await assertFails(deleteDoc(ref))
  })
})

describe('invites', () => {
  it('cualquier usuario autenticado puede leer un código exacto', async () => {
    await seedHousehold([ANA], { [ANA]: 0 })
    await assertSucceeds(getDoc(doc(db(BRUNO), 'invites', CODE)))
  })
})
