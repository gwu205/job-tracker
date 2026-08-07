#!/usr/bin/env -S npx tsx
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

import {
  ACTIVE_STATUSES,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_SETTINGS,
  INACTIVE_STATUSES,
  SOURCES,
  STATUSES,
  WORKSTYLES,
  type JobApplication,
  type PersistedState,
} from '../src/types.js'
import { sanitizeApplications } from '../src/lib/sanitizeState.js'
import { isFuzzyMatch } from '../src/lib/fuzzyMatch.js'

const filePath = process.argv[2] ?? process.env.JOB_TRACKER_SYNC_FILE
if (!filePath) {
  console.error(
    'Usage: tsx index.ts <path-to-sync-file.json>\n' +
      '(or set the JOB_TRACKER_SYNC_FILE environment variable)\n\n' +
      'The path should match the file connected in the app\'s Settings → MCP sync section.',
  )
  process.exit(1)
}

function emptyState(): PersistedState {
  return { schemaVersion: CURRENT_SCHEMA_VERSION, applications: [], settings: { ...DEFAULT_SETTINGS } }
}

async function readState(): Promise<PersistedState> {
  if (!existsSync(filePath)) {
    const state = emptyState()
    await writeState(state)
    return state
  }
  const text = await readFile(filePath, 'utf-8')
  if (!text.trim()) return emptyState()
  const parsed = JSON.parse(text)
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    applications: sanitizeApplications(parsed.applications),
    settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
  }
}

async function writeState(state: PersistedState): Promise<void> {
  await writeFile(filePath, JSON.stringify(state, null, 2), 'utf-8')
}

function summarize(app: JobApplication) {
  return {
    id: app.id,
    company: app.company,
    position: app.position,
    status: app.status,
    dateApplied: app.dateApplied,
    source: app.source,
    workstyle: app.workstyle,
    location: app.location,
    jobUrl: app.jobUrl,
    priority: app.priority,
    tags: app.tags,
    updatedAt: app.updatedAt,
  }
}

function textResult(value: unknown) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  return { content: [{ type: 'text' as const, text }] }
}

function resolveApplication(
  state: PersistedState,
  { id, company, position }: { id?: string; company?: string; position?: string },
): JobApplication | { error: string } {
  if (id) {
    const found = state.applications.find((a) => a.id === id)
    return found ?? { error: `No application found with id "${id}".` }
  }
  if (company && position) {
    const matches = state.applications.filter((a) => isFuzzyMatch(a.company, company) && isFuzzyMatch(a.position, position))
    if (matches.length === 1) return matches[0]
    if (matches.length === 0) return { error: `No application found matching "${position}" at "${company}".` }
    return {
      error: `${matches.length} applications match "${position}" at "${company}" — pass an id instead. Matches: ${matches
        .map((a) => `${a.id} (${a.status}, applied ${a.dateApplied})`)
        .join(', ')}`,
    }
  }
  return { error: 'Provide either an id, or both company and position.' }
}

const server = new McpServer({ name: 'job-tracker', version: '0.1.0' })

server.registerTool(
  'list_applications',
  {
    title: 'List job applications',
    description: 'List tracked job applications, optionally filtered by status and/or company (substring match).',
    inputSchema: {
      status: z.enum(STATUSES).optional().describe('Filter to this status only.'),
      company: z.string().optional().describe('Case-insensitive substring match against company name.'),
    },
  },
  async ({ status, company }) => {
    const state = await readState()
    let results = state.applications
    if (status) results = results.filter((a) => a.status === status)
    if (company) results = results.filter((a) => a.company.toLowerCase().includes(company.toLowerCase()))
    results = [...results].sort((a, b) => b.dateApplied.localeCompare(a.dateApplied))
    return textResult({ count: results.length, applications: results.map(summarize) })
  },
)

server.registerTool(
  'get_application',
  {
    title: 'Get a single job application',
    description:
      'Fetch full detail (status history, interview rounds, notes, etc.) for one application, by id or by company + position.',
    inputSchema: {
      id: z.string().optional(),
      company: z.string().optional(),
      position: z.string().optional(),
    },
  },
  async ({ id, company, position }) => {
    const state = await readState()
    const result = resolveApplication(state, { id, company, position })
    return textResult(result)
  },
)

