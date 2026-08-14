'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Placeholder from '@tiptap/extension-placeholder'
import { TaskList, TaskItem } from '@tiptap/extension-list'
import { TableKit } from '@tiptap/extension-table'
import {
  Lock,
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  Code,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  Palette,
  Highlighter,
  List,
  ListOrdered,
  ListChecks,
  IndentIcon,
  OutdentIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link2,
  Minus,
  Table as TableIcon,
  Quote,
  MessageSquareWarning,
  ChevronDown,
  Undo2,
  Redo2,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Unlink,
  Rows3,
  Columns3,
  Trash2,
  ChevronsUpDown,
  Eraser,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Callout } from './callout'
import { Details, DetailsSummary, DetailsContent } from './collapsible'
import { Indent } from './indent'
import { FontSize } from './font-size'
import { PhoneLink } from './phone-link'
import { migrateLegacyNotes, looksLikeHtml } from './migrate-legacy-notes'
import { HIGHLIGHT_COLORS, TEXT_COLORS } from './palette'
import styles from './editor.module.css'

interface TeamNotesEditorProps {
  clubId?: string
  initialNotes?: string
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
}

type SaveState = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error'

const AUTOSAVE_DELAY_MS = 1500

const EXTENSIONS = [
  StarterKit.configure({ link: false }),
  TextStyle,
  FontSize,
  Color,
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({ types: ['paragraph', 'heading'] }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    HTMLAttributes: { class: 'xc-link', rel: 'noopener noreferrer', target: '_blank' },
  }),
  PhoneLink,
  Subscript,
  Superscript,
  TaskList,
  TaskItem.configure({ nested: true }),
  TableKit.configure({ table: { resizable: false } }),
  Indent,
  Callout,
  Details,
  DetailsSummary,
  DetailsContent,
]

const DEFAULT_PLACEHOLDER =
  'Add private notes about promoter deals, guest policies, contacts, bottle service, or anything your team should know...'

