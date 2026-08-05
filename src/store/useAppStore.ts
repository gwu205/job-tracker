import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import {
  ACTIVE_STATUSES,
  DEFAULT_SETTINGS,
  INACTIVE_STATUSES,
  type AppSettings,
  type InterviewRound,
  type JobApplication,
  type PersistedState,
  type Source,
  type Status,
  type StatusHistoryEntry,
  type Workstyle,
  CURRENT_SCHEMA_VERSION,
} from '../types'
import { loadState, saveState, StorageQuotaError } from '../lib/storage'
import { isFuzzyMatch } from '../lib/fuzzyMatch'
import { sanitizeApplications } from '../lib/sanitizeState'

export interface NewApplicationInput {
  company: string
  position: string
  source: Source
  sourceLabel?: string
  recruiterName?: string
  recruiterEmail?: string
  recruiterPhone?: string
  dateApplied: string
  status?: Status
  notes?: string
  jobUrl?: string
  workstyle?: Workstyle
  location?: string
  salaryRangeMin?: number
  salaryRangeMax?: number
  salaryOffered?: number
  currency?: string
  resumeVersion?: string
  priority?: number
  tags?: string[]
  /** Supply to backfill a full historical status log instead of a single "now" entry. */
  statusHistory?: Array<{ status: Status; timestamp: string; note?: string }>
  interviewRounds?: Array<Omit<InterviewRound, 'id'>>
}

interface CreateOptions {
  /** id of a prior (declined/unsuccessful) application to link this re-application to. */
  linkToId?: string
}

interface AppState {
  applications: JobApplication[]
  settings: AppSettings
  storageError: string | null

  findActiveDuplicate: (company: string, position: string, excludeId?: string) => JobApplication | undefined
  findLinkablePriorApplications: (company: string, position: string) => JobApplication[]
  getRoleGroup: (roleGroupId: string) => JobApplication[]

  createApplication: (input: NewApplicationInput, opts?: CreateOptions) => JobApplication
  updateApplication: (id: string, patch: Partial<JobApplication>) => void
  deleteApplication: (id: string) => void

  changeStatus: (id: string, status: Status, opts?: { timestamp?: string; note?: string }) => void
  updateStatusHistoryEntry: (appId: string, entryId: string, patch: Partial<Omit<StatusHistoryEntry, 'id'>>) => void
  addStatusHistoryEntry: (appId: string, entry: Omit<StatusHistoryEntry, 'id'>) => void
  deleteStatusHistoryEntry: (appId: string, entryId: string) => void

  addInterviewRound: (appId: string, round: Omit<InterviewRound, 'id'>) => void
  updateInterviewRound: (appId: string, roundId: string, patch: Partial<Omit<InterviewRound, 'id'>>) => void
  deleteInterviewRound: (appId: string, roundId: string) => void

  updateSettings: (patch: Partial<AppSettings>) => void
  clearAllData: () => void
  exportState: () => PersistedState
  importState: (state: PersistedState) => void
}

function nowISO(): string {
  return new Date().toISOString()
}

