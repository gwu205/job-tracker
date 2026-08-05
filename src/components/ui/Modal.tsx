import { type ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-md"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx(
          'flex max-h-[90vh] w-full flex-col rounded-lg border border-hairline bg-surface-1 shadow-2xl',
          sizeClasses[size],
        )}
      >
        <div className="flex items-center justify-between border-b border-hairline px-lg py-sm">
          <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-sm p-1 text-ink-subtle hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:shadow-focus-ring"
          >
            ✕
          </button>
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto px-lg py-md">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-hairline px-lg py-sm">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
