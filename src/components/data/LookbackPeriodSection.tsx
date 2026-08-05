import { Input, Label, FieldGroup } from '../ui/Field'
import { useAppStore } from '../../store/useAppStore'

export function LookbackPeriodSection() {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)

  return (
    <div className="flex flex-col gap-md">
      <div className="grid max-w-md grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="lookback-start">Job hunt start date</Label>
          <Input
            id="lookback-start"
            type="date"
            value={settings.lookbackStart ?? ''}
            onChange={(e) => updateSettings({ lookbackStart: e.target.value || null })}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="lookback-end">End date (optional)</Label>
          <Input
            id="lookback-end"
            type="date"
            value={settings.lookbackEnd ?? ''}
            onChange={(e) => updateSettings({ lookbackEnd: e.target.value || null })}
          />
        </FieldGroup>
      </div>
      <p className="max-w-md text-xs text-ink-tertiary">
        Sets the default lookback window for Analytics. Leave end date blank to include everything up to today. You
        can still backfill applications dated before this window — it only affects analytics, not the board.
      </p>

      <FieldGroup className="max-w-xs">
        <Label htmlFor="stale-days">Flag applications as "gone quiet" after (days)</Label>
        <Input
          id="stale-days"
          type="number"
          min={1}
          value={settings.staleDaysThreshold}
          onChange={(e) => updateSettings({ staleDaysThreshold: Math.max(1, Number(e.target.value) || 1) })}
        />
      </FieldGroup>
    </div>
  )
}
