import { useState } from 'react'
import { INTERVIEW_TYPES, INTERVIEW_TYPE_LABELS, type InterviewRound, type InterviewType } from '../../types'
import { Button } from '../ui/Button'
import { Input, Select, Textarea, Label } from '../ui/Field'
import { formatDate, todayISODate } from '../../lib/dates'

export interface EditableRound {
  id: string
  date: string
  type: InterviewType
  interviewerName?: string
  notes?: string
}

interface InterviewRoundsEditorProps {
  rounds: EditableRound[]
  onAdd: (round: Omit<InterviewRound, 'id'>) => void
  onUpdate: (id: string, patch: Partial<Omit<InterviewRound, 'id'>>) => void
  onDelete: (id: string) => void
}

const emptyDraft = { date: todayISODate(), type: 'phone_screen' as InterviewType, interviewerName: '', notes: '' }

export function InterviewRoundsEditor({ rounds, onAdd, onUpdate, onDelete }: InterviewRoundsEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState(emptyDraft)
  const [adding, setAdding] = useState(false)

  const sorted = [...rounds].sort((a, b) => a.date.localeCompare(b.date))

  function startEdit(r: EditableRound) {
    setEditingId(r.id)
    setAdding(false)
    setDraft({ date: r.date, type: r.type, interviewerName: r.interviewerName ?? '', notes: r.notes ?? '' })
  }

  function saveEdit() {
    if (editingId) onUpdate(editingId, draft)
    setEditingId(null)
  }

  function saveNew() {
    onAdd(draft)
    setAdding(false)
    setDraft(emptyDraft)
  }

  return (
    <div className="flex flex-col gap-2">
      {sorted.length === 0 && !adding && (
        <p className="text-xs text-ink-tertiary">No interview rounds logged yet.</p>
      )}
      {sorted.map((r) =>
        editingId === r.id ? (
          <RoundDraftForm
            key={r.id}
            draft={draft}
            setDraft={setDraft}
            onSave={saveEdit}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div key={r.id} className="flex items-start justify-between gap-2 rounded-md border border-hairline bg-surface-2 px-sm py-xs">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-ink">
                {INTERVIEW_TYPE_LABELS[r.type]} · {formatDate(r.date)}
              </p>
              {r.interviewerName && <p className="text-xs text-ink-subtle">with {r.interviewerName}</p>}
              {r.notes && <p className="mt-0.5 truncate text-xs text-ink-tertiary">{r.notes}</p>}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button type="button" size="sm" variant="tertiary" onClick={() => startEdit(r)}>
                Edit
              </Button>
              <Button type="button" size="sm" variant="tertiary" onClick={() => onDelete(r.id)}>
                Remove
              </Button>
            </div>
          </div>
        ),
      )}

      {adding ? (
        <RoundDraftForm draft={draft} setDraft={setDraft} onSave={saveNew} onCancel={() => setAdding(false)} />
      ) : (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            setAdding(true)
            setEditingId(null)
            setDraft(emptyDraft)
          }}
        >
          + Add interview round
        </Button>
      )}
    </div>
  )
}

function RoundDraftForm({
  draft,
  setDraft,
  onSave,
  onCancel,
}: {
  draft: typeof emptyDraft
  setDraft: (d: typeof emptyDraft) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-hairline-strong bg-surface-2 p-sm">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Date</Label>
          <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as InterviewType })}>
            {INTERVIEW_TYPES.map((t) => (
              <option key={t} value={t}>
                {INTERVIEW_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <Label>Interviewer name</Label>
        <Input
          value={draft.interviewerName}
          onChange={(e) => setDraft({ ...draft, interviewerName: e.target.value })}
        />
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea rows={2} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="tertiary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" size="sm" variant="primary" onClick={onSave}>
          Save round
        </Button>
      </div>
    </div>
  )
}
