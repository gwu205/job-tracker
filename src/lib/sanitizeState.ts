import { v4 as uuid } from 'uuid'
import {
  INTERVIEW_TYPES,
  SOURCES,
  STATUSES,
  WORKSTYLES,
  type InterviewRound,
  type JobApplication,
  type StatusHistoryEntry,
} from '../types'

/**
 * Repairs a persisted (localStorage or imported) application into a shape the rest of the app
 * can render safely — every field the UI reads unguarded (tags, interviewRounds, statusHistory
 * entry ids/timestamps, etc.) is coerced to a safe default rather than left null/missing.
 *
 * This never fabricates meaningful content (dates, positions, ...) — unknown values become ''
 * or [] so nothing crashes, and the record stays editable through the normal UI to fix up.
 */
export function sanitizeApplication(raw: any): JobApplication {
  const nowIso = new Date().toISOString()

  const statusHistory: StatusHistoryEntry[] = Array.isArray(raw?.statusHistory)
    ? raw.statusHistory.map((h: any) => ({
        id: typeof h?.id === 'string' && h.id ? h.id : uuid(),
        status: STATUSES.includes(h?.status) ? h.status : 'saved',
        timestamp: typeof h?.timestamp === 'string' && h.timestamp ? h.timestamp : '',
        note: typeof h?.note === 'string' ? h.note : undefined,
      }))
    : []

  const interviewRounds: InterviewRound[] = Array.isArray(raw?.interviewRounds)
    ? raw.interviewRounds.map((r: any) => ({
        id: typeof r?.id === 'string' && r.id ? r.id : uuid(),
        date: typeof r?.date === 'string' && r.date ? r.date : '',
        type: INTERVIEW_TYPES.includes(r?.type) ? r.type : 'other',
        interviewerName: typeof r?.interviewerName === 'string' ? r.interviewerName : undefined,
        notes: typeof r?.notes === 'string' ? r.notes : undefined,
      }))
    : []

  return {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : uuid(),
    roleGroupId: typeof raw?.roleGroupId === 'string' && raw.roleGroupId ? raw.roleGroupId : uuid(),
    reapplicationOfId: typeof raw?.reapplicationOfId === 'string' ? raw.reapplicationOfId : undefined,

    company: typeof raw?.company === 'string' ? raw.company : '',
    position: typeof raw?.position === 'string' ? raw.position : '',

    source: SOURCES.includes(raw?.source) ? raw.source : 'other',
    sourceLabel: typeof raw?.sourceLabel === 'string' ? raw.sourceLabel : undefined,
    recruiterName: typeof raw?.recruiterName === 'string' ? raw.recruiterName : undefined,
    recruiterEmail: typeof raw?.recruiterEmail === 'string' ? raw.recruiterEmail : undefined,
    recruiterPhone: typeof raw?.recruiterPhone === 'string' ? raw.recruiterPhone : undefined,

    dateApplied: typeof raw?.dateApplied === 'string' && raw.dateApplied ? raw.dateApplied : '',
    status: STATUSES.includes(raw?.status) ? raw.status : 'saved',
    statusHistory,
    interviewRounds,

    notes: typeof raw?.notes === 'string' ? raw.notes : '',
    jobUrl: typeof raw?.jobUrl === 'string' ? raw.jobUrl : undefined,
    workstyle: WORKSTYLES.includes(raw?.workstyle) ? raw.workstyle : undefined,
    location: typeof raw?.location === 'string' ? raw.location : undefined,

    salaryRangeMin: typeof raw?.salaryRangeMin === 'number' ? raw.salaryRangeMin : undefined,
    salaryRangeMax: typeof raw?.salaryRangeMax === 'number' ? raw.salaryRangeMax : undefined,
    salaryOffered: typeof raw?.salaryOffered === 'number' ? raw.salaryOffered : undefined,
    currency: typeof raw?.currency === 'string' && raw.currency ? raw.currency : 'USD',

    rejectionReason: typeof raw?.rejectionReason === 'string' ? raw.rejectionReason : undefined,
    resumeVersion: typeof raw?.resumeVersion === 'string' ? raw.resumeVersion : undefined,
    priority: typeof raw?.priority === 'number' ? raw.priority : 3,
    tags: Array.isArray(raw?.tags) ? raw.tags.filter((t: unknown): t is string => typeof t === 'string') : [],

    createdAt: typeof raw?.createdAt === 'string' && raw.createdAt ? raw.createdAt : nowIso,
    updatedAt: typeof raw?.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : nowIso,
  }
}

export function sanitizeApplications(raw: unknown): JobApplication[] {
  if (!Array.isArray(raw)) return []
  return raw.map(sanitizeApplication)
}
