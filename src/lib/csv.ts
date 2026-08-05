import type { JobApplication } from '../types'
import { STATUS_LABELS, SOURCE_LABELS, WORKSTYLE_LABELS } from '../types'

const COLUMNS = [
  'Company',
  'Position',
  'Status',
  'Source',
  'Recruiter name',
  'Recruiter email',
  'Recruiter phone',
  'Date applied',
  'Workstyle',
  'Location',
  'Salary range min',
  'Salary range max',
  'Salary offered',
  'Currency',
  'Priority',
  'Tags',
  'Job URL',
  'Resume version',
  'Rejection reason',
  'Interview rounds',
  'Notes',
  'Created at',
  'Updated at',
] as const

function escapeCsvValue(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function rowFor(app: JobApplication): string[] {
  return [
    app.company,
    app.position,
    STATUS_LABELS[app.status],
    app.source === 'other' ? app.sourceLabel ?? 'Other' : SOURCE_LABELS[app.source],
    app.recruiterName ?? '',
    app.recruiterEmail ?? '',
    app.recruiterPhone ?? '',
    app.dateApplied,
    app.workstyle ? WORKSTYLE_LABELS[app.workstyle] : '',
    app.location ?? '',
    app.salaryRangeMin?.toString() ?? '',
    app.salaryRangeMax?.toString() ?? '',
    app.salaryOffered?.toString() ?? '',
    app.currency,
    app.priority.toString(),
    app.tags.join('; '),
    app.jobUrl ?? '',
    app.resumeVersion ?? '',
    app.rejectionReason ?? '',
    app.interviewRounds.length.toString(),
    app.notes,
    app.createdAt,
    app.updatedAt,
  ]
}

export function applicationsToCSV(applications: JobApplication[]): string {
  const lines = [COLUMNS.join(',')]
  for (const app of applications) {
    lines.push(rowFor(app).map(escapeCsvValue).join(','))
  }
  return lines.join('\n')
}

export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
