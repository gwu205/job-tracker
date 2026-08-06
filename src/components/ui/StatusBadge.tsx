import clsx from 'clsx'
import type { Status } from '../../types'
import { STATUS_LABELS } from '../../types'
import { STATUS_COLOR_CLASSES } from '../../lib/statusColors'
import { StatusDot } from './StatusDot'

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 text-xs font-medium',
        STATUS_COLOR_CLASSES[status].badge,
        className,
      )}
    >
      <StatusDot status={status} />
      {STATUS_LABELS[status]}
    </span>
  )
}