export function NotesEditor(props: TeamNotesEditorProps) {
  const { clubId, initialNotes, value, onChange, placeholder } = props
  const standalone = !!clubId

  const initialHtml = useMemo(
    () => migrateLegacyNotes(standalone ? initialNotes ?? '' : value ?? initialNotes ?? ''),
    [],
  )
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const savedHtmlRef = useRef(initialHtml)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const extensions = useMemo(
    () => [...EXTENSIONS, Placeholder.configure({ placeholder: placeholder || DEFAULT_PLACEHOLDER })],
    [placeholder],
  )

  const editor = useEditor({
    extensions,
    content: initialHtml,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: styles.content, 'aria-label': 'Team notes document' },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      if (standalone) {
        setSaveState('unsaved')
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => void save(html), AUTOSAVE_DELAY_MS)
      } else {
        onChange?.(html)
      }
    },
  })

  const save = useCallback(
    async (html: string) => {
      if (!clubId || html === savedHtmlRef.current) return
      setSaveState('saving')
      try {
        const response = await fetch('/api/admin/clubs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: clubId, admin_notes: html }),
        })
        if (!response.ok) throw new Error('Save failed')
        savedHtmlRef.current = html
        setSaveState('saved')
      } catch {
        setSaveState('error')
      }
    },
    [clubId],
  )

  const manualSave = () => {
    if (!editor) return
    if (timerRef.current) clearTimeout(timerRef.current)
    void save(editor.getHTML()).then(() => {
      if (saveState !== 'error') toast.success('Notes saved')
    })
  }

  // Warn before leaving with unsaved edits still pending the autosave debounce.
  useEffect(() => {
    if (!standalone) return
    const handler = (e: BeforeUnloadEvent) => {
      if (saveState === 'unsaved' || saveState === 'saving') {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [standalone, saveState])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  if (!editor) {
    return <div className="rounded-lg border border-border/50 bg-card min-h-[220px] animate-pulse" />
  }

  const openLinkPopover = () => {
    setLinkUrl(editor.getAttributes('link').href || '')
    setLinkPopoverOpen(true)
  }

  const applyLink = () => {
    const url = linkUrl.trim()
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      const href = /^(https?:|mailto:|tel:)/.test(url) ? url : `https://${url}`
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    }
    setLinkPopoverOpen(false)
  }

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    setLinkPopoverOpen(false)
  }

  const activeTextStyle = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
      ? 'h2'
      : editor.isActive('heading', { level: 3 })
        ? 'h3'
        : editor.isActive('heading', { level: 4 })
          ? 'h4'
          : editor.isActive('textStyle', { fontSize: '0.8125rem' })
            ? 'small'
            : 'p'

  const applyTextStyle = (v: string) => {
    const chain = editor.chain().focus()
    if (v === 'h1') chain.setHeading({ level: 1 }).unsetFontSize().run()
    else if (v === 'h2') chain.setHeading({ level: 2 }).unsetFontSize().run()
    else if (v === 'h3') chain.setHeading({ level: 3 }).unsetFontSize().run()
    else if (v === 'h4') chain.setHeading({ level: 4 }).unsetFontSize().run()
    else if (v === 'small') chain.setParagraph().setFontSize('0.8125rem').run()
    else chain.setParagraph().unsetFontSize().run()
  }

  return (
    <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 pt-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="w-3 h-3" />
          Private. Only visible to your team.
        </div>
        {standalone && <SaveIndicator state={saveState} onSaveNow={manualSave} />}
      </div>

      <Toolbar
        editor={editor}
        activeTextStyle={activeTextStyle}
        onTextStyle={applyTextStyle}
        onOpenLink={openLinkPopover}
        linkPopoverOpen={linkPopoverOpen}
        setLinkPopoverOpen={setLinkPopoverOpen}
        linkUrl={linkUrl}
        setLinkUrl={setLinkUrl}
        onApplyLink={applyLink}
        onRemoveLink={removeLink}
      />

      <SelectionBubbleMenu editor={editor} onOpenLink={openLinkPopover} />
      <TableBubbleMenu editor={editor} />

      <div className="px-3 pb-3 pt-2 max-h-[70vh] overflow-y-auto cursor-text" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function SaveIndicator({ state, onSaveNow }: { state: SaveState; onSaveNow: () => void }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-xs text-muted-foreground">
        {state === 'saving' && 'Saving...'}
        {state === 'saved' && 'Saved'}
        {state === 'unsaved' && 'Unsaved changes'}
        {state === 'error' && <span className="text-destructive">Could not save changes</span>}
      </span>
      <Button type="button" size="sm" variant="outline" onClick={onSaveNow} className="h-7 text-xs">
        Save Notes
      </Button>
    </div>
  )
}

function SelectionBubbleMenu({ editor, onOpenLink }: { editor: Editor; onOpenLink: () => void }) {
  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor, state }) => !state.selection.empty && !editor.isActive('table') && editor.isEditable}
      options={{ placement: 'top', offset: 8 }}
    >
      <div className="flex items-center gap-0.5 bg-popover border border-border rounded-lg shadow-lg p-1">
        <BubbleButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <Bold className="w-3.5 h-3.5" />
        </BubbleButton>
        <BubbleButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <Italic className="w-3.5 h-3.5" />
        </BubbleButton>
        <BubbleButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <UnderlineIcon className="w-3.5 h-3.5" />
        </BubbleButton>
        <BubbleButton active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
          <Strikethrough className="w-3.5 h-3.5" />
        </BubbleButton>
        <Separator orientation="vertical" className="h-4 mx-0.5" />
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-1.5 rounded hover:bg-muted transition-colors" title="Highlight">
              <Highlighter className="w-3.5 h-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <ColorGrid
              colors={HIGHLIGHT_COLORS}
              onPick={(color) => editor.chain().focus().toggleHighlight({ color }).run()}
              onClear={() => editor.chain().focus().unsetHighlight().run()}
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-1.5 rounded hover:bg-muted transition-colors" title="Text color">
              <Palette className="w-3.5 h-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <ColorGrid
              colors={TEXT_COLORS}
              onPick={(color) => editor.chain().focus().setColor(color).run()}
              onClear={() => editor.chain().focus().unsetColor().run()}
            />
          </PopoverContent>
        </Popover>
        <Separator orientation="vertical" className="h-4 mx-0.5" />
        <BubbleButton active={editor.isActive('link')} onClick={onOpenLink} title="Link">
          <Link2 className="w-3.5 h-3.5" />
        </BubbleButton>
      </div>
    </BubbleMenu>
  )
}

