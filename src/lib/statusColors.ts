import type { Status } from '../types'

export interface StatusColorClasses {
  /** Small indicator dot (column headers, compact contexts). */
  dot: string
  /** Text-only accent (e.g. inline labels). */
  text: string
  /** Full badge/select treatment: tinted background + border + text. */
  badge: string
}

// Written as complete literal class strings (not interpolated) so Tailwind's
// content scanner can find them.
export const STATUS_COLOR_CLASSES: Record<Status, StatusColorClasses> = {
  saved: {
    dot: 'bg-neutral',
    text: 'text-neutral',
    badge: 'bg-neutral/10 border-neutral/30 text-neutral',
  },
  applied: {
    dot: 'bg-info',
    text: 'text-info',
    badge: 'bg-info/10 border-info/30 text-info',
  },
  interviewing: {
    dot: 'bg-primary',
    text: 'text-primary',
    badge: 'bg-primary/10 border-primary/30 text-primary',
  },
  offer: {
    dot: 'bg-success',
    text: 'text-success',
    badge: 'bg-success/10 border-success/30 text-success',
  },
  declined: {
    dot: 'bg-danger',
    text: 'text-danger',
    badge: 'bg-danger/10 border-danger/30 text-danger',
  },
  unsuccessful: {
    dot: 'bg-warning',
    text: 'text-warning',
    badge: 'bg-warning/10 border-warning/30 text-warning',
  },
}
