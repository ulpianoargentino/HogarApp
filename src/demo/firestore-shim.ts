// Shim de Firestore en memoria para la DEMO (artifact / sin backend).
// Implementa el subconjunto de la API que usa la app; los datos viven en
// localStorage del navegador. No se usa en producción: se activa solo vía
// alias de módulos en vite.demo.config.ts.

const LS_KEY = 'hogarapp-demo-v1'

// ---------- Timestamp ----------

export class Timestamp {
  constructor(
    public seconds: number,
    public nanoseconds = 0,
  ) {}
  static now() {
    return new Timestamp(Math.floor(Date.now() / 1000))
  }
  static fromDate(d: Date) {
    return new Timestamp(Math.floor(d.getTime() / 1000))
  }
  static fromMillis(ms: number) {
    return new Timestamp(Math.floor(ms / 1000))
  }
  toDate() {
    return new Date(this.seconds * 1000)
  }
  toMillis() {
    return this.seconds * 1000
  }
}

// ---------- Sentinelas ----------

const INCREMENT = Symbol('increment')
const ARRAY_UNION = Symbol('arrayUnion')
const SERVER_TS = Symbol('serverTimestamp')

export function increment(n: number) {
  return { __op: INCREMENT, n }
}
export function arrayUnion(...values: unknown[]) {
  return { __op: ARRAY_UNION, values }
}
export function serverTimestamp() {
  return { __op: SERVER_TS }
}

type DocData = Record<string, unknown>

// Clon profundo que preserva instancias de Timestamp (inmutables, se comparten)
function deepClone<T>(v: T): T {
  if (v instanceof Timestamp) return v
  if (Array.isArray(v)) return v.map(deepClone) as T
  if (v && typeof v === 'object') {
    const out: DocData = {}
    for (const [k, val] of Object.entries(v)) out[k] = deepClone(val)
    return out as T
  }
  return v
}

// ---------- Store ----------

const store = new Map<string, DocData>()

function persist() {
  try {
    const obj: Record<string, DocData> = {}
    for (const [k, v] of store) obj[k] = v
    localStorage.setItem(
      LS_KEY,
      JSON.stringify(obj, (_k, v) =>
        v instanceof Timestamp ? { __ts: v.toMillis() } : v,
      ),
    )
  } catch {
    // sin storage (modo privado, thumbnail): la demo sigue en memoria
  }
}

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return
    const obj = JSON.parse(raw, (_k, v) =>
      v && typeof v === 'object' && '__ts' in v
        ? Timestamp.fromMillis(v.__ts as number)
        : v,
    ) as Record<string, DocData>
    for (const [k, v] of Object.entries(obj)) store.set(k, v)
  } catch {
    // datos corruptos o sin storage: arrancamos vacío
  }
}
load()

export function __demoStoreIsEmpty() {
  return store.size === 0
}

export function __demoSeed(docs: Record<string, DocData>) {
  for (const [path, data] of Object.entries(docs)) store.set(path, data)
  persist()
  notifyAll()
}

export function __demoReset() {
  try {
    localStorage.removeItem(LS_KEY)
  } catch {
    // sin storage, nada que borrar
  }
  store.clear()
}

// ---------- Referencias ----------

interface DocRef {
  __type: 'doc'
  path: string
  id: string
}
interface CollRef {
  __type: 'coll'
  path: string
}
interface Constraint {
  kind: 'where' | 'orderBy' | 'limit'
  field?: string
  op?: string
  value?: unknown
  dir?: 'asc' | 'desc'
  n?: number
}
interface Query {
  __type: 'query'
  path: string
  constraints: Constraint[]
}
export type QueryConstraint = Constraint

function randomId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(10)))
    .map((b) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[b % 62])
    .join('')
}

export function collection(_db: unknown, ...segments: string[]): CollRef {
  return { __type: 'coll', path: segments.join('/') }
}

export function doc(
  dbOrColl: unknown,
  ...segments: string[]
): DocRef {
  const ref = dbOrColl as CollRef
  if (ref && typeof ref === 'object' && '__type' in ref && ref.__type === 'coll') {
    const id = segments[0] ?? randomId()
    return { __type: 'doc', path: `${ref.path}/${id}`, id }
  }
  const path = segments.join('/')
  return { __type: 'doc', path, id: segments[segments.length - 1] }
}

export function query(coll: CollRef, ...constraints: Constraint[]): Query {
  return { __type: 'query', path: coll.path, constraints }
}
export function where(field: string, op: string, value: unknown): Constraint {
  return { kind: 'where', field, op, value }
}
export function orderBy(field: string, dir: 'asc' | 'desc' = 'asc'): Constraint {
  return { kind: 'orderBy', field, dir }
}
export function limit(n: number): Constraint {
  return { kind: 'limit', n }
}

// ---------- Mutaciones ----------

function resolveValue(prev: unknown, v: unknown): unknown {
  if (v && typeof v === 'object' && '__op' in (v as DocData)) {
    const op = (v as { __op: symbol }).__op
    if (op === SERVER_TS) return Timestamp.now()
    if (op === INCREMENT) {
      return (typeof prev === 'number' ? prev : 0) + (v as { n: number }).n
    }
    if (op === ARRAY_UNION) {
      const arr = Array.isArray(prev) ? [...prev] : []
      for (const item of (v as { values: unknown[] }).values) {
        if (!arr.some((x) => JSON.stringify(x) === JSON.stringify(item))) arr.push(item)
      }
      return arr
    }
  }
  return v
}

