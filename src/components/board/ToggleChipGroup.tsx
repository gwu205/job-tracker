import clsx from 'clsx'

interface ToggleChipGroupProps<T extends string> {
  label: string
  options: { value: T; label: string }[]
  selected: T[]
  onChange: (next: T[]) => void
}

export function ToggleChipGroup<T extends string>({ label, options, selected, onChange }: ToggleChipGroupProps<T>) {
  if (options.length === 0) return null

  function toggle(value: T) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-ink-tertiary">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            aria-pressed={selected.includes(opt.value)}
            className={clsx(
              'rounded-pill border px-2 py-0.5 text-xs transition-colors',
              selected.includes(opt.value)
                ? 'border-primary/40 bg-primary/15 text-primary'
                : 'border-hairline bg-canvas text-ink-subtle hover:border-hairline-strong hover:text-ink',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
