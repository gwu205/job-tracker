export const STATUSES = [
  'saved',
  'applied',
  'interviewing',
  'offer',
  'declined',
  'unsuccessful',
] as const

export type Status = (typeof STATUSES)[number]

export const ACTIVE_STATUSES: Status[] = ['saved', 'applied', 'interviewing', 'offer']
export const INACTIVE_STATUSES: Status[] = ['declined', 'unsuccessful']

export const STATUS_LABELS: Record<Status, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  declined: 'Declined',
  unsuccessful: 'Unsuccessful / Archive',
}

export const SOURCES = [
  'direct',
  'recruiter',
  'referral',
  'job_board',
  'other',
] as const

export type Source = (typeof SOURCES)[number]

export const SOURCE_LABELS: Record<Source, string> = {
  direct: 'Direct',
  recruiter: 'Recruiter',
  referral: 'Referral',
  job_board: 'Job board',
  other: 'Other',
}

export const WORKSTYLES = ['remote', 'hybrid', 'office'] as const
export type Workstyle = (typeof WORKSTYLES)[number]

export const WORKSTYLE_LABELS: Record<Workstyle, string> = {
  remote: 'Full-remote',
  hybrid: 'Hybrid',
  office: 'Office',
}

export const INTERVIEW_TYPES = [
  'phone_screen',
  'technical',
  'onsite',
  'behavioral',
  'take_home',
  'other',
] as const

export type InterviewType = (typeof INTERVIEW_TYPES)[number]

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  phone_screen: 'Phone screen',
  technical: 'Technical',
  onsite: 'Onsite',
  behavioral: 'Behavioral',
  take_home: 'Take-home',
  other: 'Other',
}

export interface StatusHistoryEntry {
  id: string
  status: Status
  timestamp: string // ISO 8601
  note?: string
}

export interface InterviewRound {
  id: string
  date: string // ISO 8601 date
  type: InterviewType
  interviewerName?: string
  notes?: string
}

export interface JobApplication {
  id: string
  /** Shared across linked re-applications to the same role (same company + position). */
  roleGroupId: string
  /** id of the immediately-prior application this one is a re-application of, if any. */
  reapplicationOfId?: string

  company: string
  position: string

  source: Source
  sourceLabel?: string // freeform label used when source === 'other'
  recruiterName?: string
  recruiterEmail?: string
  recruiterPhone?: string

  dateApplied: string // ISO 8601 date
  status: Status
  statusHistory: StatusHistoryEntry[]
  interviewRounds: InterviewRound[]

  notes: string
  jobUrl?: string
  workstyle?: Workstyle
  location?: string

  salaryRangeMin?: number
  salaryRangeMax?: number
  salaryOffered?: number
  currency: string

  rejectionReason?: string
  resumeVersion?: string
  priority: number // 1 (low) - 5 (high)
  tags: string[]

  createdAt: string
  updatedAt: string
}

export interface AppSettings {
  /** Start of the current job-hunting lookback period. Applications dated before this are excluded from analytics by default. */
  lookbackStart: string | null
  lookbackEnd: string | null
  /** Days of no status update before a card is flagged as "gone quiet". */
  staleDaysThreshold: number
  /** Claude API key, stored locally only, used for AI-assisted entry parsing. */
  claudeApiKey: string | null
}

export const DEFAULT_SETTINGS: AppSettings = {
  lookbackStart: null,
  lookbackEnd: null,
  staleDaysThreshold: 14,
  claudeApiKey: null,
}

export const CURRENT_SCHEMA_VERSION = 1

export interface PersistedState {
  schemaVersion: number
  applications: JobApplication[]
  settings: AppSettings
}
