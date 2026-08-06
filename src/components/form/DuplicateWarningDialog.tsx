import type { JobApplication } from '../../types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/StatusBadge'

interface DuplicateWarningDialogProps {
  existing: JobApplication | null
  onOpenExisting: () => void
  onCreateAnyway: () => void
  onCancel: () => void
}

export function DuplicateWarningDialog({ existing, onOpenExisting, onCreateAnyway, onCancel }: DuplicateWarningDialogProps) {
  return (
    <Modal open={!!existing} onClose={onCancel} title="Active application already exists" size="sm">
      {existing && (
        <div className="flex flex-col gap-sm">
          <p className="text-sm text-ink-muted">
            You already have an active application for <strong className="text-ink">{existing.position}</strong> at{' '}
            <strong className="text-ink">{existing.company}</strong>, currently:
          </p>
          <div>
            <StatusBadge status={existing.status} />
          </div>
          <p className="text-sm text-ink-muted">Open that record instead, or create a separate new entry anyway.</p>
        </div>
      )}
      <div className="mt-md flex justify-end gap-2">
        <Button variant="tertiary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={onCreateAnyway}>
          Create anyway
        </Button>
        <Button variant="primary" onClick={onOpenExisting}>
          Open existing
        </Button>
      </div>
    </Modal>
  )
}