function TableBubbleMenu({ editor }: { editor: Editor }) {
  return (
    <BubbleMenu
      editor={editor}
      pluginKey="tableBubbleMenu"
      shouldShow={({ editor }) => editor.isActive('table')}
      options={{ placement: 'top', offset: 8 }}
    >
      <div className="flex items-center gap-0.5 bg-popover border border-border rounded-lg shadow-lg p-1">
        <BubbleButton onClick={() => editor.chain().focus().addRowBefore().run()} title="Add row above">
          <Rows3 className="w-3.5 h-3.5" />+
        </BubbleButton>
        <BubbleButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Add row below">
          +<Rows3 className="w-3.5 h-3.5" />
        </BubbleButton>
        <BubbleButton onClick={() => editor.chain().focus().deleteRow().run()} title="Delete row">
          <Rows3 className="w-3.5 h-3.5" />
          <Trash2 className="w-3 h-3" />
        </BubbleButton>
        <Separator orientation="vertical" className="h-4 mx-0.5" />
        <BubbleButton onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add column left">
          <Columns3 className="w-3.5 h-3.5" />+
        </BubbleButton>
        <BubbleButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add column right">
          +<Columns3 className="w-3.5 h-3.5" />
        </BubbleButton>
        <BubbleButton onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete column">
          <Columns3 className="w-3.5 h-3.5" />
          <Trash2 className="w-3 h-3" />
        </BubbleButton>
        <Separator orientation="vertical" className="h-4 mx-0.5" />
        <BubbleButton onClick={() => editor.chain().focus().toggleHeaderRow().run()} title="Toggle header row">
          <ChevronsUpDown className="w-3.5 h-3.5" />
        </BubbleButton>
        <BubbleButton onClick={() => editor.chain().focus().deleteTable().run()} title="Delete table">
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </BubbleButton>
      </div>
    </BubbleMenu>
  )
}

function BubbleButton({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  title: string
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'flex items-center p-1.5 rounded text-xs transition-colors',
        active ? 'bg-gold/20 text-gold' : 'hover:bg-muted text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function ColorGrid({
  colors,
  onPick,
  onClear,
}: {
  colors: readonly { label: string; value: string }[]
  onPick: (value: string) => void
  onClear: () => void
}) {
  return (
    <div className="w-40 space-y-2">
      <div className="grid grid-cols-4 gap-1.5">
        {colors.map((c) => (
          <button
            key={c.value}
            type="button"
            title={c.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPick(c.value)}
            className="w-7 h-7 rounded-full border border-border/60 hover:scale-110 transition-transform"
            style={{ background: c.value }}
          />
        ))}
      </div>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClear}
        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-left flex items-center gap-1.5"
      >
        <Eraser className="w-3 h-3" />
        Remove
      </button>
    </div>
  )
}

interface ToolbarProps {
  editor: Editor
  activeTextStyle: string
  onTextStyle: (v: string) => void
  onOpenLink: () => void
  linkPopoverOpen: boolean
  setLinkPopoverOpen: (v: boolean) => void
  linkUrl: string
  setLinkUrl: (v: string) => void
  onApplyLink: () => void
  onRemoveLink: () => void
}

const TEXT_STYLE_LABELS: Record<string, string> = {
  p: 'Paragraph',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  small: 'Small text',
}

