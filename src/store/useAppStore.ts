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
import {
  isFileSyncSupported,
  createNewSyncFile,
  openExistingSyncFile,
  reconnectSyncFile,
  disconnectSyncFile as forgetSyncFileHandle,
  readSyncFileText,
  writeSyncFileText,
  parseSyncFileText,
  serializeForSyncFile,
} from '../lib/fileSync'

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

export type SyncStatus = 'disconnected' | 'connected' | 'error'

interface AppState {
  applications: JobApplication[]
  settings: AppSettings
  storageError: string | null

  syncFileName: string | null
  syncStatus: SyncStatus
  syncError: string | null

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

  /** Reconnects a previously-chosen sync file on app load, if any. No-op if unsupported or never connected. */
  initFileSync: () => Promise<void>
  connectNewSyncFile: () => Promise<void>
  /**
   * Opens the picker and connects the chosen file, but does NOT apply its contents if it already
   * has data — that would silently blow away what's on screen. The caller (Settings UI) confirms
   * with the user first, then either calls `importState(remoteState)` or `disconnectSyncFile()`
   * to back out cleanly rather than leaving a half-connected file the app would later overwrite.
   */
  connectExistingSyncFile: () => Promise<{ hadExistingData: boolean; remoteState: PersistedState | null }>
  disconnectSyncFile: () => Promise<void>
  /** Re-reads the connected file; applies its contents if changed since we last read or wrote it. Safe to call on an interval. */
  pollSyncFile: () => Promise<void>
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
  // Not part of reactive state — nothing needs to re-render when these change, they're just
  // bookkeeping for the file-sync feature.
  let fileHandle: FileSystemFileHandle | null = null
  let lastSyncedText: string | null = null

  const persistNow = () => {
    const { applications, settings } = get()
    persist(applications, settings, (e) => set({ storageError: e }))

    if (fileHandle) {
      const handle = fileHandle
      const serialized = serializeForSyncFile({ schemaVersion: CURRENT_SCHEMA_VERSION, applications, settings })
      // Written before the await resolves so a poll racing this write treats it as already seen
      // rather than looping back and re-applying our own change.
      lastSyncedText = serialized
      writeSyncFileText(handle, serialized).catch((err) => {
        set({ syncStatus: 'error', syncError: err instanceof Error ? err.message : 'Could not write sync file.' })
      })
    }
  }

  return {
    applications: initial.applications,
    settings: initial.settings,
    storageError: null,

    syncFileName: null,
    syncStatus: 'disconnected',
    syncError: null,

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

    async initFileSync() {
      if (!isFileSyncSupported()) return
      try {
        const handle = await reconnectSyncFile()
        if (!handle) return
        fileHandle = handle

        const text = await readSyncFileText(handle)
        const parsed = parseSyncFileText(text)
        const { applications: localApplications, settings: localSettings } = get()
        const remoteIsSuspiciouslyEmpty = parsed?.applications.length === 0 && localApplications.length > 0

        if (parsed && !remoteIsSuspiciouslyEmpty) {
          lastSyncedText = text
          set({ applications: parsed.applications, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } })
        } else {
          // Handle from a previous session pointed at a file that's now empty/unreadable, or the
          // file has no applications while we still have local ones — never let that silently wipe
          // a non-empty board. Reseed the file from local data instead of trusting the remote.
          const serialized = serializeForSyncFile({ schemaVersion: CURRENT_SCHEMA_VERSION, applications: localApplications, settings: localSettings })
          lastSyncedText = serialized
          await writeSyncFileText(handle, serialized)
        }
        set({
          syncFileName: handle.name,
          syncStatus: 'connected',
          syncError: remoteIsSuspiciouslyEmpty
            ? 'Sync file was unexpectedly empty — kept your local data and rewrote the file from it.'
            : null,
        })
      } catch (err) {
        set({ syncStatus: 'error', syncError: err instanceof Error ? err.message : 'Could not reconnect sync file.' })
      }
    },

    async connectNewSyncFile() {
      const handle = await createNewSyncFile()
      fileHandle = handle
      const { applications, settings } = get()
      const serialized = serializeForSyncFile({ schemaVersion: CURRENT_SCHEMA_VERSION, applications, settings })
      lastSyncedText = serialized
      await writeSyncFileText(handle, serialized)
      set({ syncFileName: handle.name, syncStatus: 'connected', syncError: null })
    },

    async connectExistingSyncFile() {
      const handle = await openExistingSyncFile()
      fileHandle = handle
      const text = await readSyncFileText(handle)
      const parsed = parseSyncFileText(text)

      if (parsed && parsed.applications.length > 0) {
        // Track the handle so a confirmed import (or a later write) works, but leave lastSyncedText
        // unset until the caller actually commits — see the JSDoc on this action's type.
        set({ syncFileName: handle.name, syncStatus: 'connected', syncError: null })
        return { hadExistingData: true, remoteState: parsed }
      }

      const { applications, settings } = get()
      const serialized = serializeForSyncFile({ schemaVersion: CURRENT_SCHEMA_VERSION, applications, settings })
      lastSyncedText = serialized
      await writeSyncFileText(handle, serialized)
      set({ syncFileName: handle.name, syncStatus: 'connected', syncError: null })
      return { hadExistingData: false, remoteState: null }
    },

    async disconnectSyncFile() {
      await forgetSyncFileHandle()
      fileHandle = null
      lastSyncedText = null
      set({ syncFileName: null, syncStatus: 'disconnected', syncError: null })
    },

    async pollSyncFile() {
      if (!fileHandle) return
      try {
        const text = await readSyncFileText(fileHandle)
        if (text === lastSyncedText) return
        const parsed = parseSyncFileText(text)
        if (!parsed) return

        const { applications: localApplications, settings: localSettings } = get()
        if (parsed.applications.length === 0 && localApplications.length > 0) {
          // The file went empty (e.g. an external process created/reset it) while we still have a
          // non-empty local board — don't let that silently wipe local + localStorage. Repair the
          // file from local data instead of applying the empty remote state.
          const serialized = serializeForSyncFile({ schemaVersion: CURRENT_SCHEMA_VERSION, applications: localApplications, settings: localSettings })
          lastSyncedText = serialized
          await writeSyncFileText(fileHandle, serialized)
          set({ syncStatus: 'error', syncError: 'Sync file was unexpectedly empty — restored it from local data instead of overwriting your board.' })
          return
        }

        lastSyncedText = text
        set({ applications: parsed.applications, settings: { ...get().settings, ...parsed.settings } })
        // Mirror into localStorage without writing back to the file we just read from.
        persist(parsed.applications, get().settings, (e) => set({ storageError: e }))
      } catch (err) {
        set({ syncStatus: 'error', syncError: err instanceof Error ? err.message : 'Could not read sync file.' })
      }
    },
  }
})
