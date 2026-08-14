'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react'
import { Info, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CalloutType = 'info' | 'warning' | 'success' | 'critical'

export const CALLOUT_META: Record<CalloutType, { icon: typeof Info; label: string; className: string }> = {
  info: { icon: Info, label: 'Info', className: 'border-blue-500/30 bg-blue-500/10 text-blue-200' },
  warning: { icon: AlertTriangle, label: 'Warning', className: 'border-amber-500/30 bg-amber-500/10 text-amber-200' },
  success: { icon: CheckCircle2, label: 'Success', className: 'border-green-500/30 bg-green-500/10 text-green-200' },
  critical: { icon: ShieldAlert, label: 'Critical', className: 'border-red-500/30 bg-red-500/10 text-red-200' },
}

function CalloutView({ node, updateAttributes, editor }: NodeViewProps) {
  const type = (node.attrs.type as CalloutType) || 'info'
  const meta = CALLOUT_META[type] || CALLOUT_META.info
  const Icon = meta.icon

  return (
    <NodeViewWrapper className={cn('my-2 rounded-lg border px-3 py-2.5', meta.className)} data-callout-type={type}>
      <div className="flex items-center gap-1.5 mb-1" contentEditable={false}>
        <Icon className="w-3.5 h-3.5 shrink-0" />
        {editor.isEditable ? (
          <select
            value={type}
            onChange={(e) => updateAttributes({ type: e.target.value })}
            className="text-xs font-medium uppercase tracking-wide bg-transparent border-none outline-none cursor-pointer"
          >
            {(Object.keys(CALLOUT_META) as CalloutType[]).map((key) => (
              <option key={key} value={key} className="bg-card text-foreground">
                {CALLOUT_META[key].label}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs font-medium uppercase tracking-wide">{meta.label}</span>
        )}
      </div>
      <NodeViewContent className="text-sm [&_p]:my-0" />
    </NodeViewWrapper>
  )
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (type?: CalloutType) => ReturnType
      unsetCallout: () => ReturnType
    }
  }
}

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-callout-type') || 'info',
        renderHTML: (attrs: { type: CalloutType }) => ({ 'data-callout-type': attrs.type }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-callout-type]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView)
  },

  addCommands() {
    return {
      setCallout:
        (type: CalloutType = 'info') =>
        ({ commands }) =>
          commands.wrapIn(this.name, { type }),
      unsetCallout:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    }
  },
})
