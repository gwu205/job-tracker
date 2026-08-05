import { useState } from 'react'
import { STATUSES, STATUS_LABELS, type Status, type StatusHistoryEntry } from '../../types'
import { Button } from '../ui/Button'
import { Input, Select, Label } from '../ui/Field'
import { formatDateTime, todayISODate } from '../../lib/dates'

export interface EditableHistoryEntry {
  id: string
  status: Status
  timestamp: string
  note?: string
}

interface StatusHistoryEditorProps {
  entries: EditableHistoryEntry[]
  onAdd: (entry: Omit<StatusHistoryEntry, 'id'>) => void
  onUpdate: (id: string, patch: Partial<Omit<StatusHistoryEntry, 'id'>>) => void
  onDelete: (id: string) => void
  /** When false, existing entries render read-only (still addable) — used on the board card's quick view. */
  allowEditingExisting?: boolean
}

const emptyDraft = { status: 'applied' as Status, date: todayISODate(), note: '' }

export function StatusHistoryEditor({
  entries,
  onAdd,
  onUpdate,
  onDelete,
  allowEditingExisting = true,
}: StatusHistoryEditorProps) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)

  const sorted = [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  function saveNew() {
    onAdd({ status: draft.status, timestamp: new Date(draft.date).toISOString(), note: draft.note || undefined })
    setAdding(false)
    setDraft(emptyDraft)
  }

  return (
    <div className="flex flex-col gap-2">
      {sorted.length === 0 && <p className="text-xs text-ink-tertiary">No status history yet.</p>}
      {sorted.map((entry, i) => (
        <div key={entry.id} className="flex items-center gap-2 rounded-md border border-hairline bg-surface-2 px-sm py-xs">
          <span className="w-5 shrink-0 text-center text-xs text-ink-tertiary">{i + 1}</span>
          {allowEditingExisting ? (
            <>
              <Select
                value={entry.status}
                onChange={(e) => onUpdate(entry.id, { status: e.target.value as Status })}
                className="w-auto py-0.5 px-1.5 text-xs"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
              <Input
                type="datetime-local"
                value={toDatetimeLocal(entry.timestamp)}
                onChange={(e) => onUpdate(entry.id, { timestamp: new Date(e.target.value).toISOString() })}
                className="w-auto py-0.5 px-1.5 text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="tertiary"
                onClick={() => onDelete(entry.id)}
                className="ml-auto"
              >
                Remove
              </Button>
            </>
          ) : (
            <span className="text-xs text-ink">
              {STATUS_LABELS[entry.status]} — {formatDateTime(entry.timestamp)}
            </span>
          )}
        </div>
      ))}

      {adding ? (
        <div className="flex flex-col gap-2 rounded-md border border-hairline-strong bg-surface-2 p-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Status</Label>
              <Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Status })}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Note (optional)</Label>
            <Input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="tertiary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" variant="primary" onClick={saveNew}>
              Add entry
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" size="sm" variant="secondary" onClick={() => setAdding(true)}>
          + Add status entry
        </Button>
      )}
    </div>
  )
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
