import { useState } from 'react'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useAppStore } from '../../store/useAppStore'
import { isFileSyncSupported } from '../../lib/fileSync'
import type { PersistedState } from '../../types'

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

export function MCPSyncSection() {
  const syncFileName = useAppStore((s) => s.syncFileName)
  const syncStatus = useAppStore((s) => s.syncStatus)
  const syncError = useAppStore((s) => s.syncError)
  const connectNewSyncFile = useAppStore((s) => s.connectNewSyncFile)
  const connectExistingSyncFile = useAppStore((s) => s.connectExistingSyncFile)
  const disconnectSyncFile = useAppStore((s) => s.disconnectSyncFile)
  const importState = useAppStore((s) => s.importState)

  const [pendingImport, setPendingImport] = useState<PersistedState | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const supported = isFileSyncSupported()

  async function handleCreateNew() {
    setBusy(true)
    setActionError(null)
    try {
      await connectNewSyncFile()
    } catch (err) {
      if (!isAbortError(err)) setActionError(err instanceof Error ? err.message : 'Could not create the sync file.')
    } finally {
      setBusy(false)
    }
  }

  async function handleConnectExisting() {
    setBusy(true)
    setActionError(null)
    try {
      const { hadExistingData, remoteState } = await connectExistingSyncFile()
      if (hadExistingData && remoteState) setPendingImport(remoteState)
    } catch (err) {
      if (!isAbortError(err)) setActionError(err instanceof Error ? err.message : 'Could not connect that file.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-sm">
      <p className="max-w-md text-xs text-ink-tertiary">
        Connect a JSON file on disk that an MCP server can also read and write — so Claude (via MCP)
        can add or update applications and have them show up here. This tab writes to the file
        immediately on every change, and reads it on an interval plus whenever you switch back to
        this tab, so changes made elsewhere (e.g. by Claude) appear without a manual export/import.
        Chromium-based browsers only (Chrome, Edge, Arc, Brave) — not supported in Firefox or Safari.
      </p>

      {!supported ? (
        <p className="text-xs text-warning">
          Your browser doesn't support the File System Access API, so this feature isn't available here.
        </p>
      ) : syncStatus === 'connected' ? (
        <div className="flex items-center gap-2">
          <span className="rounded-pill border border-success/30 bg-success/10 px-2 py-0.5 text-xs text-success">
            Connected
          </span>
          <span className="text-xs text-ink-muted">{syncFileName}</span>
          <Button size="sm" variant="tertiary" onClick={() => disconnectSyncFile()}>
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" disabled={busy} onClick={handleCreateNew}>
            Create new sync file
          </Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={handleConnectExisting}>
            Connect existing sync file
          </Button>
        </div>
      )}

      {syncError && <p className="text-xs text-danger">{syncError}</p>}
      {actionError && <p className="text-xs text-danger">{actionError}</p>}

      <ConfirmDialog
        open={!!pendingImport}
        title="Import this file's data?"
        description={`This file already contains ${pendingImport?.applications.length ?? 0} application(s). Importing replaces everything currently shown here with the file's contents. The file becomes the source of truth going forward — declining disconnects instead of leaving a half-connected file this tab could later overwrite.`}
        confirmLabel="Import and replace"
        danger
        onCancel={() => {
          setPendingImport(null)
          disconnectSyncFile()
        }}
        onConfirm={() => {
          if (pendingImport) importState(pendingImport)
          setPendingImport(null)
        }}
      />
    </div>
  )
}
