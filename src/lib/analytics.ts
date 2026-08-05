import { format, parseISO, startOfWeek } from 'date-fns'
import {
  SOURCES,
  SOURCE_LABELS,
  WORKSTYLES,
  WORKSTYLE_LABELS,
  type JobApplication,
  type Source,
  type Status,
  type Workstyle,
} from '../types'
import { daysBetween } from './dates'

function everReached(app: JobApplication, status: Status): boolean {
  return app.status === status || app.statusHistory.some((h) => h.status === status)
}

function firstTimestampFor(app: JobApplication, status: Status): string | undefined {
  return app.statusHistory.find((h) => h.status === status)?.timestamp
}

/** Applications that have actually been submitted (progressed beyond "Saved"). */
export function isSubmitted(app: JobApplication): boolean {
  return app.status !== 'saved' || app.statusHistory.some((h) => h.status !== 'saved')
}

const RESPONSE_STATUSES: Status[] = ['interviewing', 'offer', 'declined']

function hasResponse(app: JobApplication): boolean {
  return RESPONSE_STATUSES.some((s) => everReached(app, s))
}

export interface FunnelStats {
  submitted: number
  ignored: number
  interviewed: number
  multiRound: number
  offers: number
  responseRate: number
}

export function computeFunnel(apps: JobApplication[]): FunnelStats {
  const submittedApps = apps.filter(isSubmitted)
  const submitted = submittedApps.length
  const responded = submittedApps.filter(hasResponse).length
  const ignored = submittedApps.filter((a) => a.status === 'unsuccessful' && !hasResponse(a)).length
  const interviewed = submittedApps.filter((a) => everReached(a, 'interviewing')).length
  const multiRound = submittedApps.filter((a) => a.interviewRounds.length >= 2).length
  const offers = submittedApps.filter((a) => everReached(a, 'offer')).length

  return {
    submitted,
    ignored,
    interviewed,
    multiRound,
    offers,
    responseRate: submitted > 0 ? responded / submitted : 0,
  }
}

/** Average days between "Applied" and the first response-bearing status change. */
export function computeAvgTimeToFirstResponse(apps: JobApplication[]): number | null {
  const samples: number[] = []
  for (const app of apps) {
    const appliedAt = firstTimestampFor(app, 'applied') ?? app.dateApplied
    const responseEntry = app.statusHistory
      .filter((h) => RESPONSE_STATUSES.includes(h.status))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))[0]
    if (!responseEntry) continue
    const days = daysBetween(appliedAt, responseEntry.timestamp)
    if (days >= 0) samples.push(days)
  }
  if (samples.length === 0) return null
  return samples.reduce((a, b) => a + b, 0) / samples.length
}

/** Average days spent in each status, across all apps, counting the current (open) stage up to now. */
export function computeAvgTimeInStage(apps: JobApplication[], now: Date = new Date()): Partial<Record<Status, number>> {
  const sums: Partial<Record<Status, number>> = {}
  const counts: Partial<Record<Status, number>> = {}

  for (const app of apps) {
    const history = [...app.statusHistory].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    for (let i = 0; i < history.length; i++) {
      const entry = history[i]
      const next = history[i + 1]
      const end = next ? next.timestamp : now.toISOString()
      const days = daysBetween(entry.timestamp, end)
      if (days < 0) continue
      sums[entry.status] = (sums[entry.status] ?? 0) + days
      counts[entry.status] = (counts[entry.status] ?? 0) + 1
    }
  }

  const result: Partial<Record<Status, number>> = {}
  for (const status of Object.keys(sums) as Status[]) {
    result[status] = sums[status]! / counts[status]!
  }
  return result
}

export interface WeeklyTrendPoint {
  weekStart: string
  label: string
  count: number
}

export function computeWeeklyTrend(apps: JobApplication[]): WeeklyTrendPoint[] {
  const submittedApps = apps.filter(isSubmitted)
  const buckets = new Map<string, number>()

  for (const app of submittedApps) {
    const appliedAt = firstTimestampFor(app, 'applied') ?? app.dateApplied
    const week = startOfWeek(parseISO(appliedAt.slice(0, 10)), { weekStartsOn: 1 })
    const key = format(week, 'yyyy-MM-dd')
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, count]) => ({ weekStart, label: format(parseISO(weekStart), 'MMM d'), count }))
}

export interface BreakdownRow extends FunnelStats {
  key: string
  label: string
}

export function computeBreakdown(apps: JobApplication[], groupBy: 'source' | 'workstyle'): BreakdownRow[] {
  if (groupBy === 'source') {
    return SOURCES.map((s: Source) => ({
      key: s,
      label: SOURCE_LABELS[s],
      ...computeFunnel(apps.filter((a) => a.source === s)),
    })).filter((row) => row.submitted > 0)
  }
  return WORKSTYLES.map((w: Workstyle) => ({
    key: w,
    label: WORKSTYLE_LABELS[w],
    ...computeFunnel(apps.filter((a) => a.workstyle === w)),
  })).filter((row) => row.submitted > 0)
}

export function filterByLookback(
  apps: JobApplication[],
  lookbackStart: string | null,
  lookbackEnd: string | null,
): JobApplication[] {
  const start = lookbackStart ?? '0000-01-01'
  const end = lookbackEnd ?? '9999-12-31'
  return apps.filter((a) => a.dateApplied >= start && a.dateApplied <= end)
}
