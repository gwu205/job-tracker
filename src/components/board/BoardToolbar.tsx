import { Input, Select } from '../ui/Field'
import { ToggleChipGroup } from './ToggleChipGroup'
import { SOURCES, SOURCE_LABELS, WORKSTYLES, WORKSTYLE_LABELS } from '../../types'
import type { FilterState, SortField } from '../../lib/filterSort'
import { Button } from '../ui/Button'

interface BoardToolbarProps {
  filters: FilterState
  onChange: (patch: Partial<FilterState>) => void
  availableTags: string[]
  resultCount: number
  totalCount: number
}

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'dateApplied', label: 'Date applied' },
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'priority', label: 'Priority' },
  { value: 'company', label: 'Company' },
]

export function BoardToolbar({ filters, onChange, availableTags, resultCount, totalCount }: BoardToolbarProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-hairline px-lg py-sm">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search company or position…"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          className="max-w-xs"
          aria-label="Search applications"
        />

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-ink-tertiary">Sort</span>
          <Select
            value={filters.sortBy}
            onChange={(e) => onChange({ sortBy: e.target.value as SortField })}
            className="w-auto py-1 text-xs"
            aria-label="Sort by"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="tertiary"
            size="sm"
            onClick={() => onChange({ sortDir: filters.sortDir === 'asc' ? 'desc' : 'asc' })}
            aria-label={`Sort direction: ${filters.sortDir === 'asc' ? 'ascending' : 'descending'}`}
          >
            {filters.sortDir === 'asc' ? '↑' : '↓'}
          </Button>
        </div>

        <span className="ml-auto text-xs text-ink-tertiary">
          {resultCount === totalCount ? `${totalCount} applications` : `${resultCount} of ${totalCount}`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <ToggleChipGroup
          label="Source"
          options={SOURCES.map((s) => ({ value: s, label: SOURCE_LABELS[s] }))}
          selected={filters.sources}
          onChange={(sources) => onChange({ sources })}
        />
        <ToggleChipGroup
          label="Workstyle"
          options={WORKSTYLES.map((w) => ({ value: w, label: WORKSTYLE_LABELS[w] }))}
          selected={filters.workstyles}
          onChange={(workstyles) => onChange({ workstyles })}
        />
        {availableTags.length > 0 && (
          <ToggleChipGroup
            label="Tags"
            options={availableTags.map((t) => ({ value: t, label: t }))}
            selected={filters.tags}
            onChange={(tags) => onChange({ tags })}
          />
        )}
      </div>
    </div>
  )
}
