import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import {
  computeAvgTimeInStage,
  computeAvgTimeToFirstResponse,
  computeBreakdown,
  computeFunnel,
  computeWeeklyTrend,
  filterByLookback,
} from '../../lib/analytics'
import { STATUS_LABELS, STATUSES } from '../../types'
import { MetricCard } from './MetricCard'
import { TrendChart } from './TrendChart'
import { BreakdownTable } from './BreakdownTable'
import { Button } from '../ui/Button'
import { formatDate } from '../../lib/dates'

export function AnalyticsPage() {
  const applications = useAppStore((s) => s.applications)
  const settings = useAppStore((s) => s.settings)
  const [breakdownBy, setBreakdownBy] = useState<'source' | 'workstyle'>('source')

  const scoped = useMemo(
    () => filterByLookback(applications, settings.lookbackStart, settings.lookbackEnd),
    [applications, settings.lookbackStart, settings.lookbackEnd],
  )

  const funnel = useMemo(() => computeFunnel(scoped), [scoped])
  const trend = useMemo(() => computeWeeklyTrend(scoped), [scoped])
  const breakdown = useMemo(() => computeBreakdown(scoped, breakdownBy), [scoped, breakdownBy])
  const avgFirstResponse = useMemo(() => computeAvgTimeToFirstResponse(scoped), [scoped])
  const avgTimeInStage = useMemo(() => computeAvgTimeInStage(scoped), [scoped])

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto px-lg py-md">
      <div className="mb-md flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Analytics</h2>
          <p className="text-xs text-ink-tertiary">
            {settings.lookbackStart || settings.lookbackEnd
              ? `Lookback: ${settings.lookbackStart ? formatDate(settings.lookbackStart) : 'earliest'} – ${
                  settings.lookbackEnd ? formatDate(settings.lookbackEnd) : 'today'
                }`
              : 'Showing all-time data — set a lookback period in Settings to scope this to your current job hunt.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="Submitted" value={String(funnel.submitted)} />
        <MetricCard label="Ignored (no response)" value={String(funnel.ignored)} />
        <MetricCard label="Interviewed" value={String(funnel.interviewed)} />
        <MetricCard label="Multi-round" value={String(funnel.multiRound)} />
        <MetricCard label="Offers" value={String(funnel.offers)} />
        <MetricCard label="Response rate" value={`${Math.round(funnel.responseRate * 100)}%`} />
      </div>

      <div className="mt-lg grid grid-cols-1 gap-lg lg:grid-cols-2">
        <div>
          <h3 className="mb-2 font-display text-sm font-semibold text-ink">Applications submitted per week</h3>
          <div className="rounded-lg border border-hairline bg-surface-1 p-md">
            <TrendChart data={trend} />
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-display text-sm font-semibold text-ink">Time metrics</h3>
          <div className="rounded-lg border border-hairline bg-surface-1 p-md">
            <p className="text-xs text-ink-subtle">Avg. time to first response</p>
            <p className="mt-1 font-display text-2xl font-semibold text-ink">
              {avgFirstResponse === null ? '—' : `${avgFirstResponse.toFixed(1)} days`}
            </p>
            <div className="mt-3 border-t border-hairline pt-3">
              <p className="mb-1.5 text-xs text-ink-subtle">Avg. time in stage</p>
              <div className="flex flex-col gap-1">
                {STATUSES.map((s) => (
                  <div key={s} className="flex items-center justify-between text-xs">
                    <span className="text-ink-muted">{STATUS_LABELS[s]}</span>
                    <span className="text-ink-tertiary">
                      {avgTimeInStage[s] === undefined ? '—' : `${avgTimeInStage[s]!.toFixed(1)}d`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-lg">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-ink">Breakdown</h3>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={breakdownBy === 'source' ? 'primary' : 'tertiary'}
              onClick={() => setBreakdownBy('source')}
            >
              By source
            </Button>
            <Button
              size="sm"
              variant={breakdownBy === 'workstyle' ? 'primary' : 'tertiary'}
              onClick={() => setBreakdownBy('workstyle')}
            >
              By workstyle
            </Button>
          </div>
        </div>
        <div className="rounded-lg border border-hairline bg-surface-1 p-md">
          <BreakdownTable rows={breakdown} />
        </div>
      </div>
    </div>
  )
}
