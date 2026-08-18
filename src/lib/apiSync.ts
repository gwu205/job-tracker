import { CURRENT_SCHEMA_VERSION, DEFAULT_SETTINGS, type PersistedState } from '../types'
import { sanitizeApplications } from './sanitizeState'

export interface ApiSyncConfig {
  url: string
  token: string
}

const URL_KEY = 'job-tracker:api-url'
const TOKEN_KEY = 'job-tracker:api-token'

/** Thrown specifically on a 401 response, so callers can react to "wrong token" differently from a generic network/server error. */
export class UnauthorizedError extends Error {
  constructor() {
    super('The sync server rejected this token.')
    this.name = 'UnauthorizedError'
  }
}

/**
 * Kept out of AppSettings/PersistedState deliberately — those get serialized and PUT back to the
 * server on every change, and shipping the token back to itself on every write would be circular
 * (and would mean an export/import of your data carries your sync credentials along with it).
 */
export function loadApiConfig(): ApiSyncConfig | null {
  const url = localStorage.getItem(URL_KEY)
  const token = localStorage.getItem(TOKEN_KEY)
  if (!url || !token) return null
  return { url, token }
}

export function saveApiConfig(config: ApiSyncConfig): void {
  localStorage.setItem(URL_KEY, config.url)
  localStorage.setItem(TOKEN_KEY, config.token)
}

export function clearApiConfig(): void {
  localStorage.removeItem(URL_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

export function isApiSyncConfigured(): boolean {
  return loadApiConfig() !== null
}

async function checkResponse(res: Response): Promise<void> {
  if (res.status === 401) throw new UnauthorizedError()
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Sync server returned ${res.status}${text ? `: ${text}` : ''}.`)
  }
}

export async function fetchRemoteState(config: ApiSyncConfig): Promise<PersistedState> {
  const res = await fetch(`${config.url}/state`, {
    headers: { Authorization: `Bearer ${config.token}` },
  })
  await checkResponse(res)
  const parsed = await res.json()
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    applications: sanitizeApplications(parsed.applications),
    settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
  }
}

export async function pushRemoteState(
  config: ApiSyncConfig,
  state: PersistedState,
  opts?: { force?: boolean },
): Promise<void> {
  const query = opts?.force ? '?force=true' : ''
  const res = await fetch(`${config.url}/state${query}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  })
  await checkResponse(res)
}
