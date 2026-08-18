# job-tracker MCP server

A local [MCP](https://modelcontextprotocol.io) server that lets an MCP client (Claude Desktop, Claude Code, ...) read and write your job applications through the same Cloudflare Worker the app itself syncs with (Settings → MCP sync in the app).

It talks to that Worker over plain HTTPS — `GET`/`PUT /state`, bearer-token authenticated — so it works from wherever you run it, not just alongside the app. The app picks up changes on an interval and when its tab regains focus (see `src/lib/apiSync.ts`); this server just calls the same endpoints directly.

## Setup

1. Deploy the Worker first — see `../worker/README.md`. You'll end up with a URL (e.g. `https://job-tracker-sync.<subdomain>.workers.dev`) and a token.
2. From this directory, install dependencies:
   ```bash
   npm install
   ```
3. Point your MCP client at this server, passing that URL and token.

### Claude Code

```bash
claude mcp add job-tracker -- npx tsx /absolute/path/to/job-tracker/mcp-server/index.ts https://job-tracker-sync.<subdomain>.workers.dev <token>
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
        "https://job-tracker-sync.<subdomain>.workers.dev",
        "<token>"
      ]
    }
  }
}
```

The URL and token can also be passed via the `JOB_TRACKER_API_URL`/`JOB_TRACKER_API_TOKEN` environment variables instead of as arguments — useful if your MCP client config supports `env` more easily than `args`.

## Tools

| Tool | Purpose |
|---|---|
| `list_applications` | List applications, optionally filtered by `status` and/or `company` (substring). |
| `get_application` | Full detail (status history, interview rounds, notes) for one application, by `id` or `company`+`position`. |
| `create_application` | Add a new application. Refuses if an active (non-declined/archived) application already exists for the same company + position unless `force: true` — same duplicate-prevention story as the app's own create form. A matching declined/archived application is auto-linked as a re-application instead. |
| `update_application_status` | Change status, appending a timestamped status-history entry — same as changing it on the board. |

Not yet exposed via MCP (contributions welcome): editing scalar fields after creation, interview-round management, deleting an application, status-history backfill/edits. `list_applications`/`get_application` cover reading everything the UI can show; writing is currently limited to create + status change, which covers the "paste a link, get it tracked" flow this was built for.

## Notes

- This server and the browser app both treat the Worker's response as an untrusted boundary — content is run through the same sanitizer (`sanitizeApplications`) either side reads it, so a malformed state degrades safely (missing/invalid fields get coerced to safe defaults) rather than crashing either side.
- The Worker itself refuses (`409`) a write that would replace non-empty stored data with an empty `applications` array — this server surfaces that as a clear error rather than silently forcing it, since none of these tools should ever legitimately produce an empty write.
- Concurrent writes from the app and this server are not locked/merged — for the personal, single-user scale this is built for, the risk of the two racing on the exact same instant is low, and worst case is one write briefly overwriting another's un-synced change (the losing side's next poll picks the winner back up).
- Company/position matching for duplicate detection and `update_application_status`/`get_application` lookups by name uses the same fuzzy (case-insensitive, typo-tolerant) matching the app uses for its own duplicate warnings.
