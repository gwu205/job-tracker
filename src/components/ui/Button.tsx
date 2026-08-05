import { type ButtonHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'tertiary' | 'danger'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-focus',
  secondary: 'bg-surface-1 text-ink border border-hairline hover:border-hairline-strong',
  tertiary: 'bg-transparent text-ink-subtle hover:text-ink hover:bg-surface-1',
  danger: 'bg-transparent text-danger border border-danger/40 hover:bg-danger/10',
}

const sizeClasses: Record<Size, string> = {
  sm: 'text-xs px-sm py-xxs gap-1',
  md: 'text-sm px-md py-xs gap-1.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', className, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:shadow-focus-ring disabled:opacity-50 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
