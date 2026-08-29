import { describe, expect, it } from 'vitest'
import { occurrencesBetween } from './recurrence'
import type { EventRecurrence, HouseholdEvent } from '../types'

function makeEvent(
  startDate: string,
  recurrence: EventRecurrence | null = null,
  endDate: string | null = null,
): HouseholdEvent {
  return {
    id: 'e1',
    title: 'Prueba',
    type: 'otro',
    startDate,
    recurrence,
    endDate,
    remindDaysBefore: 3,
    notes: '',
    doneDates: [],
    createdBy: 'u1',
    createdAt: null as never,
  }
}

describe('occurrencesBetween', () => {
  it('evento único dentro del rango', () => {
    const e = makeEvent('2026-03-10')
    expect(occurrencesBetween(e, '2026-03-01', '2026-03-31')).toEqual(['2026-03-10'])
  })

  it('evento único fuera del rango', () => {
    const e = makeEvent('2026-03-10')
    expect(occurrencesBetween(e, '2026-04-01', '2026-04-30')).toEqual([])
    expect(occurrencesBetween(e, '2026-02-01', '2026-02-28')).toEqual([])
  })

  it('weekly interval 1', () => {
    const e = makeEvent('2026-01-05', { freq: 'weekly', interval: 1 })
    expect(occurrencesBetween(e, '2026-01-01', '2026-01-31')).toEqual([
      '2026-01-05',
      '2026-01-12',
      '2026-01-19',
      '2026-01-26',
    ])
  })

  it('weekly interval 2', () => {
    const e = makeEvent('2026-01-05', { freq: 'weekly', interval: 2 })
    expect(occurrencesBetween(e, '2026-01-01', '2026-01-31')).toEqual([
      '2026-01-05',
      '2026-01-19',
    ])
  })

  it('weekly arranca en la primera ocurrencia >= from, nunca antes de startDate', () => {
    const e = makeEvent('2026-01-05', { freq: 'weekly', interval: 1 })
    expect(occurrencesBetween(e, '2026-03-02', '2026-03-09')).toEqual([
      '2026-03-02',
      '2026-03-09',
    ])
    expect(occurrencesBetween(e, '2025-12-01', '2026-01-06')).toEqual(['2026-01-05'])
  })

  it('monthly con clamp al último día del mes', () => {
    const e = makeEvent('2026-01-31', { freq: 'monthly', interval: 1 })
    expect(occurrencesBetween(e, '2026-02-01', '2026-02-28')).toEqual(['2026-02-28'])
    expect(occurrencesBetween(e, '2026-04-01', '2026-04-30')).toEqual(['2026-04-30'])
    // Y vuelve al 31 en meses largos
    expect(occurrencesBetween(e, '2026-03-01', '2026-03-31')).toEqual(['2026-03-31'])
  })

  it('monthly clamp en año bisiesto (29 feb)', () => {
    const e = makeEvent('2024-01-31', { freq: 'monthly', interval: 1 })
    expect(occurrencesBetween(e, '2024-02-01', '2024-02-29')).toEqual(['2024-02-29'])
  })

  it('monthly interval 2', () => {
    const e = makeEvent('2026-01-15', { freq: 'monthly', interval: 2 })
    expect(occurrencesBetween(e, '2026-01-01', '2026-06-30')).toEqual([
      '2026-01-15',
      '2026-03-15',
      '2026-05-15',
    ])
  })

  it('yearly con clamp de 29 feb en años no bisiestos', () => {
    const e = makeEvent('2024-02-29', { freq: 'yearly', interval: 1 })
    expect(occurrencesBetween(e, '2025-02-01', '2025-03-01')).toEqual(['2025-02-28'])
    expect(occurrencesBetween(e, '2028-02-01', '2028-03-01')).toEqual(['2028-02-29'])
  })

  it('respeta endDate', () => {
    const e = makeEvent('2026-01-05', { freq: 'weekly', interval: 1 }, '2026-01-19')
    expect(occurrencesBetween(e, '2026-01-01', '2026-01-31')).toEqual([
      '2026-01-05',
      '2026-01-12',
      '2026-01-19',
    ])
  })

  it('rango que empieza antes de startDate no genera ocurrencias previas', () => {
    const e = makeEvent('2026-05-10', { freq: 'monthly', interval: 1 })
    expect(occurrencesBetween(e, '2026-04-01', '2026-06-30')).toEqual([
      '2026-05-10',
      '2026-06-10',
    ])
  })
})
