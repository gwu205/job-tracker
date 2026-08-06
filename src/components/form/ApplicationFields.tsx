import { useMemo } from 'react'
import { SOURCES, SOURCE_LABELS, WORKSTYLES, WORKSTYLE_LABELS } from '../../types'
import { Input, Select, Textarea, Label, FieldGroup } from '../ui/Field'
import { useAppStore } from '../../store/useAppStore'
import { collectFieldSuggestions } from '../../lib/suggestions'
import type { FieldsState } from './fieldsState'

interface ApplicationFieldsProps {
  fields: FieldsState
  onChange: (patch: Partial<FieldsState>) => void
}

const PRIORITY_OPTIONS = [
  { value: 1, label: '1 — Low' },
  { value: 2, label: '2 — Low-mid' },
  { value: 3, label: '3 — Medium' },
  { value: 4, label: '4 — High' },
  { value: 5, label: '5 — Top pick' },
]

function DataList({ id, options }: { id: string; options: string[] }) {
  if (options.length === 0) return null
  return (
    <datalist id={id}>
      {options.map((o) => (
        <option key={o} value={o} />
      ))}
    </datalist>
  )
}

export function ApplicationFields({ fields, onChange }: ApplicationFieldsProps) {
  const applications = useAppStore((s) => s.applications)

  // Distinct prior values per field, offered as native <datalist> suggestions — fields where
  // the same value tends to repeat across applications (company, location, resume version,
  // recruiter contacts, ...). Free-text fields that are naturally unique per application
  // (job URL, notes) are left out.
  const suggestions = useMemo(
    () => ({
      company: collectFieldSuggestions(applications, (a) => a.company),
      position: collectFieldSuggestions(applications, (a) => a.position),
      sourceLabel: collectFieldSuggestions(applications, (a) => a.sourceLabel),
      recruiterName: collectFieldSuggestions(applications, (a) => a.recruiterName),
      recruiterEmail: collectFieldSuggestions(applications, (a) => a.recruiterEmail),
      recruiterPhone: collectFieldSuggestions(applications, (a) => a.recruiterPhone),
      location: collectFieldSuggestions(applications, (a) => a.location),
      currency: collectFieldSuggestions(applications, (a) => a.currency),
      resumeVersion: collectFieldSuggestions(applications, (a) => a.resumeVersion),
      rejectionReason: collectFieldSuggestions(applications, (a) => a.rejectionReason),
    }),
    [applications],
  )

  return (
    <div className="flex flex-col gap-md">
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="f-company">Company *</Label>
          <Input
            id="f-company"
            required
            list="dl-company"
            value={fields.company}
            onChange={(e) => onChange({ company: e.target.value })}
          />
          <DataList id="dl-company" options={suggestions.company} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="f-position">Position *</Label>
          <Input
            id="f-position"
            required
            list="dl-position"
            value={fields.position}
            onChange={(e) => onChange({ position: e.target.value })}
          />
          <DataList id="dl-position" options={suggestions.position} />
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="f-date">Date applied *</Label>
          <Input
            id="f-date"
            type="date"
            required
            value={fields.dateApplied}
            onChange={(e) => onChange({ dateApplied: e.target.value })}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="f-url">Job posting URL</Label>
          <Input
            id="f-url"
            type="url"
            placeholder="https://…"
            value={fields.jobUrl}
            onChange={(e) => onChange({ jobUrl: e.target.value })}
          />
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="f-source">Source</Label>
          <Select id="f-source" value={fields.source} onChange={(e) => onChange({ source: e.target.value as any })}>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s]}
              </option>
            ))}
          </Select>
        </FieldGroup>
        {fields.source === 'other' && (
          <FieldGroup>
            <Label htmlFor="f-source-label">Source detail</Label>
            <Input
              id="f-source-label"
              list="dl-source-label"
              value={fields.sourceLabel}
              onChange={(e) => onChange({ sourceLabel: e.target.value })}
            />
            <DataList id="dl-source-label" options={suggestions.sourceLabel} />
          </FieldGroup>
        )}
      </div>

      <fieldset className="rounded-md border border-hairline p-sm">
        <legend className="px-1 text-xs font-medium text-ink-subtle">Recruiter contact</legend>
        <div className="grid grid-cols-3 gap-3">
          <FieldGroup>
            <Label htmlFor="f-rec-name">Name</Label>
            <Input
              id="f-rec-name"
              list="dl-rec-name"
              value={fields.recruiterName}
              onChange={(e) => onChange({ recruiterName: e.target.value })}
            />
            <DataList id="dl-rec-name" options={suggestions.recruiterName} />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="f-rec-email">Email</Label>
            <Input
              id="f-rec-email"
              type="email"
              list="dl-rec-email"
              value={fields.recruiterEmail}
              onChange={(e) => onChange({ recruiterEmail: e.target.value })}
            />
            <DataList id="dl-rec-email" options={suggestions.recruiterEmail} />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="f-rec-phone">Phone</Label>
            <Input
              id="f-rec-phone"
              type="tel"
              list="dl-rec-phone"
              value={fields.recruiterPhone}
              onChange={(e) => onChange({ recruiterPhone: e.target.value })}
            />
            <DataList id="dl-rec-phone" options={suggestions.recruiterPhone} />
          </FieldGroup>
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="f-workstyle">Workstyle</Label>
          <Select
            id="f-workstyle"
            value={fields.workstyle}
            onChange={(e) => onChange({ workstyle: e.target.value as any })}
          >
            <option value="">Unspecified</option>
            {WORKSTYLES.map((w) => (
              <option key={w} value={w}>
                {WORKSTYLE_LABELS[w]}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="f-location">Location / city</Label>
          <Input
            id="f-location"
            list="dl-location"
            value={fields.location}
            onChange={(e) => onChange({ location: e.target.value })}
          />
          <DataList id="dl-location" options={suggestions.location} />
        </FieldGroup>
      </div>

      <fieldset className="rounded-md border border-hairline p-sm">
        <legend className="px-1 text-xs font-medium text-ink-subtle">Compensation</legend>
        <div className="grid grid-cols-4 gap-3">
          <FieldGroup>
            <Label htmlFor="f-sal-min">Range min</Label>
            <Input
              id="f-sal-min"
              type="number"
              value={fields.salaryRangeMin}
              onChange={(e) => onChange({ salaryRangeMin: e.target.value })}
            />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="f-sal-max">Range max</Label>
            <Input
              id="f-sal-max"
              type="number"
              value={fields.salaryRangeMax}
              onChange={(e) => onChange({ salaryRangeMax: e.target.value })}
            />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="f-sal-offered">Offered</Label>
            <Input
              id="f-sal-offered"
              type="number"
              value={fields.salaryOffered}
              onChange={(e) => onChange({ salaryOffered: e.target.value })}
            />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="f-currency">Currency</Label>
            <Input
              id="f-currency"
              list="dl-currency"
              value={fields.currency}
              onChange={(e) => onChange({ currency: e.target.value })}
            />
            <DataList id="dl-currency" options={suggestions.currency} />
          </FieldGroup>
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="f-priority">Priority / interest</Label>
          <Select
            id="f-priority"
            value={fields.priority}
            onChange={(e) => onChange({ priority: Number(e.target.value) })}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="f-resume">Resume / cover letter version</Label>
          <Input
            id="f-resume"
            list="dl-resume"
            placeholder="e.g. resume_v3_swe"
            value={fields.resumeVersion}
            onChange={(e) => onChange({ resumeVersion: e.target.value })}
          />
          <DataList id="dl-resume" options={suggestions.resumeVersion} />
        </FieldGroup>
      </div>

      <FieldGroup>
        <Label htmlFor="f-tags">Tags (comma separated)</Label>
        <Input
          id="f-tags"
          placeholder="dream job, referral"
          value={fields.tags}
          onChange={(e) => onChange({ tags: e.target.value })}
        />
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor="f-rejection">Rejection reason</Label>
        <Input
          id="f-rejection"
          list="dl-rejection"
          value={fields.rejectionReason}
          onChange={(e) => onChange({ rejectionReason: e.target.value })}
        />
        <DataList id="dl-rejection" options={suggestions.rejectionReason} />
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor="f-notes">Notes</Label>
        <Textarea id="f-notes" rows={4} value={fields.notes} onChange={(e) => onChange({ notes: e.target.value })} />
      </FieldGroup>
    </div>
  )
}
