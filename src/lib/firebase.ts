import { initializeApp } from 'firebase/app'
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const app = initializeApp({
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
  messagingSenderId: import.meta.env.VITE_FB_SENDER_ID,
})

export const auth = getAuth(app)

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})

if (import.meta.env.VITE_USE_EMULATORS === '1') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  // Helper para tests E2E: el emulador de Auth acepta credenciales con claims
  // falsos, así el login no depende de ningún servicio externo.
  interface TestClaims {
    sub: string
    email: string
    name?: string
  }
  ;(window as unknown as Record<string, unknown>).__testSignIn = (claims: TestClaims) =>
    signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify(claims)))
}
