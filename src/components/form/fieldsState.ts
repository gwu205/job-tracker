import type { JobApplication, Source, Workstyle } from '../../types'
import { todayISODate } from '../../lib/dates'
import type { ParsedApplicationFields } from '../../lib/claudeClient'

export interface FieldsState {
  company: string
  position: string
  source: Source
  sourceLabel: string
  recruiterName: string
  recruiterEmail: string
  recruiterPhone: string
  dateApplied: string
  jobUrl: string
  workstyle: Workstyle | ''
  location: string
  salaryRangeMin: string
  salaryRangeMax: string
  salaryOffered: string
  currency: string
  rejectionReason: string
  resumeVersion: string
  priority: number
  tags: string
  notes: string
}

export function defaultFields(): FieldsState {
  return {
    company: '',
    position: '',
    source: 'direct',
    sourceLabel: '',
    recruiterName: '',
    recruiterEmail: '',
    recruiterPhone: '',
    dateApplied: todayISODate(),
    jobUrl: '',
    workstyle: '',
    location: '',
    salaryRangeMin: '',
    salaryRangeMax: '',
    salaryOffered: '',
    currency: 'USD',
    rejectionReason: '',
    resumeVersion: '',
    priority: 3,
    tags: '',
    notes: '',
  }
}

export function fieldsFromApp(app: JobApplication): FieldsState {
  return {
    company: app.company,
    position: app.position,
    source: app.source,
    sourceLabel: app.sourceLabel ?? '',
    recruiterName: app.recruiterName ?? '',
    recruiterEmail: app.recruiterEmail ?? '',
    recruiterPhone: app.recruiterPhone ?? '',
    dateApplied: app.dateApplied,
    jobUrl: app.jobUrl ?? '',
    workstyle: app.workstyle ?? '',
    location: app.location ?? '',
    salaryRangeMin: app.salaryRangeMin?.toString() ?? '',
    salaryRangeMax: app.salaryRangeMax?.toString() ?? '',
    salaryOffered: app.salaryOffered?.toString() ?? '',
    currency: app.currency,
    rejectionReason: app.rejectionReason ?? '',
    resumeVersion: app.resumeVersion ?? '',
    priority: app.priority,
    tags: app.tags.join(', '),
    notes: app.notes,
  }
}

export function fieldsFromParsed(parsed: ParsedApplicationFields): Partial<FieldsState> {
  const patch: Partial<FieldsState> = {}
  if (parsed.company) patch.company = parsed.company
  if (parsed.position) patch.position = parsed.position
  if (parsed.source) patch.source = parsed.source
  if (parsed.recruiterName) patch.recruiterName = parsed.recruiterName
  if (parsed.recruiterEmail) patch.recruiterEmail = parsed.recruiterEmail
  if (parsed.recruiterPhone) patch.recruiterPhone = parsed.recruiterPhone
  if (parsed.jobUrl) patch.jobUrl = parsed.jobUrl
  if (parsed.workstyle) patch.workstyle = parsed.workstyle
  if (parsed.location) patch.location = parsed.location
  if (parsed.salaryRangeMin !== undefined) patch.salaryRangeMin = String(parsed.salaryRangeMin)
  if (parsed.salaryRangeMax !== undefined) patch.salaryRangeMax = String(parsed.salaryRangeMax)
  if (parsed.currency) patch.currency = parsed.currency
  if (parsed.notes) patch.notes = parsed.notes
  return patch
}

export function parseTags(raw: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of raw.split(',')) {
    const t = part.trim()
    if (!t || seen.has(t.toLowerCase())) continue
    seen.add(t.toLowerCase())
    out.push(t)
  }
  return out
}

function parseOptionalNumber(raw: string): number | undefined {
  const t = raw.trim()
  if (!t) return undefined
  const n = Number(t)
  return Number.isFinite(n) ? n : undefined
}

export function fieldsAreValid(fields: FieldsState): boolean {
  return fields.company.trim().length > 0 && fields.position.trim().length > 0 && fields.dateApplied.trim().length > 0
}

/** Shared scalar-field payload, independent of status/statusHistory/interviewRounds handling. */
export function buildScalarPayload(fields: FieldsState) {
  return {
    company: fields.company.trim(),
    position: fields.position.trim(),
    source: fields.source,
    sourceLabel: fields.source === 'other' ? fields.sourceLabel.trim() || undefined : undefined,
    recruiterName: fields.recruiterName.trim() || undefined,
    recruiterEmail: fields.recruiterEmail.trim() || undefined,
    recruiterPhone: fields.recruiterPhone.trim() || undefined,
    dateApplied: fields.dateApplied,
    jobUrl: fields.jobUrl.trim() || undefined,
    workstyle: fields.workstyle || undefined,
    location: fields.location.trim() || undefined,
    salaryRangeMin: parseOptionalNumber(fields.salaryRangeMin),
    salaryRangeMax: parseOptionalNumber(fields.salaryRangeMax),
    salaryOffered: parseOptionalNumber(fields.salaryOffered),
    currency: fields.currency.trim() || 'USD',
    rejectionReason: fields.rejectionReason.trim() || undefined,
    resumeVersion: fields.resumeVersion.trim() || undefined,
    priority: fields.priority,
    tags: parseTags(fields.tags),
    notes: fields.notes,
  }
}
