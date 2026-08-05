import { useDroppable } from '@dnd-kit/core'
import clsx from 'clsx'
import type { JobApplication, Status } from '../../types'
import { STATUS_LABELS } from '../../types'
import { ApplicationCard } from './ApplicationCard'

interface KanbanColumnProps {
  status: Status
  applications: JobApplication[]
  onOpenApplication: (id: string) => void
}

export function KanbanColumn({ status, applications, onOpenApplication }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-surface-2/40">
      <div className="flex items-center justify-between px-sm py-xs">
        <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-ink-subtle">
          {STATUS_LABELS[status]}
        </h3>
        <span className="text-xs text-ink-tertiary">{applications.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={clsx(
          'scrollbar-thin flex flex-1 flex-col gap-2 overflow-y-auto rounded-md p-xs transition-colors min-h-[120px]',
          isOver && 'bg-primary/5 ring-1 ring-inset ring-primary/30',
        )}
      >
        {applications.map((app) => (
          <ApplicationCard key={app.id} app={app} onOpen={() => onOpenApplication(app.id)} />
        ))}
        {applications.length === 0 && (
          <p className="px-xs py-md text-center text-xs text-ink-tertiary">No applications</p>
        )}
      </div>
    </div>
  )
}
