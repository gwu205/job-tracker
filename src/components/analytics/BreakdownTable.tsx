import type { BreakdownRow } from '../../lib/analytics'

export function BreakdownTable({ rows }: { rows: BreakdownRow[] }) {
  if (rows.length === 0) {
    return <p className="text-xs text-ink-tertiary">No data for this breakdown yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-ink-tertiary">
            <th className="py-1.5 pr-3 font-medium">Group</th>
            <th className="py-1.5 pr-3 font-medium">Submitted</th>
            <th className="py-1.5 pr-3 font-medium">Interviewed</th>
            <th className="py-1.5 pr-3 font-medium">Offers</th>
            <th className="py-1.5 pr-3 font-medium">Response rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-hairline">
              <td className="py-1.5 pr-3 text-ink">{row.label}</td>
              <td className="py-1.5 pr-3 text-ink-muted">{row.submitted}</td>
              <td className="py-1.5 pr-3 text-ink-muted">{row.interviewed}</td>
              <td className="py-1.5 pr-3 text-ink-muted">{row.offers}</td>
              <td className="py-1.5 pr-3 text-ink-muted">{Math.round(row.responseRate * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
