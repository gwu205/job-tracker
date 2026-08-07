# job-tracker MCP server

A local [MCP](https://modelcontextprotocol.io) server that lets an MCP client (Claude Desktop, Claude Code, ...) read and write your job applications directly, by reading/writing the same JSON file the app itself syncs with (Settings → MCP sync in the app).

It does **not** talk to the app over a network — there is no live push. The app picks up file changes on an interval and when its tab regains focus (see the app's `src/lib/fileSync.ts`); this server just reads/writes the same file directly with Node's `fs`.

## Setup

1. In the app, go to **Settings → MCP sync** and either "Create new sync file" or "Connect existing sync file." Note the file's path.
2. From this directory, install dependencies:
   ```bash
   npm install
   ```
3. Point your MCP client at this server, passing the same file path.

### Claude Code

```bash
claude mcp add job-tracker -- npx tsx /absolute/path/to/job-tracker/mcp-server/index.ts /absolute/path/to/job-tracker-sync.json
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "job-tracker": {
      "command": "npx",
      "args": [
        "tsx",
        "/absolute/path/to/job-tracker/mcp-server/index.ts",
        "/absolute/path/to/job-tracker-sync.json"
      ]
    }
  }
}
```

The sync file path can also be passed via the `JOB_TRACKER_SYNC_FILE` environment variable instead of as an argument — useful if your MCP client config supports `env` more easily than `args`.

If the file doesn't exist yet, the server creates it empty on first run — you don't strictly need to connect it from the app first, but the app won't pick up anything the server wrote until *you* connect that same path from Settings.

## Tools

| Tool | Purpose |
|---|---|
| `list_applications` | List applications, optionally filtered by `status` and/or `company` (substring). |
| `get_application` | Full detail (status history, interview rounds, notes) for one application, by `id` or `company`+`position`. |
| `create_application` | Add a new application. Refuses if an active (non-declined/archived) application already exists for the same company + position unless `force: true` — same duplicate-prevention story as the app's own create form. A matching declined/archived application is auto-linked as a re-application instead. |
| `update_application_status` | Change status, appending a timestamped status-history entry — same as changing it on the board. |

Not yet exposed via MCP (contributions welcome): editing scalar fields after creation, interview-round management, deleting an application, status-history backfill/edits. `list_applications`/`get_application` cover reading everything the UI can show; writing is currently limited to create + status change, which covers the "paste a link, get it tracked" flow this was built for.

## Notes

- This server and the browser app both treat the sync file as an untrusted boundary — content is run through the same sanitizer (`sanitizeApplications`) either side reads it, so a malformed or hand-edited file degrades safely (missing/invalid fields get coerced to safe defaults) rather than crashing either side.
- Concurrent writes from the app and this server are not locked/merged — for the personal, single-user scale this is built for, the risk of the two racing on the exact same instant is low, and worst case is one write briefly overwriting another's un-synced change (the losing side's poll cycle will pick the winner back up).
- Company/position matching for duplicate detection and `update_application_status`/`get_application` lookups by name uses the same fuzzy (case-insensitive, typo-tolerant) matching the app uses for its own duplicate warnings.
