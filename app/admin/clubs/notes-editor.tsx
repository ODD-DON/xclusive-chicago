'use client'

import { useRef, useState, Fragment } from 'react'
import { Bold, List, ListOrdered, Eye, Pencil } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface NotesEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

// Applies a transform to the textarea's current selection (or the whole
// line, for the list buttons) and returns the new full text plus where the
// cursor should land -- kept as plain string math so there's no editor
// dependency for what's ultimately a handful of admins jotting private notes.
function wrapSelection(text: string, start: number, end: number, marker: string) {
  const before = text.slice(0, start)
  const selected = text.slice(start, end) || 'text'
  const after = text.slice(end)
  return {
    text: `${before}${marker}${selected}${marker}${after}`,
    selectionStart: start + marker.length,
    selectionEnd: start + marker.length + selected.length,
  }
}

function prefixLines(text: string, start: number, end: number, makePrefix: (lineIndex: number) => string) {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1
  const lineEndSearch = text.indexOf('\n', end)
  const lineEnd = lineEndSearch === -1 ? text.length : lineEndSearch

  const block = text.slice(lineStart, lineEnd)
  const lines = block.split('\n')
  const prefixed = lines.map((line, i) => `${makePrefix(i)}${line}`).join('\n')

  return {
    text: text.slice(0, lineStart) + prefixed + text.slice(lineEnd),
    selectionStart: lineStart,
    selectionEnd: lineStart + prefixed.length,
  }
}

// Deliberately tiny -- just enough markdown to cover "bold things, bullet
// point etc" for internal notes, rendered as real React elements (never
// dangerouslySetInnerHTML) so there's no injection surface.
function renderNotes(text: string) {
  if (!text.trim()) return <p className="text-sm text-muted-foreground italic">No notes yet</p>

  const renderInline = (line: string) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      ),
    )
  }

  const lines = text.split('\n')
  const blocks: React.ReactNode[] = []
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null

  const flushList = () => {
    if (!list) return
    const Tag = list.type
    blocks.push(
      <Tag key={blocks.length} className={Tag === 'ul' ? 'list-disc pl-5 space-y-0.5' : 'list-decimal pl-5 space-y-0.5'}>
        {list.items.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </Tag>,
    )
    list = null
  }

  lines.forEach((line) => {
    const bulletMatch = line.match(/^-\s+(.*)/)
    const numberedMatch = line.match(/^\d+\.\s+(.*)/)

    if (bulletMatch) {
      if (list?.type !== 'ul') {
        flushList()
        list = { type: 'ul', items: [] }
      }
      list.items.push(bulletMatch[1])
    } else if (numberedMatch) {
      if (list?.type !== 'ol') {
        flushList()
        list = { type: 'ol', items: [] }
      }
      list.items.push(numberedMatch[1])
    } else {
      flushList()
      if (line.trim()) {
        blocks.push(
          <p key={blocks.length} className="text-sm text-foreground">
            {renderInline(line)}
          </p>,
        )
      }
    }
  })
  flushList()

  return <div className="space-y-1.5">{blocks}</div>
}

export function NotesEditor({ value, onChange, placeholder }: NotesEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')

  const applySelectionEdit = (fn: (text: string, start: number, end: number) => { text: string; selectionStart: number; selectionEnd: number }) => {
    const el = textareaRef.current
    if (!el) return
    const result = fn(value, el.selectionStart, el.selectionEnd)
    onChange(result.text)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(result.selectionStart, result.selectionEnd)
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <ToolbarButton
            title="Bold"
            onClick={() => applySelectionEdit((t, s, e) => wrapSelection(t, s, e, '**'))}
          >
            <Bold className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            title="Bullet list"
            onClick={() => applySelectionEdit((t, s, e) => prefixLines(t, s, e, () => '- '))}
          >
            <List className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton
            title="Numbered list"
            onClick={() => applySelectionEdit((t, s, e) => prefixLines(t, s, e, (i) => `${i + 1}. `))}
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </ToolbarButton>
        </div>
        <button
          type="button"
          onClick={() => setMode((m) => (m === 'edit' ? 'preview' : 'edit'))}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
        >
          {mode === 'edit' ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              Preview
            </>
          ) : (
            <>
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </>
          )}
        </button>
      </div>

      {mode === 'edit' ? (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-muted border-border/50 min-h-[140px] font-mono text-sm"
        />
      ) : (
        <div className="bg-muted border border-border/50 rounded-md p-3 min-h-[140px]">{renderNotes(value)}</div>
      )}
    </div>
  )
}

function ToolbarButton({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {children}
    </button>
  )
}
