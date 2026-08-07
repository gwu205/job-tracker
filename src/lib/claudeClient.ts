import { SOURCES, WORKSTYLES, type Source, type Workstyle } from '../types'

export interface ParsedApplicationFields {
  company?: string
  position?: string
  source?: Source
  recruiterName?: string
  recruiterEmail?: string
  recruiterPhone?: string
  jobUrl?: string
  workstyle?: Workstyle
  location?: string
  salaryRangeMin?: number
  salaryRangeMax?: number
  currency?: string
  notes?: string
}

const CLAUDE_MODEL = 'claude-sonnet-5'

export async function parseJobTextWithClaude(apiKey: string, text: string): Promise<ParsedApplicationFields> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      tools: [
        {
          name: 'extract_job_application',
          description:
            'Extract structured job application details from pasted freetext such as a job posting, a forwarded recruiter email, or a LinkedIn message.',
          input_schema: {
            type: 'object',
            properties: {
              company: { type: 'string' },
              position: { type: 'string' },
              source: { type: 'string', enum: [...SOURCES] },
              recruiterName: { type: 'string' },
              recruiterEmail: { type: 'string' },
              recruiterPhone: { type: 'string' },
              jobUrl: { type: 'string' },
              workstyle: { type: 'string', enum: [...WORKSTYLES] },
              location: { type: 'string' },
              salaryRangeMin: { type: 'number' },
              salaryRangeMax: { type: 'number' },
              currency: {
                type: 'string',
                description: 'ISO currency code (e.g. USD, EUR, JPY) if a salary or compensation figure is mentioned.',
              },
              notes: {
                type: 'string',
                description: 'A short freetext summary of anything relevant not captured in the other fields.',
              },
            },
            required: ['company', 'position'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'extract_job_application' },
      messages: [
        {
          role: 'user',
          content: `Extract job application details from the following pasted text. Only include fields you can confidently infer from the text; omit fields you're unsure about rather than guessing.\n\n---\n${text}\n---`,
        },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Claude API error (${res.status}). ${body.slice(0, 300)}`)
  }

  const data = await res.json()
  const toolUse = (data.content ?? []).find((c: any) => c.type === 'tool_use')
  if (!toolUse) throw new Error('Claude did not return structured data — try rephrasing or pasting more context.')

  const input = toolUse.input as ParsedApplicationFields
  if (input.source && !SOURCES.includes(input.source)) delete input.source
  if (input.workstyle && !WORKSTYLES.includes(input.workstyle)) delete input.workstyle
  return input
}
