// Shim de Firebase Auth para la DEMO: sesión iniciada como "Ana" sin Google.

export interface User {
  uid: string
  displayName: string | null
  photoURL: string | null
  email: string | null
}

export const DEMO_USER: User = {
  uid: 'demo-ana',
  displayName: 'José',
  photoURL: null,
  email: 'jose@demo.hogarapp',
}

type AuthCallback = (u: User | null) => void
let currentUser: User | null = DEMO_USER
const callbacks = new Set<AuthCallback>()

export function getAuth() {
  return {}
}
export function connectAuthEmulator() {}

export class GoogleAuthProvider {
  static credential(_json?: string) {
    return {}
  }
}

export function onAuthStateChanged(_auth: unknown, cb: AuthCallback) {
  callbacks.add(cb)
  queueMicrotask(() => cb(currentUser))
  return () => callbacks.delete(cb)
}

function setUser(u: User | null) {
  currentUser = u
  for (const cb of [...callbacks]) cb(u)
}

export async function signInWithPopup() {
  setUser(DEMO_USER)
}
export async function signInWithRedirect() {
  setUser(DEMO_USER)
}
export async function signInWithCredential() {
  setUser(DEMO_USER)
}

export async function signOut() {
  // En la demo, salir = reiniciar los datos de ejemplo
  const { __demoReset } = await import('./firestore-shim')
  __demoReset()
  location.reload()
}
