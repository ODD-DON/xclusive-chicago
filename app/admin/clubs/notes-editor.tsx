'use client'

import { useRef, useState, Fragment } from 'react'
import { Bold, Italic, List, ListOrdered, CheckSquare } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface NotesEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

// Applies a transform to the textarea's current selection (or the whole
// line, for the list buttons) and returns the new full text plus where the
// cursor should land -- kept as plain string math so there's no editor
// dependency for what's ultimately a handful of admins jotting quick notes.
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

function toggleCheckbox(text: string, lineIndexInFullText: number) {
  const lines = text.split('\n')
  const line = lines[lineIndexInFullText]
  if (!line) return text
  lines[lineIndexInFullText] = line.includes('[ ]') ? line.replace('[ ]', '[x]') : line.replace('[x]', '[ ]')
  return lines.join('\n')
}

// Deliberately tiny -- just enough markdown to cover bold/italic/bullets/
// numbers/checklists for internal notes, rendered as real React elements
// (never dangerouslySetInnerHTML) so there's no injection surface.
function renderNotes(text: string, onToggleCheck: (lineIndex: number) => void) {
  if (!text.trim()) {
    return <p className="text-sm text-muted-foreground italic">Nothing jotted down yet — click to add a note</p>
  }

  const renderInline = (line: string) => {
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 1) {
        return (
          <em key={i} className="italic">
            {part.slice(1, -1)}
          </em>
        )
      }
      return <Fragment key={i}>{part}</Fragment>
    })
  }

  const rawLines = text.split('\n')
  const blocks: React.ReactNode[] = []
  let list: { type: 'ul' | 'ol'; items: { text: string; lineIndex: number }[] } | null = null

  const flushList = () => {
    if (!list) return
    const Tag = list.type
    blocks.push(
      <Tag
        key={blocks.length}
        className={Tag === 'ul' ? 'list-disc pl-5 space-y-1' : 'list-decimal pl-5 space-y-1'}
      >
        {list.items.map((item, i) => (
          <li key={i}>{renderInline(item.text)}</li>
        ))}
      </Tag>,
    )
    list = null
  }

  rawLines.forEach((line, lineIndex) => {
    const checkMatch = line.match(/^-\s+\[( |x)\]\s+(.*)/)
    const bulletMatch = line.match(/^-\s+(.*)/)
    const numberedMatch = line.match(/^\d+\.\s+(.*)/)

    if (checkMatch) {
      flushList()
      const checked = checkMatch[1] === 'x'
      blocks.push(
        <button
          key={blocks.length}
          type="button"
          onClick={() => onToggleCheck(lineIndex)}
          className="flex items-start gap-2 text-left w-full group"
        >
          <span
            className={cn(
              'mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors',
              checked ? 'bg-gold border-gold' : 'border-muted-foreground/40 group-hover:border-gold',
            )}
          >
            {checked && (
              <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
          <span className={cn('text-sm', checked && 'line-through text-muted-foreground')}>
            {renderInline(checkMatch[2])}
          </span>
        </button>,
      )
    } else if (bulletMatch) {
      if (list?.type !== 'ul') {
        flushList()
        list = { type: 'ul', items: [] }
      }
      list.items.push({ text: bulletMatch[1], lineIndex })
    } else if (numberedMatch) {
      if (list?.type !== 'ol') {
        flushList()
        list = { type: 'ol', items: [] }
      }
      list.items.push({ text: numberedMatch[1], lineIndex })
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

  return <div className="space-y-2">{blocks}</div>
}

export function NotesEditor({ value, onChange, placeholder }: NotesEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [mode, setMode] = useState<'write' | 'preview'>(value ? 'preview' : 'write')

  const applySelectionEdit = (
    fn: (text: string, start: number, end: number) => { text: string; selectionStart: number; selectionEnd: number },
  ) => {
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
    <div className="rounded-lg border border-gold/20 bg-gold/5 overflow-hidden">
      <div className="flex items-center justify-between px-2 pt-2">
        <div className="flex items-center gap-0.5 bg-background/40 rounded-md p-0.5">
          <ModeTab active={mode === 'write'} onClick={() => setMode('write')}>
            Write
          </ModeTab>
          <ModeTab active={mode === 'preview'} onClick={() => setMode('preview')}>
            Preview
          </ModeTab>
        </div>

        {mode === 'write' && (
          <div className="flex items-center gap-0.5">
            <ToolbarButton title="Bold" onClick={() => applySelectionEdit((t, s, e) => wrapSelection(t, s, e, '**'))}>
              <Bold className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton title="Italic" onClick={() => applySelectionEdit((t, s, e) => wrapSelection(t, s, e, '*'))}>
              <Italic className="w-3.5 h-3.5" />
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
            <ToolbarButton
              title="Checklist"
              onClick={() => applySelectionEdit((t, s, e) => prefixLines(t, s, e, () => '- [ ] '))}
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </ToolbarButton>
          </div>
        )}
      </div>

      {mode === 'write' ? (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => value.trim() && setMode('preview')}
          autoFocus={mode === 'write' && !!value}
          placeholder={placeholder}
          className="bg-transparent border-none shadow-none focus-visible:ring-0 min-h-[160px] text-sm leading-relaxed p-3 resize-y"
        />
      ) : (
        <div
          onClick={() => setMode('write')}
          className="min-h-[160px] p-3 cursor-text"
        >
          {renderNotes(value, (lineIndex) => onChange(toggleCheckbox(value, lineIndex)))}
        </div>
      )}
    </div>
  )
}

function ModeTab({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 text-xs rounded transition-colors',
        active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function ToolbarButton({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors"
    >
      {children}
    </button>
  )
}