function sortHistory(history: StatusHistoryEntry[]): StatusHistoryEntry[] {
  return [...history].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

function persist(applications: JobApplication[], settings: AppSettings, setError: (e: string | null) => void) {
  try {
    saveState({ schemaVersion: CURRENT_SCHEMA_VERSION, applications, settings })
    setError(null)
  } catch (err) {
    if (err instanceof StorageQuotaError) {
      setError(err.message)
    } else {
      throw err
    }
  }
}

const initial = loadState()

export const useAppStore = create<AppState>((set, get) => {
  const persistNow = () => {
    const { applications, settings } = get()
    persist(applications, settings, (e) => set({ storageError: e }))
  }

  return {
    applications: initial.applications,
    settings: initial.settings,
    storageError: null,

    findActiveDuplicate(company, position, excludeId) {
      return get().applications.find(
        (a) =>
          a.id !== excludeId &&
          ACTIVE_STATUSES.includes(a.status) &&
          isFuzzyMatch(a.company, company) &&
          isFuzzyMatch(a.position, position),
      )
    },

    findLinkablePriorApplications(company, position) {
      return get()
        .applications.filter(
          (a) =>
            INACTIVE_STATUSES.includes(a.status) &&
            isFuzzyMatch(a.company, company) &&
            isFuzzyMatch(a.position, position),
        )
        .sort((a, b) => b.dateApplied.localeCompare(a.dateApplied))
    },

    getRoleGroup(roleGroupId) {
      return get()
        .applications.filter((a) => a.roleGroupId === roleGroupId)
        .sort((a, b) => a.dateApplied.localeCompare(b.dateApplied))
    },

    createApplication(input, opts) {
      const status = input.status ?? 'saved'
      const linkTarget = opts?.linkToId ? get().applications.find((a) => a.id === opts.linkToId) : undefined
      const roleGroupId = linkTarget?.roleGroupId ?? uuid()
      const timestamp = nowISO()

      const statusHistory: StatusHistoryEntry[] = input.statusHistory?.length
        ? sortHistory(input.statusHistory.map((h) => ({ id: uuid(), ...h })))
        : [{ id: uuid(), status, timestamp }]

      const interviewRounds: InterviewRound[] = (input.interviewRounds ?? []).map((r) => ({ id: uuid(), ...r }))

      const app: JobApplication = {
        id: uuid(),
        roleGroupId,
        reapplicationOfId: linkTarget?.id,
        company: input.company,
        position: input.position,
        source: input.source,
        sourceLabel: input.sourceLabel,
        recruiterName: input.recruiterName,
        recruiterEmail: input.recruiterEmail,
        recruiterPhone: input.recruiterPhone,
        dateApplied: input.dateApplied,
        status,
        statusHistory,
        interviewRounds,
        notes: input.notes ?? '',
        jobUrl: input.jobUrl,
        workstyle: input.workstyle,
        location: input.location,
        salaryRangeMin: input.salaryRangeMin,
        salaryRangeMax: input.salaryRangeMax,
        salaryOffered: input.salaryOffered,
        currency: input.currency ?? 'USD',
        resumeVersion: input.resumeVersion,
        priority: input.priority ?? 3,
        tags: input.tags ?? [],
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      set((s) => ({ applications: [...s.applications, app] }))
      persistNow()
      return app
    },

    updateApplication(id, patch) {
      set((s) => ({
        applications: s.applications.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: nowISO() } : a)),
      }))
      persistNow()
    },

    deleteApplication(id) {
      set((s) => ({ applications: s.applications.filter((a) => a.id !== id) }))
      persistNow()
    },

    changeStatus(id, status, opts) {
      const timestamp = opts?.timestamp ?? nowISO()
      set((s) => ({
        applications: s.applications.map((a) => {
          if (a.id !== id) return a
          const entry: StatusHistoryEntry = { id: uuid(), status, timestamp, note: opts?.note }
          return {
            ...a,
            status,
            statusHistory: sortHistory([...a.statusHistory, entry]),
            updatedAt: nowISO(),
          }
        }),
      }))
      persistNow()
    },

    updateStatusHistoryEntry(appId, entryId, patch) {
      set((s) => ({
        applications: s.applications.map((a) => {
          if (a.id !== appId) return a
          const statusHistory = sortHistory(
            a.statusHistory.map((h) => (h.id === entryId ? { ...h, ...patch } : h)),
          )
          return { ...a, statusHistory, updatedAt: nowISO() }
        }),
      }))
      persistNow()
    },

    addStatusHistoryEntry(appId, entry) {
      set((s) => ({
        applications: s.applications.map((a) =>
          a.id === appId
            ? { ...a, statusHistory: sortHistory([...a.statusHistory, { id: uuid(), ...entry }]), updatedAt: nowISO() }
            : a,
        ),
      }))
      persistNow()
    },

    deleteStatusHistoryEntry(appId, entryId) {
      set((s) => ({
        applications: s.applications.map((a) =>
          a.id === appId ? { ...a, statusHistory: a.statusHistory.filter((h) => h.id !== entryId) } : a,
        ),
      }))
      persistNow()
    },

    addInterviewRound(appId, round) {
      set((s) => ({
        applications: s.applications.map((a) =>
          a.id === appId
            ? { ...a, interviewRounds: [...a.interviewRounds, { id: uuid(), ...round }], updatedAt: nowISO() }
            : a,
        ),
      }))
      persistNow()
    },

    updateInterviewRound(appId, roundId, patch) {
      set((s) => ({
        applications: s.applications.map((a) =>
          a.id === appId
            ? {
                ...a,
                interviewRounds: a.interviewRounds.map((r) => (r.id === roundId ? { ...r, ...patch } : r)),
                updatedAt: nowISO(),
              }
            : a,
        ),
      }))
      persistNow()
    },

    deleteInterviewRound(appId, roundId) {
      set((s) => ({
        applications: s.applications.map((a) =>
          a.id === appId ? { ...a, interviewRounds: a.interviewRounds.filter((r) => r.id !== roundId) } : a,
        ),
      }))
      persistNow()
    },

    updateSettings(patch) {
      set((s) => ({ settings: { ...s.settings, ...patch } }))
      persistNow()
    },

    clearAllData() {
      set({ applications: [], settings: { ...DEFAULT_SETTINGS } })
      persistNow()
    },

    exportState() {
      const { applications, settings } = get()
      return { schemaVersion: CURRENT_SCHEMA_VERSION, applications, settings }
    },

    importState(state) {
      set({
        applications: sanitizeApplications(state.applications),
        settings: { ...DEFAULT_SETTINGS, ...state.settings },
      })
      persistNow()
    },
  }
})
