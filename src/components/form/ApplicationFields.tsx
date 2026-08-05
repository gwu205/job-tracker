import { SOURCES, SOURCE_LABELS, WORKSTYLES, WORKSTYLE_LABELS } from '../../types'
import { Input, Select, Textarea, Label, FieldGroup } from '../ui/Field'
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

export function ApplicationFields({ fields, onChange }: ApplicationFieldsProps) {
  return (
    <div className="flex flex-col gap-md">
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="f-company">Company *</Label>
          <Input id="f-company" required value={fields.company} onChange={(e) => onChange({ company: e.target.value })} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="f-position">Position *</Label>
          <Input id="f-position" required value={fields.position} onChange={(e) => onChange({ position: e.target.value })} />
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
              value={fields.sourceLabel}
              onChange={(e) => onChange({ sourceLabel: e.target.value })}
            />
          </FieldGroup>
        )}
      </div>

      <fieldset className="rounded-md border border-hairline p-sm">
        <legend className="px-1 text-xs font-medium text-ink-subtle">Recruiter contact</legend>
        <div className="grid grid-cols-3 gap-3">
          <FieldGroup>
            <Label htmlFor="f-rec-name">Name</Label>
            <Input id="f-rec-name" value={fields.recruiterName} onChange={(e) => onChange({ recruiterName: e.target.value })} />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="f-rec-email">Email</Label>
            <Input
              id="f-rec-email"
              type="email"
              value={fields.recruiterEmail}
              onChange={(e) => onChange({ recruiterEmail: e.target.value })}
            />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="f-rec-phone">Phone</Label>
            <Input
              id="f-rec-phone"
              type="tel"
              value={fields.recruiterPhone}
              onChange={(e) => onChange({ recruiterPhone: e.target.value })}
            />
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
          <Input id="f-location" value={fields.location} onChange={(e) => onChange({ location: e.target.value })} />
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
            <Input id="f-currency" value={fields.currency} onChange={(e) => onChange({ currency: e.target.value })} />
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
            placeholder="e.g. resume_v3_swe"
            value={fields.resumeVersion}
            onChange={(e) => onChange({ resumeVersion: e.target.value })}
          />
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
          value={fields.rejectionReason}
          onChange={(e) => onChange({ rejectionReason: e.target.value })}
        />
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor="f-notes">Notes</Label>
        <Textarea id="f-notes" rows={4} value={fields.notes} onChange={(e) => onChange({ notes: e.target.value })} />
      </FieldGroup>
    </div>
  )
}
