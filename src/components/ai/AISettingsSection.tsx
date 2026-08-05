import { useState } from 'react'
import { Input, Label, FieldGroup } from '../ui/Field'
import { Button } from '../ui/Button'
import { useAppStore } from '../../store/useAppStore'

export function AISettingsSection() {
  const apiKey = useAppStore((s) => s.settings.claudeApiKey)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const [draft, setDraft] = useState(apiKey ?? '')
  const [reveal, setReveal] = useState(false)

  const dirty = draft !== (apiKey ?? '')

  return (
    <div className="flex flex-col gap-sm">
      <p className="max-w-md text-xs text-ink-tertiary">
        Paste a Claude API key to enable AI-assisted entry (parsing pasted job postings, recruiter emails, or LinkedIn
        messages into a pre-filled form). The key is stored only in this browser's local storage and sent directly
        from your browser to Anthropic's API — it never touches a backend of ours, because there isn't one. No OAuth,
        no third-party account connections.
      </p>
      <FieldGroup className="max-w-sm">
        <Label htmlFor="claude-key">Claude API key</Label>
        <div className="flex gap-2">
          <Input
            id="claude-key"
            type={reveal ? 'text' : 'password'}
            placeholder="sk-ant-…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoComplete="off"
          />
          <Button type="button" variant="tertiary" onClick={() => setReveal((r) => !r)}>
            {reveal ? 'Hide' : 'Show'}
          </Button>
        </div>
      </FieldGroup>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="primary"
          disabled={!dirty}
          onClick={() => updateSettings({ claudeApiKey: draft.trim() || null })}
        >
          Save key
        </Button>
        {apiKey && (
          <Button
            type="button"
            variant="tertiary"
            onClick={() => {
              updateSettings({ claudeApiKey: null })
              setDraft('')
            }}
          >
            Remove key
          </Button>
        )}
      </div>
    </div>
  )
}