function applyFields(target: DocData, data: DocData) {
  for (const [key, value] of Object.entries(data)) {
    if (key.includes('.')) {
      // dot-path: points.uid, memberProfiles.uid
      const parts = key.split('.')
      let obj = target
      for (const p of parts.slice(0, -1)) {
        if (typeof obj[p] !== 'object' || obj[p] === null) obj[p] = {}
        obj = obj[p] as DocData
      }
      const last = parts[parts.length - 1]
      obj[last] = resolveValue(obj[last], value)
    } else {
      target[key] = resolveValue(target[key], value)
    }
  }
}

function write(path: string, data: DocData, merge: boolean) {
  const existing = store.get(path)
  const target: DocData = merge && existing ? deepClone(existing) : {}
  applyFields(target, data)
  store.set(path, target)
}

function update(path: string, data: DocData) {
  const existing = store.get(path)
  const target: DocData = existing ? deepClone(existing) : {}
  applyFields(target, data)
  store.set(path, target)
}

// ---------- Listeners ----------

type Listener = () => void
const listeners = new Set<Listener>()
let notifyScheduled = false

function notifyAll() {
  if (notifyScheduled) return
  notifyScheduled = true
  queueMicrotask(() => {
    notifyScheduled = false
    persist()
    for (const l of [...listeners]) l()
  })
}

// ---------- Snapshots ----------

function docSnapshot(ref: DocRef) {
  const data = store.get(ref.path)
  return {
    id: ref.id,
    exists: () => data !== undefined,
    data: () => (data ? deepClone(data) : undefined),
  }
}

function compare(a: unknown, b: unknown): number {
  const av = a instanceof Timestamp ? a.toMillis() : a
  const bv = b instanceof Timestamp ? b.toMillis() : b
  if (av === bv) return 0
  if (av === undefined || av === null) return -1
  if (bv === undefined || bv === null) return 1
  return (av as never) < (bv as never) ? -1 : 1
}

function runQuery(q: Query) {
  const prefix = q.path + '/'
  let rows: Array<{ id: string; data: DocData }> = []
  for (const [path, data] of store) {
    if (!path.startsWith(prefix)) continue
    const rest = path.slice(prefix.length)
    if (rest.includes('/')) continue // solo docs directos
    rows.push({ id: rest, data })
  }
  for (const c of q.constraints) {
    if (c.kind === 'where') {
      rows = rows.filter((r) => {
        const v = r.data[c.field!]
        if (c.op === '==') return compare(v, c.value) === 0
        if (c.op === '>=') return compare(v, c.value) >= 0
        if (c.op === '<=') return compare(v, c.value) <= 0
        return true
      })
    }
  }
  const ob = q.constraints.find((c) => c.kind === 'orderBy')
  if (ob) {
    rows.sort((a, b) => {
      const r = compare(a.data[ob.field!], b.data[ob.field!])
      return ob.dir === 'desc' ? -r : r
    })
  }
  const lim = q.constraints.find((c) => c.kind === 'limit')
  if (lim) rows = rows.slice(0, lim.n)
  return {
    docs: rows.map((r) => ({
      id: r.id,
      data: () => deepClone(r.data),
      exists: () => true,
    })),
  }
}

// ---------- API pública ----------

export function initializeFirestore() {
  return {}
}
export function persistentLocalCache() {
  return {}
}
export function persistentMultipleTabManager() {
  return {}
}
export function connectFirestoreEmulator() {}

export async function getDoc(ref: DocRef) {
  return docSnapshot(ref)
}

export async function setDoc(ref: DocRef, data: DocData, opts?: { merge?: boolean }) {
  write(ref.path, data, opts?.merge ?? false)
  notifyAll()
}

export async function addDoc(coll: CollRef, data: DocData) {
  const ref = doc(coll)
  write(ref.path, data, false)
  notifyAll()
  return ref
}

export async function updateDoc(ref: DocRef, data: DocData) {
  update(ref.path, data)
  notifyAll()
}

export async function deleteDoc(ref: DocRef) {
  store.delete(ref.path)
  notifyAll()
}

export function writeBatch(_db: unknown) {
  const ops: Array<() => void> = []
  return {
    set(ref: DocRef, data: DocData, opts?: { merge?: boolean }) {
      ops.push(() => write(ref.path, data, opts?.merge ?? false))
    },
    update(ref: DocRef, data: DocData) {
      ops.push(() => update(ref.path, data))
    },
    delete(ref: DocRef) {
      ops.push(() => store.delete(ref.path))
    },
    async commit() {
      for (const op of ops) op()
      notifyAll()
    },
  }
}

export function onSnapshot(
  target: DocRef | Query,
  next: (snap: never) => void,
  _error?: (e: Error) => void,
): () => void {
  const emit = () => {
    if ('__type' in target && target.__type === 'doc') {
      next(docSnapshot(target) as never)
    } else {
      next(runQuery(target as Query) as never)
    }
  }
  const listener = () => emit()
  listeners.add(listener)
  queueMicrotask(emit)
  return () => listeners.delete(listener)
}
