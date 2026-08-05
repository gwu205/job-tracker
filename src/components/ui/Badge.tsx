import clsx from 'clsx'

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-pill bg-surface-2 px-2 py-0.5 text-xs text-ink-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}
