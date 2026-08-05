import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Field'
import { useAppStore } from '../../store/useAppStore'
import { parseJobTextWithClaude, type ParsedApplicationFields } from '../../lib/claudeClient'

interface AIParseModalProps {
  open: boolean
  onClose: () => void
  onParsed: (fields: ParsedApplicationFields) => void
  onGoToSettings: () => void
}

export function AIParseModal({ open, onClose, onParsed, onGoToSettings }: AIParseModalProps) {
  const apiKey = useAppStore((s) => s.settings.claudeApiKey)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function handleParse() {
    if (!apiKey || !text.trim()) return
    setLoading(true)
    setError(null)
    try {
      const fields = await parseJobTextWithClaude(apiKey, text)
      onParsed(fields)
      setText('')
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
      title="Add via AI paste"
      size="md"
      footer={
        <>
          <Button variant="tertiary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleParse} disabled={!apiKey || !text.trim() || loading}>
            {loading ? 'Parsing…' : 'Parse with AI'}
          </Button>
        </>
      }
    >
      {!apiKey ? (
        <div className="rounded-md border border-hairline bg-surface-2 p-sm text-sm text-ink-muted">
          Add a Claude API key in Settings to use this feature.
          <div className="mt-2">
            <Button size="sm" variant="secondary" onClick={onGoToSettings}>
              Go to Settings
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink-tertiary">
            Paste a job posting, a forwarded recruiter email, or a LinkedIn message. Claude will pull out what it can
            into a pre-filled form — you'll review and confirm before anything is saved.
          </p>
          <Textarea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste freetext here…"
            autoFocus
          />
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      )}
    </Modal>
  )
}
