import { useEffect, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ApplicationFields } from './ApplicationFields'
import { InterviewRoundsEditor, type EditableRound } from './InterviewRoundsEditor'
import { StatusHistoryEditor, type EditableHistoryEntry } from './StatusHistoryEditor'
import { DuplicateWarningDialog } from './DuplicateWarningDialog'
import { defaultFields, fieldsAreValid, buildScalarPayload } from './fieldsState'
import { useAppStore } from '../../store/useAppStore'
import type { JobApplication } from '../../types'

interface CreateApplicationModalProps {
  open: boolean
  onClose: () => void
  onCreated: (app: JobApplication) => void
  onOpenApplication: (id: string) => void
  /** Prefill (e.g. from AI-assisted paste parsing). */
  prefill?: Partial<ReturnType<typeof defaultFields>>
}

export function CreateApplicationModal({ open, onClose, onCreated, onOpenApplication, prefill }: CreateApplicationModalProps) {
  const createApplication = useAppStore((s) => s.createApplication)
  const findActiveDuplicate = useAppStore((s) => s.findActiveDuplicate)
  const findLinkablePriorApplications = useAppStore((s) => s.findLinkablePriorApplications)

  const [fields, setFields] = useState(() => ({ ...defaultFields(), ...prefill }))
  const [rounds, setRounds] = useState<EditableRound[]>([])
  const [history, setHistory] = useState<EditableHistoryEntry[]>(() => [
    { id: uuid(), status: 'saved', timestamp: new Date().toISOString() },
  ])
  const [duplicate, setDuplicate] = useState<JobApplication | null>(null)

  // The modal is always mounted (visibility is just the `open` prop), so the useState
  // initializers above only ever see the very first `prefill` — re-sync from the latest one
  // each time it's actually opened (e.g. a fresh AI/quick-parse result).
  useEffect(() => {
    if (open) {
      setFields({ ...defaultFields(), ...prefill })
      setRounds([])
      setHistory([{ id: uuid(), status: 'saved', timestamp: new Date().toISOString() }])
      setDuplicate(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefill])

  if (!open) return null

  function resetAndClose() {
    setFields({ ...defaultFields(), ...prefill })
    setRounds([])
    setHistory([{ id: uuid(), status: 'saved', timestamp: new Date().toISOString() }])
    setDuplicate(null)
    onClose()
  }

  function doCreate() {
    const latestStatus = [...history].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).at(-1)?.status ?? 'saved'
    const linkTarget = findLinkablePriorApplications(fields.company, fields.position)[0]
    const app = createApplication(
      {
        ...buildScalarPayload(fields),
        status: latestStatus,
        statusHistory: history.map((h) => ({ status: h.status, timestamp: h.timestamp, note: h.note })),
        interviewRounds: rounds.map((r) => ({
          date: r.date,
          type: r.type,
          interviewerName: r.interviewerName,
          notes: r.notes,
        })),
      },
      linkTarget ? { linkToId: linkTarget.id } : undefined,
    )
    onCreated(app)
    resetAndClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fieldsAreValid(fields)) return
    const existing = findActiveDuplicate(fields.company, fields.position)
    if (existing) {
      setDuplicate(existing)
      return
    }
    doCreate()
  }

  return (
    <>
      <Modal
        open={open && !duplicate}
        onClose={resetAndClose}
        title="New application"
        size="lg"
        footer={
          <>
            <Button variant="tertiary" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button variant="primary" form="create-application-form" type="submit">
              Create application
            </Button>
          </>
        }
      >
        <form id="create-application-form" onSubmit={handleSubmit} className="flex flex-col gap-lg">
          <ApplicationFields fields={fields} onChange={(patch) => setFields((f) => ({ ...f, ...patch }))} />

          <section>
            <h3 className="mb-2 font-display text-sm font-semibold text-ink">Status history</h3>
            <StatusHistoryEditor
              entries={history}
              onAdd={(entry) => setHistory((h) => [...h, { id: uuid(), ...entry }])}
              onUpdate={(id, patch) => setHistory((h) => h.map((e) => (e.id === id ? { ...e, ...patch } : e)))}
              onDelete={(id) => setHistory((h) => h.filter((e) => e.id !== id))}
            />
          </section>

          <section>
            <h3 className="mb-2 font-display text-sm font-semibold text-ink">Interview rounds</h3>
            <InterviewRoundsEditor
              rounds={rounds}
              onAdd={(round) => setRounds((r) => [...r, { id: uuid(), ...round }])}
              onUpdate={(id, patch) => setRounds((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)))}
              onDelete={(id) => setRounds((r) => r.filter((x) => x.id !== id))}
            />
          </section>
        </form>
      </Modal>

      <DuplicateWarningDialog
        existing={duplicate}
        onCancel={() => setDuplicate(null)}
        onOpenExisting={() => {
          if (duplicate) onOpenApplication(duplicate.id)
          setDuplicate(null)
          resetAndClose()
        }}
        onCreateAnyway={() => {
          setDuplicate(null)
          doCreate()
        }}
      />
    </>
  )
}
