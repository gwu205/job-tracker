# job-tracker-sync (Cloudflare Worker)

The shared backend both the browser app and `mcp-server/` sync against. Stores the whole
`PersistedState` blob (same shape as `src/types.ts`) under one Cloudflare KV key, gated by a
single bearer token. No user accounts — this is meant for one person's own data, reachable from
any device with the URL + token.

## Endpoints

- `GET /state` — returns the stored state, or a well-formed empty state if nothing's been synced yet.
- `PUT /state` — replaces the stored state. Rejects (`409`) an empty `applications: []` body if the
  currently-stored state is non-empty, unless `?force=true` is passed — this is the guard against
  an empty write silently wiping real data.

Both require `Authorization: Bearer <token>`.

## One-time setup (run these yourself — account-specific, can't be scripted)

```bash
cd worker
npm install

# Opens a browser OAuth flow against your Cloudflare account.
npx wrangler login

# Creates the KV namespace and prints its id.
npx wrangler kv namespace create job-tracker-state
# -> copy the printed id into wrangler.jsonc's kv_namespaces[0].id

# Generate a token yourself, then paste it in when prompted.
openssl rand -hex 32
npx wrangler secret put API_TOKEN

# Local smoke test before a real deploy (binds http://localhost:8787).
npx wrangler dev
```

Once `wrangler dev` looks right (see the `curl` sequence in the main implementation plan / PR
description), deploy for real:

```bash
npx wrangler deploy
```

This prints the live URL, something like `https://job-tracker-sync.<your-subdomain>.workers.dev`.

## After deploying

You'll need that URL + the token you generated in two places:

1. **The app** — Settings → MCP sync → paste both in, click Connect.
2. **The MCP server** — update wherever it's configured (e.g. `~/.claude.json`'s `job-tracker`
   MCP server entry) to pass the URL and token instead of the old file path — see
   `mcp-server/README.md`.

Keep the token itself out of git — it only lives as a Worker secret and in the two places above.
