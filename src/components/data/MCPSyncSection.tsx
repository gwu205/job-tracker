import { useState } from 'react'
import { Input, Label, FieldGroup } from '../ui/Field'
import { Button } from '../ui/Button'
import { useAppStore } from '../../store/useAppStore'

export function MCPSyncSection() {
  const apiSyncUrl = useAppStore((s) => s.apiSyncUrl)
  const syncStatus = useAppStore((s) => s.syncStatus)
  const syncError = useAppStore((s) => s.syncError)
  const connectApiSync = useAppStore((s) => s.connectApiSync)
  const disconnectApiSync = useAppStore((s) => s.disconnectApiSync)

  const [urlDraft, setUrlDraft] = useState('')
  const [tokenDraft, setTokenDraft] = useState('')
  const [reveal, setReveal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleConnect() {
    setBusy(true)
    setActionError(null)
    try {
      await connectApiSync({ url: urlDraft.trim().replace(/\/$/, ''), token: tokenDraft.trim() })
      setTokenDraft('')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not connect.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-sm">
      <p className="max-w-md text-xs text-ink-tertiary">
        Connect the small backend an MCP server can also read and write — so Claude (via MCP) can add or update
        applications and have them show up here, from any device or browser. This tab writes to it immediately on
        every change, and reads it on an interval plus whenever you switch back to this tab, so changes made
        elsewhere (e.g. by Claude) appear without a manual export/import.
      </p>

      {syncStatus === 'connected' ? (
        <div className="flex items-center gap-2">
          <span className="rounded-pill border border-success/30 bg-success/10 px-2 py-0.5 text-xs text-success">
            Connected
          </span>
          <span className="text-xs text-ink-muted">{apiSyncUrl}</span>
          <Button size="sm" variant="tertiary" onClick={() => disconnectApiSync()}>
            Disconnect
          </Button>
        </div>
      ) : syncStatus === 'unauthorized' ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-pill border border-danger/30 bg-danger/10 px-2 py-0.5 text-xs text-danger">
              Unauthorized
            </span>
            <span className="text-xs text-ink-muted">{apiSyncUrl}</span>
            <Button size="sm" variant="tertiary" onClick={() => disconnectApiSync()}>
              Disconnect
            </Button>
          </div>
          <p className="text-xs text-danger">
            The token was rejected by the server — check it matches what you set with{' '}
            <code>wrangler secret put API_TOKEN</code>, then reconnect below.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-sm">
          <FieldGroup className="max-w-sm">
            <Label htmlFor="api-url">Worker URL</Label>
            <Input
              id="api-url"
              type="text"
              placeholder="https://job-tracker-sync.<you>.workers.dev"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              autoComplete="off"
            />
          </FieldGroup>
          <FieldGroup className="max-w-sm">
            <Label htmlFor="api-token">Token</Label>
            <div className="flex gap-2">
              <Input
                id="api-token"
                type={reveal ? 'text' : 'password'}
                placeholder="paste token"
                value={tokenDraft}
                onChange={(e) => setTokenDraft(e.target.value)}
                autoComplete="off"
              />
              <Button type="button" variant="tertiary" onClick={() => setReveal((r) => !r)}>
                {reveal ? 'Hide' : 'Show'}
              </Button>
            </div>
          </FieldGroup>
          <div className="flex gap-2">
            <Button type="button" variant="primary" disabled={busy || !urlDraft || !tokenDraft} onClick={handleConnect}>
              Connect
            </Button>
          </div>
        </div>
      )}

      {syncError && <p className="text-xs text-danger">{syncError}</p>}
      {actionError && <p className="text-xs text-danger">{actionError}</p>}
    </div>
  )
}