function Toolbar({
  editor,
  activeTextStyle,
  onTextStyle,
  onOpenLink,
  linkPopoverOpen,
  setLinkPopoverOpen,
  linkUrl,
  setLinkUrl,
  onApplyLink,
  onRemoveLink,
}: ToolbarProps) {
  const isLinkActive = editor.isActive('link')

  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-border/50 bg-muted/20">
      <Select value={activeTextStyle} onValueChange={onTextStyle}>
        <SelectTrigger className="h-8 w-[130px] text-xs bg-transparent border-border/50">
          <SelectValue>{TEXT_STYLE_LABELS[activeTextStyle]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(TEXT_STYLE_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ToolbarDivider />

      <ToolbarButton title="Bold" shortcut="Ctrl+B" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Italic" shortcut="Ctrl+I" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Underline" shortcut="Ctrl+U" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <Popover>
        <PopoverTrigger asChild>
          <ToolbarButton title="Highlight" active={editor.isActive('highlight')}>
            <Highlighter className="w-4 h-4" />
          </ToolbarButton>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <ColorGrid
            colors={HIGHLIGHT_COLORS}
            onPick={(color) => editor.chain().focus().toggleHighlight({ color }).run()}
            onClear={() => editor.chain().focus().unsetHighlight().run()}
          />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <ToolbarButton title="Text color">
            <Palette className="w-4 h-4" />
          </ToolbarButton>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <ColorGrid
            colors={TEXT_COLORS}
            onPick={(color) => editor.chain().focus().setColor(color).run()}
            onClear={() => editor.chain().focus().unsetColor().run()}
          />
        </PopoverContent>
      </Popover>

      <ToolbarDivider />

      <ToolbarButton title="Bulleted list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Checklist" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}>
        <ListChecks className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton title="Decrease indent" shortcut="Shift+Tab" onClick={() => editor.chain().focus().outdent().run()}>
        <OutdentIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Increase indent" shortcut="Tab" onClick={() => editor.chain().focus().indent().run()}>
        <IndentIcon className="w-4 h-4" />
      </ToolbarButton>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ToolbarButton title="Alignment">
            <AlignLeft className="w-4 h-4" />
            <ChevronDown className="w-3 h-3 opacity-60" />
          </ToolbarButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('left').run()}>
            <AlignLeft className="w-4 h-4 mr-2" /> Left
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('center').run()}>
            <AlignCenter className="w-4 h-4 mr-2" /> Center
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('right').run()}>
            <AlignRight className="w-4 h-4 mr-2" /> Right
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
            <AlignJustify className="w-4 h-4 mr-2" /> Justify
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolbarDivider />

      <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
        <PopoverTrigger asChild>
          <ToolbarButton title="Insert link" shortcut="Ctrl+K" active={isLinkActive} onClick={onOpenLink}>
            <Link2 className="w-4 h-4" />
          </ToolbarButton>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start">
          <div className="space-y-2">
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && onApplyLink()}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" className="h-7 text-xs bg-gold hover:bg-gold-light text-background flex-1" onClick={onApplyLink}>
                {isLinkActive ? 'Update link' : 'Add link'}
              </Button>
              {isLinkActive && (
                <>
                  <button
                    type="button"
                    title="Open link"
                    onClick={() => window.open(editor.getAttributes('link').href, '_blank', 'noopener,noreferrer')}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Copy link"
                    onClick={() => {
                      navigator.clipboard.writeText(editor.getAttributes('link').href || '')
                      toast.success('Link copied')
                    }}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Remove link"
                    onClick={onRemoveLink}
                    className="p-1.5 rounded hover:bg-muted text-destructive"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <ToolbarButton title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="w-4 h-4" />
      </ToolbarButton>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ToolbarButton title="Insert">
            <MessageSquareWarning className="w-4 h-4" />
            <ChevronDown className="w-3 h-3 opacity-60" />
          </ToolbarButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => editor.chain().focus().setCallout('info').run()}>Info callout</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setCallout('warning').run()}>Warning callout</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setCallout('success').run()}>Success callout</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setCallout('critical').run()}>Critical callout</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().setDetails().run()}>Collapsible section</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            <TableIcon className="w-4 h-4 mr-2" /> Table
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolbarDivider />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ToolbarButton title="More">
            <MoreHorizontal className="w-4 h-4" />
          </ToolbarButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code className="w-4 h-4 mr-2" /> Inline code
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <Code className="w-4 h-4 mr-2" /> Code block
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleSuperscript().run()}>
            <SuperscriptIcon className="w-4 h-4 mr-2" /> Superscript
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleSubscript().run()}>
            <SubscriptIcon className="w-4 h-4 mr-2" /> Subscript
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
            <Eraser className="w-4 h-4 mr-2" /> Clear formatting
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1" />

      <ToolbarButton title="Undo" shortcut="Ctrl+Z" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Redo" shortcut="Ctrl+Shift+Z" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo2 className="w-4 h-4" />
      </ToolbarButton>
    </div>
  )
}

function ToolbarDivider() {
  return <Separator orientation="vertical" className="h-5 mx-1" />
}

function ToolbarButton({
  children,
  title,
  shortcut,
  active,
  disabled,
  onClick,
  ...rest
}: {
  children: React.ReactNode
  title: string
  shortcut?: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={title}
          aria-pressed={active}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClick}
          className={cn(
            'flex items-center gap-0.5 p-1.5 rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none',
            active ? 'bg-gold/20 text-gold' : 'text-muted-foreground hover:text-foreground hover:bg-background/60',
          )}
          {...rest}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {title}
        {shortcut && <span className="opacity-60"> ({shortcut})</span>}
      </TooltipContent>
    </Tooltip>
  )
}

export { looksLikeHtml }
