import { INTERVIEW_TYPES, SOURCES, STATUSES } from '../types'

export interface ImportValidationResult {
  valid: boolean
  /** Human-readable, deduplicated problem summary — safe to render as a list. */
  issues: string[]
  appCount: number
}

interface Bucket {
  message: string
  count: number
  example?: string
}

function labelFor(app: any, index: number): string {
  const company = typeof app?.company === 'string' && app.company.trim() ? app.company : null
  const position = typeof app?.position === 'string' && app.position.trim() ? app.position : null
  if (company && position) return `${company} — ${position}`
  if (company) return company
  return `entry #${index + 1}`
}

/**
 * Validates that a parsed JSON value matches this app's JobApplication schema closely enough
 * to import safely. Deliberately strict: several fields (tags, interviewRounds, statusHistory
 * entry ids/timestamps) are read unguarded elsewhere in the app, so a partially-shaped record
 * would crash the UI later rather than failing here where we can show a clear message.
 */
export function validateImportedState(parsed: unknown): ImportValidationResult {
  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, issues: ['File is not a JSON object.'], appCount: 0 }
  }

  const obj = parsed as any
  if (!Array.isArray(obj.applications)) {
    return { valid: false, issues: ['Missing an "applications" array at the top level.'], appCount: 0 }
  }

  const buckets = new Map<string, Bucket>()
  const flag = (key: string, message: string, example?: string) => {
    const existing = buckets.get(key)
    if (existing) {
      existing.count++
    } else {
      buckets.set(key, { message, count: 1, example })
    }
  }

  obj.applications.forEach((app: any, i: number) => {
    const label = labelFor(app, i)

    if (typeof app?.id !== 'string' || !app.id) flag('id', 'missing a required "id" field', label)
    if (typeof app?.roleGroupId !== 'string' || !app.roleGroupId) flag('roleGroupId', 'missing a required "roleGroupId" field', label)
    if (typeof app?.company !== 'string' || !app.company) flag('company', 'missing "company"', label)
    if (typeof app?.position !== 'string' || !app.position) flag('position', '"position" is missing or null (must be a non-empty string)', label)

    if (!SOURCES.includes(app?.source)) {
      flag('source', `"source" isn't one of ${SOURCES.join(', ')}`, `${label} has source "${app?.source}"`)
    }

    if (typeof app?.dateApplied !== 'string' || !app.dateApplied) {
      flag('dateApplied', '"dateApplied" is missing or null (must be a date string)', label)
    }

    if (!STATUSES.includes(app?.status)) {
      flag('status', `"status" isn't one of ${STATUSES.join(', ')}`, `${label} has status "${app?.status}"`)
    }

    if (!Array.isArray(app?.statusHistory)) {
      flag('statusHistory', 'missing a "statusHistory" array', label)
    } else {
      app.statusHistory.forEach((h: any) => {
        if (typeof h?.id !== 'string' || !h.id) flag('statusHistory.id', 'a statusHistory entry is missing "id"', label)
        if (typeof h?.timestamp !== 'string' || !h.timestamp) {
          flag('statusHistory.timestamp', 'a statusHistory entry is missing "timestamp" (found "date" instead?)', label)
        }
        if (!STATUSES.includes(h?.status)) {
          flag('statusHistory.status', `a statusHistory entry has a status not in ${STATUSES.join(', ')}`, `${label}: "${h?.status}"`)
        }
      })
    }

    if (!Array.isArray(app?.interviewRounds)) {
      flag('interviewRounds', 'missing an "interviewRounds" array (use [] if none)', label)
    } else {
      app.interviewRounds.forEach((r: any) => {
        if (typeof r?.id !== 'string' || !r.id) flag('interviewRounds.id', 'an interviewRounds entry is missing "id"', label)
        if (typeof r?.date !== 'string' || !r.date) {
          flag('interviewRounds.date', 'an interviewRounds entry is missing "date" or it\'s null', label)
        }
        if (!INTERVIEW_TYPES.includes(r?.type)) {
          flag('interviewRounds.type', `an interviewRounds entry has a "type" not in ${INTERVIEW_TYPES.join(', ')}`, `${label}: "${r?.type}"`)
        }
        if (r?.interviewer !== undefined && r?.interviewerName === undefined) {
          flag('interviewRounds.interviewer', 'an interviewRounds entry uses "interviewer" — the field is called "interviewerName" (this data would be silently dropped)', label)
        }
      })
    }

    if (app?.jdUrl !== undefined && app?.jobUrl === undefined) {
      flag('jdUrl', 'uses "jdUrl" — the field is called "jobUrl" (this data would be silently dropped)', label)
    }
    if (
      app?.salary !== undefined &&
      app?.salaryRangeMin === undefined &&
      app?.salaryRangeMax === undefined &&
      app?.salaryOffered === undefined
    ) {
      flag('salary', 'uses "salary" — expected "salaryRangeMin"/"salaryRangeMax"/"salaryOffered" (this data would be silently dropped)', label)
    }
    if (!Array.isArray(app?.tags)) flag('tags', 'missing a "tags" array (use [] if none)', label)
    if (typeof app?.notes !== 'string') flag('notes', 'missing a "notes" string (use "" if none)', label)
    if (typeof app?.currency !== 'string' || !app.currency) flag('currency', 'missing "currency" (e.g. "USD")', label)
    if (typeof app?.priority !== 'number') flag('priority', 'missing a numeric "priority" (1-5)', label)
    if (typeof app?.createdAt !== 'string' || !app.createdAt) flag('createdAt', 'missing "createdAt" timestamp', label)
    if (typeof app?.updatedAt !== 'string' || !app.updatedAt) flag('updatedAt', 'missing "updatedAt" timestamp', label)
  })

  const issues = [...buckets.values()].map((b) => {
    const countLabel = b.count === 1 ? '1 record' : `${b.count} records`
    return `${countLabel} ${b.message}${b.example ? ` (e.g. ${b.example})` : ''}.`
  })

  return { valid: issues.length === 0, issues, appCount: obj.applications.length }
}
