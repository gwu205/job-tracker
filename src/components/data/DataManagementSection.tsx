import { useRef, useState } from 'react'
import clsx from 'clsx'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useAppStore } from '../../store/useAppStore'
import { applicationsToCSV, downloadFile } from '../../lib/csv'
import { estimateStorageUsage } from '../../lib/storage'
import { validateImportedState } from '../../lib/validateImport'
import { CURRENT_SCHEMA_VERSION, type PersistedState } from '../../types'

export function DataManagementSection() {
  const applications = useAppStore((s) => s.applications)
  const exportState = useAppStore((s) => s.exportState)
  const importState = useAppStore((s) => s.importState)
  const clearAllData = useAppStore((s) => s.clearAllData)
  const storageError = useAppStore((s) => s.storageError)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [pendingImport, setPendingImport] = useState<PersistedState | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importIssues, setImportIssues] = useState<string[]>([])

  const usage = estimateStorageUsage()
  const usagePct = Math.min(100, Math.round(usage.ratio * 100))

  function exportCSV() {
    const csv = applicationsToCSV(applications)
    downloadFile(`job-applications-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv')
  }

  function exportJSON() {
    const json = JSON.stringify(exportState(), null, 2)
    downloadFile(`job-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`, json, 'application/json')
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImportError(null)
    setImportIssues([])

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        const result = validateImportedState(parsed)
        if (!result.valid) {
          setImportError(
            `This file doesn't match the job-tracker backup format (${result.appCount} record(s) checked):`,
          )
          setImportIssues(result.issues)
          return
        }
        const obj = parsed as any
        setPendingImport({
          schemaVersion: obj.schemaVersion ?? CURRENT_SCHEMA_VERSION,
          applications: obj.applications,
          settings: obj.settings ?? {},
        })
      } catch {
        setImportError('Could not parse that file as JSON.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col gap-md">
      <div>
        <h3 className="font-display text-sm font-semibold text-ink">Storage usage</h3>
        <div className="mt-1.5 h-1.5 w-full max-w-sm overflow-hidden rounded-pill bg-surface-2">
          <div
            className={clsx(
              'h-full rounded-pill transition-all',
              usagePct > 85 ? 'bg-danger' : usagePct > 60 ? 'bg-warning' : 'bg-success',
            )}
            style={{ width: `${usagePct}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-ink-tertiary">
          {(usage.bytes / 1024).toFixed(1)} KB used of an estimated {(usage.quotaBytes / 1024 / 1024).toFixed(0)} MB
          browser storage limit ({usagePct}%).
        </p>
        {usagePct > 85 && (
          <p className="mt-1 text-xs text-warning">
            Approaching local storage's limit — export a backup soon to avoid losing data.
          </p>
        )}
        {storageError && <p className="mt-1 text-xs text-danger">{storageError}</p>}
      </div>

      <div>
        <h3 className="font-display text-sm font-semibold text-ink">Export</h3>
        <div className="mt-1.5 flex gap-2">
          <Button variant="secondary" onClick={exportCSV}>
            Export CSV
          </Button>
          <Button variant="secondary" onClick={exportJSON}>
            Export JSON backup
          </Button>
        </div>
      </div>

      <div>
        <h3 className="font-display text-sm font-semibold text-ink">Import</h3>
        <p className="mt-1 text-xs text-ink-tertiary">
          Restore from a JSON backup. This replaces all data currently in this browser.
        </p>
        <div className="mt-1.5">
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFileSelected} className="hidden" />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            Import JSON backup
          </Button>
        </div>
        {importError && (
          <div className="mt-1.5 rounded-md border border-danger/30 bg-danger/5 p-sm">
            <p className="text-xs text-danger">{importError}</p>
            {importIssues.length > 0 && (
              <ul className="mt-1.5 flex list-disc flex-col gap-0.5 pl-4 text-xs text-ink-muted">
                {importIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-display text-sm font-semibold text-danger">Danger zone</h3>
        <div className="mt-1.5">
          <Button variant="danger" onClick={() => setConfirmClear(true)}>
            Clear all data
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Clear all data?"
        description="This permanently deletes every tracked application and resets settings on this device. Export a backup first if you might need this data again."
        confirmLabel="Clear everything"
        danger
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearAllData()
          setConfirmClear(false)
        }}
      />

      <ConfirmDialog
        open={!!pendingImport}
        title="Replace all data with this backup?"
        description={`This file contains ${pendingImport?.applications.length ?? 0} application(s). Importing replaces everything currently stored in this browser.`}
        confirmLabel="Import and replace"
        danger
        onCancel={() => setPendingImport(null)}
        onConfirm={() => {
          if (pendingImport) importState(pendingImport)
          setPendingImport(null)
        }}
      />
    </div>
  )
}
