import { CURRENT_SCHEMA_VERSION, DEFAULT_SETTINGS, type PersistedState } from '../types'
import { sanitizeApplications } from './sanitizeState'

const STORAGE_KEY = 'job-tracker:data'

// Each entry migrates PersistedState-shaped data from its key version to key+1.
// Add new migrations here as the schema evolves; never mutate old ones.
const MIGRATIONS: Record<number, (state: any) => any> = {
  // Example for the future:
  // 1: (state) => ({ ...state, schemaVersion: 2, applications: state.applications.map(...) }),
}

function migrate(raw: any): PersistedState {
  let state = raw
  while (typeof state.schemaVersion === 'number' && state.schemaVersion < CURRENT_SCHEMA_VERSION) {
    const step = MIGRATIONS[state.schemaVersion]
    if (!step) break
    state = step(state)
  }
  return state as PersistedState
}

export function createEmptyState(): PersistedState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    applications: [],
    settings: { ...DEFAULT_SETTINGS },
  }
}

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyState()
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.applications)) {
      return createEmptyState()
    }
    const migrated = migrate(parsed)
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      // Repairs any record that predates a validation fix (or was written some other way) so a
      // corrupt field can't crash the app on every load — see sanitizeState.ts.
      applications: sanitizeApplications(migrated.applications),
      settings: { ...DEFAULT_SETTINGS, ...(migrated.settings ?? {}) },
    }
  } catch {
    return createEmptyState()
  }
}

export class StorageQuotaError extends Error {
  constructor() {
    super('Local storage quota exceeded. Export a backup, then free up space.')
    this.name = 'StorageQuotaError'
  }
}

export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)) {
      throw new StorageQuotaError()
    }
    throw err
  }
}

/** Most browsers cap localStorage around 5MB per origin. We treat that as the practical ceiling for the usage warning. */
const ASSUMED_QUOTA_BYTES = 5 * 1024 * 1024

export function estimateStorageUsage(): { bytes: number; quotaBytes: number; ratio: number } {
  const raw = localStorage.getItem(STORAGE_KEY) ?? ''
  const bytes = new Blob([raw]).size
  return { bytes, quotaBytes: ASSUMED_QUOTA_BYTES, ratio: bytes / ASSUMED_QUOTA_BYTES }
}
