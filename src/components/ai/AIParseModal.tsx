import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Textarea, Input, Label, FieldGroup } from '../ui/Field'
import { useAppStore } from '../../store/useAppStore'
import { parseJobTextWithClaude, type ParsedApplicationFields } from '../../lib/claudeClient'
import { parseJobTextHeuristically } from '../../lib/heuristicParse'

interface AIParseModalProps {
  open: boolean
  onClose: () => void
  onParsed: (fields: ParsedApplicationFields) => void
  onGoToSettings: () => void
}

export function AIParseModal({ open, onClose, onParsed, onGoToSettings }: AIParseModalProps) {
  const apiKey = useAppStore((s) => s.settings.claudeApiKey)
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  function finishWith(fields: ParsedApplicationFields) {
    // A URL typed here is more reliable than whatever a parser may have spotted in the pasted
    // text, so it wins if both are present.
    onParsed({ ...fields, jobUrl: url.trim() || fields.jobUrl })
    setUrl('')
    setText('')
  }

  function handleQuickParse() {
    if (!text.trim()) return
    setError(null)
    finishWith(parseJobTextHeuristically(text))
  }

  async function handleAIParse() {
    if (!apiKey || !text.trim()) return
    setLoading(true)
    setError(null)
    try {
      const fields = await parseJobTextWithClaude(apiKey, text)
      finishWith(fields)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong parsing that text.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add from pasted text"
      size="md"
      footer={
        <>
          <Button variant="tertiary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleQuickParse} disabled={!text.trim() || loading}>
            Quick parse (no AI)
          </Button>
          <Button variant="primary" onClick={handleAIParse} disabled={!apiKey || !text.trim() || loading}>
            {loading ? 'Parsing…' : 'Parse with AI'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs text-ink-tertiary">
          Paste a job posting, a forwarded recruiter email, or a LinkedIn message, then either quick-parse it locally
          (pulls out email, phone, salary range, workstyle — no account or API key needed) or send it to Claude for
          fuller extraction (company, position, and more). Either way you'll review and confirm before anything is
          saved.
        </p>

        <FieldGroup>
          <Label htmlFor="ai-url">Job posting URL (optional)</Label>
          <Input
            id="ai-url"
            type="url"
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoFocus
          />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor="ai-text">Pasted text</Label>
          <p className="mb-1 text-xs text-ink-tertiary">
            We can't fetch a URL's content directly from the browser (job sites block that), so paste the posting's
            text below — open the link, select all, copy, paste.
          </p>
          <Textarea
            id="ai-text"
            rows={9}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste freetext here…"
          />
        </FieldGroup>

        {!apiKey && (
          <p className="text-xs text-ink-tertiary">
            No Claude API key set — "Quick parse" still works without one.{' '}
            <button type="button" onClick={onGoToSettings} className="text-primary underline underline-offset-2">
              Add a key in Settings
            </button>{' '}
            for fuller AI extraction.
          </p>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </Modal>
  )
}
