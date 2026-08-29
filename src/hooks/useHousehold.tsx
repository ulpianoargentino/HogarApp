import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { generateInviteCode } from '../lib/inviteCode'
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
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null)

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const uid = user!.uid
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null)
  const [userDocLoaded, setUserDocLoaded] = useState(false)
  const [household, setHousehold] = useState<Household | null>(null)

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
    if (!hid) {
      setHousehold(null)
      return
    }
    return onSnapshot(doc(db, 'households', hid), (snap) => {
      if (snap.exists()) setHousehold({ id: snap.id, ...snap.data() } as Household)
    })
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
    batch.update(doc(db, 'users', uid), { householdId: householdRef.id })
    await batch.commit()
  }

  async function joinHousehold(rawCode: string) {
    const code = rawCode.trim().toUpperCase()
    const inviteSnap = await getDoc(doc(db, 'invites', code))
    if (!inviteSnap.exists()) {
      throw new Error('Código inválido. Revisá que esté bien escrito.')
    }
    const targetHid = inviteSnap.data().householdId as string
    const profile: MemberProfile = {
      name: user!.displayName ?? 'Sin nombre',
      photoURL: user!.photoURL ?? null,
    }
    const householdSnap = await getDoc(doc(db, 'households', targetHid))
    if (!householdSnap.exists()) throw new Error('Ese hogar ya no existe.')
    const data = householdSnap.data() as Omit<Household, 'id'>
    if (data.members.includes(uid)) {
      await setDoc(doc(db, 'users', uid), { householdId: targetHid }, { merge: true })
      return
    }
    if (data.members.length >= 2) {
      throw new Error('Ese hogar ya tiene dos personas.')
    }
    const batch = writeBatch(db)
    batch.update(doc(db, 'households', targetHid), {
      members: [...data.members, uid],
      [`memberProfiles.${uid}`]: profile,
      [`points.${uid}`]: 0,
    })
    batch.update(doc(db, 'users', uid), { householdId: targetHid })
    await batch.commit()
  }

  const value = useMemo<HouseholdContextValue>(() => {
    const partnerUid = household?.members.find((m) => m !== uid) ?? null
    return {
      uid,
      userDoc,
      household,
      loading: !userDocLoaded || (hid !== null && household === null),
      partnerUid,
      myProfile: household?.memberProfiles[uid] ?? null,
      partnerProfile: partnerUid ? (household?.memberProfiles[partnerUid] ?? null) : null,
      createHousehold,
      joinHousehold,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, userDoc, household, userDocLoaded, hid])

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
