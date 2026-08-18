# job-tracker

A kanban-style job application tracker. Drag applications across stages (Saved → Applied →
Interviewing → Offer, or Declined/Unsuccessful), log interview rounds and status history, and see
funnel/response analytics for a given job-hunting period — all from the browser, with an optional
sync layer that lets an MCP client (e.g. Claude) read and write the same data.

## Core functionality

**Kanban board & tracking**
- Create, edit, and delete applications; drag-and-drop between status columns, or move status via
  a keyboard-accessible control (not drag-only, for accessibility/mobile).
- Every status change is auto-timestamped into that application's status history.
- Interview rounds are logged per application (date, type, interviewer, notes).
- Re-applying to a role you already have an **active** record for warns you and offers to open the
  existing one instead of creating a duplicate. Re-applying to a role that's **Declined**/
  **Unsuccessful** is allowed and auto-links the new record to the prior one ("2nd application to
  this role") — both still count separately in analytics.

**Organizing & finding**
- Search/filter the board by company, source, workstyle, tags, etc.; sort within a view.
- Cards with no status update in N days (configurable) are flagged as "gone quiet."
- A lookback period scopes what counts as the "current" job hunt for analytics, independent of
  when a record was created — so backfilled historical applications can carry real historical
  dates.

**Analytics** ([src/components/analytics](src/components/analytics), [src/lib/analytics.ts](src/lib/analytics.ts))
- Funnel counts (submitted → interviewing → multiple rounds → offer), response rate, time-to-
  first-response, time-in-stage, and a weekly trend chart, each optionally broken down by source
  or workstyle, scoped to the lookback period.

**Data management** ([src/lib/storage.ts](src/lib/storage.ts), [src/lib/csv.ts](src/lib/csv.ts), [src/lib/validateImport.ts](src/lib/validateImport.ts))
- All data lives in `localStorage` under a versioned schema (`CURRENT_SCHEMA_VERSION` in
  [src/types.ts](src/types.ts)), with a migration table for future schema changes.
- Export to CSV, or export/import a full JSON backup. Imports are validated and sanitized field-by-
  field rather than trusted wholesale, so a malformed backup degrades safely instead of crashing
  the app.
- Clear-all-data is a destructive action gated behind a confirmation step.

**AI-assisted entry** ([src/lib/claudeClient.ts](src/lib/claudeClient.ts), [src/components/ai](src/components/ai))
- Paste a job posting/description and have it parsed into structured fields (company, position,
  source, comp range, etc.) via the Claude API, using a user-supplied API key stored locally only.

**MCP sync** ([worker/](worker/), [mcp-server/](mcp-server/), [src/lib/apiSync.ts](src/lib/apiSync.ts))
- Optional: point the app at a small Cloudflare Worker + KV backend, and an MCP client (Claude
  Desktop, Claude Code, …) can list, create, and update applications through a standalone MCP
  server that talks to the same backend. The app picks up changes made elsewhere by polling while
  the tab is visible/focused — see [Architecture](#architecture) below.

## Tech stack

- **App**: React 18 + TypeScript, Vite, Tailwind CSS, Zustand (store), @dnd-kit (drag-and-drop),
  Recharts (analytics charts).
- **Sync backend**: Cloudflare Workers + KV ([worker/](worker/)).
- **MCP server**: standalone Node/TypeScript process using `@modelcontextprotocol/sdk`
  ([mcp-server/](mcp-server/)).

## Getting started

```bash
npm install
npm run dev       # start the Vite dev server
npm run build      # tsc -b type-check, then production build
npm run lint        # eslint
npm run preview      # serve the production build locally
```

The app works standalone with zero setup — data is local to the browser. MCP sync is optional and
requires deploying the Worker and pointing both the app and the MCP server at it; see
[worker/README.md](worker/README.md) and [mcp-server/README.md](mcp-server/README.md).

## Project structure

```
src/
  components/
    board/       kanban board, columns, cards, toolbar
    form/        create/edit application modals, field state, duplicate-warning dialog
    analytics/   funnel/trend/breakdown views
    ai/          Claude-powered paste-to-parse modal + API key settings
    data/        settings page, data import/export/clear, MCP sync settings
    ui/          shared primitives (Button, Modal, Badge, StatusSelect, ...)
  lib/           pure logic: analytics, CSV export, storage + migrations, import validation,
                 sanitization, fuzzy company/position matching, autofill suggestions, API sync
  store/         Zustand store (useAppStore) — single source of truth for app state + actions
  types.ts       data model (JobApplication, Status, PersistedState, ...) and schema version

worker/          Cloudflare Worker + KV backend (optional, for MCP sync)
mcp-server/      standalone MCP server exposing list/get/create/update-status tools
```

## Architecture

The app is client-only by default — a single-page app persisting to `localStorage`, no account or
network dependency required to use it.

MCP sync is a layered addition on top of that: the browser app and the MCP server both read/write
the same `PersistedState` blob (the same shape as `src/types.ts`) via a thin Worker that stores it
as one JSON value in KV, gated by a bearer token. There's no realtime push — the open tab polls the
Worker on an interval while visible and on refocus, and the Worker rejects a write that would
replace non-empty stored data with an empty one (guarding against, e.g., a startup race wiping real
data). This sync layer went through two earlier designs before landing here — see the "Development
process" section below and [issue #13](https://github.com/gwu205/job-tracker/issues/13) for the
still-open idea of replacing polling with a WebSocket/SSE push.

## Development process

This app started from a single spec ([PROMPT.md](PROMPT.md)) — a full user-story-level description
of the data model, statuses, and features — scaffolded in one pass and then built out feature-by-
feature on top of that foundation, each as its own branch + pull request:

1. **Scaffold** — initial data model, kanban board, forms, analytics, storage.
2. **Hardening** — import validation and state sanitization, so malformed/hand-edited JSON
   (backups, or bad writes from elsewhere) can't crash the app.
3. **UX polish** — status color coding, field autofill from prior entries.
4. **MCP integration**, iterated through three designs as trade-offs became clear:
   - *Browser-side file sync* (File System Access API) — worked, but Chromium-only, single-device,
     and needed a fresh permission grant per page load.
   - That surfaced a real incident (an empty sync file silently overwriting a populated board),
     fixed with a guard against empty-state writes clobbering real data.
   - **Cloudflare Worker + KV backend** (current) — replaced the local file with a small hosted
     HTTP API, removing the browser-permission dance and working from any device/browser. The
     empty-write guard was re-implemented server-side as the authoritative version.

Work is tracked as GitHub issues/PRs against this repo; several features (autofill suggestions,
status color-coding, the MCP sync redesigns) shipped as scoped PRs off `feature/*`/`fix/*` branches
reviewed against `main`. A chunk of this implementation, including this README, was written with
[Claude Code](https://claude.com/claude-code) pair-programming against that issue/PR workflow.
