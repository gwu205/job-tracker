export function MetricCard({
  label,
  value,
  caption,
}: {
  label: string
  value: string
  caption?: string
}) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-1 p-md">
      <p className="text-xs text-ink-subtle">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-ink">{value}</p>
      {caption && <p className="mt-0.5 text-xs text-ink-tertiary">{caption}</p>}
    </div>
  )
}
