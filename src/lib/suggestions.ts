import type { JobApplication } from '../types'

/**
 * Distinct, trimmed, non-empty prior values for a given field across all applications —
 * used to power <datalist> autofill suggestions on free-text inputs that tend to repeat
 * (location, resume version, recruiter contacts, ...).
 */
export function collectFieldSuggestions(
  applications: JobApplication[],
  getter: (app: JobApplication) => string | undefined,
): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const app of applications) {
    const raw = getter(app)
    if (!raw) continue
    const value = raw.trim()
    if (!value || seen.has(value.toLowerCase())) continue
    seen.add(value.toLowerCase())
    out.push(value)
  }
  return out.sort((a, b) => a.localeCompare(b))
}
