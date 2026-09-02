import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { occurrencesBetween } from './recurrence'
import type { Task, TaskSeries } from '../types'

/** Id determinístico de la tarea de una serie en una fecha (evita duplicados entre dispositivos). */
export function seriesTaskId(seriesId: string, date: string): string {
  return `${seriesId}_${date}`
}

/** Fechas en las que una serie activa genera tarea dentro del rango. */
export function seriesOccurrences(series: TaskSeries, from: string, to: string): string[] {
  if (!series.active) return []
  return occurrencesBetween(series, from, to)
}

/**
 * Crea (si faltan) las tareas de las series activas para las fechas del rango.
 * Idempotente y seguro aunque `existing` esté incompleto (p.ej. todavía
 * cargando): antes de crear verifica en Firestore que el doc no exista, así
 * nunca pisa una tarea ya completada.
 */
export async function materializeSeries(
  hid: string,
  seriesList: TaskSeries[],
  existing: Task[],
  from: string,
  to: string,
): Promise<void> {
  const have = new Set(existing.map((t) => t.id))
  const batch = writeBatch(db)
  let pending = 0
  for (const s of seriesList) {
    for (const date of seriesOccurrences(s, from, to)) {
      const id = seriesTaskId(s.id, date)
      if (have.has(id)) continue
      const ref = doc(db, 'households', hid, 'tasks', id)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        have.add(id)
        continue
      }
      batch.set(ref, {
        title: s.title,
        assigneeUid: s.assigneeUid,
        date,
        done: false,
        points: s.points,
        seriesId: s.id,
        createdBy: s.createdBy,
        createdAt: serverTimestamp(),
        completedAt: null,
        completedBy: null,
      })
      have.add(id)
      pending++
    }
  }
  if (pending > 0) await batch.commit()
}

/** Texto corto de la recurrencia: "cada 2 semanas", "cada mes"… */
export function recurrenceLabel(r: { freq: 'weekly' | 'monthly' | 'yearly'; interval: number }): string {
  const n = Math.max(1, r.interval)
  if (r.freq === 'weekly') return n === 1 ? 'cada semana' : `cada ${n} semanas`
  if (r.freq === 'monthly') return n === 1 ? 'cada mes' : `cada ${n} meses`
  return n === 1 ? 'cada año' : `cada ${n} años`
}
