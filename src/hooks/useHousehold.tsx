import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { generateInviteCode, normalizeInviteCode } from '../lib/inviteCode'
import { useAuth } from './useAuth'
import type { Household, MemberProfile, UserDoc } from '../types'

interface HouseholdContextValue {
  uid: string
  /** null mientras carga; householdId null = todavía no tiene hogar */
  userDoc: UserDoc | null
  household: Household | null
  loading: boolean
  partnerUid: string | null
  myProfile: MemberProfile | null
  partnerProfile: MemberProfile | null
  createHousehold: (name: string) => Promise<void>
  joinHousehold: (code: string) => Promise<void>
  /** Salir del hogar actual para poder crear otro o unirse al de la pareja */
  leaveHousehold: () => Promise<void>
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null)

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const uid = user!.uid
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null)
  const [userDocLoaded, setUserDocLoaded] = useState(false)
  const [household, setHousehold] = useState<Household | null>(null)
  const [householdLoaded, setHouseholdLoaded] = useState(false)

  // Asegurar el doc de usuario y suscribirse a él
  useEffect(() => {
    const ref = doc(db, 'users', uid)
    let cancelled = false

    getDoc(ref).then((snap) => {
      if (cancelled || snap.exists()) return
      setDoc(ref, {
        householdId: null,
        displayName: user!.displayName ?? 'Sin nombre',
        photoURL: user!.photoURL ?? null,
        email: user!.email ?? '',
        createdAt: serverTimestamp(),
      })
    })

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setUserDoc(snap.data() as UserDoc)
        setUserDocLoaded(true)
      }
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [uid, user])

  // Suscripción al hogar cuando hay householdId
  const hid = userDoc?.householdId ?? null
  useEffect(() => {
    setHousehold(null)
    if (!hid) {
      setHouseholdLoaded(true)
      return
    }
    setHouseholdLoaded(false)
    // El hogar puede dejar de existir (lo borró quien lo creó) o dejar de ser
    // legible (salimos de él): en los dos casos hay que terminar de "cargar"
    // igual, si no la app se queda para siempre en el splash.
    return onSnapshot(
      doc(db, 'households', hid),
      (snap) => {
        setHousehold(snap.exists() ? ({ id: snap.id, ...snap.data() } as Household) : null)
        setHouseholdLoaded(true)
      },
      (err) => {
        console.error('household snapshot', err)
        setHousehold(null)
        setHouseholdLoaded(true)
      },
    )
  }, [hid])

  async function createHousehold(name: string) {
    const code = generateInviteCode()
    const householdRef = doc(collection(db, 'households'))
    const profile: MemberProfile = {
      name: user!.displayName ?? 'Sin nombre',
      photoURL: user!.photoURL ?? null,
    }
    const batch = writeBatch(db)
    batch.set(householdRef, {
      name,
      members: [uid],
      memberProfiles: { [uid]: profile },
      points: { [uid]: 0 },
      inviteCode: code,
      createdAt: serverTimestamp(),
    })
    batch.set(doc(db, 'invites', code), {
      householdId: householdRef.id,
      createdBy: uid,
      createdAt: serverTimestamp(),
    })
    // set+merge: el doc de usuario puede estar todavía creándose
    batch.set(doc(db, 'users', uid), { householdId: householdRef.id }, { merge: true })
    await batch.commit()
  }

  async function joinHousehold(rawCode: string) {
    const code = normalizeInviteCode(rawCode)
    if (code.length < 4) {
      throw new Error('El código tiene 6 caracteres. Revisalo y probá de nuevo.')
    }
    const inviteSnap = await getDoc(doc(db, 'invites', code))
    if (!inviteSnap.exists()) {
      throw new Error(
        'Ese código no existe. Copialo tal cual aparece en Ajustes del hogar de tu pareja.',
      )
    }
    const targetHid = inviteSnap.data().householdId as string
    if (targetHid === hid) {
      throw new Error('Ya estás en ese hogar.')
    }
    if (hid) {
      // Con un hogar propio encima, el join siempre fallaría: hay que salir antes.
      throw new Error(
        'Ya tenés un hogar. Salí de él desde Ajustes y después usá el código.',
      )
    }
    const profile: MemberProfile = {
      name: user!.displayName ?? 'Sin nombre',
      photoURL: user!.photoURL ?? null,
    }
    // No se puede leer el hogar antes de ser miembro: el join va "a ciegas"
    // con arrayUnion y las reglas validan que seamos exactamente el 2.º.
    const batch = writeBatch(db)
    batch.update(doc(db, 'households', targetHid), {
      members: arrayUnion(uid),
      [`memberProfiles.${uid}`]: profile,
      [`points.${uid}`]: 0,
    })
    batch.set(doc(db, 'users', uid), { householdId: targetHid }, { merge: true })
    try {
      await batch.commit()
    } catch (err) {
      console.error('joinHousehold', err)
      throw new Error(
        'No pudimos unirte: ese hogar ya tiene dos personas. Pedile a tu pareja que revise Ajustes.',
      )
    }
  }

  /**
   * Salir del hogar actual. Si quedabas solo, el hogar y su código se borran
   * (el caso típico: cada uno creó el suyo y quieren compartir uno solo).
   */
  async function leaveHousehold() {
    if (!hid) return
    const alone = !household || household.members.length <= 1
    const batch = writeBatch(db)
    if (alone) {
      batch.delete(doc(db, 'households', hid))
      if (household?.inviteCode) batch.delete(doc(db, 'invites', household.inviteCode))
    } else {
      batch.update(doc(db, 'households', hid), {
        members: arrayRemove(uid),
        [`memberProfiles.${uid}`]: deleteField(),
        [`points.${uid}`]: deleteField(),
      })
    }
    batch.set(doc(db, 'users', uid), { householdId: null }, { merge: true })
    try {
      await batch.commit()
    } catch (err) {
      console.error('leaveHousehold', err)
      throw new Error('No pudimos sacarte del hogar. Probá de nuevo en un momento.')
    }
  }

  const value = useMemo<HouseholdContextValue>(() => {
    const partnerUid = household?.members.find((m) => m !== uid) ?? null
    return {
      uid,
      userDoc,
      household,
      loading: !userDocLoaded || !householdLoaded,
      partnerUid,
      myProfile: household?.memberProfiles[uid] ?? null,
      partnerProfile: partnerUid ? (household?.memberProfiles[partnerUid] ?? null) : null,
      createHousehold,
      joinHousehold,
      leaveHousehold,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, userDoc, household, userDocLoaded, householdLoaded, hid])

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>
}

export function useHousehold(): HouseholdContextValue {
  const ctx = useContext(HouseholdContext)
  if (!ctx) throw new Error('useHousehold debe usarse dentro de <HouseholdProvider>')
  return ctx
}

/** Igual que useHousehold pero garantiza hogar cargado (usar dentro de RequireHousehold). */
export function useHome() {
  const ctx = useHousehold()
  return { ...ctx, hid: ctx.household!.id, household: ctx.household! }
}
