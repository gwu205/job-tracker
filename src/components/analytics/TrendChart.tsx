import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { WeeklyTrendPoint } from '../../lib/analytics'

export function TrendChart({ data }: { data: WeeklyTrendPoint[] }) {
  if (data.length === 0) {
    return <p className="text-xs text-ink-tertiary">No submitted applications in this period yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#23252a" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: '#8a8f98', fontSize: 11 }} axisLine={{ stroke: '#23252a' }} tickLine={false} />
        <YAxis
          allowDecimals={false}
          tick={{ fill: '#8a8f98', fontSize: 11 }}
          axisLine={{ stroke: '#23252a' }}
          tickLine={false}
          width={28}
        />
        <Tooltip
          cursor={{ fill: 'rgba(94,106,210,0.08)' }}
          contentStyle={{
            background: '#141516',
            border: '1px solid #23252a',
            borderRadius: 8,
            fontSize: 12,
            color: '#f7f8f8',
          }}
          labelFormatter={(label) => `Week of ${label}`}
        />
        <Bar dataKey="count" name="Applications submitted" fill="#5e6ad2" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
