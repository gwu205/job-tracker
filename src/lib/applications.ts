import { ACTIVE_STATUSES, type JobApplication } from '../types'
import { daysBetween } from './dates'

export function lastStatusChangeAt(app: JobApplication): string {
  if (app.statusHistory.length === 0) return app.updatedAt
  return app.statusHistory.reduce((latest, h) => (h.timestamp > latest ? h.timestamp : latest), app.statusHistory[0].timestamp)
}

export function isStale(app: JobApplication, staleDaysThreshold: number, now: Date = new Date()): boolean {
  if (!ACTIVE_STATUSES.includes(app.status)) return false
  const last = lastStatusChangeAt(app)
  return daysBetween(last, now) >= staleDaysThreshold
}

export function roleGroupIndex(app: JobApplication, group: JobApplication[]): number {
  const sorted = [...group].sort((a, b) => a.dateApplied.localeCompare(b.dateApplied))
  return sorted.findIndex((a) => a.id === app.id) + 1
}
