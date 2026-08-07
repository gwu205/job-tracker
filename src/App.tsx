import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { useAppStore } from './store/useAppStore'
import { KanbanBoard } from './components/board/KanbanBoard'
import { BoardToolbar } from './components/board/BoardToolbar'
import { AnalyticsPage } from './components/analytics/AnalyticsPage'
import { SettingsPage } from './components/data/SettingsPage'
import { CreateApplicationModal } from './components/form/CreateApplicationModal'
import { EditApplicationModal } from './components/form/EditApplicationModal'
import { AIParseModal } from './components/ai/AIParseModal'
import { Button } from './components/ui/Button'
import { applyFilters, collectTags, defaultFilterState, type FilterState } from './lib/filterSort'
import { fieldsFromParsed, type FieldsState } from './components/form/fieldsState'
import type { ParsedApplicationFields } from './lib/claudeClient'

type View = 'board' | 'analytics' | 'settings'

const TABS: { id: View; label: string }[] = [
  { id: 'board', label: 'Board' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
]

const SYNC_POLL_INTERVAL_MS = 8000

function App() {
  const applications = useAppStore((s) => s.applications)
  const syncStatus = useAppStore((s) => s.syncStatus)
  const initFileSync = useAppStore((s) => s.initFileSync)
  const pollSyncFile = useAppStore((s) => s.pollSyncFile)

  const [view, setView] = useState<View>('board')
  const [filters, setFilters] = useState<FilterState>(defaultFilterState())
  const [createOpen, setCreateOpen] = useState(false)
  const [createPrefill, setCreatePrefill] = useState<Partial<FieldsState> | undefined>(undefined)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [aiOpen, setAiOpen] = useState(false)

  const filteredApps = useMemo(() => applyFilters(applications, filters), [applications, filters])
  const availableTags = useMemo(() => collectTags(applications), [applications])

  // Reconnect a previously-chosen sync file (if any) once on load.
  useEffect(() => {
    initFileSync()
  }, [initFileSync])

  // While connected, pick up changes written elsewhere (e.g. by an MCP server) on an interval and
  // whenever the tab regains focus — there's no native "watch this file" event to hook instead.
  useEffect(() => {
    if (syncStatus !== 'connected') return
    const poll = () => pollSyncFile()
    const interval = setInterval(poll, SYNC_POLL_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') poll()
    }
    window.addEventListener('focus', poll)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', poll)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [syncStatus, pollSyncFile])

  function openCreate(prefill?: Partial<FieldsState>) {
    setCreatePrefill(prefill)
    setCreateOpen(true)
  }

  function closeCreate() {
    setCreateOpen(false)
    setCreatePrefill(undefined)
  }

  function handleAIParsed(parsed: ParsedApplicationFields) {
    setAiOpen(false)
    openCreate(fieldsFromParsed(parsed))
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-4 border-b border-hairline px-lg py-sm">
        <h1 className="font-display text-sm font-semibold text-ink">Job Tracker</h1>
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={clsx(
                'rounded-md px-sm py-1 text-sm font-medium transition-colors',
                view === tab.id ? 'bg-surface-2 text-ink' : 'text-ink-subtle hover:text-ink',
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" onClick={() => setAiOpen(true)}>
            Add via AI
          </Button>
          <Button variant="primary" onClick={() => openCreate()}>
            + New application
          </Button>
        </div>
      </header>

      {view === 'board' && (
        <div className="flex min-h-0 flex-1 flex-col">
          <BoardToolbar
            filters={filters}
            onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
            availableTags={availableTags}
            resultCount={filteredApps.length}
            totalCount={applications.length}
          />
          <div className="min-h-0 flex-1">
            <KanbanBoard applications={filteredApps} onOpenApplication={setEditingId} />
          </div>
        </div>
      )}

      {view === 'analytics' && <AnalyticsPage />}
      {view === 'settings' && <SettingsPage />}

      <CreateApplicationModal
        open={createOpen}
        onClose={closeCreate}
        onCreated={() => {}}
        onOpenApplication={setEditingId}
        prefill={createPrefill}
      />
      <EditApplicationModal applicationId={editingId} onClose={() => setEditingId(null)} onOpenApplication={setEditingId} />
      <AIParseModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onParsed={handleAIParsed}
        onGoToSettings={() => {
          setAiOpen(false)
          setView('settings')
        }}
      />
    </div>
  )
}

export default App
