import type { JobApplication, Source, Workstyle } from '../types'
import { normalizeForMatch } from './fuzzyMatch'

export type SortField = 'dateApplied' | 'updatedAt' | 'priority' | 'company'
export type SortDir = 'asc' | 'desc'

export interface FilterState {
  search: string
  sources: Source[]
  workstyles: Workstyle[]
  tags: string[]
  sortBy: SortField
  sortDir: SortDir
}

export function defaultFilterState(): FilterState {
  return {
    search: '',
    sources: [],
    workstyles: [],
    tags: [],
    sortBy: 'dateApplied',
    sortDir: 'desc',
  }
}

export function applyFilters(applications: JobApplication[], filters: FilterState): JobApplication[] {
  const search = normalizeForMatch(filters.search)

  let result = applications.filter((app) => {
    if (search) {
      const hay = normalizeForMatch(`${app.company} ${app.position}`)
      if (!hay.includes(search)) return false
    }
    if (filters.sources.length > 0 && !filters.sources.includes(app.source)) return false
    if (filters.workstyles.length > 0 && (!app.workstyle || !filters.workstyles.includes(app.workstyle))) return false
    if (filters.tags.length > 0 && !app.tags.some((t) => filters.tags.includes(t))) return false
    return true
  })

  const dir = filters.sortDir === 'asc' ? 1 : -1
  result = [...result].sort((a, b) => {
    switch (filters.sortBy) {
      case 'priority':
        return (a.priority - b.priority) * dir
      case 'company':
        return a.company.localeCompare(b.company) * dir
      case 'updatedAt':
        return a.updatedAt.localeCompare(b.updatedAt) * dir
      case 'dateApplied':
      default:
        return a.dateApplied.localeCompare(b.dateApplied) * dir
    }
  })

  return result
}

export function collectTags(applications: JobApplication[]): string[] {
  const set = new Set<string>()
  for (const app of applications) for (const t of app.tags) set.add(t)
  return [...set].sort((a, b) => a.localeCompare(b))
}
