import { CURRENT_SCHEMA_VERSION, DEFAULT_SETTINGS, type PersistedState } from '../../src/types'

export interface Env {
  job_tracker_state: KVNamespace
  API_TOKEN: string
}

const STATE_KEY = 'state'

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

/** Not a cryptographically rigorous constant-time compare, but avoids the cheapest short-circuit timing tells for a single-user personal token — proportionate to the threat model here. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

function isAuthorized(request: Request, env: Env): boolean {
  const header = request.headers.get('Authorization') ?? ''
  return safeEqual(header, `Bearer ${env.API_TOKEN}`)
}

function emptyState(): PersistedState {
  return { schemaVersion: CURRENT_SCHEMA_VERSION, applications: [], settings: { ...DEFAULT_SETTINGS } }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Preflight requests never carry the Authorization header — must be answered before auth.
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() })
    }

    if (url.pathname !== '/state') {
      return json({ error: 'not_found' }, 404)
    }

    if (!isAuthorized(request, env)) {
      return json({ error: 'unauthorized' }, 401)
    }

    if (request.method === 'GET') {
      const raw = await env.job_tracker_state.get(STATE_KEY)
      if (raw === null) {
        // Never synced yet — a normal first-run state, not an error.
        return json(emptyState(), 200)
      }
      return new Response(raw, { status: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
    }

    if (request.method === 'PUT') {
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return json({ error: 'invalid_json', message: 'Request body is not valid JSON.' }, 400)
      }

      if (typeof body !== 'object' || body === null || !Array.isArray((body as PersistedState).applications)) {
        return json({ error: 'malformed_state', message: 'Body must be an object with an "applications" array.' }, 400)
      }

      const incoming = body as PersistedState
      const force = url.searchParams.get('force') === 'true'

      if (!force && incoming.applications.length === 0) {
        const existingRaw = await env.job_tracker_state.get(STATE_KEY)
        const existing = existingRaw ? (JSON.parse(existingRaw) as PersistedState) : null
        if (existing && Array.isArray(existing.applications) && existing.applications.length > 0) {
          return json(
            {
              error: 'empty_overwrite_rejected',
              message: 'Refusing to overwrite non-empty stored state with an empty applications array. Pass ?force=true to override.',
            },
            409,
          )
        }
      }

      await env.job_tracker_state.put(STATE_KEY, JSON.stringify(incoming))
      return json({ ok: true }, 200)
    }

    return json({ error: 'method_not_allowed' }, 405)
  },
} satisfies ExportedHandler<Env>
