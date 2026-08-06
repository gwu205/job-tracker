import type { ReactEventHandler } from 'react'
import clsx from 'clsx'
import type { Status } from '../../types'
import { STATUSES, STATUS_LABELS } from '../../types'
import { STATUS_COLOR_CLASSES } from '../../lib/statusColors'

interface StatusSelectProps {
  value: Status
  onChange: (status: Status) => void
  id?: string
  className?: string
  onClick?: ReactEventHandler<HTMLSelectElement>
  'aria-label'?: string
}

/**
 * A status <select> that's color-coded to the current value. Deliberately its own component
 * rather than reusing the shared Field `Select` — that one bakes in a fixed background/border/
 * text color which would fight with the per-status tint here (Tailwind utilities of equal
 * specificity don't reliably "override" by class order without tailwind-merge).
 */
export function StatusSelect({ value, onChange, id, className, onClick, ...rest }: StatusSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as Status)}
      onClick={onClick}
      className={clsx(
        'cursor-pointer appearance-none rounded-pill border px-2 py-0.5 text-xs font-medium transition-colors',
        'focus:outline-none focus:shadow-focus-ring',
        STATUS_COLOR_CLASSES[value].badge,
        className,
      )}
      {...rest}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  )
}
