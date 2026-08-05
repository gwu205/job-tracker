import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import type { JobApplication, Status } from '../../types'
import { STATUSES, STATUS_LABELS, WORKSTYLE_LABELS } from '../../types'
import { Select } from '../ui/Field'
import { Badge } from '../ui/Badge'
import { formatDate, ordinal } from '../../lib/dates'
import { isStale, lastStatusChangeAt, roleGroupIndex } from '../../lib/applications'
import { useAppStore } from '../../store/useAppStore'

const PRIORITY_LABEL = ['', 'Low', 'Low-mid', 'Medium', 'High', 'Top pick']

interface ApplicationCardProps {
  app: JobApplication
  onOpen: () => void
}

export function ApplicationCard({ app, onOpen }: ApplicationCardProps) {
  const changeStatus = useAppStore((s) => s.changeStatus)
  const staleDaysThreshold = useAppStore((s) => s.settings.staleDaysThreshold)
  const getRoleGroup = useAppStore((s) => s.getRoleGroup)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: app.id,
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: isDragging ? 50 : undefined }
    : undefined

  const stale = isStale(app, staleDaysThreshold)
  const group = app.roleGroupId ? getRoleGroup(app.roleGroupId) : [app]
  const groupIndex = group.length > 1 ? roleGroupIndex(app, group) : 1

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'group rounded-lg border border-hairline bg-surface-1 p-sm shadow-sm transition-colors hover:border-hairline-strong',
        isDragging && 'opacity-50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={onOpen}
          className="flex-1 text-left focus-visible:outline-none focus-visible:shadow-focus-ring rounded-sm"
        >
          <p className="font-display text-sm font-semibold leading-snug text-ink">{app.company}</p>
          <p className="text-xs text-ink-subtle leading-snug">{app.position}</p>
        </button>
        <button
          {...listeners}
          {...attributes}
          aria-label={`Drag ${app.company} ${app.position} card`}
          className="cursor-grab touch-none rounded-sm px-1 py-0.5 text-ink-tertiary opacity-0 transition-opacity hover:bg-surface-2 hover:text-ink-subtle focus-visible:opacity-100 focus-visible:outline-none group-hover:opacity-100"
        >
          ⠿
        </button>
      </div>

      <div className="mt-xs flex flex-wrap gap-1">
        {stale && (
          <Badge className="bg-warning/10 text-warning">
            Gone quiet · {formatDate(lastStatusChangeAt(app))}
          </Badge>
        )}
        {groupIndex > 1 && <Badge className="bg-primary/10 text-primary">{ordinal(groupIndex)} application to this role</Badge>}
        {app.workstyle && <Badge>{WORKSTYLE_LABELS[app.workstyle]}</Badge>}
        {app.priority >= 4 && <Badge className="bg-success/10 text-success">{PRIORITY_LABEL[app.priority]}</Badge>}
        {app.tags.slice(0, 3).map((t) => (
          <Badge key={t}>{t}</Badge>
        ))}
      </div>

      <div className="mt-sm flex items-center justify-between gap-2">
        <span className="text-xs text-ink-tertiary">{formatDate(app.dateApplied)}</span>
        <label className="sr-only" htmlFor={`status-${app.id}`}>
          Change status for {app.company} {app.position}
        </label>
        <Select
          id={`status-${app.id}`}
          value={app.status}
          onChange={(e) => changeStatus(app.id, e.target.value as Status)}
          onClick={(e) => e.stopPropagation()}
          className="w-auto py-0.5 px-1.5 text-xs"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}
