import { WORKSTYLES, type Workstyle } from '../types'
import type { ParsedApplicationFields } from './claudeClient'

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[a-zA-Z.]{2,}/
const PHONE_RE = /(\+?[\d(][\d\-.\s()]{6,}\d)/
const URL_RE = /https?:\/\/[^\s)]+/i
const LOCATION_LABEL_RE = /location\s*[:\-]\s*([^\n]+)/i

const CURRENCY_TOKEN = '(USD|EUR|GBP|JPY|CAD|AUD|NZD|SGD|[$€£¥₹])'
const NUMBER_TOKEN = '([\\d,]+(?:\\.\\d+)?)\\s?(k|K)?'
const SALARY_RANGE_RE = new RegExp(
  `${CURRENCY_TOKEN}\\s?${NUMBER_TOKEN}\\s?(?:[-–—~〜]|to)\\s?(?:${CURRENCY_TOKEN}\\s?)?${NUMBER_TOKEN}`,
)

const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  $: 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  '₹': 'INR',
}

function parseNumberToken(digits: string, kSuffix: string | undefined): number {
  const n = Number(digits.replace(/,/g, ''))
  return kSuffix ? n * 1000 : n
}

function normalizeCurrency(token: string): string {
  return CURRENCY_SYMBOL_MAP[token] ?? token.toUpperCase()
}

function detectWorkstyle(text: string): Workstyle | undefined {
  const lower = text.toLowerCase()
  if (/\bhybrid\b/.test(lower)) return 'hybrid'
  if (/\bremote\b/.test(lower)) return 'remote'
  if (/\b(on-?site|in-?office|in the office)\b/.test(lower)) return 'office'
  return undefined
}

/**
 * Best-effort extraction of the fields that have a reliable, regex-detectable shape — no
 * network call, no API key. Deliberately does NOT attempt company/position/etc.: guessing
 * those from unstructured prose without an LLM produces confidently wrong values, which is
 * worse than leaving the field blank for the user to fill in. The full pasted text goes into
 * notes so nothing found this way is lost.
 */
export function parseJobTextHeuristically(text: string): ParsedApplicationFields {
  const fields: ParsedApplicationFields = { notes: text.trim() }

  const email = text.match(EMAIL_RE)?.[0]
  if (email) fields.recruiterEmail = email

  const phone = text.match(PHONE_RE)?.[0]?.trim()
  if (phone) fields.recruiterPhone = phone

  const url = text.match(URL_RE)?.[0]
  if (url) fields.jobUrl = url

  const location = text.match(LOCATION_LABEL_RE)?.[1]?.trim()
  if (location) fields.location = location

  const workstyle = detectWorkstyle(text)
  if (workstyle && WORKSTYLES.includes(workstyle)) fields.workstyle = workstyle

  const salaryMatch = text.match(SALARY_RANGE_RE)
  if (salaryMatch) {
    const [, curA, numA, kA, curB, numB, kB] = salaryMatch
    const min = parseNumberToken(numA, kA)
    const max = parseNumberToken(numB, kB)
    if (Number.isFinite(min) && Number.isFinite(max) && max >= min) {
      fields.salaryRangeMin = min
      fields.salaryRangeMax = max
    }
    const currency = curA || curB
    if (currency) fields.currency = normalizeCurrency(currency)
  }

  return fields
}
