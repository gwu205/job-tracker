import { CURRENT_SCHEMA_VERSION, DEFAULT_SETTINGS, type PersistedState } from '../types'
import { sanitizeApplications } from './sanitizeState'
import { loadFileHandle, saveFileHandle, clearFileHandle } from './fileHandleDb'

export function isFileSyncSupported(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window
}

/** Opens a native "save" dialog to create a brand-new sync file, then remembers the handle. */
export async function createNewSyncFile(): Promise<FileSystemFileHandle> {
  const handle = await window.showSaveFilePicker({
    suggestedName: 'job-tracker-sync.json',
    types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
  })
  await saveFileHandle(handle)
  return handle
}

/** Opens a native "open" dialog to point at an existing sync file (e.g. one an MCP server already created), then remembers the handle. */
export async function openExistingSyncFile(): Promise<FileSystemFileHandle> {
  const [handle] = await window.showOpenFilePicker({
    types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
  })
  await saveFileHandle(handle)
  return handle
}

/** Re-establishes a previously-connected sync file on app load, re-requesting permission if the browser needs it. */
export async function reconnectSyncFile(): Promise<FileSystemFileHandle | null> {
  const handle = await loadFileHandle()
  if (!handle) return null
  const existing = await handle.queryPermission({ mode: 'readwrite' })
  if (existing === 'granted') return handle
  const requested = await handle.requestPermission({ mode: 'readwrite' })
  return requested === 'granted' ? handle : null
}

export async function disconnectSyncFile(): Promise<void> {
  await clearFileHandle()
}

export async function readSyncFileText(handle: FileSystemFileHandle): Promise<string> {
  const file = await handle.getFile()
  return file.text()
}

export async function writeSyncFileText(handle: FileSystemFileHandle, text: string): Promise<void> {
  const writable = await handle.createWritable()
  await writable.write(text)
  await writable.close()
}

/** Parses + sanitizes sync-file text the same way JSON import does — same untrusted-boundary treatment, since an MCP server or a stale file could hand back anything. */
export function parseSyncFileText(text: string): PersistedState | null {
  if (!text.trim()) return null
  try {
    const parsed = JSON.parse(text)
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.applications)) return null
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      applications: sanitizeApplications(parsed.applications),
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    }
  } catch {
    return null
  }
}

export function serializeForSyncFile(state: PersistedState): string {
  return JSON.stringify(state, null, 2)
}