server.registerTool(
  'create_application',
  {
    title: 'Create a job application',
    description:
      "Add a new tracked job application — e.g. after reading a job posting URL yourself and extracting its details. " +
      'Checks for an existing active (non-declined/archived) application at the same company + position first and ' +
      'refuses unless force is set, to avoid accidental duplicates; a prior declined/archived application for the same ' +
      'role is instead auto-linked as a re-application, matching how the app itself handles this.',
    inputSchema: {
      company: z.string().min(1),
      position: z.string().min(1),
      dateApplied: z.string().min(1).describe('ISO date, e.g. "2026-08-06".'),
      status: z.enum(STATUSES).default('applied').describe('Defaults to "applied" — this tool is for jobs you already applied to.'),
      source: z.enum(SOURCES).default('other'),
      jobUrl: z.string().optional(),
      location: z.string().optional(),
      workstyle: z.enum(WORKSTYLES).optional(),
      salaryRangeMin: z.number().optional(),
      salaryRangeMax: z.number().optional(),
      currency: z.string().optional(),
      recruiterName: z.string().optional(),
      recruiterEmail: z.string().optional(),
      recruiterPhone: z.string().optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
      priority: z.number().min(1).max(5).optional(),
      force: z.boolean().default(false).describe('Create even if an active duplicate already exists.'),
    },
  },
  async (input) => {
    const state = await readState()

    const activeDuplicate = state.applications.find(
      (a) => ACTIVE_STATUSES.includes(a.status) && isFuzzyMatch(a.company, input.company) && isFuzzyMatch(a.position, input.position),
    )
    if (activeDuplicate && !input.force) {
      return textResult({
        error: 'active_duplicate',
        message: `An active application for "${input.position}" at "${input.company}" already exists (status: ${activeDuplicate.status}, id: ${activeDuplicate.id}). Call update_application_status on it instead, or retry create_application with force: true to add a separate entry anyway.`,
        existing: summarize(activeDuplicate),
      })
    }

    const linkTarget = state.applications
      .filter(
        (a) => INACTIVE_STATUSES.includes(a.status) && isFuzzyMatch(a.company, input.company) && isFuzzyMatch(a.position, input.position),
      )
      .sort((a, b) => b.dateApplied.localeCompare(a.dateApplied))[0]

    const now = new Date().toISOString()
    const app: JobApplication = {
      id: randomUUID(),
      roleGroupId: linkTarget?.roleGroupId ?? randomUUID(),
      reapplicationOfId: linkTarget?.id,
      company: input.company,
      position: input.position,
      source: input.source,
      recruiterName: input.recruiterName,
      recruiterEmail: input.recruiterEmail,
      recruiterPhone: input.recruiterPhone,
      dateApplied: input.dateApplied,
      status: input.status,
      statusHistory: [{ id: randomUUID(), status: input.status, timestamp: now }],
      interviewRounds: [],
      notes: input.notes ?? '',
      jobUrl: input.jobUrl,
      workstyle: input.workstyle,
      location: input.location,
      salaryRangeMin: input.salaryRangeMin,
      salaryRangeMax: input.salaryRangeMax,
      currency: input.currency ?? 'USD',
      priority: input.priority ?? 3,
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
    }

    await writeState({ ...state, applications: [...state.applications, app] })
    return textResult({
      created: summarize(app),
      linkedToReapplicationOf: linkTarget ? summarize(linkTarget) : undefined,
    })
  },
)

server.registerTool(
  'update_application_status',
  {
    title: 'Update a job application\'s status',
    description: 'Change an application\'s status, appending a timestamped status-history entry — same as changing it on the board.',
    inputSchema: {
      id: z.string().optional(),
      company: z.string().optional(),
      position: z.string().optional(),
      status: z.enum(STATUSES),
      note: z.string().optional(),
    },
  },
  async ({ id, company, position, status, note }) => {
    const state = await readState()
    const resolved = resolveApplication(state, { id, company, position })
    if ('error' in resolved) return textResult(resolved)

    const now = new Date().toISOString()
    const updated: JobApplication = {
      ...resolved,
      status,
      statusHistory: [...resolved.statusHistory, { id: randomUUID(), status, timestamp: now, note }].sort((a, b) =>
        a.timestamp.localeCompare(b.timestamp),
      ),
      updatedAt: now,
    }

    await writeState({
      ...state,
      applications: state.applications.map((a) => (a.id === updated.id ? updated : a)),
    })
    return textResult({ updated: summarize(updated) })
  },
)

const transport = new StdioServerTransport()
await server.connect(transport)
console.error(`job-tracker MCP server running on stdio, syncing ${filePath}`)
