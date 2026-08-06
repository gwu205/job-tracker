import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Label } from '../ui/Field'
import { Badge } from '../ui/Badge'
import { StatusSelect } from '../ui/StatusSelect'
import { StatusDot } from '../ui/StatusDot'
import { ApplicationFields } from './ApplicationFields'
import { InterviewRoundsEditor } from './InterviewRoundsEditor'
import { StatusHistoryEditor } from './StatusHistoryEditor'
import { fieldsFromApp, buildScalarPayload, type FieldsState } from './fieldsState'
import { useAppStore } from '../../store/useAppStore'
import { STATUS_LABELS } from '../../types'
import { STATUS_COLOR_CLASSES } from '../../lib/statusColors'
import { formatDate, ordinal } from '../../lib/dates'
import { roleGroupIndex } from '../../lib/applications'

interface EditApplicationModalProps {
  applicationId: string | null
  onClose: () => void
  onOpenApplication: (id: string) => void
}

export function EditApplicationModal({ applicationId, onClose, onOpenApplication }: EditApplicationModalProps) {
  const app = useAppStore((s) => s.applications.find((a) => a.id === applicationId))
  const updateApplication = useAppStore((s) => s.updateApplication)
  const deleteApplication = useAppStore((s) => s.deleteApplication)
  const changeStatus = useAppStore((s) => s.changeStatus)
  const addInterviewRound = useAppStore((s) => s.addInterviewRound)
  const updateInterviewRound = useAppStore((s) => s.updateInterviewRound)
  const deleteInterviewRound = useAppStore((s) => s.deleteInterviewRound)
  const addStatusHistoryEntry = useAppStore((s) => s.addStatusHistoryEntry)
  const updateStatusHistoryEntry = useAppStore((s) => s.updateStatusHistoryEntry)
  const deleteStatusHistoryEntry = useAppStore((s) => s.deleteStatusHistoryEntry)
  const getRoleGroup = useAppStore((s) => s.getRoleGroup)

  const [fields, setFields] = useState<FieldsState | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (app) setFields(fieldsFromApp(app))
    else setFields(null)
  }, [app?.id])

  if (!applicationId || !app || !fields) return null

  const group = getRoleGroup(app.roleGroupId)
  const groupIndex = group.length > 1 ? roleGroupIndex(app, group) : 1

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!fields || !app) return
    updateApplication(app.id, buildScalarPayload(fields))
    onClose()
  }

  return (
    <>
      <Modal
        open={!!applicationId}
        onClose={onClose}
        title={`${app.company} — ${app.position}`}
        size="lg"
        footer={
          <div className="flex w-full items-center justify-between">
            <Button variant="danger" type="button" onClick={() => setConfirmDelete(true)}>
              Delete application
            </Button>
            <div className="flex gap-2">
              <Button variant="tertiary" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" form="edit-application-form" type="submit">
                Save changes
              </Button>
            </div>
          </div>
        }
      >
        <form id="edit-application-form" onSubmit={handleSave} className="flex flex-col gap-lg">
          {group.length > 1 && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-sm">
              <p className="mb-1 text-xs font-medium text-primary">
                {groupIndex === 1 ? 'This role has later re-applications' : `${ordinal(groupIndex)} application to this role`}
              </p>
              <div className="flex flex-wrap gap-1">
                {group.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onOpenApplication(g.id)}
                    disabled={g.id === app.id}
                    className={clsx(
                      'disabled:cursor-default',
                      g.id === app.id ? 'rounded-pill ring-1 ring-primary/50' : 'hover:opacity-80',
                    )}
                  >
                    <Badge className={clsx('gap-1.5', STATUS_COLOR_CLASSES[g.status].text)}>
                      <StatusDot status={g.status} />
                      {formatDate(g.dateApplied)} · {STATUS_LABELS[g.status]}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Label htmlFor="current-status">Current status</Label>
            <StatusSelect id="current-status" value={app.status} onChange={(newStatus) => changeStatus(app.id, newStatus)} />
            <span className="text-xs text-ink-tertiary">Changing this logs a new timestamped status-history entry.</span>
          </div>

          <ApplicationFields fields={fields} onChange={(patch) => setFields((f) => (f ? { ...f, ...patch } : f))} />

          <section>
            <h3 className="mb-2 font-display text-sm font-semibold text-ink">Status history</h3>
            <StatusHistoryEditor
              entries={app.statusHistory}
              onAdd={(entry) => addStatusHistoryEntry(app.id, entry)}
              onUpdate={(id, patch) => updateStatusHistoryEntry(app.id, id, patch)}
              onDelete={(id) => deleteStatusHistoryEntry(app.id, id)}
            />
          </section>

          <section>
            <h3 className="mb-2 font-display text-sm font-semibold text-ink">Interview rounds</h3>
            <InterviewRoundsEditor
              rounds={app.interviewRounds}
              onAdd={(round) => addInterviewRound(app.id, round)}
              onUpdate={(id, patch) => updateInterviewRound(app.id, id, patch)}
              onDelete={(id) => deleteInterviewRound(app.id, id)}
            />
          </section>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this application?"
        description={`This permanently deletes the ${app.position} application at ${app.company}. This can't be undone.`}
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteApplication(app.id)
          setConfirmDelete(false)
          onClose()
        }}
      />
    </>
  )
}

