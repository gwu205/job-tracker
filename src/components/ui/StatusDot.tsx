import clsx from 'clsx'
import type { Status } from '../../types'
import { STATUS_COLOR_CLASSES } from '../../lib/statusColors'

export function StatusDot({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={clsx('inline-block h-1.5 w-1.5 shrink-0 rounded-full', STATUS_COLOR_CLASSES[status].dot, className)}
    />
  )
}
